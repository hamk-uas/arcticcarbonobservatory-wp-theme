import { downloadZip } from "./client-zip/index.js" 

// https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
function saveFile(blob, filename) {
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        const a = document.createElement('a');
        document.body.appendChild(a);
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 0)
    }
}
  
var sitesGeoJson;
var managementEventSchemaJson;
async function getJson(response) {
    if (!response.ok) {
        throw new Error(`Failed to fetch ${response.url}: ${response.status}`);
    }
    return response.json();
}
var fetchPromises = [
    fetch(`${foConfig.storageUrl}/fieldobs_sites_translated.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson).then(async (json) => {
        sitesGeoJson = json;
        console.log("sitesGeoJson:");
        console.log(sitesGeoJson);
    }),
    fetch(foConfig.managementEventSchemaJsonUrl).then(getJson).then(json => {
        managementEventSchemaJson = json;
        compileJsonSchema(managementEventSchemaJson);
        console.log("managementEventSchemaJson:");
        console.log(managementEventSchemaJson);
    }),    
]

var debugContainerElement = document.getElementById("page");

var siteJsons = {};
var siteIds = [];
var numLoaded = 0;
var numFailed = 0;
var numToLoad = 0;
var dummy;
Promise.all(fetchPromises).then(async (values) => {
    // Load siteJson files
    let fetchPromises2 = [];
    const loaderElement = document.createElement("p");
    debugContainerElement.appendChild(loaderElement);
    numToLoad = sitesGeoJson.features.length;
    for (const siteFeature of sitesGeoJson.features) {
        let siteId = siteFeature.properties.id;
        siteIds.push(siteId);
        fetchPromises2.push(fetch(`${foConfig.storageUrl}/${siteId}/site.json?date=${getCacheRefreshDate(foConfig.now)}`).then(async (result) => {
            if (result.ok) {
                numLoaded += 1;
                let siteJson = JSON.parse(await result.text());
                siteJson.storageUrl = foConfig.storageUrl;
                siteJsons[siteJson.id] = siteJson;                
            } else {
                numFailed += 1;
                console.log(result);
            }
            loaderElement.innerHTML = `Loaded ${numLoaded}/${numToLoad} site JSON files${numFailed? `(${numFailed} failures)` : ""}`;
        }));
    }
    Promise.all(fetchPromises2).then(async () => {
        // Load management data files
        let fetchPromises3 = [];
        const loaderElement = document.createElement("p");
        debugContainerElement.appendChild(loaderElement);
        numLoaded = 0;
        numFailed = 0;
        numToLoad = 0;
        for (let siteId of siteIds) {
            for (let source of siteJsons[siteId].sources.filter(source => source.sourceType === "mgmt_event")) {
                for (let json of source.jsonList) {
                    numToLoad += 1;
                }
            }
        }
        for (let siteId of siteIds) {
            for (let source of siteJsons[siteId].sources.filter(source => source.sourceType === "mgmt_event")) {
                for (let json of source.jsonList) {
                    let siteJson = siteJsons[siteId];
                    let path = `${siteJson.storageUrl}/${siteId}/${json.url}?date=${getCacheRefreshDate(new Date(foConfig.now))}`;
                    fetchPromises3.push(fetch(path).then(async (result) => {
                        if (result.ok) {
                            numLoaded += 1;
                            let dataJson = JSON.parse(await result.text());
                            json.data = dataJson;
                        } else {
                            numFailed += 1;
                            console.log(result);
                        }
                        loaderElement.innerHTML = `Loaded ${numLoaded}/${numToLoad} management data files${numFailed? `(${numFailed} failures)` : ""}`;
                    }));
                }
            }
        }
        Promise.all(fetchPromises3).then(async () => {
            let newElement = document.createElement("div");
            newElement.innerHTML = `Modifying management events to conform to JSON Schema: <a href="${foConfig.managementEventSchemaJsonUrl}">${foConfig.managementEventSchemaJsonUrl}</a>`;
            debugContainerElement.appendChild(newElement);
            let exportButtonElement = document.createElement("button");
            exportButtonElement.innerHTML = "Download all JSONs after modifications";
            debugContainerElement.appendChild(exportButtonElement);       
            let numProblematic = 0;
            let numTotal = 0;
            let files = [];
            let siteHtml = "";
            for (let siteId of siteIds) {
                let siteJson = siteJsons[siteId];
                for (let source of siteJson.sources.filter(source => source.sourceType === "mgmt_event")) {
                    for (let json of source.jsonList) {
                        let path = `${siteId}/${json.url}`;
                        let bits = JSON.stringify(json.data);
                        files.push(new File([bits], path, {type: "application/json"}));
                        for (let event of json.data.management.events) {
                            let origEvent = JSON.parse(JSON.stringify(event));
                            makeManagementEventCompatibleWithSchema(event);
                            let resolvedSchema = {};
                            numTotal += 1;
                            if (resolveJsonSchema(event, resolvedSchema, managementEventSchemaJson) || jsonToHTML(event, resolvedSchema, ["$schema", "mgmt_operations_event", "foUIYOffset"]).includes("(unknown property)")) {
                                numProblematic += 1;                                
                                siteHtml += "<table><tr>";
                                let backup_language = foConfig.language;
                                let width = 640;
                                for (let language of ["en"]) {
                                    foConfig.language = language;                      
                                    siteHtml += `<td style="line-height: 1; vertical-align: top; padding-left: 5px; padding-right: 5px; margin-left: 10px; margin-bottom: 10px; border: 3px solid #480; border-radius: 10px; width: ${width}px;"><div class="FOJSONViewer" style=""><svg class="FOPopupIcon" width="40" height="40" viewBox="0 0 40 40">${getManagementEventSymbolHtml(event.mgmt_operations_event, 20, 20, "#480", 1.75)}</svg><span style="font-size: 40px; margin-left: 10px;">${siteId}_${source.block}</span>`;
                                    siteHtml += `${jsonToHTML(event, resolvedSchema, ["$schema", "mgmt_operations_event", "foUIYOffset"])}</div></td>`;
                                }
                                foConfig.language = backup_language;
                                siteHtml += "<tr></table>";
                                siteHtml += `The original event JSON:`
                                siteHtml += `<pre><code class="language-json">${JSON.stringify(origEvent, null, "    ")}</code></pre>`;
                                siteHtml += `was modified to:`
                                siteHtml += `<pre><code class="language-json">${JSON.stringify(event, null, "    ")}</code></pre>`;
                                siteHtml += `and viewed using a schema-like object:`
                                siteHtml += `<pre><code class="language-json">${JSON.stringify(resolvedSchema, null, "    ")}</code></pre><br>`;
                            }
                        }
                    }
                }
            }
            newElement = document.createElement("div");
            newElement.innerHTML = `Total number of events: ${numTotal}.`;
            debugContainerElement.appendChild(newElement);
            if (numProblematic > 0) {                
                newElement = document.createElement("div");
                newElement.innerHTML = `There are still problems with the following ${numProblematic} events:`;
                debugContainerElement.appendChild(newElement);
                const siteDivElement = document.createElement("div");
                siteDivElement.innerHTML = siteHtml;
                debugContainerElement.appendChild(siteDivElement);        
                exportButtonElement.onclick = async function(e) {
                    let blob = await downloadZip(files).blob();
                    saveFile(blob, `modified_events_${new Date().toISOString().split("T")[0]}.zip`);
                    e.preventDefault();
                }                
            } else {
                newElement = document.createElement("div");
                newElement.innerHTML = `No problems detected.`;
                debugContainerElement.appendChild(newElement);
            }
            hljs.highlightAll();
        })
});
});