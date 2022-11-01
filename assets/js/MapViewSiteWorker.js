var v; // State variables

const minimumTimeStepInMinutes = 10;

function getCacheRefreshDate(date) {
    return [date.getFullYear(), (date.getMonth() + 1).toString().padStart(2, '0'), date.getDate().toString().padStart(2, '0'), date.getHours().toString().padStart(2, '0')].join('-')+"h";
}

async function loadData() {
    let newFetchPromises = [];
    for (sourceId in v.sources) {        
        let source = v.sources[sourceId];
        let useTimeStepInMinutes = minimumTimeStepInMinutes;
        if (source.minimumTimeStep !== undefined) {
            useTimeStepInMinutes = source.minimumTimeStep / 60000;
        }
        if (source.csvList !== undefined) {
            source.csvList.forEach(function (csv, csvListIndex) {
                if (csv.loaded === undefined) {
                    let csvStartDate = new Date(csv.startTime);
                    let csvEndDate = new Date(csv.endTime);
                    if (csvStartDate <= v.endDate && csvEndDate >= v.startDate) {                        
                        if (csv.fetchAbortController === undefined) {
                            csv.fetchAbortController = new AbortController();
                            let path = `${v.site.storageUrl}/${v.site.id}/${csv.url}?date=${getCacheRefreshDate(new Date(v.now))}`;
                            //console.log(`Fetch CSV file ${path}`);
                            let fetchPromise = fetch(path, { method: 'GET', signal: csv.fetchAbortController.signal }).then(async function (result) {
                                if (!result.ok) {
                                    csv.loaded = true; // We are finished and have processed the result
                                    console.warn(`Failed to fetch ${path} with status code ${result.status}`);
                                    postMessage({
                                        command: "csvSourceUpdate",
                                        updates: [{
                                            sourceId: source.id,
                                            csvListIndex: csvListIndex,
                                            update: {
                                                loaded: true,
                                                data: undefined // Could not get data
                                            }
                                        }]
                                    });
                                } else {
                                    // The CSV file contains past data
                                    let text = await result.text(); // CSV file contents
                                    csv.loaded = true; // We are finished and have processed the result
                                    csv.data = {}; // Dictionary from CSV field name to all the values
                                    text = text.replace(/"/g, ""); // This is a quick fix to remove quotes which are never needed. TODO: Please fix this in CSV files instead.
                                    let fieldIsDate = []; // For each CSV column, is it a date field?
                                    let lines = text.split(/\r?\n/); // Split CSV to lines
                                    let fields = lines[0].split(","); // Split First line of CSV to field names
                                    //console.log(`Parse CSV file ${v.site.id}/${csv.url}: Fields: ${fields}`);
                                    let fieldData = []; // Array of all the values 
                                    // Loop through all the CSV columns a.k.a. fields
                                    let dateFields = [];
                                    let dates = [];
                                    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
                                        fieldIsDate[fieldIndex] = (source.csvFieldType[fields[fieldIndex]] === "date");
                                        if (fieldIsDate[fieldIndex] !== undefined) {
                                            // This field is used in some chart
                                            csv.data[fields[fieldIndex]] = []; // Prepare an array for its values
                                            fieldData.push(csv.data[fields[fieldIndex]]); // Store a reference to the value array, for quick access based on column number
                                            if (fieldIsDate[fieldIndex]) {
                                                dateFields.push(fieldIndex);
                                                dates.push(0);
                                            }
                                        } else {
                                            fieldData.push(null); // This field is not used for anything, store a null reference for the values
                                        }
                                    }
                                    let skipped = 0;
                                    for (let lineNumber = 1; lineNumber < lines.length; lineNumber++) {
                                        if (!(lineNumber == lines.length - 1 && lines[lineNumber] == "")) {
                                            let values = lines[lineNumber].split(",");
                                            for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
                                                if (fieldIsDate[fieldIndex] !== undefined) {
                                                    if (values[fieldIndex] === '') {
                                                        fieldData[fieldIndex].push('');
                                                    } else {
                                                        if (fieldIsDate[fieldIndex]) {
                                                            fieldData[fieldIndex].push((new Date(values[fieldIndex])).valueOf());
                                                            //dateFieldIndex++;
                                                        } else {
                                                            fieldData[fieldIndex].push(parseFloat(values[fieldIndex]));
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (skipped > 0) {
                                        console.warn(`Skipped ${skipped} of ${lines.length} lines (${lines.length - skipped} remaining) with identical or differing by at most ${useTimeStepInMinutes} minute dates in CSV file ${path}`);
                                    }
                                    for (const [field, val] of Object.entries(csv.data)) {
                                        if (source.csvFieldCredits !== undefined && source.csvFieldCredits[field] !== undefined && source.csvFieldCredits[field]["ecmwf_ensemble_forecast"]) {
                                            while (val[val.length - 1] === '') {
                                                val.pop();
                                            }
                                            if (source.csvFieldType[field] !== "date" && source.csvFieldType[field] !== "integrationTime") {
                                                for (let index = val.length - 1; index >= 1; index--) {
                                                    val[index] = val[index] - val[index - 1];
                                                }
                                                csv.data[field] = val.reverse();
                                            }
                                        }
                                    }
                                    postMessage({
                                        command: "csvSourceUpdate",
                                        updates: [{
                                            sourceId: source.id,
                                            csvListIndex: csvListIndex,
                                            update: {
                                                loaded: true,
                                                data: csv.data
                                            }
                                        }]
                                    });
                                }
                            }).catch(e => {
                                if (e.name === "AbortError") {
                                    // console.log(`Aborted fetch of ${csv.url}`)
                                } else {
                                    console.error(e);
                                }
                            });
                            newFetchPromises.push(fetchPromise);
                            csv.fetchPromise = fetchPromise;
                        }
                    } else {
                        if (csv.fetchAbortController !== undefined) {
                            csv.fetchAbortController.abort();
                            delete csv.fetchAbortController;
                        }
                    }
                }
            });
        } else if (source.geoTiffList !== undefined) {
            source.geoTiffList.forEach(function (geoTiff, geoTiffListIndex) {
                if (geoTiff.loaded === undefined) {
                    let geoTiffDate = new Date(geoTiff.time);                    
                    if (geoTiff.source.sourceCategoryId === v.satelliteImageLegendId && geoTiffDate.valueOf() == v.satelliteImageDate) {
                        if (geoTiff.fetchAbortController === undefined) {
                            let path = `${v.site.storageUrl}/${v.site.id}/${geoTiff.url}?date=${getCacheRefreshDate(new Date(v.now))}`;
                            //console.log(`Fetch geoTiff file ${path}`);
                            geoTiff.fetchAbortController = new AbortController();
                            let fetchPromise = fetch(`${path}`, { method: 'GET', signal: geoTiff.fetchAbortController.signal }).then(async function (result) {
                                if (!result.ok) {
                                    geoTiff.loaded = true; // We are finished, with error
                                    console.warn(`Failed to fetch GeoTiff with path ${path} and type ${source.sourceType}: ${result.status}`);
                                    postMessage({
                                        command: "geoTiffSourceUpdate",
                                        updates: [{
                                            sourceId: source.id,
                                            geoTiffListIndex: geoTiffListIndex,
                                            update: {
                                                loaded: true,
                                                arrayBuffer: undefined
                                            }
                                        }]
                                    });
                                } else {
                                    geoTiff.buggy = new Date(result.headers.get('Last-Modified')) < new Date("2022-10-25T07:00:00.000Z"); // Older GeoTIFF files had a bug
                                    geoTiff.arrayBuffer = await result.arrayBuffer();
                                    geoTiff.loaded = true; // We are finished and have processed the result
                                    postMessage({
                                        command: "geoTiffSourceUpdate",
                                        updates: [{
                                            sourceId: source.id,
                                            geoTiffListIndex: geoTiffListIndex,
                                            update: {
                                                loaded: true,
                                                arrayBuffer: geoTiff.arrayBuffer,
                                                buggy: geoTiff.buggy
                                            }
                                        }]
                                    });
                                }
                            }).catch(e => {
                                if (e.name === "AbortError") {
                                    // console.log(`Aborted fetch of ${path}`)
                                } else {
                                    console.error(e);
                                }
                            });
                            newFetchPromises.push(fetchPromise);
                            geoTiff.fetchPromise = fetchPromise;
                        }
                    } else {
                        if (geoTiff.fetchAbortController !== undefined) {
                            geoTiff.fetchAbortController.abort();
                            delete geoTiff.fetchAbortController;
                        }
                    }
                }
            });
        } /*else if (source.geoTiffList !== undefined) {
            source.geoTiffList.forEach(function (geoTiff, geoTiffListIndex) {
                if (geoTiff.loaded === undefined) {
                    let geoTiffDate = new Date(geoTiff.time);
                    if (geoTiff.source.sourceCategoryId === v.satelliteImageLegendId && geoTiffDate.valueOf() == v.satelliteImageDate) {
                        if (geoTiff.fetchAbortController === undefined) {
                            let path = `${v.storageUrl}/${v.site.id}/${geoTiff.url.replace(".tif", "_mapbox_source.json")}?date=${getCacheRefreshDate(new Date(v.now))}`;
                            //console.log(`Fetch geoTiff file ${path}`);
                            geoTiff.fetchAbortController = new AbortController();
                            let fetchPromise = fetch(`${path}`, { method: 'GET', signal: geoTiff.fetchAbortController.signal }).then(async function (result) {
                                if (!result.ok) {
                                    geoTiff.loaded = true; // We are finished and have processed the result
                                    console.warn(`Failed to fetch NdviImage with path ${path} and type ${source.sourceType}: ${result.status}`);
                                    postMessage({
                                        command: "geoTiffSourceUpdate",
                                        updates: [{
                                            sourceId: source.id,
                                            geoTiffListIndex: geoTiffListIndex,
                                            update: {
                                                loaded: true,
                                                mapboxSource: undefined
                                            }
                                        }]
                                    });
                                } else {
                                    geoTiff.mapboxSource = JSON.parse(await result.text()); // geoTiff 
                                    // console.log("geoTiff.mapboxSource at worker:");
                                    // console.log(geoTiff.mapboxSource);
                                    //geoTiff.mapboxSource.source.url = geoTiff.mapboxSource.source.url.replace("/fmifieldobservatory/", "/fieldobservatory2/data/"); // *** dirty fix TODO do in trigger/function
                                    geoTiff.loaded = true; // We are finished and have processed the result
                                    postMessage({
                                        command: "geoTiffSourceUpdate",
                                        updates: [{
                                            sourceId: source.id,
                                            geoTiffListIndex: geoTiffListIndex,
                                            update: {
                                                loaded: true,
                                                mapboxSource: geoTiff.mapboxSource
                                            }
                                        }]
                                    });
                                }
                            }).catch(e => {
                                if (e.name === "AbortError") {
                                    // console.log(`Aborted fetch of ${path}`)
                                } else {
                                    console.error(e);
                                }
                            });
                            newFetchPromises.push(fetchPromise);
                            geoTiff.fetchPromise = fetchPromise;
                        }
                    } else {
                        if (geoTiff.fetchAbortController !== undefined) {
                            geoTiff.fetchAbortController.abort();
                            delete geoTiff.fetchAbortController;
                        }
                    }
                }
            });
        }*/ else if (source.jsonList !== undefined) {
            source.jsonList.forEach(function (json, jsonListIndex) {
                if (json.loaded === undefined) {
                    if (new Date(json.startTime) <= v.endDate && new Date(json.endTime) >= v.startDate) {
                        if (json.fetchAbortController === undefined) {
                            let path = `${v.site.storageUrl}/${v.site.id}/${json.url}?date=${getCacheRefreshDate(new Date(v.now))}`;
                            console.log(`Fetch json file ${path}`);
                            json.fetchAbortController = new AbortController();
                            let fetchPromise = fetch(`${path}`, { method: 'GET', signal: json.fetchAbortController.signal }).then(async function (result) {
                                if (!result.ok) {
                                    json.loaded = true; // We are finished and have processed the result
                                    console.warn(`Failed to fetch json with path ${path} and type ${source.sourceType}: ${result.status}`);
                                    postMessage({
                                        command: "jsonSourceUpdate",
                                        updates: [{
                                            sourceId: source.id,
                                            jsonListIndex: jsonListIndex,
                                            update: {
                                                loaded: true,
                                                mapboxSource: undefined
                                            }
                                        }]
                                    });
                                } else {
                                    json.data = JSON.parse(await result.text()); // json 
                                    if (json.data.management !== undefined && json.data.management.events !== undefined) {
                                        json.data.management.events.forEach(function (event) {
                                            if (event.date !== undefined) {
                                                let dateInt = (new Date(event.date)).valueOf();
                                                if (isNaN(dateInt)) {
                                                    console.warn(`Failed parsing date "${event.date}" in ${json.url}`)
                                                    event.date = 0;
                                                } else {
                                                    event.date = dateInt;
                                                }
                                            }
                                            if (event.start_date !== undefined) {
                                                let dateInt = (new Date(event.start_date)).valueOf();
                                                if (isNaN(dateInt)) {
                                                    console.warn(`Failed parsing start_date "${event.start_date}" in ${json.url}`)
                                                    event.start_date = 0;
                                                } else {
                                                    event.start_date = dateInt;
                                                }
                                            }
                                            if (event.end_date !== undefined) {
                                                let dateInt = (new Date(event.end_date)).valueOf();
                                                if (isNaN(dateInt)) {
                                                    console.warn(`Failed parsing end_date "${event.end_date}" in ${json.url}`)
                                                    event.end_date = 0;
                                                } else {
                                                    event.end_date = dateInt;
                                                }
                                            }
                                        });
                                    }
                                    json.loaded = true; // We are finished and have processed the result
                                    postMessage({
                                        command: "jsonSourceUpdate",
                                        updates: [{
                                            sourceId: source.id,
                                            jsonListIndex: jsonListIndex,
                                            update: {
                                                loaded: true,
                                                data: json.data
                                            }
                                        }]
                                    });
                                }
                            }).catch(e => {
                                if (e.name === "AbortError") {
                                    // console.log(`Aborted fetch of ${path}`)
                                } else {
                                    console.error(e);
                                }
                            });
                            newFetchPromises.push(fetchPromise);
                            json.fetchPromise = fetchPromise;
                        }
                    } else {
                        if (json.fetchAbortController !== undefined) {
                            json.fetchAbortController.abort();
                            delete json.fetchAbortController;
                        }
                    }
                }
            });
        }
    };
    await Promise.all(newFetchPromises);
}

onmessage = function (e) {
    switch (e.data.command) {
        case "importScript":
            importScripts(e.data.script);
            break;
        case "vInit": // Init state v
            v = e.data.v;
            break;
        case "vUpdate": // Update state v
            v = { ...v, ...e.data.vUpdate }; // Merge new vars into old vars with overwriting
            break;
        case "chartUpdate": // Update chart properties
            v.charts[e.data.chartId] = { ...v.charts[e.data.chartId], ...e.data.chartUpdate }; // Merge new vars into old vars with overwriting
            break;
        case "loadData":
            loadData();
            break;
        case "refreshCharts":
            prepXGrid(v);
            e.data.chartIds.forEach(function (chartId, index) {
                prepYGrid(v, chartId)
                let chart = {
                    id: chartId,
                    yAxisHtml: getYAxisHtml(v, chartId),
                    drawingHtmls: getDrawingHtmls(v, chartId),
                };
                postMessage({
                    command: "refreshCharts",
                    refreshIndex: e.data.refreshIndex,
                    xAxisHtml: getXAxisHtml(v),
                    charts: [chart]
                });
            });
            break;
    }

}
