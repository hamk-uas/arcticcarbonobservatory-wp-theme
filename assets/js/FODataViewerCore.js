var md = markdownit();

// Compile JSON Schema to expand each $ref and to flatten each allOf
function compileJsonSchema(schemaJson, rootSchema = schemaJson, path = "#") {
    schemaJson.path = path; // To help with debugging elsewhere
    //console.log(`${path}`);
    if (rootSchema.titleIds === undefined) {
        rootSchema.titleIds = {};
        for (const [key, value] of Object.entries(rootSchema["@context"])) {
            if (value["@id"] === "dc:title") {
                rootSchema.titleIds[key] = true;
            }
        }
    }
    // Flatten allOf
    if (schemaJson.allOf !== undefined) {
        let allOf = schemaJson.allOf;
        delete schemaJson.allOf;
        for (let subSchema of allOf) {
            for (const [key, value] of Object.entries(subSchema)) {
                if (schemaJson[key] !== undefined) {
                    console.warn("Cannot flatten JSON Schema allOf:")
                    console.warn(allOf);
                } else {
                    schemaJson[key] = value;                
                }
            }
        }
    }
    // Recursively compile each oneOf
    if (schemaJson.oneOf !== undefined) {
        for (let [index, subSchema] of schemaJson.oneOf.entries()) {
            compileJsonSchema(subSchema, rootSchema, `${path}/oneOf[${index}]`);
        }
    }
    /*// Recursively compile each anyOf
    if (schemaJson.anyOf !== undefined) {
        for (let [index, subSchema] of schemaJson.anyOf.entries()) {
            compileJsonSchema(subSchema, rootSchema, `${path}/anyOf[${index}]`);
        }
    }*/
    // Expand $ref
    if (schemaJson["$ref"] !== undefined) {
        //console.log(`Expand ${path}/$ref`)
        let ref_path = schemaJson["$ref"].split('/');
        let ref = undefined;
        for (const step of ref_path) {            
            if (step === "#") {
                ref = rootSchema;
            } else {
                if (ref[step] !== undefined) {
                    ref = ref[step];
                } else {
                    ref = undefined;
                    console.warn(`Cannot resolve $ref: ${schemaJson["$ref"]}, failing at step ${step}`);
                }
            }
        }        
        if (ref !== undefined) {
            for (const [key, value] of Object.entries(ref)) {
                schemaJson[key] = value;
            }
        }
        delete schemaJson["$ref"]
    }
    // Recursively compile items
    if (schemaJson.items !== undefined) {
        compileJsonSchema(schemaJson.items, rootSchema, `${path}/items`)
    }
    // Recursively compile properties
    if (schemaJson.properties !== undefined) {
        for (let [propertyId, subSchema] of Object.entries(schemaJson.properties)) {
            compileJsonSchema(subSchema, rootSchema, `${path}/properties/${propertyId}`)
        }
    }
}

// Resolve the object from the JSON Schema that matches the JSON and return the resolved schema
function resolveJsonSchema(json, resolvedSchema, schema, rootJson = json, rootSchema = schema, titleIds = undefined, jsonPath = "event") {
    let errors = false;
    //console.log(`Validating ${jsonPath} with ${schema.path}`);
    // Copy titles, copy to valuetitle if the schema has a "const" and a title already exists
    for (const titleId of Object.keys(rootSchema.titleIds)) {
        if (schema[titleId] !== undefined) {
            //console.log(`Add title ${titleId}: ${schema[titleId]}`);
            if (schema["const"] === undefined || resolvedSchema[titleId] === undefined) {
                resolvedSchema[titleId] = schema[titleId];
            } else {
                resolvedSchema[`value${titleId}`] = schema[titleId];
            }
        }
    }
    // Copy type from schema
    if (schema.type !== undefined) {
        resolvedSchema.type = schema.type;
    }
    // Copy format from schema
    if (schema.format !== undefined) {
        resolvedSchema.format = schema.format;
    }
    // Copy const from schema
    if (schema.const !== undefined) {
        resolvedSchema.const = schema.const;
    }
    // Copy x-ui from schema
    if (schema["x-ui"] !== undefined) {
        resolvedSchema["x-ui"] = schema["x-ui"];
    }
    if (resolvedSchema.type === "object") {
        // Fail validation if the object is an array, a string, a number, or a boolean.
        if (["boolean", "number", "string"].includes(typeof json) || Array.isArray(json)) {            
            console.warn(`Failed JSON validation at ${schema.path}. Expected object, got: ${json}`)
            return true;
        }
        // Handle properties of object type schema        
        if (schema.properties !== undefined) {
            // Copy properties from schema to resolved schema, resolving each property. Only do that if the property exists in json.            
            for (const [propertyId, propertySchema] of Object.entries(schema.properties)) {
                if (propertyId in json) {
                    let resolvedPropertySchema = {};
                    if (resolvedSchema.properties !== undefined && resolvedSchema.properties[propertyId] !== undefined) {
                        resolvedPropertySchema = resolvedSchema.properties[propertyId];
                    }
                    errors = resolveJsonSchema((json !== undefined)? json[propertyId] : undefined, resolvedPropertySchema, propertySchema, rootJson, rootSchema, titleIds, `${jsonPath}[${propertyId}]`) || errors;
                    if (resolvedSchema.properties === undefined) {
                        resolvedSchema.properties = {};
                    }
                    resolvedSchema.properties[propertyId] = resolvedPropertySchema;
                }
            }
            // Check required properties for presence
            if (schema.required !== undefined) {                
                for (requiredPropertyId of schema.required) {
                    if (requiredPropertyId in json === false) {
                        console.warn(`Failed JSON Schema resolve at ${schema.path}. Missing required property '${requiredPropertyId}' in:\n${JSON.stringify(json, null, 4)}`);
                        errors = true;
                        resolvedSchema.properties[requiredPropertyId] = undefined; // Mark missing property
                    }
                }
            }
        }
        // Handle oneOf
        if (schema.oneOf !== undefined) {
            // Apply the matching element of a oneOf
            let subSchemas = schema.oneOf.filter(function (subSchema) {
                if (subSchema.properties) {
                    for (const [propertyId, property] of Object.entries(subSchema.properties)) {
                        if (property.const !== undefined && json[propertyId] !== undefined && json[propertyId] === property.const ) {
                            return true;
                        }
                    }
                }
                return false;
            });
            if (subSchemas.length > 1) {
                console.warn(`Failed JSON Schema resolve at ${schema.path}. Too many matches (choosing first) in oneOf for:\n${JSON.stringify(json, null, 4)}`)
                errors = true;
            }            
            if (subSchemas.length > 0) {
                // console.log("oneOf match");
                errors = resolveJsonSchema(json, resolvedSchema, subSchemas[0], rootJson, rootSchema, titleIds, jsonPath) || errors;
            } else {
                console.warn(`Failed JSON Schema resolve at ${schema.path}. No match in oneOf for:\n${JSON.stringify(json, null, 4)}`)
                errors = true;
            }
        }
        /*// Handle anyOf
        if (schema.anyOf !== undefined) {
            // Apply any matching elements of a anyOf
            let subSchemas = schema.anyOf.filter(function (subSchema) {
                if (subSchema.properties) {
                    for (const [propertyId, property] of Object.entries(subSchema.properties)) {
                        if (property.const !== undefined && json[propertyId] !== undefined && json[propertyId] === property.const ) {
                            return true;
                        }
                    }
                }
                return false;
            });
            for (let subSchema of subSchemas) {
                // console.log("oneOf match");
                errors = resolveJsonSchema(json, resolvedSchema, subSchema, rootJson, rootSchema, titleIds, jsonPath) || errors;
            }
        }*/
    }
    if (resolvedSchema.type === "array") {        
        // Fail validation if the object is an array, a string, a number, or a boolean.
        if (["boolean", "number", "string"].includes(typeof json) || !Array.isArray(json)) {            
            console.warn(`Failed JSON Schema resolve at ${schema.path}. Expected array, got:\n${JSON.stringify(json, null, 4)}`)
            return true;
        }
        resolvedSchema.items = []
        for (let [index, element] of json.entries()) {
            let resolvedItemSchema = {}
            errors = resolveJsonSchema(element, resolvedItemSchema, schema.items, rootJson, rootSchema, titleIds, `${jsonPath}[${index}]`) || errors;
            resolvedSchema.items.push(resolvedItemSchema);
        }
    }
    if (resolvedSchema.type === "string") {
        // Fail validation if the object is a boolean, a number, an array, or an object
        if (["boolean", "number", "object"].includes(typeof json)) { // typeof Array is also "object"
            console.warn(`Failed JSON Schema resolve at ${schema.path}. Expected string, got:\n${JSON.stringify(json, null, 4)}`)
            return true;
        }
        // Handle string oneOf
        if (schema.oneOf !== undefined) {
            // Apply the matching element of a oneOf
            let subSchema = schema.oneOf.find(function (subSchema) {
                if (subSchema.const !== undefined && json !== undefined && json === subSchema.const ) {
                    return true;
                }
                return false;
            });
            if (subSchema !== undefined) {
                // console.log("string oneOf match");
                errors = resolveJsonSchema(json, resolvedSchema, subSchema, rootJson, rootSchema, titleIds, jsonPath) || errors;
            } else {
                console.warn(`Failed JSON Schema resolve at ${schema.path}. No match in oneOf for:\n${JSON.stringify(json, null, 4)}`)
                errors = true;
            }
        }
    }
    return errors;
    // console.log(`Resolved ${schema.path}: ${JSON.stringify(resolvedSchema)}`);
}

function jsonToHTML(json, resolvedSchema, bannedProperties = []) {
    // json can be loosely a json object, a string, a number, a vector, etc.
    // resolvedSchema is an unambiguous schema for the json
    if (json === undefined) return ""; // If there is no json, it cannot be HTMLified    
    let html = ""; // Start with an empty HTML.
    let title = null; // By default we don't have a title. We may find a title later.
    let titleIsUnitless = false; // By default we have a usual title not split to resolvedSchema["x-ui"].unitless_title and resolvedSchema["x-ui"].unit
    if (resolvedSchema["x-ui"] !== undefined) {
        title = translate(resolvedSchema["x-ui"], "unitless_title", null);
        if (title !== null && resolvedSchema["x-ui"].unit !== undefined) {           
            titleIsUnitless = true; // Found unitless title and unit
        } else {
            title = null; // No unitless title We still need a title.
        }
    }
    if (title === null) {
        title = translate(resolvedSchema, "title", null);
    }
    if (resolvedSchema.type === "object") {
        html += "<ul>";
    }
    if (title !== null) {
        html += `<li><span class="VariableTitle${resolvedSchema.type === "array"? " ArrayTitle": ""}">${title}`;
        let valuetitle = translate(resolvedSchema, "valuetitle", null);
        if (valuetitle !== null) {
            html += `:</span> <span class="ValueTitle">${valuetitle}</span>`;
        } else if (resolvedSchema.type === "number") {
            if (titleIsUnitless) {
                html += `:</span> <span class="ValueTitle">${json} ${resolvedSchema["x-ui"].unit}</span>`;
            } else {
                html += `:</span> <span class="ValueTitle">${json}</span>`;
            }
        } else if (resolvedSchema.type === "string") {
            html += `:</span> <span class="ValueString">"${json}"</span>`;
        }
        html += "</li>";
    }
    if (resolvedSchema.type === "object") {
        if (resolvedSchema.properties !== undefined) {
            for (const [propertyId, propertySchema] of Object.entries(resolvedSchema.properties)) {
                if (!bannedProperties.includes(propertyId)) {
                    if (propertySchema === undefined) {
                        html += `<li title="Missing property"><span class="VariableTitle MissingJSONProperty">${propertyId}:</span> <span class="ValueTitle MissingJSONValue">(missing required property)</span></li>`;
                    }
                    html += jsonToHTML(json[propertyId], propertySchema, bannedProperties);
                }
            }
        }
        for (const [propertyId, propertyValue] of Object.entries(json)) {
            if (!bannedProperties.includes(propertyId) && (resolvedSchema.properties === undefined || propertyId in resolvedSchema.properties === false)) {
                html += `<li title="Unknown property"><span class="VariableTitle UnknownJSONProperty">${propertyId}:</span> <span class="ValueTitle UnknownJSONValue">${JSON.stringify(propertyValue)} (unknown property)</span></li>`;
            }
        }
        html += "</ul>";
    }
    if (resolvedSchema.type === "array") {
        html += "<ol>";
        for (let [index, itemResolvedSchema] of resolvedSchema.items.entries()) {
            //console.log(`array[${index}] jsonToHTML`);
            html += jsonToHTML(json[index], itemResolvedSchema, bannedProperties);
        }
        html += "</ol>";
    }
    //console.log(html);
    return html;
}

// Translations
var t = {
    tooltip: {
        /* Map controls */
        "mapFilter": "Show/hide filter",
        "mapFilter_fi": "Näytä/piilota suodatin",
        "mapFilter_sv": "Visa/dölj filtret",
        "mapFilterSiteType": "Show/hide a farm type",
        "mapFilterSiteType_fi": "Näytä/piilota maatilatyyppi",
        "mapFilterSiteType_sv": "Visa/dölj gårdstypen",
        "findMyLocation": "Find my location",
        "findMyLocation_fi": "Etsi sijaintini",
        "findMyLocation_sv": "Ange min plats",
        "toggleAttribution": "Toggle attribution",
        "toggleAttribution_fi": "Näytä/piilota lähteet",
        "toggleAttribution_sv": "Visa/dölj attributerna ",
        "mapFeedback": "Map feedback",
        "mapFeedback_fi": "Anna palautetta kartasta",
        "mapFeedback_sv": "Ge feedback på kartan",
        "enterFullscreen": "Enter fullscreen",
        "enterFullscreen_fi": "Kokoruututila",
        "enterFullscreen_sv": "Helskärmsläge",
        "exitFullscreen": "Exit fullscreen",
        "exitFullscreen_fi": "Pois kokoruututilasta",
        "exitFullscreen_sv": "Avsluta helskärmsläge",
        "locationNotAvailable": "Location not available",
        "locationNotAvailable": "Sijaintia ei saatavilla",
        "locationNotAvailable_sv": "Platsen är inte tillgänglig",
        "mapboxLogo": "Mapbox logo",
        "mapboxLogo_fi": "Mapboxin logo",
        "mapboxLogo_sv": "Mapbox logo",
        "map": "Map",
        "map_fi": "Kartta",
        "map_sv": "Karta",
        "resetBearingToNorth": "Reset bearing to north",
        "resetBearingToNorth_fi": "Palauta kompassin pohjoinen",
        "resetBearingToNorth_sv": "Återställ kompassen mot norr",
        "zoomIn": "Zoom in",
        "zoomIn_fi": "Zoomaa sisään",
        "zoomIn_sv": "Zooma in",
        "zoomOut": "Zoom out",
        "zoomOut_fi": "Zoomaa ulos",
        "zoomOut_sv": "Zooma ut",
        "useCtrlPlusScrollToZoomTheMap": "Use Ctrl + scroll to zoom the map",
        "useCtrlPlusScrollToZoomTheMap_fi": "Ctrl + vieritys zoomaa karttaa",
        "useCtrlPlusScrollToZoomTheMap_sv": "Använd Ctrl + skrolla för att zooma på kartan",
        "useCmdPlusScrollToZoomTheMap": "Use ⌘ + scroll to zoom the map",
        "useCmdPlusScrollToZoomTheMap_fi": "⌘ + vieritys zoomaa karttaa",
        "useCmdPlusScrollToZoomTheMap_sv": "Använd ⌘ + skrolla för att zooma på kartan",
        "useTwoFingersToMoveTheMap": "Use two fingers to move the map",
        "useTwoFingersToMoveTheMap_fi": "Liikuta karttaa kahdella sormella",
        "useTwoFingersToMoveTheMap_sv": "Använd två fingrar för att flytta på kartan",
        /* Satellite image selector */
        "toggleSatelliteImages": $ => `Show/hide ${$.numImages? $.numImages + " ": ""}images\n${$.dateString}`,
        "toggleSatelliteImages_fi": $ => `Näytä/piilota ${$.numImages? $.numImages + " kuvaa": "kuvat"}\n${$.dateString}`,
        "toggleSatelliteImages_sv": $ => `Visa/dölj ${$.numImages? $.numImages + " ": ""}bilder\n${$.dateString}`,
        /* Selected satellite image date indicator */
        "satellite": $ => `Selected satellite image date\n${$.dateString}`,
        "satellite_fi": $ => `Valittu satelliittikuvan päivämäärä\n${$.dateString}`,
        "satellite_sv": $ => `Datum på den valda satellitbilden\n${$.dateString}`,
        /* Current time indicator */
        "now": $ => `Present time\n${$.dateString}`,
        "now_fi": $ => `Nykyhetki\n${$.dateString}`,
        "now_sv": $ => `Nutid\n${$.dateString}`,
        /* Pan area */
        "panArea": "Drag to pan",
        "panArea_fi": "Vedä siirtääksesi näkymää",
        "panArea_sv": "Dra för att flytta på det du ser",
        /* Management event */
        "toggleEvent": $ => `Show/hide event\n${$.dateString}`,
        "toggleEvent_fi": $ => `Näytä/piilota tapahtuma\n${$.dateString}`,
        "toggleEvent_sv": $ => `Visa/dölj händelse\n${$.dateString}`,
        /* Chart controls */
        "zoomXIn": "Zoom in time",
        "zoomXIn_fi": "Zoomaa sisään aikaa",
        "zoomXIn_sv": "Zooma in tid",
        "zoomXOut": "Zoom out time",
        "zoomXOut_fi": "Zoomaa ulos aikaa",
        "zoomXOut_sv": "Zooma ut tid",
        "autoZoomY": "Autozoom to values\non/off",
        "autoZoomY_fi": "Automaattinen zoomaus arvoihin\npäälle/pois",
        "autoZoomY_sv": "Zooma automatiskt på värden/npå/av",
        "timeAggregation": "Select time aggregation",
        "timeAggregation_fi": "Valitse ajallinen koostaminen",
        "timeAggregation_sv": "Välj tidsaggregation",
        "chartDownload": "Download image and data",
        "chartDownload_fi": "Lataa kuva ja data",
        "chartDownload_sv": "Ladda ner bild och data",
        "legendItemVisibility": "Toggle item visibility",
        "legendItemVisibility_fi": "Näytä/piilota kohde",
        "legendItemVisibility_sv": "Visa/dölj objekt",
        "selectSatelliteImageType": "Select satellite image type",
        "selectSatelliteImageType_fi": "Valitse satelliittikuvan tyyppi",
        "selectSatelliteImageType_sv": "Välj satellitbildens typ",
    },
    vegetationIndex: {
        "ndviNormalizedSumImage": "cumNDVI",
        "laiImage": "LAI",
        "ndviImage": "NDVI"
    },
    plaintext_titles: {
        "management": "Management",
        "management_fi": "Viljelymenetelmä",
        "management_sv": "Åtgärd",
        "species": "Species",
        "species_fi": "Lajike",
        "species_sv": "Art",
        "soil_texture": "Soil type",
        "soil_texture_fi": "Maalaji",
        "soil_texture_sv": "Jordart",
        "click_to_zoom": "Click to zoom",
        "click_to_zoom_fi": "Zoomaa napsauttamalla",
        "click_to_zoom_sv": "Klicka för att zooma",
        "click_to_view_data": "Click to view data",
        "click_to_view_data_fi": "Napsauta katsoaksesi dataa",
        "click_to_view_data_sv": "Klicka för att se data",
        "site_type_Name": "Farm type",
        "site_type_Name_fi": "Maatilatyyppi",
        "site_type_Name_sv": "Gårdstypen"
    },
    soil_texture_choice_plaintext: {
        "PEAT": "peat",
        "PEAT_fi": "turve",
        "PEAT_sv": "torv",
        "CSA": "coarse sand",
        "CSI": "coarse silt",
        "CSALO": "coarse sandy loam",
        "CL": "clay",
        "CL_fi": "aitosavi",
        "CL_sv": "styv lera",
        "CLLO": "clay loam",
        "CLLO_fi": "hiuesavi",
        "CLLO_sv": "mellanlera",
        "FLO": "fine loam",
        "FLOSA": "fine loamy sand",
        "FSA": "fine sand",
        "FSA_fi": "hieno hiekka",
        "FSA_sv": "fin sand",
        "FSALO": "fine sandy loam",
        "SICLL": "silty clay loam",
        "SICLL_fi": "hiesusavi",
        "SICLL_sv": "siltig mellanlera",
        "LO": "loam",
        "LO_fi": "hiue",
        "LO_sv": "lättlera",
        "LOSA": "loamy sand",
        "LOSA_fi": "hiesupitoinen hiekka",
        "LOSA_sv": "siltig sand",
        "SA": "sand",
        "SA_fi": "hiekka",
        "SA_sv": "sand",
        "SACL": "sandy clay",
        "SACL_fi": "hietasavi",
        "SACL_sv": "sandig lera",
        "SACLL": "sandy clay loam",
        "SACLL_fi": "hiekkapitoinen savimulta",
        "SACLL_sv": "sandig mellanlera",
        "SI": "silt",
        "SI_fi": "hiesu",
        "SI_sv": "silt",
        "SICL": "silty clay",
        "SICL_fi": "silttinen savi",
        "SICL_sv": "siltig lera",
        "SILO": "silty loam",
        "SILO_fi": "hieno hieta",
        "SILO_sv": "siltig lättlera",
        "SALO": "sandy loam",
        "SALO_fi": "hiekkapitoinen hiesu",
        "SALO_sv": "sandig lättlera",
        "VFLOS": "very fine loamy sand",
        "VFSA": "very fine sand",
        "VFSAL": "very fine sandy loam"
    },
    plaintext: {
        air: "air",
        air_fi: "ilma",
        air_sv: "luft",
        soil: "soil",
        soil_fi: "maa",
        soil_sv: "jord",
        up: "up",
        up_fi: "ylöspäin",
        up_sv: "uppåt",
        down: "down",
        down_fi: "alaspäin",
        down_sv: "nedåt",
        plot: "plot",
        plot_fi: "lohko",
        plot_sv: "skifte",
        plotgroup: "plot group",
        plotgroup_fi: "lohkoryhmä",
        plotgroup_sv: "skiftesgrupp",
        unkwnown: "unknown",
        unknown_fi: "ei tiedossa",
        unknown_sv: "okänd"
    },
    mgmt_operations_variable_name_plaintext: {
        "block": "Block",
        "block_fi": "Lohko",
        "block_sv": "Skifte",
    },
    languageExtList: ["", "_fi", "_sv"]
}

// Get property of object in the current language.
// You can pass a fallback value that is returned if the property is not found in the desired language or the default language.
// If fallback is undefined or not given, then the property name itself returned as the fallback value.
function translate(object, property, fallback = property, language = foConfig.language) {
    if (property == null) {
        return translate(t.plaintext, "unknown", "unknown", language);        
    }
    if (language !== 'en') {
        let translationKey = `${property}_${language}`;
        if (object[translationKey] !== undefined && object[translationKey] != null) {
            if (object[translationKey] === null || object[translationKey] === undefined) {
                return object[translationKey];
            } else {
                return md.renderInline(object[translationKey]);
            }
        }
    }
    // Fall back to English
    if (object[property] != null) {
        if (object[property] === null || object[property] === undefined) {
            return object[property];
        } else {
            return md.renderInline(object[property]);
        }
    } else {
        return fallback;
    }
}

// translate but using untouched translations
function unsanitaryTranslate(object, property, fallback = property, language = foConfig.language) {
    if (property == null) {
        return unsanitaryTranslate(t.plaintext, "unknown", "unknown", language);        
    }
    if (language !== 'en') {
        let translationKey = `${property}_${language}`;
        if (object[translationKey] !== undefined && object[translationKey] != null) {
            return object[translationKey];
        }
    }
    // Fall back to English
    if (object[property] != null) {
        return object[property];
    } else {
        return fallback;
    }
}

function getTranslationKey(object, property) {
    if (foConfig.language === 'en') {
        return property;
    } else {
        let translationKey = `${property}_${foConfig.language}`;
        if (object[translationKey] !== undefined) {
            return translationKey;
        } else {
            return property;
        }
    }
}

function addChartColors(v) {
    v.oldChartColors = ["#71CDB6", "#349A80", "#3DBFCB", "#CDCEC8", "#129BC7", "#64D1F4", "#95E2D6", "#5E5E5E", "#DD9E48", "#BC346D", "#7617D5", "#0E0C29"];
    v.chartColors = ["#71CDB6", "#0B7496", "#7CAD39", "#227222", "#E0D15D", "#A59732", "#C7C7C5", "#5E5E5E", "#DD9E48", "#BC346D", "#7617D5"];
    v.airColors = [v.chartColors[1], v.oldChartColors[5], v.oldChartColors[4], v.oldChartColors[2]];
    v.temperatureAirColors = [undefined, v.oldChartColors[11]];
    v.waterColors = [v.oldChartColors[4]];
    v.soilColors = [v.chartColors[7], v.chartColors[6], v.chartColors[8], v.chartColors[9], "#000000", "#804000"] // The last ones are not official colors
    v.disabledColor = ["#CDCEC8"];
}

// Find out which charts can be made and prepare chart data structures, discarding everything unnecessary
function prepCharts(v, chartsJson) {
    chartsJson = JSON.parse(JSON.stringify(chartsJson));

    if (foConfig.chartFilter !== undefined) {
        chartsJson.charts = chartsJson.charts.filter(chart => foConfig.chartFilter[chart.id]);
    }

    var sourceTypeToSources = {}; // Dict: sourceType id => source

    // Add those sources for which non-empty csvList or geoTiffList exists, to dictionary sourceTypeToSources. This is needed for determining which charts need to be made.
    //v.site.sources = v.site.sources.filter(source => source !== null); // Fix upstream bug
    v.site.sources.forEach(function (source) {
        if (source.csvList !== undefined) {
            let newCSVList = source.csvList.filter(csv => !csv.url.includes(".cor.")); // *** TODO: Do the filtering at FMI instead.
            if (newCSVList.length < source.csvList.length) {
                console.warn(`For source "${source.id}", filtered away ${source.csvList.length - newCSVList.length} CSV urls that contains the string ".cor.": ${source.csvList.filter(csv => csv.url.includes(".cor.")).map(csv => `"${csv.url}"`).join (", ")}`);
            }
            source.csvList = newCSVList;
        }
        if ((source.csvList !== undefined && source.csvList != null && source.csvList.length) || (source.geoTiffList !== undefined && source.geoTiffList != null && source.geoTiffList.length) || (source.jsonList !== undefined && source.jsonList != null && source.jsonList.length)) {
            for (; v.sources[source.id] !== undefined;) { // This is a quick fix: Append "-dup" to source id if it already exists. TODO: Please fix this in site.json files instead.
                let newSourceId = source.id + "-dup";
                console.warn(`Renamed duplicate source.id ${source.id} to ${newSourceId}`);
                source.id = newSourceId;
            }
            if (!(source.sourceType in sourceTypeToSources)) {
                sourceTypeToSources[source.sourceType] = [];
            }
            sourceTypeToSources[source.sourceType].push(source);
            v.sources[source.id] = source;
        }
    });

    delete v.site.sources;
    
    // Replace sourceTypes with sources. Add charts that will be made to v.charts.
    chartsJson.charts.forEach(function (chart) {
        chart.sourceTypes.forEach(function (sourceType) {
            if (sourceType.id in sourceTypeToSources) {
                // Merge parameters from sourceType and source, with source parameters overriding sourceType parameters.
                sourceTypeToSources[sourceType.id].forEach(function (source) {
                    let pushIt = true;
                    if (source.csvFields !== undefined) {
                        // Only include the source if all the needed csvFields are available
                        if (sourceType.seriesCSVFields.date !== undefined && !source.csvFields[sourceType.seriesCSVFields.date]) {
                            pushIt = false;
                        }
                        if (sourceType.seriesCSVFields.val !== undefined && !source.csvFields[sourceType.seriesCSVFields.val]) {
                            pushIt = false;
                        }
                        if (sourceType.seriesCSVFields.fractiles !== undefined) {
                            sourceType.seriesCSVFields.fractiles.forEach(function (fractile) {
                                if (!source.csvFields[fractile.startField] || !source.csvFields[fractile.endField]) {
                                    pushIt = false;
                                }
                            });
                        }
                    }
                    if (pushIt) {
                        let sourceWithoutParameters = { ...source }; // Clone
                        if (sourceWithoutParameters.parameters !== undefined) {
                            delete sourceWithoutParameters.parameters; // Remove parameters
                        }
                        let newSource = { ...sourceType, ...sourceWithoutParameters }; // Merge properties, with sourceWithoutParameters properties taking priority.
                        if (source.parameters !== undefined) {
                            newSource.parameters = { ...newSource.parameters, ...source.parameters }; // Merge parameters, with source parameters taking priority.
                        }
                        if (chart.sources === undefined) {
                            chart.sources = [];
                        }
                        chart.sources.push(newSource);
                    }
                });
            }
        });
        delete chart.sourceTypes;
        if (chart.sourceCategoryList !== undefined) {
            chart.sourceCategories = {};
            chart.sourceCategoryList.forEach(function (sourceCategory) {
                chart.sourceCategories[sourceCategory.id] = sourceCategory;
            });
        }
        if (chart.sources !== undefined) {
            // Source can override chart defaults
            chart.sources.forEach(function (source) {
                if (source.override !== undefined) {
                    Object.assign(chart, source.override);
                }
            });
            v.chartIds.push(chart.id);
            v.charts[chart.id] = chart;
            if (chart.id === "satelliteImages") {
            } else {
                chart.autoZoom = false;
            }
            if (chart.defaults !== undefined) {
                Object.assign(chart, chart.defaults);
            }
        }
    });

    v.credits = {};
    v.chartIds.forEach(function (chartId) {
        var chart = v.charts[chartId];
        chart.sources.forEach(function (source) {
            if (v.sources[source.id].charts === undefined) {
                v.sources[source.id].charts = {};
            }
            v.sources[source.id].charts[chartId] = chart;
            if (source.seriesCSVFields !== undefined) {                
                for (const [csvFieldType, csvField] of Object.entries(source.seriesCSVFields)) {
                    if (v.sources[source.id].csvFieldType === undefined) {
                        v.sources[source.id].csvFieldType = {};
                    }
                    if (csvFieldType === "fractiles") {
                        csvField.forEach(function (fractile) {
                            v.sources[source.id].csvFieldType[fractile.startField] = "fractile";
                            v.sources[source.id].csvFieldType[fractile.endField] = "fractile";                            
                            // CSV field credits from source
                            if (source.credits !== undefined && source.credits.length > 0) {
                                if (v.sources[source.id].csvFieldCredits === undefined) {
                                    v.sources[source.id].csvFieldCredits = {};
                                }
                                if (v.sources[source.id].csvFieldCredits[fractile.startField] === undefined) {
                                    v.sources[source.id].csvFieldCredits[fractile.startField] = {};
                                }
                                if (v.sources[source.id].csvFieldCredits[fractile.endField] === undefined) {
                                    v.sources[source.id].csvFieldCredits[fractile.endField] = {};
                                }
                                source.credits.forEach(function (credit) {
                                    v.sources[source.id].csvFieldCredits[fractile.startField][credit] = true;
                                    v.sources[source.id].csvFieldCredits[fractile.endField][credit] = true;
                                });
                            }
                        });
                    } else {
                        // CSV field type
                        v.sources[source.id].csvFieldType[csvField] = csvFieldType;
                        // CSV field credits from source
                        if (source.credits !== undefined && source.credits.length > 0) {
                            if (v.sources[source.id].csvFieldCredits === undefined) {
                                v.sources[source.id].csvFieldCredits = {};
                            }
                            if (v.sources[source.id].csvFieldCredits[csvField] === undefined) {
                                v.sources[source.id].csvFieldCredits[csvField] = {};
                            }
                            source.credits.forEach(function (credit) {
                                v.sources[source.id].csvFieldCredits[csvField][credit] = true;
                                //console.log(`Source ${source.id} CSV field ${csvField} gets credit ${credit}`);
                            });
                        }
                    }
                }
            }
            if (source.sourceCategoryId !== undefined) {
                if (chart.sourceCategories[source.sourceCategoryId].sources === undefined) {
                    chart.sourceCategories[source.sourceCategoryId].sources = [];
                }
                chart.sourceCategories[source.sourceCategoryId].sources.push(source);
            }
            // Merge CSV credits to source credits
            if (source.csvList !== undefined) {
                source.csvList.forEach(function (csv) {
                    if (csv.credits !== undefined) {
                        if (source.credits === undefined) {
                            source.credits = [];
                        }
                        source.credits.push(...csv.credits);
                    }
                });
            }
            if (source.credits !== undefined) {
                // For each credit of the source...
                source.credits.forEach(function (creditId) {
                    // Add the credit to site credits
                    if (v.credits[creditId] === undefined) {
                        v.credits[creditId] = {
                            id: creditId,
                            charts: {},
                            years: {},
                        };
                    }
                    // Collect credit into a credits that concern this chart
                    if (chart.credits === undefined) {
                        chart.credits = {};
                    }
                    chart.credits[creditId] = true;
                    let credit = v.credits[creditId];
                    // Add years to the credit
                    if (source.geoTiffList !== undefined) {
                        source.geoTiffList.forEach(function (geoTiff) {
                            credit.years[new Date(geoTiff.time).getUTCFullYear()] = true;
                        });
                    }
                    if (source.csvList !== undefined) {
                        source.csvList.forEach(function (csv) {
                            credit.years[new Date(csv.startTime).getUTCFullYear()] = true;
                            credit.years[new Date(csv.endTime).getUTCFullYear()] = true;
                        });
                    }
                    credit.charts[chartId] = chart;
                });
            }
        });
        chart.visible = {};
        if (chartId === "satelliteImages") {
            for (let sourceCategoryId in chart.sourceCategories) {
                chart.visible[sourceCategoryId] = false;
                let sourceCategory = chart.sourceCategories[sourceCategoryId];
                //console.log("sourceCategory:");
                //console.log(sourceCategory);
                if (sourceCategory.sources !== undefined) {
                    sourceCategory.sources.forEach(function (source) {
                        source.geoTiffList.forEach(function (geoTiff, geoTiffIndex) {
                            geoTiff.source = source;
                            geoTiff.index = geoTiffIndex;
                            if (sourceCategory.dateToGeoTiffList === undefined) {
                                sourceCategory.dateToGeoTiffList = {};
                            }
                            //geoTiff.source = source;
                            let date = new Date(geoTiff.time).valueOf();
                            if (sourceCategory.dateToGeoTiffList[date] === undefined) {
                                sourceCategory.dateToGeoTiffList[date] = [];
                            }
                            sourceCategory.dateToGeoTiffList[date].push(geoTiff);
                        });
                        //console.log(source);
                    });
                    sourceCategory.geoTiffDates = Object.keys(sourceCategory.dateToGeoTiffList).map(a => parseInt(a)).sort((a, b) => a - b);
                }
            }
            chart.visible[chart.sourceCategoryList[0].id] = true;
        } else {
            chart.sources.forEach(function (source) {
                if (source.seriesCSVFields !== undefined) { 
                    source.legendId = `${source.id}_${source.seriesCSVFields.val}`;                    
                } else if (source.seriesEventFields !== undefined) {
                    source.legendId = `${source.id}_${source.seriesEventFields.val}`;
                }
                chart.visible[source.legendId] = true;
                if (!chart.legendIdToSource) {
                    chart.legendIdToSource = {};
                }
                chart.legendIdToSource[source.legendId] = source;
            });
            if (chart.relatedSatelliteImage !== undefined && v.charts[chart.relatedSatelliteImage.chart] !== undefined && v.charts[chart.relatedSatelliteImage.chart].sourceCategories[chart.relatedSatelliteImage.sourceCategoryId] !== undefined) {
                v.charts[chart.relatedSatelliteImage.chart].sourceCategories[chart.relatedSatelliteImage.sourceCategoryId].relatedChart = chart.id;
            }
        }

        // Auto time aggregation setting picker if timeAggregationSettingIndex = "auto"        
        if (chart.timeAggregationSettingIndex === "auto") {
            let filteredTimeAggregationSettings = [];
            let index = 0;
            let fallbackIndex = 0;
            for (let timeAggregationSetting of chart.timeAggregationSettings) {
                if (timeAggregationSetting.enabled) {
                    if (chart.sources.every(source => source.integrationTime !== undefined && timeAggregationSetting.period % Math.abs(source.integrationTime) == 0)) {
                        if (chart.timeAggregationSettingIndex === "auto") {
                            chart.timeAggregationSettingIndex = index;                            
                        }
                    }
                    if (chart.sources.some(source => source.integrationTime !== undefined && timeAggregationSetting.period % Math.abs(source.integrationTime) == 0)) {
                        filteredTimeAggregationSettings.push(timeAggregationSetting);
                        index++;
                    }
                } else {
                    fallbackIndex = index;
                    filteredTimeAggregationSettings.push(timeAggregationSetting);
                    index++;
                }
            }
            chart.timeAggregationSettings = filteredTimeAggregationSettings;
            if (chart.timeAggregationSettingIndex === "auto" || chart.sources.some(source => source.gappy)) {
                chart.timeAggregationSettingIndex = fallbackIndex;
            }
        }
    });

    // Discard sources that are not used in any chart
    v.sources = Object.fromEntries(Object.entries(v.sources).filter(([sourceId, source]) => source.charts !== undefined));

    // For each chart, discard sourceCategories that don't have any sources
    v.chartIds.forEach(function (chartId) {
        let chart = v.charts[chartId];
        if (chart.sourceCategories !== undefined) {
            Object.entries(chart.sourceCategories).forEach(function ([sourceCategoryId, sourceCategory]) {
                if (sourceCategory.sources === undefined || sourceCategory.sources.length == 0) {
                    delete chart.sourceCategories[sourceCategory.id];
                }
            });
            chart.sourceCategoryList = chart.sourceCategoryList.filter(sourceCategory => chart.sourceCategories[sourceCategory.id] !== undefined);
        }
    });

    // Name the sources in the charts
    v.chartIds.forEach(function (chartId) {
        let chart = v.charts[chartId];
        let sourceNameDups = {};
        chart.sources.forEach(function (source) {            
            if (source.block !== undefined) {
                let block = v.site.blockIdToBlock[source.block];
                if (block === undefined) {
                    console.warn(`Chart ${chartId} source ${source.id} has unknown block ${source.block}. Assigning to site`)
                    source.name = v.site.Name;
                } else {
                    source.name = translate(block, "Name");
                    if (source.name === undefined) {
                        source.name = `${translate(t.plaintext, "plot")} ${source.block}`;
                    }
                }
            } else if (source.blockGroup !== undefined) {
                source.name = `${translate(t.plaintext, "plotgroup")} ${source.blockGroup}`;
            } else {
                source.name = v.site.Name;
            }
            if (sourceNameDups[source.name] === undefined) {
                sourceNameDups[source.name] = 1;
            } else {
                sourceNameDups[source.name]++;
            }
            if (source.sourceCategoryId !== undefined) {
                if (chart.sourceCategories[source.sourceCategoryId] === undefined) {
                    console.warn(`Removed unknown sourceCategory ${source.sourceCategoryId} from chart ${chart.id} source ${source.id}.`);
                    delete source.sourceCategoryId;
                }
            }
        });
        let sourceIndex = 0;
        soilSources = [];
        airSources = [];
        isSoilSource = new Array(chart.sources.length).fill(false);
        isAirSource = new Array(chart.sources.length).fill(false);
        chart.sources.forEach(function (source) {
            if (source.parameters !== undefined) {
                if (source.parameters.height_cm !== undefined) {
                    if (source.parameters.height_cm === "+") {
                        source.parameters.height_cm_sortable = 0;
                        if (source.name === v.site.Name) {
                            source.name = translate(t.plaintext, "air");
                            source.rainbow = true;
                        } else {
                            source.name += ` ${translate(t.plaintext, "air")}`;
                        }
                        airSources.push(sourceIndex);
                        isAirSource[sourceIndex] = true;
                    } else if (source.parameters.height_cm === "-") {
                        source.parameters.height_cm_sortable = 0;
                        if (source.name === v.site.Name) {
                            source.name = translate(t.plaintext, "soil");
                        } else {
                            source.name += ` ${translate(t.plaintext, "soil")}`;
                        }
                        soilSources.push(sourceIndex);
                        isSoilSource[sourceIndex] = true;
                    } else if (source.parameters.height_cm > 0) {
                        source.parameters.height_cm_sortable = source.parameters.height_cm;
                        if (source.name === v.site.Name) {
                            source.name = `${translate(t.plaintext, "air")} ${source.parameters.height_cm} cm`;
                        } else {
                            source.name += ` ${translate(t.plaintext, "air")} ${source.parameters.height_cm} cm`;
                        }
                        airSources.push(sourceIndex);
                        isAirSource[sourceIndex] = true;
                    } else {
                        source.parameters.height_cm_sortable = source.parameters.height_cm;
                        if (source.name === v.site.Name) {
                            source.name = `${translate(t.plaintext, "soil")} ${source.parameters.height_cm} cm`;
                        } else {
                            source.name += ` ${translate(t.plaintext, "soil")} ${source.parameters.height_cm} cm`;
                        }
                        soilSources.push(sourceIndex);
                        isSoilSource[sourceIndex] = true;
                    }
                } else if (source.parameters.direction !== undefined) {
                    if (source.name === v.site.Name) {
                        source.name = translate(t.plaintext, source.parameters.direction);
                    } else {
                        source.name += ` ${translate(t.plaintext, source.parameters.direction)}`;
                    }
                }
            }
            if (source.sourceCategoryId !== undefined) {
                let sourceCategory = chart.sourceCategories[source.sourceCategoryId];
                if (!(sourceCategory.hideTitleIfOnly && Object.keys(chart.sourceCategories).length == 1)) {
                    if (source.name == v.site.Name) {
                        source.name = translate(sourceCategory, "title");
                    } else {
                        source.name = `${translate(sourceCategory, "title")}<br>${translate(source, "name")}`;
                    }
                }
            }
            if (source.sourceType === "fmimeteo") {
                source.name += ` (${v.site.weather_station})`;
            }
            sourceIndex++;
        });
        sourceNameDups = {};
        chart.sources.forEach(function (source) {
            if (sourceNameDups[source.name] === undefined) {
                sourceNameDups[source.name] = 1;
            } else {
                sourceNameDups[source.name]++;
            }
        });
        chart.sources.forEach(function (source) {
            if (sourceNameDups[source.name] > 1 || chart.id === "datasenseBatteryVoltage") {
                source.name += ` (${source.id})`;
            }
        });
        soilSources.sort(function (a, b) { return chart.sources[a].parameters.height_cm_sortable > chart.sources[b].parameters.height_cm_sortable });
        airSources.sort(function (a, b) { return chart.sources[a].parameters.height_cm_sortable < chart.sources[b].parameters.height_cm_sortable });
        sourceIndex = 0;
        let colorIndex = 0;
        chart.sources.forEach(function (source) {
            if (!isSoilSource[sourceIndex] && !isAirSource[sourceIndex]) {
                if (colorIndex < v.chartColors.length) {
                    source.color = v.chartColors[colorIndex++];
                } else {
                    source.color = "#000000";
                }
            }
            sourceIndex++;
        });
        let soilColorIndex = 0;
        soilSources.forEach(function (sourceIndex) {
            if (soilColorIndex < v.soilColors.length) {
                chart.sources[sourceIndex].color = v.soilColors[soilColorIndex++];
            } else {
                chart.sources[sourceIndex].color = "#000000";
            }
        });
        let airColorIndex = 0;
        airSources.forEach(function (sourceIndex) {
            if (chart.id === "temperature") {
                if (airColorIndex < v.temperatureAirColors.length) {
                    chart.sources[sourceIndex].color = v.temperatureAirColors[airColorIndex++];
                } else {
                    chart.sources[sourceIndex].color = "#000000";
                }
            } else {
                if (airColorIndex < v.airColors.length) {
                    chart.sources[sourceIndex].color = v.airColors[airColorIndex++];
                } else {
                    chart.sources[sourceIndex].color = "#000000";
                }
            }
        });
    });

    console.log("v = ");
    console.log(v);

    // Append sourceCategory and source descriptions to chart description
    v.chartIds.forEach(function (chartId) {
        let chart = v.charts[chartId];
        let chartDescription = translate(chart, "description", "");
        if (chart.sourceCategories !== undefined) {
            Object.entries(chart.sourceCategories).forEach(function ([sourceCategoryId, sourceCategory]) {
                if (translate(sourceCategory, "description", null) != null) {
                    let sourceCategoryDescription = translate(sourceCategory, "description");
                    if (!chartDescription.includes(sourceCategoryDescription)) {
                        chartDescription = `${chartDescription} ${sourceCategoryDescription}`;
                    }
                }
            });
            Object.entries(chart.sources).forEach(function ([sourceId, source]) {
                if (translate(source, "description", null) != null) {
                    let sourceDescription = translate(source, "description");
                    if (!chartDescription.includes(sourceDescription)) {
                        chartDescription = `${chartDescription} ${sourceDescription}`;
                    }
                }
            });
        }
        if (chartDescription === "") {
            chart[getTranslationKey(chart, "description")] = undefined;
        } else {
            chart[getTranslationKey(chart, "description")] = chartDescription;
        }
    });
}

function getManagementEventSymbolHtml(mgmt_operations_event, x, y, color, scale = 1) {
    switch (mgmt_operations_event) {
        case "observation":
        case "measurement":
            return getPipetteSymbolHtml(x, y, color, scale);
        case "harvest":
            return getScytheSymbolHtml(x, y, color, scale);
        case "grazing":
            return getGrazingSymbolHtml(x, y, color, scale);
        case "other":
        default:
            return getTractorSymbolHtml(x, y, color, scale);
    }
}

function getGrazingSymbolHtml(x, y, color, scale) {
    return `<g pointer-events="none" transform="translate(${x}, ${y}) scale(${4.1*scale}) translate(-3.3, -3.2) translate(-60.390349,-18.16825)" style="fill-rule:evenodd;fill:${color};stroke:none;">
    <path d="m 61.329224,21.57643 v 0 c 0.122158,0.353603 0.142785,0.251365 0.197061,0.708983 0.01958,0.104781 0.10281,0.344004 0.105032,0.815942 l 0.431543,0.0018 c 0,0 -0.05419,-0.454138 -0.03961,-0.68108 0.02135,-0.332152 0.2365,-0.864736 0.2365,-0.864736 0,0 0.408959,0.04743 0.586301,0.217385 0.03547,0.03399 0.04957,0.138791 0.04957,0.138791 v 0 c 0,0 0.07852,0.266504 0.158618,0.37672 0.11295,0.15541 0.308308,0.233355 0.436202,0.376719 0.11715,0.131321 0.29741,0.436202 0.29741,0.436202 l 0.605499,-0.113373 -7.93e-4,-0.699549 c 0,0 0.124989,-0.533607 0.0694,-0.793093 -0.02051,-0.0957 0.03221,-0.279732 0.03221,-0.279732 0.245671,-0.333625 0.391869,-0.87269 -0.133895,-0.284165 0.02648,-1.295105 -0.322133,-0.112382 -0.322133,-0.112382 -0.56126,-0.612447 -0.880157,-1.962075 -1.571746,-2.152612 -0.475464,0.274533 -0.861849,0.502611 -1.256623,1.192628 -0.394375,0.689317 -0.352589,1.25268 -0.247351,1.884104 z M 64.083134,21.328995 c -0.309467,0.143149 -0.171998,0.476389 0.129453,0.48509 0.103357,-0.311786 -0.129453,-0.48509 -0.129453,-0.48509 z"/>
    <path d="m 62.325893,21.673067 0.241603,0.06874 c 0.01169,0.327405 0.04622,0.42347 0.05755,0.67934 0.02175,0.490932 0.12097,0.504897 0.12097,0.680293 l -0.453448,-0.0158 c -0.01169,-0.280633 -0.107183,-0.711944 -0.0838,-1.1212 z"/>
    <path d="m 65.10374,23.102575 c -0.180554,-0.592513 -0.607028,-0.865709 -0.607028,-0.865709 0,0 0.326927,-0.31739 0.627216,0.289043 -0.16801,-0.723341 -0.140081,-1.207822 -0.140081,-1.207822 0,0 0.415526,0.352825 0.447318,0.947893 0.220522,-0.687686 0.887211,-0.60709 0.887211,-0.60709 0,0 -0.810638,0.610627 -0.79384,1.433999 z"/>    
  </g>`;
}

function getPipetteSymbolHtml(x, y, color, scale) {
    // <path style="fill:none;stroke:${color};stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" d="m 509.77061,27.960504 2.17625,0.04742"/>
    // <path style="fill:none;stroke:${color};stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" d="m 509.77723,29.780408 2.17625,0.04742"/>
    return `<g pointer-events="none" transform="translate(${x}, ${y}) scale(${3.5*scale}) translate(-1.9, -2.9) translate(-68.637254, -149.61243)">
        <g transform="matrix(0.02783964,0.2631146,-0.2631146,0.02783964,64.373332,17.813085)">
            <g transform="matrix(0.65963685,-0.89183205,0.89183205,0.65963685,145.00179,467.55796)">
                <path style="fill:${color};fill-opacity:1;stroke:none;stroke-width:0.901492;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="m 509.70874,32.72005 4.28238,-2.562994 0.0277,3.53846 -0.72506,1.278848 -2.03361,0.561997 -1.48304,-1.46001 z"/>
            </g>
            <rect style="fill:${color};fill-opacity:1;stroke:${color};stroke-width:1.11487;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="3.4152527" height="5.9629211" x="274.40262" y="418.81348" transform="rotate(-53.787372)" ry="1.4811453" rx="1.7076263" />
            <rect style="fill:${color};fill-opacity:1;stroke:${color};stroke-width:1.11487;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="6.7902527" height="1.4004211" x="272.72934" y="423.76477" transform="rotate(-53.787372)" ry="0.27857971" />
            <rect style="fill:none;fill-opacity:1;stroke:${color};stroke-width:1.11487;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="5" height="10.837921" x="273.66452" y="424.32193" transform="rotate(-53.787372)" ry="1.9186401" rx="2.1451263" />
            <rect style="fill:${color};fill-opacity:1;stroke:${color};stroke-width:0.938861;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="1.2790616" height="2.3370237" x="275.42572" y="435.15985" transform="rotate(-53.787372)" ry="0.7142387" />
        </g>
    </g>`;
}

function getScytheSymbolHtml(x, y, color, scale) {
    return `
    <g pointer-events="none" transform="translate(${x}, ${y}) scale(${scale}) translate(${-1.5}, ${0.5}) scale(-0.175, 0.175)">
        <path style="fill:${color};fill-opacity:1;stroke:none;stroke-width:0.264583px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
       d="m -36.768029,-38.195914 c 9.587396,-11.62938 45.3823448,-22.119947 75.677885,4.997597 l -74.606972,79.961537 -8.567307,-9.28125 62.112979,-67.110578 c -9.9952002,-10.709133 -29.78326,-12.345601 -54.616585,-8.567306 z"/>
    </g>`;
}

function getTractorSymbolHtml(x, y, color, scale) {
    return `
    <g pointer-events="none" transform="translate(${x}, ${y}) scale(${scale}) translate(${11.5}, ${11.5}) scale(-0.04, 0.04)">
    <path
        d="m 343.80294,-464.05417 c -15.27689,2.60844 -22.93441,10.06106 -29,18.53125 l -17.78125,107.6875 H 85.959197 c -22.633974,3.4177 -18.15625,13.70231 -18.15625,21.96875 l 17.15625,105.0625 H 100.0842 c 11.92375,-39.65325 92.73915,-38.21796 105.31249,0 h 90.6875 c -4.37792,-69.28605 95.27097,-166.91193 195.96875,-71.75 v -56.90625 h 0.25 v -124.59375 z m -6,27.59375 h 110.375 l 0.3125,97.375 -129.84375,1.0625 15.9375,-92.9375 c 0.55544,-1.89677 0.83604,-3.80624 3.21875,-5.5 z"
        style="fill:${color};fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"/>
    <path
        d="m 484.37085,-212.09637 a 77.17142,77.17142 0 1 1 -154.34284,0 77.17142,77.17142 0 1 1 154.34284,0 z"
        style="opacity:1;fill:none;fill-opacity:15;fill-rule:nonzero;stroke:${color};stroke-width:50;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"/>
    <path
        d="m 198.45785,-170.36983 a 45.654921,45.654921 0 1 1 -91.30984,0 45.654921,45.654921 0 1 1 91.30984,0 z"
        style="opacity:1;fill:none;fill-opacity:1;fill-rule:nonzero;stroke:${color};stroke-width:29.5802;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"/>
    </g>`;
}

function getCalendarSymbolHtml(id, x, y, color, tooltipString) {
    // width="141" height="146"
    return `        
        <g transform="translate(${x}, ${y}) translate(${-70*0.19}, ${-146*0.19}) scale(0.19)"><path fill="${color}"
        d="M13.3,126.4V37.4c0-2.4,.9-4.5,2.6-6.3c1.7-1.8,3.8-2.6
        6.2-2.6h8.8v-6.7c0-3.1,1.1-5.7,3.2-7.9c2.2-2.2,4.7-3.3,7.8-3.3h4.4c3,0
        5.6,1.1,7.8,3.3c2.2,2.2,3.2,4.8,3.2,7.9v6.7h26.4v-6.7c0-3.1,1.1-5.7
        3.2-7.9c2.2-2.2,4.7-3.3,7.8-3.3h4.4c3,0,5.6,1.1,7.8,3.3c2.2,2.2,3.2
        4.8,3.2,7.9v6.7h8.8c2.4,0,4.4,.9,6.2,2.6c1.7,1.8,2.6,3.8,2.6,6.3v88.9c0
        2.4-.9,4.5-2.6,6.3c-1.7,1.8-3.8,2.6-6.2,2.6H22.1c-2.4,0-4.4-.9-6.2-2.6C14.2,130.8
        13.3,128.8,13.3,126.4z M22.1,126.4h96.8V55.2H22.1V126.4z M39.7,41.9c0,.6,.2,1.2
        .6,1.6c.4,.4,.9,.6,1.6,.6h4.4c.6,0,1.2-.2,1.6-.6c.4-.4
        .6-.9,.6-1.6v-20c0-.6-.2-1.2-.6-1.6c-.4-.4-.9-.6-1.6-.6h-4.4c-.6,0-1.2,.2-1.6
        .6c-.4,.4-.6,1-.6,1.6V41.9z
        M92.5,41.9c0,.6,.2,1.2,.6,1.6c.4,.4,.9,.6
        1.6,.6h4.4c.6,0,1.2-.2,1.6-.6c.4-.4
        .6-.9,.6-1.6v-20c0-.6-.2-1.2-.6-1.6c-.4-.4-.9-.6-1.6-.6h-4.4c-.6
        0-1.2,.2-1.6,.6c-.4,.4-.6,1-.6,1.6V41.9z"/></g><rect id="${id}" x="${x-11}" y="${y-26}" width="22" height="24" fill="transparent"><title>${tooltipString}</title></rect>`;
}

function getSatelliteSymbolHtml(x, y, color, tooltipString) {
    return `<g transform=" translate(${x}, ${y}) scale(0.05) translate(${255 * Math.sqrt(2)}, ${128}) rotate(135)" fill="${color}" stroke="none" >
    <path d="M469.672,128.941c13.981-24.243,10.628-55.825-10.081-76.533c-20.71-20.709-52.292-24.061-76.533-10.08L340.732,0
	l-11.494,11.495c-47.217,47.219-47.217,124.049,0,171.267c23.609,23.61,54.621,35.414,85.634,35.414
	c31.013,0,62.025-11.805,85.635-35.414L512,171.268L469.672,128.941z M444.861,104.129l-37.006-37.006
	c2.237-0.507,4.545-0.777,6.896-0.777c8.255,0,16.015,3.214,21.852,9.052C444.385,83.18,447.132,94.114,444.861,104.129z"/>
    <path d="M348.261,265.634l21.638-21.637c-4.324-1.321-8.602-2.828-12.823-4.536c-19.091-7.727-36.192-19.069-50.831-33.708
	c-18.401-18.401-31.139-40.35-38.233-63.663l-21.647,21.647L104.601,21.972L0,126.574l141.764,141.764l-54.913,54.913
	l101.897,101.897l54.913-54.913L385.426,512l104.601-104.601L348.261,265.634z M45.98,126.573l58.621-58.62l24.172,24.172
	l-58.62,58.621L45.98,126.573z M93.142,173.736l58.621-58.621l24.311,24.311l-58.621,58.621L93.142,173.736z M164.755,245.348
	l-24.311-24.311l58.621-58.621l24.312,24.311L164.755,245.348z M266.651,347.246l58.621-58.621l24.173,24.172l-58.621,58.621
	L266.651,347.246z M313.814,394.407l58.621-58.621l24.311,24.311l-58.621,58.62L313.814,394.407z M361.115,441.708l58.621-58.62
	l24.311,24.311l-58.621,58.62L361.115,441.708z"/>
    </g><rect x="${x-13}" y="${y}" width="26" height="20" fill="transparent"><title>${tooltipString}</title></rect>`;
}

function getVisibleSymbolHtml(id, color, onClick, tooltipString, visible = true, defsHtml = "") {
    return `
    <svg id="${id}" style="vertical-align:middle; cursor:pointer" width="39.413" height="40" viewBox="0 -7.3355 39.413 40" onclick="${onClick}" onmousedown="preventDefault(event)">
        <title>${tooltipString}</title>
        <defs>${defsHtml}</defs>
        <rect x="0" y="-7.3355" width="39.413" height="40" style="fill:none; stroke:none"/>
        <g id="${`${id}_hidden`}" style="visibility: ${(!visible) ? "visible": "hidden"}">
            <path d="M102.562,595.666c0-.76-6.849-7.365-13.241-10.722a12.588,12.588,0,0,0-4.371-1.719A8.3,8.3,0,0,0,83.128,583c-.091,0-.181.005-.272.007s-.181-.007-.272-.007a8.3,8.3,0,0,0-1.822.224,12.586,12.586,0,0,0-4.371,1.719C70,588.3,63.149,594.905,63.149,595.666c0,.892,7.012,7.583,13.467,10.863A12.583,12.583,0,0,0,80.7,608.1a8.493,8.493,0,0,0,1.879.234c.091,0,.181,0,.272-.007s.181.007.272.007a8.493,8.493,0,0,0,1.879-.234,12.583,12.583,0,0,0,4.088-1.568C95.55,603.249,102.562,596.558,102.562,595.666Z" transform="translate(-63.149 -583.001)" fill="${v.disabledColor}" />
            <circle cx="19.7065" cy="12.6645" r="9.5" fill="#fff"/>
            <circle cx="19.7065" cy="12.6645" r="3.5" fill="${v.disabledColor}"/>
            <g transform="translate(6.606)">
                <path id="Path_64" data-name="Path 64" d="M464.856,594.249a1.8,1.8,0,0,1-1.27-3.067L486,568.766a1.8,1.8,0,0,1,2.541,2.541l-22.417,22.417A1.791,1.791,0,0,1,464.856,594.249Z" transform="translate(-463.059 -568.24)" fill="${v.disabledColor}"/>
            </g>
        </g>
        <g id="${`${id}_visible`}" style="visibility: ${(visible) ? "visible" : "hidden"}"">
            <rect x="0" y="-7.3355" width="39.413" height="40" style="fill:none; stroke:none"/>
            <path d="M102.562,595.666c0-.76-6.849-7.365-13.241-10.722a12.588,12.588,0,0,0-4.371-1.719A8.3,8.3,0,0,0,83.128,583c-.091,0-.181.005-.272.007s-.181-.007-.272-.007a8.3,8.3,0,0,0-1.822.224,12.586,12.586,0,0,0-4.371,1.719C70,588.3,63.149,594.905,63.149,595.666c0,.892,7.012,7.583,13.467,10.863A12.583,12.583,0,0,0,80.7,608.1a8.493,8.493,0,0,0,1.879.234c.091,0,.181,0,.272-.007s.181.007.272.007a8.493,8.493,0,0,0,1.879-.234,12.583,12.583,0,0,0,4.088-1.568C95.55,603.249,102.562,596.558,102.562,595.666Z" transform="translate(-63.149 -583.001)" fill="${color}"/>
            <circle cx="19.7065" cy="12.6645" r="9.5" fill="#fff"/>
            <circle cx="19.7065" cy="12.6645" r="3.5" fill="${color}"/>
        </g>
    </svg>`;
}

function getZoomInSymbolHtml(id, x, y, tooltipString) {
    return `
    <svg x="${x}" y="${y}" width="42.321" height="45.321" viewBox="0 0 42.321 45.321">
        <g transform="matrix(0.017, -1, 1, 0.017, 0, 31.876)" fill="#ffffff" stroke="#71cdb6" stroke-width="4">
            <circle cx="15.94" cy="15.94" r="15.94" stroke="none" />
            <circle cx="15.94" cy="15.94" r="13.94" fill="none" />
        </g>
        <line x2="13" y2="15" transform="translate(26.5 27.5)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4" />
        <g transform="translate(-0.5 0.5)">
            <line x2="10" transform="translate(11.5 15.5)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4" />
            <line y2="10" transform="translate(16.5 10.5)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4" />
        </g>
        <rect id="${id}" style="cursor:pointer" x="0" y="0" width="42.321" height="45.321" fill="transparent"><title>${tooltipString}</title></rect>
    </svg>`;
}

function getTimeAggregationPeriodText(period) {
    if (period === undefined) return "";

    let period_plaintext = {
        "3600000": "hourly",
        "3600000_fi": "tunti",
        "3600000_sv": "timme",
        "21600000": "6-hourly",
        "21600000_fi": "6 tuntia",
        "21600000_sv": "6 timmar",
        "43200000": "12-hourly",
        "43200000_fi": "12 tuntia",
        "43200000_sv": "12 timmar",
        "86400000": "daily",
        "86400000_fi": "vuorokausi",
        "86400000_sv": "dygn",
        "604800000": "weekly",
        "604800000_fi": "viikko",
        "604800000_sv": "vecka",
        "2592000000": "30-daily",
        "2592000000_fi": "30 päivää",
        "2592000000_sv": "30 dagar"
    };

    return translate(period_plaintext, `${period}`, `${period / 1000} s`);
}

function getTimeAggregationSymbolHtml(chartId, x, y, tooltipString) {
    let chart = v.charts[chartId];
    let timeAggregation = (chart.timeAggregationSettings !== undefined) ? chart.timeAggregationSettings[chart.timeAggregationSettingIndex] : {};
    function g(enabled) {
        return `
        <g stroke-linecap="round" stroke-linejoin="round" stroke-width="4" fill="none" stroke="${enabled ? "#71cdb6" : v.disabledColor}">
            <path d="M2 2V38H38M9 37V13M17 37V17M25 37V4M33 37V6"/>
            <circle stroke="none" fill="${enabled ? "#71cdb6" : v.disabledColor}" cx="9" cy="13" r="4"/>
            <circle stroke="none" fill="${enabled ? "#71cdb6" : v.disabledColor}" cx="17" cy="17" r="4"/>
            <circle stroke="none" fill="${enabled ? "#71cdb6" : v.disabledColor}" cx="25" cy="4" r="4"/>
            <circle stroke="none" fill="${enabled ? "#71cdb6" : v.disabledColor}" cx="33" cy="6" r="4"/>
            <path stroke-width="8" stroke="#fff" d="M6 29L13 22L21 27L29 15L37 18"/>
            <path stroke="${enabled ? v.chartColors[1] : v.disabledColor}" d="M6 29L13 22L21 27L29 15L37 18"/>
        </g>`;
    }
    settingsStr = '';
    chart.timeAggregationSettings.forEach(function (timeAggregationSetting, timeAggregationSettingIndex) {
        settingsStr += `
        <g id="chart_${chartId}_time_aggregation_setting_${timeAggregationSettingIndex}" stroke="#71cdb6" style="visibility:${(chart.timeAggregationSettingIndex == timeAggregationSettingIndex) ? 'visible' : 'hidden'}">
            <text style="font: 16px sans-serif; font-weight:normal;" fill="#000000" stroke="none" text-anchor="middle" pointer-events="none" dominant-baseline="hanging" x="20" y="43">${getTimeAggregationPeriodText(timeAggregationSetting.period)}</text>
        </g>`;
    });
    return `
    <svg id="chart_${chartId}_time_aggregation" x="${x - 20}" y="${y}" width="80" height="58" viewBox="0 0 80 58" onclick="cycleTimeAggregation('${chartId}', event);" onmousedown="preventDefault(event)">
        <g transform="translate(20 0)">            
            <g id="chart_${chartId}_time_aggregation_disabled" stroke="${v.disabledColor}" style="visibility:${(timeAggregation.enabled) ? 'hidden' : 'visible'}">
                ${g(false)}
            </g>
            <g id="chart_${chartId}_time_aggregation_enabled" stroke="#71cdb6" style="visibility:${(timeAggregation.enabled) ? 'visible' : 'hidden'}">
                ${g(true)}
            </g>
            <rect x="0" y="0" width="40" height="40" fill="transparent"><title>${tooltipString}</title></rect>
            ${settingsStr}
    </svg>`;
}

function getZoomOutSymbolHtml(id, x, y, tooltipString) {
    return `
    <svg style="cursor:pointer" x="${x}" y="${y}" width="42.321" height="45.321" viewBox="0 0 42.321 45.321">
        <g transform="matrix(0.017, -1, 1, 0.017, 0, 31.876)" fill="#ffffff" stroke="#71cdb6" stroke-width="4">
            <circle cx="15.94" cy="15.94" r="15.94" stroke="none"/>
            <circle cx="15.94" cy="15.94" r="13.94" fill="none"/>
        </g>
        <line x2="13" y2="15" transform="translate(26.5 27.5)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4"/>
        <line x2="10" transform="translate(11.5 15.5)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4"/>
        <rect id="${id}" style="cursor:pointer" x="0" y="0" width="42.321" height="45.321" fill="transparent"><title>${tooltipString}</title></rect>
    </svg>`;
}

function getAutoZoomSymbolHtml(chartId, x, y, tooltipString) {
    let chart = v.charts[chartId];
    let g = `
    <g transform="matrix(0.017, -1, 1, 0.017, 0, 31.876)" fill="#ffffff" stroke-width="4">
        <circle cx="15.94" cy="15.94" r="15.94" stroke="none"/>
        <circle cx="15.94" cy="15.94" r="13.94" fill="none"/>
    </g>
    <line x2="13" y2="15" transform="translate(26.5 27.5)" fill="none" stroke-linecap="round" stroke-width="4"/>
    <g>
        <g>
            <line x2="5" y2="10" transform="translate(16.5 10.5)" fill="none" stroke-linecap="round" stroke-width="3"/>
            <line x1="5" y2="10" transform="translate(11.5 10.5)" fill="none" stroke-linecap="round" stroke-width="3"/>
        </g>
        <path d="M0,0H7.829" transform="translate(12.5 18.5)" fill="none" stroke-linecap="round" stroke-width="2"/>
    </g>`;
    return `    
    <svg x="${x}" y="${y}" width="42.321" height="45.321" viewBox="0 0 42.321 45.321">
        <g id="chart_${chartId}_auto_zoom_disabled" stroke="${v.disabledColor}" style="visibility:${(chart.autoZoom)? 'hidden' : 'visible'}">
            ${g}
        </g>
        <g id="chart_${chartId}_auto_zoom_enabled" stroke="#71cdb6" style="visibility:${(chart.autoZoom) ? 'visible' : 'hidden'}">
            ${g}
        </g>
        <rect id="chart_${chartId}_auto_zoom" style="cursor:pointer" onclick="toggleAutoZoom('${chartId}', event);" onmousedown="preventDefault(event)" x="0" y="0" width="42.321" height="45.321" fill="transparent"><title>${tooltipString}</title></rect>
    </svg>`;
}

function getDownloadSymbolHtml(id, x, y, tooltipString, color = "#71cdb6", backgroundColor = "#fff", scale = 1) {
    return `
    <svg x="${x}" y="${y}" width="42.321" height="45.321" viewBox="0 0 42.321 45.321">
      <g transform="scale(${scale})">
        <g transform="translate(${(42.321 - 40) / 2} ${(45.321 - 39) / 2})">
          <g fill="${backgroundColor}" stroke="${color}" stroke-width="4">
            <rect width="40" height="39" rx="19.5" stroke="none"/>
            <rect x="2" y="2" width="36" height="35" rx="17.5" fill="none"/>
          </g>
          <g transform="translate(13 9)">
            <line id="Line_8" data-name="Line 8" y2="12" transform="translate(7)" fill="none" stroke="${color}" stroke-linecap="round" stroke-width="4"/>
            <g id="Group_17" data-name="Group 17" transform="translate(2.857 8.806)">
              <path id="Line_10" data-name="Line 10" d="M344.706,568.969l-4.127,4.4-4.127-4.4" transform="translate(-336.452 -568.969)" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
            </g>
            <line id="Line_11" data-name="Line 11" x1="14" transform="translate(0 20)" fill="none" stroke="${color}" stroke-linecap="round" stroke-width="4"/>
          </g>
          <rect id="${id}" style="cursor:pointer" x="0" y="0" width="42.321" height="45.321" fill="transparent">${(tooltipString !== undefined)?`<title>${tooltipString}</title>`:''}</rect>
        </g>
      </g>
    </svg>`;
}

function getChartDownloadTableHtml(chartId) {
    return `<svg id="chart_download_table_${chartId}" class="chart_download" width="281" height="62" viewBox="0 0 281 62"><g fill="#fff" stroke="#71cdb6" stroke-width="4"><rect width="281" height="62" rx="31" stroke="none"/><rect x="2" y="2" width="277" height="58" rx="29" fill="none"/></g><path d="M1.188,17H5.922c3.762,0,6.372-2.376,6.372-5.994S9.684,4.994,5.922,4.994H1.188Zm2.556-2.25V7.244H5.922a3.513,3.513,0,0,1,3.762,3.762A3.594,3.594,0,0,1,5.922,14.75ZM18.09,17.216A4.412,4.412,0,0,0,22.7,12.644,4.408,4.408,0,0,0,18.09,8.09a4.4,4.4,0,0,0-4.59,4.554A4.408,4.408,0,0,0,18.09,17.216Zm0-2.034a2.287,2.287,0,0,1-2.214-2.538,2.241,2.241,0,1,1,4.446,0A2.3,2.3,0,0,1,18.09,15.182ZM32.022,17h2.43L37.1,8.306H34.722l-1.62,5.85-1.908-5.85H29.16l-1.908,5.85-1.62-5.85H23.256L25.9,17H28.35l1.836-5.922ZM44.1,17h2.286V10.862A2.529,2.529,0,0,0,43.56,8.09a3.981,3.981,0,0,0-3.042,1.35V8.306H38.232V17h2.286V11.15a2.476,2.476,0,0,1,1.98-1.026,1.411,1.411,0,0,1,1.6,1.62Zm4.554,0H50.94V4.994H48.654Zm8.586.216a4.412,4.412,0,0,0,4.608-4.572,4.6,4.6,0,0,0-9.2,0A4.408,4.408,0,0,0,57.24,17.216Zm0-2.034a2.287,2.287,0,0,1-2.214-2.538,2.241,2.241,0,1,1,4.446,0A2.3,2.3,0,0,1,57.24,15.182ZM68.76,17h2.286V11.384c0-2.5-1.818-3.294-3.8-3.294a5.7,5.7,0,0,0-3.8,1.368l.864,1.53a3.658,3.658,0,0,1,2.538-1.026c1.152,0,1.908.576,1.908,1.458v1.206a3.514,3.514,0,0,0-2.754-1.062,2.753,2.753,0,0,0-3.024,2.772,2.9,2.9,0,0,0,3.024,2.88A3.6,3.6,0,0,0,68.76,16.1Zm0-2.088a2.286,2.286,0,0,1-1.836.756c-.9,0-1.638-.468-1.638-1.278,0-.846.738-1.314,1.638-1.314a2.286,2.286,0,0,1,1.836.756ZM79.29,17h2.3V4.994h-2.3V9.422A3.348,3.348,0,0,0,76.608,8.09c-2.214,0-3.852,1.728-3.852,4.572,0,2.9,1.656,4.554,3.852,4.554a3.375,3.375,0,0,0,2.682-1.332Zm0-2.808a2.487,2.487,0,0,1-1.98.99,2.264,2.264,0,0,1-2.2-2.52,2.27,2.27,0,0,1,2.2-2.538,2.487,2.487,0,0,1,1.98.99Zm12.1,3.024a2.822,2.822,0,0,0,1.908-.558l-.486-1.728a1.249,1.249,0,0,1-.792.252c-.5,0-.792-.414-.792-.954V10.3h1.764v-2H91.224V5.93h-2.3V8.306H87.48v2h1.44V14.84A2.173,2.173,0,0,0,91.386,17.216ZM99.774,17h2.286V11.384c0-2.5-1.818-3.294-3.8-3.294a5.7,5.7,0,0,0-3.8,1.368l.864,1.53a3.658,3.658,0,0,1,2.538-1.026c1.152,0,1.908.576,1.908,1.458v1.206a3.514,3.514,0,0,0-2.754-1.062A2.753,2.753,0,0,0,94,14.336a2.9,2.9,0,0,0,3.024,2.88A3.6,3.6,0,0,0,99.774,16.1Zm0-2.088a2.286,2.286,0,0,1-1.836.756c-.9,0-1.638-.468-1.638-1.278,0-.846.738-1.314,1.638-1.314a2.286,2.286,0,0,1,1.836.756ZM104.328,17h2.286V15.884a3.375,3.375,0,0,0,2.682,1.332c2.2,0,3.852-1.656,3.852-4.554,0-2.844-1.638-4.572-3.852-4.572a3.348,3.348,0,0,0-2.682,1.332V4.994h-2.286Zm2.286-2.79V11.132a2.522,2.522,0,0,1,1.962-1.008,2.263,2.263,0,0,1,2.214,2.538,2.247,2.247,0,0,1-2.214,2.52A2.544,2.544,0,0,1,106.614,14.21ZM114.876,17h2.286V4.994h-2.286Zm4-4.356a4.4,4.4,0,0,0,4.644,4.572A5.419,5.419,0,0,0,127.1,16.01l-1.008-1.476a3.555,3.555,0,0,1-2.322.864,2.343,2.343,0,0,1-2.5-2.016h6.462v-.5c0-2.844-1.764-4.788-4.356-4.788A4.425,4.425,0,0,0,118.872,12.644Zm4.5-2.736a2.014,2.014,0,0,1,2.142,1.926H121.23A2.089,2.089,0,0,1,123.372,9.908Z" transform="translate(105 21)" fill="#71cdb6"/><g transform="translate(54 15)"><line y2="18" transform="translate(11)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4"/><g transform="translate(-331.952 -554.969)"><path d="M349.452,568.969l-6.5,7-6.5-7" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/></g><line x1="22" transform="translate(0 31)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4"/></g></svg>`;
}

function getChartDownloadImageHtml(chartId) {
    return `<svg id="chart_download_image_${chartId}" class="chart_download" width="281" height="62" viewBox="0 0 281 62"><g fill="#fff" stroke="#71cdb6" stroke-width="4"><rect width="281" height="62" rx="31" stroke="none" /><rect x="2" y="2" width="277" height="58" rx="29" fill="none" /></g><path d="M1.188,17H5.922c3.762,0,6.372-2.376,6.372-5.994S9.684,4.994,5.922,4.994H1.188Zm2.556-2.25V7.244H5.922a3.513,3.513,0,0,1,3.762,3.762A3.594,3.594,0,0,1,5.922,14.75ZM18.09,17.216A4.412,4.412,0,0,0,22.7,12.644,4.408,4.408,0,0,0,18.09,8.09a4.4,4.4,0,0,0-4.59,4.554A4.408,4.408,0,0,0,18.09,17.216Zm0-2.034a2.287,2.287,0,0,1-2.214-2.538,2.241,2.241,0,1,1,4.446,0A2.3,2.3,0,0,1,18.09,15.182ZM32.022,17h2.43L37.1,8.306H34.722l-1.62,5.85-1.908-5.85H29.16l-1.908,5.85-1.62-5.85H23.256L25.9,17H28.35l1.836-5.922ZM44.1,17h2.286V10.862A2.529,2.529,0,0,0,43.56,8.09a3.981,3.981,0,0,0-3.042,1.35V8.306H38.232V17h2.286V11.15a2.476,2.476,0,0,1,1.98-1.026,1.411,1.411,0,0,1,1.6,1.62Zm4.554,0H50.94V4.994H48.654Zm8.586.216a4.412,4.412,0,0,0,4.608-4.572,4.6,4.6,0,0,0-9.2,0A4.408,4.408,0,0,0,57.24,17.216Zm0-2.034a2.287,2.287,0,0,1-2.214-2.538,2.241,2.241,0,1,1,4.446,0A2.3,2.3,0,0,1,57.24,15.182ZM68.76,17h2.286V11.384c0-2.5-1.818-3.294-3.8-3.294a5.7,5.7,0,0,0-3.8,1.368l.864,1.53a3.658,3.658,0,0,1,2.538-1.026c1.152,0,1.908.576,1.908,1.458v1.206a3.514,3.514,0,0,0-2.754-1.062,2.753,2.753,0,0,0-3.024,2.772,2.9,2.9,0,0,0,3.024,2.88A3.6,3.6,0,0,0,68.76,16.1Zm0-2.088a2.286,2.286,0,0,1-1.836.756c-.9,0-1.638-.468-1.638-1.278,0-.846.738-1.314,1.638-1.314a2.286,2.286,0,0,1,1.836.756ZM79.29,17h2.3V4.994h-2.3V9.422A3.348,3.348,0,0,0,76.608,8.09c-2.214,0-3.852,1.728-3.852,4.572,0,2.9,1.656,4.554,3.852,4.554a3.375,3.375,0,0,0,2.682-1.332Zm0-2.808a2.487,2.487,0,0,1-1.98.99,2.264,2.264,0,0,1-2.2-2.52,2.27,2.27,0,0,1,2.2-2.538,2.487,2.487,0,0,1,1.98.99ZM89.6,7.028A1.368,1.368,0,1,0,88.236,5.66,1.367,1.367,0,0,0,89.6,7.028ZM88.47,17h2.286V8.306H88.47Zm15.336,0h2.3V10.718a2.321,2.321,0,0,0-2.556-2.628,3.689,3.689,0,0,0-2.988,1.584A2.3,2.3,0,0,0,98.154,8.09,3.8,3.8,0,0,0,95.31,9.44V8.306H93.024V17H95.31V11.15a2.333,2.333,0,0,1,1.8-1.026c.936,0,1.3.576,1.3,1.386V17h2.3V11.132a2.308,2.308,0,0,1,1.8-1.008c.936,0,1.3.576,1.3,1.386Zm9.774,0h2.286V11.384c0-2.5-1.818-3.294-3.8-3.294a5.7,5.7,0,0,0-3.8,1.368l.864,1.53a3.658,3.658,0,0,1,2.538-1.026c1.152,0,1.908.576,1.908,1.458v1.206a3.514,3.514,0,0,0-2.754-1.062,2.753,2.753,0,0,0-3.024,2.772,2.9,2.9,0,0,0,3.024,2.88A3.6,3.6,0,0,0,113.58,16.1Zm0-2.088a2.286,2.286,0,0,1-1.836.756c-.9,0-1.638-.468-1.638-1.278,0-.846.738-1.314,1.638-1.314a2.286,2.286,0,0,1,1.836.756Zm4.374,4.32a5.267,5.267,0,0,0,3.744,1.3c2.142,0,4.7-.81,4.7-4.122v-8.1h-2.3V9.422A3.348,3.348,0,0,0,121.41,8.09c-2.2,0-3.834,1.584-3.834,4.428,0,2.9,1.656,4.428,3.834,4.428a3.386,3.386,0,0,0,2.682-1.368v.882a2.125,2.125,0,0,1-2.394,2.2,3.455,3.455,0,0,1-2.718-1.08Zm6.138-5.31a2.532,2.532,0,0,1-1.962.99,2.156,2.156,0,0,1-2.2-2.394,2.156,2.156,0,0,1,2.2-2.394,2.479,2.479,0,0,1,1.962.99Zm4.014-1.278a4.4,4.4,0,0,0,4.644,4.572,5.419,5.419,0,0,0,3.582-1.206l-1.008-1.476A3.555,3.555,0,0,1,133,15.4a2.343,2.343,0,0,1-2.5-2.016h6.462v-.5c0-2.844-1.764-4.788-4.356-4.788A4.425,4.425,0,0,0,128.106,12.644Zm4.5-2.736a2.014,2.014,0,0,1,2.142,1.926h-4.284A2.089,2.089,0,0,1,132.606,9.908Z" transform="translate(105 21)" fill="#71cdb6" /><g transform="translate(54 15)"><line y2="18" transform="translate(11)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4" /><g transform="translate(-331.952 -554.969)"><path d="M349.452,568.969l-6.5,7-6.5-7" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" /></g><line x1="22" transform="translate(0 31)" fill="none" stroke="#71cdb6" stroke-linecap="round" stroke-width="4" /></g></svg>`;
}

function getChartSvgInnerHtml(v, chartId, standalone = false) {
    let chart = v.charts[chartId];
    let height;
    if (chartId === "satelliteImages") {
        height = v.dimensions.satelliteImagesHeight;
    } else {
        height = v.dimensions.height;
    }
    let zoomInX = v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth + v.dimensions.width - 42.321 - 15;;
    let { drawingDefsHtml, drawingBackgroundHtml, drawingHtml } = getDrawingHtmls(v, chartId, standalone);
    let controlY = 0;
    function controlYPostfixAdd(value) {
        let temp = controlY;
        controlY += value;
        return temp;
    }
    return `
    <defs>
        ${standalone ? `
            <clipPath id="chart_clip_${chartId}">
                <rect x="0" y="0" width="${v.dimensions.width}" height="${v.dimensions.topMargin + height}" />
            </clipPath>` : ""
        }
        ${!standalone ? `
            <linearGradient id="chart_pan_area_gradient_${chartId}">
                <stop class="main-stop" offset="0%" />
                <stop class="main-stop-second" offset="30%" />
                <stop class="alt-stop-second" offset="70%" />
                <stop class="alt-stop" offset="100%" />
            </linearGradient>
        ` : ""}
    </defs>
    <defs id="chart_drawing_defs_${chartId}">
        ${drawingDefsHtml}
    </defs>
    <g transform="translate(${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth} 0)">
        <svg width="${v.dimensions.width}" height="${v.dimensions.topMargin + height}" ${(standalone) ? `clip-path="url(#chart_clip_${chartId})"` : ''}>
            <g id="chart_drawing_background_${chartId}" transform="translate(0 ${v.dimensions.topMargin})">
                ${drawingBackgroundHtml}
            </g>
        </svg>
    </g>
    ${(chartId !== "satelliteImages") ? `<g transform="translate(${v.dimensions.leftMargin} ${v.dimensions.topMargin + height / 2}) rotate(-90)"> <text style="font: 16px sans-serif;" text-anchor="middle" dominant-baseline="hanging" x="0" y="0">${translate(chart, "yLabel")}</text></g>` : ""}
    <svg width="${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth + v.dimensions.width}" height="${v.dimensions.topMargin + height + v.dimensions.bottomMargin}">
        <g id="chart_y_axis_${chartId}" transform="translate(0 ${v.dimensions.topMargin})" style="font: 14px sans-serif;" text-anchor="end" dominant-baseline="middle">
            ${(standalone ? getYAxisHtml(v, chartId) : "")}
        </g>
    </svg>
    <g transform="translate(0 ${v.dimensions.topMargin + height})">
        <svg width="${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth + v.dimensions.width + v.dimensions.rightMargin}" height="${v.dimensions.bottomMargin}">
            <g id="chart_x_axis_${chartId}" transform="translate(${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth} 0)" style="font: 14px sans-serif;" text-anchor="middle" dominant-baseline="hanging">
                ${(standalone ? getXAxisHtml(v) : "")}
            </g>
        </svg>
    </g>    
    <path style="stroke: #CCCCCC; stroke-width: 2; fill: none;" d="M ${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth} ${v.dimensions.topMargin} ${(true) ? `v ${height}` : `m 0 ${height}`} h ${v.dimensions.width}" />
    <g transform="translate(${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth} 0)">
        ${!standalone ? `<rect id="chart_pan_area_${chartId}" class="ChartPanArea" fill="url(#chart_pan_area_gradient_${chartId})" x="0" y="${v.dimensions.topMargin}" width="${v.dimensions.width}" height="${height}" fill="none"><title>${translate(t.tooltip, 'panArea')}</rect>` : ""}
        <svg width="${v.dimensions.width}" height="${v.dimensions.topMargin + height}" ${(standalone) ? `clip-path="url(#chart_clip_${chartId})"` : ''}>
            <g id="chart_drawing_${chartId}" transform="translate(0 ${v.dimensions.topMargin})">
                ${drawingHtml}
            </g>
        </svg>        
    </g>
    ${(standalone ? "" : `
        <g id="chart_controls_svg_${chartId}" class="ChartControls">
            ${getZoomInSymbolHtml(`chart_zoom_x_in_${chartId}`, zoomInX, controlYPostfixAdd(60), translate(t.tooltip, 'zoomXIn'))}
            ${getZoomOutSymbolHtml(`chart_zoom_x_out_${chartId}`, zoomInX, controlYPostfixAdd(60), translate(t.tooltip, 'zoomXOut'))}
            ${(chart.timeAggregationSettings !== undefined) ? getTimeAggregationSymbolHtml(chartId, zoomInX, controlYPostfixAdd(63), translate(t.tooltip, 'timeAggregation')) : ""}
            ${(chartId !== "satelliteImages") ? getDownloadSymbolHtml(`chart_download_${chartId}`, zoomInX, controlYPostfixAdd(60), translate(t.tooltip, 'chartDownload')) : ""}
            ${(chartId !== "satelliteImages") ? getAutoZoomSymbolHtml(chartId, v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth + 15, 0, unsanitaryTranslate(t.tooltip, 'autoZoomY')) : ""}
        </g>`
    )}`;
}

function getChartSvgOuterHtml(v, chartId, standalone = false, legendItemCoordinates) {
    let height;
    if (chartId === "satelliteImages") {
        height = v.dimensions.satelliteImagesHeight;
    } else {
        height = v.dimensions.height;
    }

    let svgLegend = "";
    let maxY = 0;
    if (standalone) {
        svgLegend += `<g style="font: 14px sans-serif;" text-anchor="start" dominant-baseline="middle">`;
        let chart = v.charts[chartId];
        chart.sources.forEach(function (source, sourceIndex) {
            let x = legendItemCoordinates[sourceIndex][0];
            let y = legendItemCoordinates[sourceIndex][1] + 7;
            if (chartId === 'temperature' && source.rainbow !== undefined) {
                let gradientId = `chart_${chartId}_legend_${source.id}_gradient`;
                svgLegend += `<defs>${getTemperatureGradientHtml(gradientId, x, 0, x + 20, 0, -15, 35)}</defs><line stroke-width="4" stroke="url(#${gradientId})" x1="${x}" y1="${y}" x2="${x + 20}" y2="${y}" />`;
            } else {
                svgLegend += `<line stroke-width="4" stroke="${source.color}" x1="${x}" y1="${y}" x2="${x + 20}" y2="${y}" />`;
            }            
            x += 27;
            let rows = source.name.split("<br>");
            rows.forEach(function (row, rowIndex) {
                svgLegend += `<text x="${x}" y="${y + rowIndex * 14}" ${chart.visible[source.legendId] ? "" : 'style="text-decoration-line: line-through;"'}>${row}</text>`;
            });
            maxY = Math.max(maxY, legendItemCoordinates[sourceIndex][1]);
        });
        svgLegend += "</g>";
    }
    return `
    <svg xmlns="http://www.w3.org/2000/svg" id="chart_svg_${chartId}" ${(standalone ? `width="${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth + v.dimensions.width + v.dimensions.rightMargin}"` : `pointer-events="all" style="touch-action: pan-y;" width="100%"`)} height="${(standalone)? maxY + 50 : v.dimensions.topMargin + height + v.dimensions.bottomMargin}">
        ${getChartSvgInnerHtml(v, chartId, standalone)}
        ${svgLegend}
    </svg>`;
}

// Generate those chart-specific divs that do not need resizing
function getChartDivOuterHtml(v, chartId) {
    return `<div onmousemove="document.getElementById('chart_controls_svg_${chartId}').classList.add('Entered')" onmouseenter="document.getElementById('chart_controls_svg_${chartId}').classList.add('Entered')" onmouseleave="document.getElementById('chart_controls_svg_${chartId}').classList.remove('Entered')" id="chart_div_${chartId}" class="chart_gridcontainer_item"${(chartId === "satelliteImages")? ' style="border: none"' : ''}>
    ${chartId === "satelliteImages"? `<div id="chart_colorbar_container_${chartId}" class="chart_colorbar_container">
        <span id="chart_colorbar_cumNDVI_title_${chartId}" class="chart_colorbar_title chart_colorbar_cumNDVI_title" style="visibility:hidden">${t.vegetationIndex["ndviNormalizedSumImage"]}</span>
        <span id="chart_colorbar_nvdi_title_${chartId}" class="chart_colorbar_title chart_colorbar_ndvi_title" style="visibility:hidden">${t.vegetationIndex["ndviImage"]}</span>
        <span id="chart_colorbar_lai_title_${chartId}" class="chart_colorbar_title chart_colorbar_lai_title" style="visibility:hidden">${t.vegetationIndex["laiImage"]}</span>
        <img id="chart_colorbar_${chartId}" class="chart_colorbar" style="visibility:hidden" width="48px" src="${foConfig.imagesUrl}/colorbar.svg" alt="colorbar">
        <img id="chart_colorbar_lai_${chartId}" class="chart_colorbar_lai" style="visibility:hidden" width="48px" src="${foConfig.imagesUrl}/colorbar_lai_8.svg" alt="colorbar LAI">
    </div>`: ''}
    ${foConfig.chartDivInnerHTMLTemplate.replaceAll("chartId", chartId)}
    </div>`;
}

function prepXGrid(v) {
    // Find the first day at time 00:00 UTC that is within view
    var pixelsPerMillisecond = v.dimensions.width / (v.endDate - v.startDate);
    var pixelsPerHour = pixelsPerMillisecond * (1000 * 60 * 60);
    var gridDate = new Date(v.startDate);
    // Round down to the start of the current hour
    gridDate.setUTCMilliseconds(0);
    gridDate.setUTCSeconds(0);
    gridDate.setUTCMinutes(0);
    var minPixelsPerTickLabel;
    let pixelsPerTick;
    // Can we show hour ticks?
    if (pixelsPerHour < v.minPixelsPerHourTick) {
        // No. Can we show day ticks?
        gridDate.setUTCHours(0);
        var pixelsPerDay = pixelsPerHour * 24;
        if (pixelsPerDay < v.minPixelsPerDayTick) {
            // No. Can we show month ticks?
            gridDate.setUTCDate(1);
            var pixelsPerMonth = pixelsPerDay * 30;
            if (pixelsPerMonth < v.minPixelsPerMonthTick) {
                // No. But we can always show year ticks.
                gridDate.setUTCMonth(0);
                v.tickStep = 3; // 1 year
            } else {
                // We can show month ticks.
                v.tickStep = 2; // 1 month
            }
        } else {
            // We can show day ticks.
            v.tickStep = 1; // 1 day
        }
    } else {
        // We can show hour ticks.
        v.tickStep = 0; // 1 hour
    }

    v.xGrid = [];
    let margin = 1000; // Try Infinity
    let year = false;
    for (; gridDate <= v.endDate;) {
        if (gridDate >= v.startDate) {
            let utc = gridDate.valueOf();
            let x = (utc - v.startDate) * pixelsPerMillisecond;
            let str = "";
            let gridDateCopy = new Date(gridDate);
            let importance = -1;
            switch (true) {
                case true:
                    if (gridDate.getUTCMonth() == 0 && gridDate.getUTCDate() == 1 && gridDate.getUTCHours() == 0) { // Years
                        if (margin < v.minPixelsPerYearTickLabel) {
                            for (let index = v.xGrid.length - 1; (index >= 0 && v.xGrid[index].importance < 3); index--) {
                                if (v.xGrid[index].importance >= 0 && v.xGrid[index].x < v.dimensions.width - v.minPixelsPerUTCText - v.minPixelsPerYearTickLabel) {
                                    v.xGrid[index].str = "";
                                    v.xGrid[index].importance = -1;
                                    margin = 1000;
                                    break;
                                }
                            }
                        }
                        if (margin >= v.minPixelsPerYearTickLabel && x < v.dimensions.width - v.minPixelsPerUTCText - v.minPixelsPerYearTickLabel) {
                            str = `${gridDate.getUTCFullYear()}`;
                            year = true;
                            margin = -v.minPixelsPerYearTickLabel;
                            importance = 3;
                            break;
                        }
                    }
                    if (gridDate.getUTCDate() == 1 && gridDate.getUTCHours() == 0) { // Months
                        if (margin < v.minPixelsPerMonthTickLabel) {
                            for (let index = v.xGrid.length - 1; (index >= 0 && v.xGrid[index].importance < 2); index--) {
                                if (v.xGrid[index].importance >= 0 && v.xGrid[index].x < v.dimensions.width - v.minPixelsPerUTCText - v.minPixelsPerMonthTickLabel) {
                                    v.xGrid[index].str = "";
                                    v.xGrid[index].importance = -1;
                                    margin = 1000;
                                    break;
                                }
                            }
                        }
                        if (margin >= v.minPixelsPerMonthTickLabel && x < v.dimensions.width - v.minPixelsPerUTCText - v.minPixelsPerMonthTickLabel) {
                            str = `${gridDate.getUTCDate()}.${gridDate.getUTCMonth() + 1}.${gridDate.getUTCFullYear()}`;
                            year = true;
                            margin = -v.minPixelsPerMonthTickLabel;
                            importance = 2;
                            break;
                        }
                    }
                    if (gridDate.getUTCHours() == 0) { // Days
                        if (margin < v.minPixelsPerDayTickLabel) {
                            for (let index = v.xGrid.length - 1; (index >= 0 && v.xGrid[index].importance < 1); index--) {
                                if (v.xGrid[index].importance >= 0 && v.xGrid[index].x < v.dimensions.width - v.minPixelsPerUTCText - v.minPixelsPerDayTickLabel) {
                                    v.xGrid[index].str = "";
                                    v.xGrid[index].importance = -1;
                                    margin = 1000;
                                    break;
                                }
                            }
                        }
                        if (margin >= v.minPixelsPerDayTickLabel && x < v.dimensions.width - v.minPixelsPerUTCText - v.minPixelsPerDayTickLabel) {
                            str = `${gridDate.getUTCDate()}.${gridDate.getUTCMonth() + 1}.`;
                            margin = -v.minPixelsPerDayTickLabel;
                            importance = 1;
                            break;
                        }
                    }
                    if (margin >= v.minPixelsPerHourTickLabel && x < v.dimensions.width - v.minPixelsPerUTCText - v.minPixelsPerHourTickLabel) { // Hours
                        str = `${String(gridDate.getUTCHours()).padStart(2, '0')}:00`;
                        margin = -v.minPixelsPerHourTickLabel;
                        importance = 0;
                    }
            }
            v.xGrid.push({
                x: x,
                utc: utc,
                str: str,
                importance: importance
            });
        }

        switch (v.tickStep) {
            case 0:
                gridDate.setUTCHours(gridDate.getUTCHours() + 1);
                break;
            case 1:
                gridDate.setUTCDate(gridDate.getUTCDate() + 1);
                break;
            case 2:
                gridDate.setUTCMonth(gridDate.getUTCMonth() + 1);
                break;
            case 3:
                gridDate.setUTCFullYear(gridDate.getUTCFullYear() + 1);
                break;
        }

        if (v.xGrid.length > 0) {
            margin += (gridDate.valueOf() - v.xGrid[v.xGrid.length - 1].utc) * pixelsPerMillisecond;
        }

    }

    if (!year) {
        for (let index = 0; index < v.xGrid.length; index++) {
            if (v.xGrid[index].importance == 1) {
                let gridDate = new Date(v.xGrid[index].utc);
                v.xGrid[index].str = `${gridDate.getUTCDate()}.${gridDate.getUTCMonth() + 1}.${gridDate.getUTCFullYear()}`;
                break;
            }
        }
    }
}

function prepYGrid(v, chartId) {
    var chart = v.charts[chartId];

    if (chart.defaults !== undefined && chart.defaults.yMin !== undefined && chart.defaults.yMax !== undefined) {
        chart.yMin = chart.defaults.yMin;
        chart.yMax = chart.defaults.yMax;
        let minVal;
        let maxVal;
        if (chart.autoZoom) {
            ({ seriesLists, loading, minVal, maxVal } = getSeriesLists(v, chartId));            
            if (minVal != Infinity && maxVal != -Infinity) {
                if (minVal == maxVal) {
                    if (chart.minMaxIncludesZero && minVal < 0) {
                        chart.yMin = minVal;
                    } else if (minVal > chart.yMax) {
                        chart.yMax = minVal;
                    }
                } else if (chart.minMaxIncludesZero && minVal >= 0) {
                    chart.yMin = 0;
                    chart.yMax = maxVal;
                } else {
                    let threshold = maxVal / 1000;
                    if (maxVal - minVal < threshold) {                    
                        let mean = 0.5 * (minVal + maxVal);
                        chart.yMin = mean - 0.5 * threshold;
                        chart.yMax = mean + 0.5 * threshold;
                    } else {
                        chart.yMin = minVal;
                        chart.yMax = maxVal;
                    }
                }
            }
        }
    }

    var pixelsPerUnit = v.dimensions.height / (chart.yMax - chart.yMin);
    var pixelsPerStep = pixelsPerUnit;
    var log10Step = 0;
    for (; pixelsPerStep < v.minPixelsPerValTick;) {
        pixelsPerStep *= 10;
        log10Step++;
    }
    for (; pixelsPerStep > v.dimensions.height / 3 || pixelsPerStep >= v.minPixelsPerValTick * 10;) {
        pixelsPerStep *= 0.1;
        log10Step--;
    }
    var unitsPerStep = Math.pow(10, log10Step);
    var stepsPerUnit = Math.pow(10, -log10Step);
    var steps = Math.floor(chart.yMin / unitsPerStep) - 1;
    for (; steps * unitsPerStep < chart.yMin - 0.01 / pixelsPerUnit;) {
        steps++;
    }
    v.yGrid = [];
    for (; steps * unitsPerStep <= chart.yMax + 0.01 / pixelsPerUnit;) {
        let str;
        if (log10Step < 0) {
            str = Math.round(steps) / stepsPerUnit;
        } else {
            str = (steps * unitsPerStep).toString();
        }
        v.yGrid.push({
            val: steps * unitsPerStep,
            str: str
        });
        steps++;
    }
}

function getXAxisHtml(v) {
    var retVal = '<g stroke="#DDDDDD" fill="none" stroke-width="2">' // Chart axis line
    var tickLabels = "";
    v.xGrid.forEach(function (tick) {
        let x = tick.x.toFixed(1);
        retVal += `<line ${(tick.importance >= 0) ? 'stroke="#aaaaaa"' : ''} x1="${x}" y1="0" x2="${x}" y2="12" />`;
        tickLabels += `<text x="${x}" y="${20}">${tick.str}</text>` // Chart tick label
    });
    retVal += `</g>`;
    retVal += `
    <g style="font: 14px sans-serif;" text-anchor="start" dominant-baseline="middle" fill="#000000" stroke="none">
        <text pointer-events="none" text-anchor="end" dominant-baseline="hanging" x="${v.dimensions.width}" y="${20}">UTC</text>
    </g>`;
    retVal += tickLabels;
    return retVal;
}

function getYAxisHtml(v, chartId) {
    var chart = v.charts[chartId];
    var pixelsPerUnit = v.dimensions.height / (chart.yMax - chart.yMin);
    var retVal = `<path style="stroke: #000000; stroke-opacity: 0.08; stroke-width: 1;" d="` // Chart grid
    var tickLabels = "";
    v.yGrid.forEach(function (tick) {
        let y = (tick.val - chart.yMin) * pixelsPerUnit;
        retVal += `M ${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth + v.dimensions.width} ${v.dimensions.height - y} H ${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth - 13} `
        tickLabels += `<text x="${v.dimensions.leftMargin + v.dimensions.yAxisAreaWidth - 22}" y="${v.dimensions.height - y}">${tick.str}</text>` // Chart tick label
    });
    retVal += `"/>`;
    retVal += tickLabels;
    return retVal;
}

function getTemperatureGradientHtml(id, x1, y1, x2, y2, minTemp, maxTemp) {
    return `
    <linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        <stop offset="${(0 - minTemp)/(maxTemp - minTemp)}" style="stop-color:#0040ff" />
        <stop offset="${(5 - minTemp) / (maxTemp - minTemp)}" style="stop-color:#00d000" />
        <stop offset="${(25 - minTemp) / (maxTemp - minTemp)}" style="stop-color:#c0ff00" />
        <stop offset="${(35 - minTemp) / (maxTemp - minTemp)}" style="stop-color:#fff000" />
    </linearGradient>`; //         <stop offset="0.5" style="stop-color:#c0c0ff" />
}

function linkify(url, text, isHtml) {
    if (isHtml) {
        return `<a href="${url}" target="_blank">${text}</a>`;
    } else {
        return `${text} (${url})`;
    }
}

function getCreditStr(credit, isHtml, enableSitePI) {
    let creditStr = "";
    if (isHtml) {
        creditStr += '<p>';
    }
    let chartTitles = Object.keys(credit.charts).map(chartId => translate(v.charts[chartId], "title", chartId, "en"));
    let chartsStr = chartTitles.slice(0, -1).join(', ') + ((chartTitles.length > 1) ? " and " : "") + chartTitles.slice(-1);
    let years = Object.keys(credit.years).sort((a, b) => a - b);
    let yearsStr = years.join(', ');
    switch (credit.id) {
        case "sentinelDerivative":
            creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} modified ${linkify("https://scihub.copernicus.eu/dhus", "Copernicus Sentinel", isHtml)} data (${yearsStr}). ${linkify("https://sentinel.esa.int/documents/247904/690755/Sentinel_Data_Legal_Notice/", "License", isHtml)}.`;
            break;
        case "camsModified":
            creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} modified ${linkify("https://atmosphere.copernicus.eu/", "Copernicus Atmosphere Monitoring Service", isHtml)} information (${yearsStr}). ${linkify("https://confluence.ecmwf.int/display/CKB/How+to+reference+or+acknowledge+data+from+CAMS+%28Copernicus+Atmosphere+Monitoring+Service%29+in+a+publication", "Reference and license", isHtml)}. Neither the European Commission nor ${linkify("https://www.ecmwf.int/", "ECMWF", isHtml)} is responsible for any use that may be made of the information it contains.`;
            break;
        case "fmiOpenData":
            creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} open weather data from the ${linkify("https://en.ilmatieteenlaitos.fi/", "Finnish Meteorological Institute", isHtml)} (FMI). ${linkify("https://en.ilmatieteenlaitos.fi/open-data-licence", "License", isHtml)}.`;
            break;
        case "smhiOpenData":
            creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} open weather data from the ${linkify("https://www.smhi.se/en", "Swedish Meteorological and Hydrological Institute", isHtml)} (SMHI). ${linkify("https://www.smhi.se/en/services/open-data/conditions-of-use-1.33347", "License", isHtml)}.`;
            break;
        case "ecmwf_ensemble_forecast":
            creditStr += `The probability forecast in ${chartsStr} is produced by the ${linkify("https://www.ecmwf.int/", "European Centre for Medium-Range Weather Forecasts", isHtml)} (ECMWF) and disseminated by the ${linkify("https://en.ilmatieteenlaitos.fi/", "Finnish Meteorological Institute", isHtml)}.`;
            break;
        case "fmiIntensiveSite":
            creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} data produced by the ${linkify("https://en.ilmatieteenlaitos.fi/", "Finnish Meteorological Institute", isHtml)} under the ${linkify("https://creativecommons.org/licenses/by/4.0/", "Creative Commons Attribution 4.0 International license (CC BY 4.0)", isHtml)} and provided without warranty of any kind. Please note that the data are provisional and will be subject to further quality control.`;
            break;
        case "hy":
            creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} data produced by the ${linkify("https://www2.helsinki.fi/en/inar-institute-for-atmospheric-and-earth-system-research", "INAR Institute of University of Helsinki", isHtml)} under the ${linkify("https://creativecommons.org/licenses/by/4.0/", "Creative Commons Attribution 4.0 International license (CC BY 4.0)", isHtml)} and provided without warranty of any kind. Please note that the data are provisional and will be subject to further quality control.`;
            break;
        case "datasense":
            creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} data from ${linkify("https://www.datasense.fi/", "Datasense", isHtml)} sensors.`;
            break;
        case "lonzee":
            creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} data from Bodson, B., Chopin, H., De Ligne, A., Demoulin, L., Douxfils, B., Engelmann, T., Faurès, A., Heinesch, B., Longdoz, B., Manise, T., Piret, A., Thyrion, T., Ecosystem Thematic Centre (2021). Fluxnet Product, Lonzee, 2003-12-31–2020-12-31, Miscellaneous, ${linkify("https://hdl.handle.net/11676/ql2ZkJ2Xx4a4yOyG3cd5lsBS", "https://hdl.handle.net/11676/ql2ZkJ2Xx4a4yOyG3cd5lsBS", isHtml)}. ICOS data is ${linkify("https://data.icos-cp.eu/licence", "licensed", isHtml)} under a ${linkify("https://creativecommons.org/licenses/by/4.0/", "Creative Commons Attribution 4.0 International license (CC BY 4.0)", isHtml)}.`;
            break;
        }
    if (isHtml) {
        creditStr += "</p>";
    }
    return creditStr;
}

function getChartCsvAndTxt(v, chartId) {
    let chart = v.charts[chartId];
    let { seriesLists, loading } = getSeriesLists(v, chartId, date => new Date(date).toISOString());    
    let exportSources = []; // These are indexes to seriesLists
    let hasFlags = false;
    for (let sourceIndex = 0; sourceIndex < chart.sources.length; sourceIndex++) {
        let source = chart.sources[sourceIndex];
        if (source.seriesCSVFields !== undefined) {
            if (source.seriesCSVFields.date !== undefined && seriesLists[sourceIndex].length != 0) {
                if (!(source.credits !== undefined && source.credits.some((source) => source === "ecmwf_ensemble_forecast"))) {
                    exportSources.push(sourceIndex);
                }
            }
            if (source.seriesCSVFields.flags !== undefined) {
                hasFlags = true;
            }
        }
    }
    let txt = `The CSV file is encoded in UTF-8.\n`;
    let popupHTML = '<h4>Credits and licenses</h4>';
    if (hasFlags) {
        txt += `\nFlags, combined using binary OR: 1: prediction 2: final scientific QC. 4: stable. 8: unstable. 16: online filtering v1. 32: online gapfilling v1.`;
    }
    if (v.credits !== undefined) {
        for (const credit of Object.values(v.credits).filter(credit => credit.charts[chartId] !== undefined)) {
            let chartCredit = {...credit};
            chartCredit.charts = {};
            chartCredit.charts[chartId] = chart;
            txt += `\n${getCreditStr(chartCredit, false, true)}`;
            popupHTML += `\n${getCreditStr(chartCredit, true, true)}`;
        }
    }
    txt += `\n${(chart.credits["fmiIntensiveSite"] && v.site.pi_Name && v.site.pi_email) ? `We kindly ask you to contact the principal investigator of the site, ${v.site.pi_Name} (${v.site.pi_email}), about scientific use of the data.` : `The principal investigator of the site is ${v.site.pi_Name} (${v.site.pi_email})`}`;
    popupHTML += `\n${(chart.credits["fmiIntensiveSite"] && v.site.pi_Name && v.site.pi_email) ? `<h4>Notice</h4><p>We kindly ask you to contact the principal investigator of the site, ${v.site.pi_Name} (${v.site.pi_email}), about scientific use of the data.</p>` : ""}`;
    txt += `\n${(loading ? "WARNING: CSV exported in the middle of data load" : "")}`;
    txt += `\ntitle=${v.charts[chartId].title}`;
    txt += `\nyLabel=${v.charts[chartId].yLabel}`;
    let csv = '';
    if (exportSources.length != 0) {
        let exportSeriesList = [];
        let fillers = [];
        let maxExportSeriesLength = 0;
        for (let exportSourceIndex = 0; exportSourceIndex < exportSources.length; exportSourceIndex++) {
            let sourceIndex = exportSources[exportSourceIndex];
            let source = chart.sources[sourceIndex];
            let stdErr = (source.seriesCSVFields.stdErr !== undefined);
            let flags = (source.seriesCSVFields.flags !== undefined);
            let filler = `,${(stdErr ? "," : "")}${(flags ? "," : "")}`;
            let exportSeries = [
                `${source.id}${filler}`,
                `${source.seriesCSVFields.date},${source.seriesCSVFields.val}${(stdErr ? `,${source.seriesCSVFields.stdErr}` : "")}${(flags ? `,${source.seriesCSVFields.flags}` : "")}`/*,
                `UTC,${source.name}${(stdErr ? ",stdErr" : "")}${(flags ? ",flags" : "")}`    */
            ];
            for (let seriesIndex = 0; seriesIndex < seriesLists[sourceIndex].length; seriesIndex++) {                
                let series = seriesLists[sourceIndex][seriesIndex];
                series.forEach(function (sample) {
                    exportSeries.push(`${sample.date},${sample.val}${(stdErr ? `,${sample.stdErr}` : "")}${(flags ? `,${sample.flags}` : "")}`);
                });                
                if (seriesIndex < seriesLists[sourceIndex].length - 1) {
                    exportSeries.push(filler);
                }
            }
            if (exportSeries.length > maxExportSeriesLength) {
                maxExportSeriesLength = exportSeries.length;
            }
            exportSeriesList.push(exportSeries);
            fillers.push(filler);
        }        
        for (let exportSeriesIndex = 0; exportSeriesIndex < maxExportSeriesLength; exportSeriesIndex++) {
            for (let exportSourceIndex = 0; exportSourceIndex < exportSources.length; exportSourceIndex++) {
                if (exportSeriesIndex < exportSeriesList[exportSourceIndex].length) {
                    csv += `${exportSeriesList[exportSourceIndex][exportSeriesIndex]}${(exportSourceIndex < exportSources.length - 1 ? "," : "\n")}`;
                } else {
                    csv += `${fillers[exportSourceIndex]}${(exportSourceIndex < exportSources.length - 1 ? "," : "\n")}`;
                }
            }
        }
    }
    return [csv, txt, popupHTML];
}

// For a given chart, get a list that contains for each source a list of series. Each series is a list of samples. Each sample consists of a date, a val and possibly stdErr and/or flags.
function getSeriesLists(v, chartId, processDate = date => date, processVal = val => val, processStdErr = stdErr => stdErr, processIntegrationTime = integrationTime => integrationTime) {
    let chart = v.charts[chartId];
    let timeAggregation = (chart.timeAggregationSettings !== undefined) ? chart.timeAggregationSettings[chart.timeAggregationSettingIndex] : {};
    let minVal = Infinity;
    let maxVal = -Infinity;
    let loading = false;
    let seriesLists = [];
    chart.sources.forEach(function (source) {
        let seriesList = [];
        let series = [];
        if (source.jsonList !== undefined && chart.visible[source.legendId] && source.seriesEventFields !== undefined) {
            source.jsonList.forEach(function (json) {
                let jsonStartDate = new Date(json.startTime);
                let jsonEndDate = new Date(json.endTime);
                if (jsonStartDate <= v.endDate && jsonEndDate >= v.startDate) {
                    if (json.loaded === undefined) {
                        loading = true;
                    }
                    if (json.data === undefined || json.data.management === undefined || json.data.management.events === undefined) {
                        if (series.length > 0) {
                            seriesList.push(series);
                            series = [];
                        }
                    } else {
                        json.data.management.events.filter(function (event) {
                            if (source.acceptFilter !== undefined && event[source.acceptFilter.key] !== source.acceptFilter.val) {                                
                                return false;
                            }
                            if (event[source.seriesEventFields.date] === undefined) {
                                return false;
                            }
                            if (event[source.seriesEventFields.val] !== undefined && event[source.seriesEventFields.val] !== "-99.0") {
                                return true;
                            }
                            if (event[source.seriesEventFields.altVal] !== undefined && event[source.seriesEventFields.altVal] !== "-99.0") {
                                return true;
                            }
                            return false;
                        }).forEach(function (event) {
                            let val = event[source.seriesEventFields.val];
                            if (val === undefined || val === "-99.0") {
                                val = event[source.seriesEventFields.altVal];
                            }
                            if (val !== undefined && val !== "-99.0" && !Array.isArray(val)) {                                
                                let sample = {
                                    date: processDate((new Date(event[source.seriesEventFields.date])).valueOf()),
                                    val: processVal(val),
                                };
                                series.push(sample);
                                // Update minimum and maximum
                                if ((new Date(event[source.seriesEventFields.date])).valueOf() >= v.startDate && (new Date(event[source.seriesEventFields.date])).valueOf() <= v.endDate) {
                                    maxVal = Math.max(maxVal, val);
                                    minVal = Math.min(minVal, val);
                                }
                            }
                        });
                    }
                }
            });
        }
        if (source.csvList !== undefined && ((chartId === "satelliteImages")? chart.visible[source.sourceCategoryId] : chart.visible[source.legendId])) {
            let acceptedDate = 0;
            let acceptedIntegrationTime = 0;
            let timeAggregationPeriodStart = 0;
            let timeAggregationAccumulator = 0;
            source.csvList.forEach(function (csv) {
                let csvStartDate = new Date(csv.startTime);
                let csvEndDate = new Date(csv.endTime);
                if (csvStartDate <= v.endDate && csvEndDate >= v.startDate) {
                    if (csv.loaded === undefined) {
                        loading = true;
                    }
                    if (csv.data === undefined) {
                        if (series.length > 0) {
                            seriesList.push(series);
                            series = [];
                        }
                    } else {
                        dates = csv.data[source.seriesCSVFields.date];
                        if (dates !== undefined) {
                            let vals = csv.data[source.seriesCSVFields.val];
                            let integrationTimes = csv.data[source.seriesCSVFields.integrationTime];
                            let gapDetectTimeThreshold = source.gapDetectTimeThreshold;
                            // TODO: currently gapDetectTimeThreshold does not work with integrationTimes, only with integrationTime
                            if (gapDetectTimeThreshold === undefined) {                                
                                if (source.integrationTime !== undefined) {
                                    gapDetectTimeThreshold = Math.abs(source.integrationTime);
                                } else {
                                    gapDetectTimeThreshold = Infinity;
                                }
                            }
                            let stdErrs = csv.data[source.seriesCSVFields.stdErr];
                            let flagsList = csv.data[source.seriesCSVFields.flags];
                            let fractiles = undefined;
                            if (source.seriesCSVFields.fractiles !== undefined && source.seriesCSVFields.fractiles.length > 0) {
                                fractiles = source.seriesCSVFields.fractiles.map(fractile => [csv.data[fractile.startField], csv.data[fractile.endField]]);
                            }
                            if (dates !== undefined && vals !== undefined && dates.length > 0 && vals.length == dates.length) {
                                for (let i = 0; i < vals.length; i++) {
                                    if (vals[i] === "" || isNaN(vals[i])) {
                                        // NaN
                                    } else {
                                        if (dates[i].valueOf() > acceptedDate + gapDetectTimeThreshold) {
                                            // Gap detected.                                            
                                            if (series.length > 0) {
                                                // Push current series and start a new one empty
                                                seriesList.push(series);
                                                series = [];
                                            }
                                            // Indicate that time has not yet been aggregated
                                            timeAggregationPeriodStart = 0;
                                        }
                                        acceptedDate = dates[i].valueOf();                                        
                                        if (source.integrationTime !== undefined) {
                                            acceptedIntegrationTime = source.integrationTime;
                                        }
                                        if (integrationTimes !== undefined && integrationTimes.length == dates.length) {
                                            acceptedIntegrationTime = integrationTimes[i];
                                        }
                                        if (timeAggregation.enabled && acceptedIntegrationTime !== 0 && timeAggregation.period != Math.abs(acceptedIntegrationTime)) {
                                            // Time aggregation is enabled                                            
                                            if (series.length == 0 && timeAggregationPeriodStart == 0) {
                                                // We have not aggregated any time yet
                                                if (acceptedIntegrationTime < 0) {                                         
                                                    let yearStart = Date.UTC(new Date(dates[i].valueOf() + acceptedIntegrationTime).getUTCFullYear(), 0);
                                                    let remainder = (dates[i].valueOf() + acceptedIntegrationTime - yearStart) % timeAggregation.period;
                                                    if (remainder == 0) {
                                                        // Time aggregation starts with the current integration period
                                                        timeAggregationPeriodStart = dates[i].valueOf() + acceptedIntegrationTime;
                                                        // Zero time aggregation accumulator
                                                        timeAggregationAccumulator = 0;
                                                    }
                                                } else {
                                                    let yearStart = Date.UTC(dates[i].getUTCFullYear(), 0);
                                                    let remainder = (dates[i].valueOf() - yearStart) % timeAggregation.period;
                                                    if (remainder == 0) {
                                                        // Time aggregation starts with the current integration period
                                                        timeAggregationPeriodStart = dates[i].valueOf();
                                                        // Zero time aggregation accumulator
                                                        timeAggregationAccumulator = 0;
                                                    }
                                                }
                                            }
                                            if (timeAggregationPeriodStart !== 0) {
                                                // We have started time aggregation now or earlier
                                                // Time aggregation accumulate
                                                timeAggregationAccumulator += vals[i];
                                                if (acceptedIntegrationTime < 0) {
                                                    // Negative integrationTime
                                                    if (dates[i].valueOf() - timeAggregationPeriodStart == timeAggregation.period) {
                                                        // We have accumulated a time aggregation period
                                                        if (timeAggregation.statistic === "mean") {
                                                            // Calculate mean instead of sum
                                                            timeAggregationAccumulator *= -acceptedIntegrationTime;
                                                            timeAggregationAccumulator /= timeAggregation.period;
                                                        }
                                                        // Push a sample to the series
                                                        let sample = {
                                                            date: processDate(timeAggregationPeriodStart),
                                                            val: processVal(timeAggregationAccumulator),
                                                            integrationTime: processIntegrationTime(timeAggregation.period)
                                                        };
                                                        series.push(sample);
                                                        // Update minimum and maximum if the time aggregation period is within view
                                                        if (timeAggregationPeriodStart + timeAggregation.period >= v.startDate && timeAggregationPeriodStart <= v.endDate) {
                                                            maxVal = Math.max(maxVal, timeAggregationAccumulator);
                                                            minVal = Math.min(minVal, timeAggregationAccumulator);
                                                        }
                                                        // Restart accumulation
                                                        timeAggregationAccumulator = 0;
                                                        timeAggregationPeriodStart += timeAggregation.period;
                                                    }
                                                } else {
                                                    // Positive integrationTime
                                                    if (dates[i].valueOf() + acceptedIntegrationTime - timeAggregationPeriodStart == timeAggregation.period) {
                                                        // We have accumulated a time aggregation period
                                                        if (timeAggregation.statistic === "mean") {
                                                            // Calculate mean instead of sum
                                                            timeAggregationAccumulator *= acceptedIntegrationTime;
                                                            timeAggregationAccumulator /= timeAggregation.period;
                                                        }
                                                        // Push a sample to the series
                                                        let sample = {
                                                            date: processDate(timeAggregationPeriodStart),
                                                            val: processVal(timeAggregationAccumulator),
                                                            integrationTime: processIntegrationTime(timeAggregation.period)
                                                        };
                                                        series.push(sample);
                                                        // Update minimum and maximum if the time aggregation period is within view
                                                        if (timeAggregationPeriodStart + timeAggregation.period >= v.startDate && timeAggregationPeriodStart <= v.endDate) {
                                                            maxVal = Math.max(maxVal, timeAggregationAccumulator);
                                                            minVal = Math.min(minVal, timeAggregationAccumulator);
                                                        }
                                                        // Restart accumulation
                                                        timeAggregationAccumulator = 0;
                                                        timeAggregationPeriodStart += timeAggregation.period;
                                                    }
                                                }
                                            }
                                        } else {
                                            let sample = {
                                                date: processDate(dates[i].valueOf()),
                                                val: processVal(vals[i])
                                            };
                                            if (acceptedIntegrationTime !== 0) {
                                                sample.integrationTime = processIntegrationTime(Math.abs(acceptedIntegrationTime));
                                                if (acceptedIntegrationTime < 0) {
                                                    sample.date = processDate(dates[i].valueOf() + acceptedIntegrationTime); // shift sample date to make integration time positive
                                                }
                                            }
                                            if (fractiles) {
                                                sample.fractiles = [];
                                                fractiles.forEach(function (fractile) {
                                                    sample.fractiles.push([processVal(fractile[0][i]), processVal(fractile[1][i])]);
                                                    if (dates[i].valueOf() >= v.startDate && dates[i].valueOf() <= v.endDate) {
                                                        // Do not trust fractile ordering
                                                        minVal = Math.min(minVal, fractile[0][i]);
                                                        minVal = Math.min(minVal, fractile[1][i]);
                                                        maxVal = Math.max(maxVal, fractile[0][i]);
                                                        maxVal = Math.max(maxVal, fractile[1][i]);
                                                    }
                                                });
                                            }
                                            if (stdErrs !== undefined && stdErrs.length == dates.length) {
                                                sample.stdErr = processStdErr(stdErrs[i]);
                                                if (dates[i].valueOf() >= v.startDate && dates[i].valueOf() <= v.endDate) {
                                                    // Do not trust stdErr sign
                                                    minVal = Math.min(minVal, (vals[i] - sample.stdErr));
                                                    minVal = Math.min(minVal, (vals[i] + sample.stdErr));
                                                    maxVal = Math.max(maxVal, (vals[i] - sample.stdErr));
                                                    maxVal = Math.max(maxVal, (vals[i] + sample.stdErr));
                                                }
                                            } else {
                                                if (dates[i].valueOf() >= v.startDate && dates[i].valueOf() <= v.endDate) {
                                                    minVal = Math.min(minVal, vals[i]);
                                                    maxVal = Math.max(maxVal, vals[i]);
                                                }
                                            }
                                            if (flagsList !== undefined && flagsList.length == dates.length) {
                                                sample.flags = flagsList[i];
                                            }
                                            series.push(sample);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }
        if (series.length > 0) {
            seriesList.push(series);
        }
        seriesLists.push(seriesList);
    });
    return { seriesLists, loading, minVal, maxVal};
}

function getDrawingHtmls(v, chartId, standalone = false) {
    let height;
    if (chartId === "satelliteImages") {
        height = v.dimensions.satelliteImagesHeight;        
    } else {
        height = v.dimensions.height;
    }

    let cursorDrawn = false;
    let loading = false;
    let minVal = Infinity;
    let maxVal = -Infinity;
    var chart = v.charts[chartId];
    var pixelsPerMillisecond = v.dimensions.width / (v.endDate - v.startDate);
    var pixelsPerHour = 1000 * 60 * 60 * pixelsPerMillisecond;
    var drawingDefsHtml = "";
    var drawingBackgroundHtml = "";
    var drawingHtml = "";

    if (chartId === "satelliteImages") {
        let height = v.dimensions.satelliteImagesHeight;
        chart.sourceCategoryList.forEach(function (sourceCategory) {
            if (chart.visible[sourceCategory.id]) {
                sourceCategory.geoTiffDates.forEach(function (date, index) {
                    let x = ((date - v.startDate) * pixelsPerMillisecond);
                    let numImages = sourceCategory.dateToGeoTiffList[date].filter(geoTiff => v.site.blockIdToBlock[geoTiff.source.block].visible).length;
                    if (numImages > 0 && x >= -20 && x <= v.dimensions.width + 20) {
                        let color = v.disabledColor;                        
                        let selected = false;
                        if (date === v.satelliteImageDate) {
                            color = v.chartColors[0];
                            selected = true;
                        }
                        let dateObject = new Date(date);
                        let circleId = `chart_${chartId}_sourceCategory_${sourceCategory}_index_${index}`;
                        let tooltipString = unsanitaryTranslate(t.tooltip, 'toggleSatelliteImages')({ numImages: numImages, dateString: `${dateObject.getUTCDate()}.${dateObject.getUTCMonth() + 1}.${dateObject.getUTCFullYear()} UTC`});
                        drawingHtml += `<circle id="${circleId}" style="cursor:pointer" stroke-width="${2 + ((selected) ? 2 : 0)}" stroke="${color}" fill="#ffffff" cx="${x.toFixed(1)}" cy="${height / 2}" r="${18 - ((selected) ? 1 : 0)}"><title>${tooltipString}</title></circle>`;
                        drawingHtml += `<text pointer-events="none" font-family="sans-serif" font-size="18px" ${(selected) ? 'font-weight="bold"' : ''} fill="${color}" text-anchor="middle" dominant-baseline="middle" x="${x.toFixed(1)}" y="${height / 2 + 2}">${numImages}</text>`;
                        if (date === v.satelliteImageDate && !cursorDrawn) {
                            drawingHtml += `<line pointer-events="none" x1="${x.toFixed(1)}" y1="${-v.dimensions.topMargin/2}" x2="${x.toFixed(1)}" y2="${height}" stroke="${v.chartColors[0]}" stroke-width="1" stroke-dasharray="4" />`;
                            cursorDrawn = true;
                        }
                    }
                });
            }
        });
    }
    if (chartId !== "satelliteImages") {

        let pixelsPerUnit = height / (chart.yMax - chart.yMin);
        let zeroFract = (0 - chart.yMin) / (chart.yMax - chart.yMin) * height / (v.dimensions.topMargin + height);

        ({ seriesLists, loading, minVal, maxVal } = getSeriesLists(v, chartId,
            date => (date - v.startDate) * pixelsPerMillisecond,
            val => (height - (val - chart.yMin) * pixelsPerUnit).toFixed(1),
            stdErr => /*(height - (stdErr - chart.yMin)*/ (stdErr * pixelsPerUnit).toFixed(1),
            integrationTime => integrationTime * pixelsPerMillisecond,
        ));

        switch (chart.id) {
            case "soilHeatFlux":
            case "radiationBalance":
                drawingDefsHtml += `
                <linearGradient id="${chartId}_gradient_fill" gradientUnits="userSpaceOnUse" x1="0" y1="${height}" x2="0" y2="${-v.dimensions.topMargin}">
                    <stop offset="0" style="stop-color:#ffffff;" />
                    <stop offset="${zeroFract}" style="stop-color:#ffffff;" />
                    <stop offset="${zeroFract}" style="stop-color:#ffffcc;" />
                    <stop offset="1" style="stop-color:#ffffcc;" />
                </linearGradient>`;
                break;
            case "CO2flux":
                drawingDefsHtml += `
                <linearGradient id="${chartId}_gradient_fill" gradientUnits="userSpaceOnUse" x1="0" y1="${height}" x2="0" y2="${-v.dimensions.topMargin}">
                    <stop offset="0" style="stop-color:#cccccc;" />
                    <stop offset="${zeroFract}" style="stop-color:#cccccc;" />
                    <stop offset="${zeroFract}" style="stop-color:#f0f0f0;" />
                    <stop offset="1" style="stop-color:#f0f0f0;" />
                </linearGradient>`;
                break;
            case "temperature":
                drawingDefsHtml += getTemperatureGradientHtml(`chart_${chart.id}_gradient`, 0, height, 0, 0, chart.yMin, chart.yMax);
                break;
        }

        chart.sources.forEach(function (source, sourceIndex) {
            if (chart.visible[source.legendId]) {
                // Area fills
                let g = undefined;
                switch (chart.id) {
                    case "soilMoisture":
                    case "fmimeteoRelativeHumidity":
                    case "precipitation":
                        g = `stroke="none" fill="#dff5ff"`; // fill="#cdf0ff" or fill="#bde2f0" or fill="#c0f0ff"
                        break;
                    //case "CO2flux":
                    case "radiationBalance":
                    case "soilHeatFlux":
                        g = `stroke="none" fill="url(#${chartId}_gradient_fill)"`;
                        break;
                    case "CO2concentration":
                        g = `stroke="none" fill="#f0f0f0"`;
                        break;
                    case "30minPAR":
                    case "dailyPAR":
                        g = `stroke="none" fill="#ffffcc"`;
                        break;                            
                    case "shortwave":
                        if (source.parameters.direction === "down") {
                            g = `stroke="none" fill="#ffffcc"`;
                        } else {
                            g = `stroke="none" fill="#ffffff"`;
                        }
                        break;
                }
                if (g !== undefined) {                    
                    g = `<g pointer-events="none" ${g}>`
                    seriesLists[sourceIndex].forEach(function (series) {
                        if ((series.length > 1 || (series[0].integrationTime !== undefined && series[0].integrationTime > 0.5)) && series[0].fractiles === undefined) {
                            let d = '';
                            if (series[0].integrationTime !== undefined && series[0].integrationTime > 0.5 && !source.lines) {
                                d += `M${series[0].date.toFixed(2)} ${series[0].val}`;
                                d += `h${(series[0].integrationTime - 0.02).toFixed(2)}`; // Trying to avoid an Android Chrome bug by making this a bit shorter
                                for (let i = 1; i < series.length; i++) {
                                    d += `L${series[i].date.toFixed(2)} ${series[i].val}h${(series[i].integrationTime - 0.02).toFixed(2)}`;
                                }
                            } else if (series[0].integrationTime !== undefined) {
                                d += `M${(series[0].date + series[0].integrationTime * 0.5).toFixed(2)} ${series[0].val}`;
                                for (let i = 1; i < series.length; i++) {
                                    d += `L${(series[i].date + series[i].integrationTime * 0.5).toFixed(2)} ${series[i].val}`;
                                }
                            } else {
                                d += `M${series[0].date.toFixed(2)} ${series[0].val}`;
                                for (let i = 1; i < series.length; i++) {
                                    d += `L${series[i].date.toFixed(2)} ${series[i].val}`;
                                }
                            }
                            switch (chart.id) {
                                case "soilMoisture":
                                case "fmimeteoRelativeHumidity":
                                case "precipitation":
                                case "CO2concentration":
                                case "30minPAR":
                                case "dailyPAR":
                                case "shortwave":
                                    // Fill to chart bottom
                                    //g += `<path d="${d} V ${height} H ${series[0][0]}"/>`;
                                    //break;
                                case "CO2flux":
                                case "radiationBalance":
                                case "soilHeatFlux":
                                    // Fill to zero level
                                    if (series[0].integrationTime !== undefined && series[0].integrationTime > 0.5 && !source.lines) {
                                        g += `<path d="${d} V ${height - (0 - chart.yMin) * pixelsPerUnit} H ${series[0].date.toFixed(2)}Z"/>`;
                                    } else if (series[0].integrationTime !== undefined) {
                                        g += `<path d="${d} V ${height - (0 - chart.yMin) * pixelsPerUnit} H ${(series[0].date + series[0].integrationTime * 0.5).toFixed(2)}Z"/>`;
                                    } else {
                                        g += `<path d="${d} V ${height - (0 - chart.yMin) * pixelsPerUnit} H ${series[0].date.toFixed(2)}Z"/>`;
                                    }
                                    break;
                            }
                        }
                    });
                    drawingBackgroundHtml += `${g}</g>`;
                }
            }
        });
        let fractilesHtml = "";
        let linesHtml = "";      
        chart.sources.forEach(function (source, sourceIndex) {
            if (chart.visible[source.legendId]) {
                let sourceColor;
                if (chart.id === "temperature" && source.rainbow !== undefined) {
                    sourceColor = `url(#chart_${chart.id}_gradient)`;
                } else {
                    sourceColor = source.color;
                }
                seriesLists[sourceIndex].forEach(function (series) {
                    if (source.dots) {
                        // Draw dots
                        linesHtml += '<g>';
                        for (let i = 0; i < series.length; i++) {
                            let useDate = series[i].date;
                            if (series[i].integrationTime !== undefined) {
                                useDate -= series[i].integrationTime / 2;
                            }
                            let clickStr = 'pointer-events="none"';
                            let tooltipString;
                            if (chart.relatedSatelliteImage !== undefined && !standalone && v.charts["satelliteImages"] !== undefined && v.charts["satelliteImages"].sourceCategories[chart.relatedSatelliteImage.sourceCategoryId] !== undefined) {
                                let date = Math.round(v.startDate + useDate / pixelsPerMillisecond);
                                let dateObject = new Date(date);
                                let geoTiffList = v.charts["satelliteImages"].sourceCategories[chart.relatedSatelliteImage.sourceCategoryId].dateToGeoTiffList[date];                                
                                if (geoTiffList !== undefined) {
                                    clickStr = `cursor="pointer" onclick="selectNearestSatelliteImage('${chart.relatedSatelliteImage.sourceCategoryId}', ${v.startDate + useDate / pixelsPerMillisecond}, event)" onmousedown = "preventDefault(event)"`;
                                    tooltipString = unsanitaryTranslate(t.tooltip, 'toggleSatelliteImages')({ dateString: `${dateObject.getUTCDate()}.${dateObject.getUTCMonth() + 1}.${dateObject.getUTCFullYear()} UTC`});
                                }
                            }                            
                            if (tooltipString !== undefined) {
                                linesHtml += `<circle ${clickStr} stroke="none" fill="${source.color}" cx="${useDate}" cy="${series[i].val}" r="6"><title>${tooltipString}</title></circle>`;
                            } else {
                                linesHtml += `<circle ${clickStr} stroke="none" fill="${source.color}" cx="${useDate}" cy="${series[i].val}" r="6" />`;
                                if (isNaN(useDate)) {
                                    console.log(source);
                                    console.log(`<circle ${clickStr} stroke="none" fill="${source.color}" cx="${useDate}" cy="${series[i].val}" r="6" />`);
                                }
                            }
                        }
                        linesHtml += "</g>";
                        // Draw error bars, if stdErr or fractiles are available
                        linesHtml += '<g pointer-events="none">';
                        seriesLists[sourceIndex].forEach(function (series) {
                            // fractiles
                            if (series[0].fractiles !== undefined) {
                                series[0].fractiles.forEach(function (dummy, fractileIndex) {
                                    for (let i = 0; i < series.length; i++) {
                                        linesHtml += `<path style="stroke-width: 0.5; stroke-linejoin: round; stroke-linecap: round; fill: none;" stroke="${source.color}" d="M ${(series[i].date - 4).toFixed(2)} ${series[i].fractiles[fractileIndex][0]} h 8 m -4 0 V ${series[i].fractiles[fractileIndex][1]} m -4 0 h 8"/>`; // Chart path
                                    }
                                });
                            } else {
                                // stdErr
                                if (series[0].stdErr !== undefined) {
                                    for (let i = 0; i < series.length; i++) {
                                        linesHtml += `<path style="stroke-width: 0.5; stroke-linejoin: round; stroke-linecap: round; fill: none;" stroke="${source.color}" d="M ${(series[i].date - 4).toFixed(2)} ${series[i].val - series[i].stdErr} h 8 m -4 0 v ${series[i].stdErr * 2} m -4 0 h 8"/>`; // Chart path
                                    }
                                }
                            }
                        });
                        linesHtml += "</g>";
                    }
                    if (series[0].fractiles !== undefined) {
                        // Draw fractiles
                        series[0].fractiles.forEach(function (dummy, fractileIndex) {
                            let lines = source.lines;
                            if (source.bars) {
                                if (series[0].integrationTime === undefined) {
                                    console.error(`Chart ${chart.id} source ${source.id} lacks integrationTime needed by bars. Drawing lines instead.`);
                                    lines = true;
                                } else {
                                    // Draw fractile bars
                                    if (series[0].integrationTime > 0.5) {
                                        let d = `M${series[0].date.toFixed(2)} ${series[0].fractiles[fractileIndex][0]}`;
                                        for (let i = 0; i < series.length; i++) {
                                            d += `M${(series[i].date + 0.5).toFixed(1)} ${series[i].fractiles[fractileIndex][0]}`;
                                            d += `V${series[i].fractiles[fractileIndex][1]}h${(series[0].integrationTime - 0.5).toFixed(1)}V${series[i].fractiles[fractileIndex][0]}`;
                                        }
                                        fractilesHtml += `<path style="stroke: none; fill-opacity: 0.25" fill="${sourceColor}" d="${d}"/>` // Chart path
                                    } else {
                                        lines = true;
                                    }
                                }
                            }
                            if (source.stairs) {
                                // Draw fractile stairs
                                let d = `M${series[0].date.toFixed(2)} ${series[0].fractiles[fractileIndex][0]}`;
                                d += `h${(series[0].integrationTime - 0.02).toFixed(2)}`;
                                for (let i = 1; i < series.length; i++) {
                                    d += `L${series[i].date.toFixed(2)} ${series[i].fractiles[fractileIndex][0]}h${(series[i].integrationTime - 0.02).toFixed(2)}`;
                                }
                                for (let i = series.length - 1; i >= 0; i--) {
                                    d += `L${(series[i].date + series[i].integrationTime - 0.02).toFixed(2)} ${series[i].fractiles[fractileIndex][1]}h${(-series[i].integrationTime + 0.02).toFixed(2)}`;
                                }
                                fractilesHtml += `<path style="stroke: none; fill-opacity: 0.25" fill="${sourceColor}" d="${d}"/>` // Chart path
                            }
                            if (lines) {
                                if (series[0].integrationTime !== undefined) {
                                    // Draw fractile lines with nodes centered at integration times.
                                    let d = `M${(series[0].date + series[0].integrationTime * 0.5).toFixed(2)} ${series[0].fractiles[fractileIndex][0]}`;
                                    for (let i = 1; i < series.length; i++) {
                                        d += `L${(series[i].date + series[i].integrationTime * 0.5).toFixed(2)} ${series[i].fractiles[fractileIndex][0]}`;
                                    }
                                    for (let i = series.length - 1; i >= 0; i--) {
                                        d += `L${(series[i].date + series[i].integrationTime * 0.5).toFixed(2)} ${series[i].fractiles[fractileIndex][1]}`;
                                    }
                                    fractilesHtml += `<path style="stroke: none; fill-opacity: 0.25" fill="${sourceColor}" d="${d}"/>` // Chart path
                                } else {
                                    // Draw fractile lines
                                    let d = `M${series[0].date.toFixed(2)} ${series[0].fractiles[fractileIndex][0]}`;
                                    for (let i = 1; i < series.length; i++) {
                                        d += `L${series[i].date.toFixed(2)} ${series[i].fractiles[fractileIndex][0]}`;
                                    }
                                    for (let i = series.length - 1; i >= 0; i--) {
                                        d += `L${series[i].date.toFixed(2)} ${series[i].fractiles[fractileIndex][1]}`;
                                    }
                                    fractilesHtml += `<path style="stroke: none; fill-opacity: 0.25" fill="${sourceColor}" d="${d}"/>` // Chart path
                                }
                            }
                        });
                    }
                    if (source.lines || source.stairs || source.bars) {
                        // Main data series
                        let lines = source.lines;
                        let stairs = source.stairs;
                        let bars = source.bars;
/*                        if (lines && chart.timeAggregation && chart.timeAggregationPeriod != Math.abs(source.integrationTime)) {
                            stairs = true;
                            lines = false;
                        }*/
                        if (bars && series[0].integrationTime !== undefined) {
                            // Draw bars
                            let d = "";
                            let xAxisVal = (height + chart.yMin * pixelsPerUnit).toFixed(1);
                            for (let i = 0; i < series.length; i++) {
                                if (series[0].fractiles !== undefined) {
                                    d += `M${(series[i].date + 1.5).toFixed(1)} ${series[i].val}h${(series[i].integrationTime - 3).toFixed(1)}`;
                                } else {
                                    //if (series[i].val != xAxisVal) {
                                    d += `M${series[i].date.toFixed(1)} ${xAxisVal}`;
                                    d += `V${series[i].val}h${series[0].integrationTime.toFixed(1)}V${xAxisVal}`;
                                    //}
                                }
                            }
                            linesHtml += `<g pointer-events="none"><path style="stroke-width: 2; stroke-linejoin: round; stroke-linecap: square; fill: none;" stroke="${sourceColor}" d="${d}"/></g>` // Chart path
                        }
                        if (stairs && series[0].integrationTime !== undefined) {
                            // Draw stairs
                            let d = "";
                            if (series[0].integrationTime !== undefined && series[0].integrationTime > 0.5) {
                                d += `M${series[0].date.toFixed(2)} ${series[0].val}`;
                                d += `h${(series[0].integrationTime - 0.02).toFixed(2)}`;
                                for (let i = 1; i < series.length; i++) {
                                    d += `L${series[i].date.toFixed(2)} ${series[i].val}h${(series[i].integrationTime - 0.02).toFixed(2)}`;
                                }
                            } else {
                                d += `M${(series[0].date + series[0].integrationTime * 0.5).toFixed(2)} ${series[0].val}`;
                                if (series.length == 1) {
                                    d += `h0.001`;
                                } else {
                                    for (let i = 1; i < series.length; i++) {
                                        d += `L${(series[i].date + series[i].integrationTime * 0.5).toFixed(2)} ${series[i].val}`;
                                    }
                                }
                            }
                            linesHtml += `<g pointer-events="none"><path style="stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; fill: none;" stroke="${sourceColor}" d="${d}"/></g>` // Chart path
                        }
                        if (lines) {
                            let d = "";
                            if (series[0].integrationTime !== undefined) {
                                // Draw lines with nodes centered at integration times.
                                d += `M${(series[0].date + series[0].integrationTime*0.5).toFixed(2)} ${series[0].val}`;
                                if (series.length == 1) {
                                    d += `h0.001`;
                                } else {
                                    for (let i = 1; i < series.length; i++) {
                                        d += `L${(series[i].date + series[0].integrationTime * 0.5).toFixed(2)} ${series[i].val}`;
                                    }
                                }
                            } else {
                                // Draw lines
                                d += `M${series[0].date.toFixed(2)} ${series[0].val}`;
                                if (series.length == 1) {
                                    d += `h0.001`;
                                } else {
                                    for (let i = 1; i < series.length; i++) {
                                        d += `L${series[i].date.toFixed(2)} ${series[i].val}`;
                                    }
                                }
                            }
                            linesHtml += `<g pointer-events="none"><path style="stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; fill: none;" stroke="${sourceColor}" d="${d}"/></g>` // Chart path
                        }
                    }
                });
            }
        });
        drawingHtml += `<g pointer-events="none">${ fractilesHtml }</g>`;
        drawingHtml += linesHtml;
    }
    if (foConfig.now < v.endDate) {
        let nowX = (foConfig.now - v.startDate) * pixelsPerMillisecond;
/*        // Indicate prediction
        if (maxDate > foConfig.now || forecast == true) {
            if (foConfig.now > v.startDate) {
                drawingBackgroundHtml += `<rect pointer-events="none" x="${nowX.toFixed(1)}" y="0" width="${v.dimensions.width - nowX.toFixed(1)}" height="${height}" style="fill:#ffffff;stroke:none;opacity:0.4" />`;
            } else {
                drawingBackgroundHtml += `<rect pointer-events="none" x="0" y="0" width="${v.dimensions.width}" height="${height}" style="fill:#ffffff;stroke:none;opacity:0.4" />`;
            }
        }*/
        // Indicate current time
        if (foConfig.now >= v.startDate) {
            let dateObject = new Date(foConfig.now);
            let tooltipString = unsanitaryTranslate(t.tooltip, 'now')({dateString: `${dateObject.getUTCDate()}.${dateObject.getUTCMonth() + 1}.${dateObject.getUTCFullYear()} UTC`});
            drawingBackgroundHtml += `<line pointer-events="none" x1="${nowX.toFixed(1)}" y1="0" x2="${nowX.toFixed(1)}" y2="${height}" stroke="${v.disabledColor}" stroke-width="1" stroke-dasharray="4" />`;
            drawingBackgroundHtml += `<text pointer-events="none" font-family="sans-serif" font-size="12px" font-weight="bold" fill="${v.disabledColor}" text-anchor="middle" dominant-baseline="middle" x="${nowX.toFixed(1)}" y="${-9}">✓</text>`;
            drawingBackgroundHtml += getCalendarSymbolHtml(`chart_${chart.id}_now`, nowX.toFixed(1), 0, v.disabledColor, tooltipString);
        }
    }
    // Show management events
    let occupiedXs = {};
    if (v.charts["global"] !== undefined) {
        v.charts["global"].sources.forEach(function (source, sourceIndex) {
            if (source.sourceType === "mgmt_event") {
                if (source.block == undefined || v.site.blockIdToBlock[source.block].visible) source.jsonList.forEach(function (json, jsonIndex) {
                    if (new Date(json.startTime) <= v.endDate && new Date(json.endTime) >= v.startDate) {
                        if (json.loaded === undefined) {
                            loading = true;
                        }
                        if (json.data !== undefined && json.data.management !== undefined && json.data.management.events !== undefined) {
                            json.data.management.events.forEach(function (event, eventIndex) {
                                let onView = false;
                                let selected = false;
                                let color = selected ? v.chartColors[2] : v.disabledColor;
                                let iconX = undefined;
                                if (event.date !== undefined && event.end_date !== undefined) {
                                    let startDateObject = new Date(event.date);
                                    selected = /*(v.eventDate !== undefined && startDateObject.valueOf() == (new Date(v.eventDate)).valueOf()) &&*/ (eventIndex == v.eventIndex) && (sourceIndex == v.eventSourceIndex);
                                    color = selected ? v.chartColors[2] : v.disabledColor;
                                    let sx = (startDateObject.valueOf() - v.startDate) * pixelsPerMillisecond;
                                    let yOffset = 0;
                                    if (occupiedXs[Math.floor(sx)] !== undefined || occupiedXs[Math.ceil(sx)] !== undefined) {
                                        if (occupiedXs[Math.floor(sx)] === undefined) {
                                            occupiedXs[Math.floor(sx)] = 0;
                                        }
                                        if (occupiedXs[Math.ceil(sx)] === undefined) {
                                            occupiedXs[Math.ceil(sx)] = 0;
                                        }
                                        yOffset = Math.max(occupiedXs[Math.floor(sx)], occupiedXs[Math.ceil(sx)]) + 10;
                                        occupiedXs[Math.floor(sx)] = yOffset;
                                        occupiedXs[Math.ceil(sx)] = yOffset;
                                    } else {
                                        occupiedXs[Math.floor(sx)] = 0;
                                        occupiedXs[Math.ceil(sx)] = 0;
                                    }
                                    event.foUIYOffset = yOffset;
                                    let ex = ((new Date(event.end_date)).valueOf() - v.startDate) * pixelsPerMillisecond;
                                    if (ex + 21 > 0 && sx - 21 < v.dimensions.width) {
                                        onView = true
                                        drawingBackgroundHtml += `<rect pointer-events="none" style="cursor:pointer" stroke="none" fill="${color}" fill-opacity="0.1" x="${sx.toFixed(1)}" y="${-2}" width="${(ex - sx).toFixed(1)}" height="${height}"/>`
                                        drawingBackgroundHtml += `<line pointer-events="none" x1="${sx.toFixed(1)}" y1="-2" x2="${sx.toFixed(1)}" y2="${height}" stroke="${color}" stroke-width="${1 + ((selected) ? 1 : 0)}" />`;
                                        drawingBackgroundHtml += `<line pointer-events="none" x1="${ex.toFixed(1)}" y1="0" x2="${ex.toFixed(1)}" y2="${height}" stroke="${color}" stroke-width="${1 + ((selected) ? 1 : 0)}" />`;
                                        drawingBackgroundHtml += `<path d="M ${sx.toFixed(1)} ${-14 + yOffset} C ${(sx + (ex - sx) * 0.5).toFixed(1)} ${-14 + yOffset + 19}, ${ex.toFixed(1)} ${-7}, ${ex.toFixed(1)} ${0}" fill="none" stroke="${color}" stroke-width="${1 + ((selected) ? 1 : 0)}" />`;
                                        let r = 13 - 1 - ((selected) ? 0.5 : 0);
                                        let tooltipString = unsanitaryTranslate(t.tooltip, 'toggleEvent')({dateString: `${startDateObject.getUTCDate()}.${startDateObject.getUTCMonth() + 1}.${startDateObject.getUTCFullYear()} UTC`});
                                        drawingHtml += `<circle id="chart_${chartId}_global_${source.id}_${jsonIndex}_${eventIndex}" style="cursor:pointer" stroke-width="${2 + ((selected) ? 1 : 0)}" stroke="${color}" fill="#ffffff" cx="${sx.toFixed(1)}" cy="${-14 + yOffset}" r="${13 - 1 - ((selected) ? 0.5 : 0)}"><title>${tooltipString}</title></circle>`;
                                        iconX = sx;
                                    }
                                } else if (event.date !== undefined) {
                                    selected = /*(v.eventDate !== undefined && (new Date(event.date)).valueOf() == (new Date(v.eventDate)).valueOf()) && */(eventIndex == v.eventIndex) && (sourceIndex == v.eventSourceIndex);
                                    color = selected ? v.chartColors[2] : v.disabledColor;
                                    let x = ((new Date(event.date)).valueOf() - v.startDate) * pixelsPerMillisecond;
                                    let yOffset = 0;
                                    if (occupiedXs[Math.floor(x)] !== undefined || occupiedXs[Math.ceil(x)] !== undefined) {
                                        if (occupiedXs[Math.floor(x)] === undefined) {
                                            occupiedXs[Math.floor(x)] = 0;
                                        }
                                        if (occupiedXs[Math.ceil(x)] === undefined) {
                                            occupiedXs[Math.ceil(x)] = 0;
                                        }
                                        yOffset = Math.max(occupiedXs[Math.floor(x)], occupiedXs[Math.ceil(x)]) + 10;
                                        occupiedXs[Math.floor(x)] = yOffset;
                                        occupiedXs[Math.ceil(x)] = yOffset;
                                    } else {
                                        occupiedXs[Math.floor(x)] = 0;
                                        occupiedXs[Math.ceil(x)] = 0;
                                    }
                                    event.foUIYOffset = yOffset;
                                    if (x + 21 > 0 && x - 21 < v.dimensions.width) {
                                        onView = true
                                        drawingBackgroundHtml += `<line pointer-events="none" x1="${x.toFixed(1)}" y1="-2" x2="${x.toFixed(1)}" y2="${height}" stroke="${color}" stroke-width="${1 + ((selected) ? 1 : 0)}" />`;
                                        let dateObject = new Date(event.date)
                                        let tooltipString = unsanitaryTranslate(t.tooltip, 'toggleEvent')({dateString: `${dateObject.getUTCDate()}.${dateObject.getUTCMonth() + 1}.${dateObject.getUTCFullYear()} UTC`});
                                        drawingHtml += `<circle id="chart_${chartId}_global_${source.id}_${jsonIndex}_${eventIndex}" style="cursor:pointer" stroke-width="${2 + ((selected) ? 1 : 0)}" stroke="${color}" fill="#ffffff" cx="${x.toFixed(1)}" cy="${-14 + yOffset}" r="${13 - 1 - ((selected) ? 0.5 : 0)}"><title>${tooltipString}</title></circle>`;
                                        iconX = x;
                                    }
                                }
                                if (onView) {
                                    if (iconX !== undefined) {
                                        drawingHtml += getManagementEventSymbolHtml(event.mgmt_operations_event, iconX.toFixed(1), -14 + event.foUIYOffset, color);
                                    }
                                    if (selected) {
                                        let description0 = "";
                                        if (event.date !== undefined && event.end_date !== undefined) {
                                            let startDateObject = new Date(event.date);
                                            let endDateObject = new Date(event.end_date);
                                            endDateObject.setDate(endDateObject.getDate() - 1) // Show not the date of midnight, but the date of previous day
                                            description0 = `${startDateObject.getUTCDate()}.${startDateObject.getUTCMonth() + 1}.${startDateObject.getUTCFullYear()} – ${endDateObject.getUTCDate()}.${endDateObject.getUTCMonth() + 1}.${endDateObject.getUTCFullYear()}`;
                                        } else if (event.date !== undefined) {
                                            let dateObject = new Date(event.date);
                                            description0 = `${dateObject.getUTCDate()}.${dateObject.getUTCMonth() + 1}.${dateObject.getUTCFullYear()}`;
                                        }
                                        if (source.block !== undefined) {
                                            description0 += `, ${translate(t.plaintext, "plot")} ${source.block}`
                                        }
                                        if (source.blockGroup !== undefined) {
                                            description0 += `, ${translate(t.plaintext, "plotgroup")} ${source.blockGroup}`
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    }
    // Show satellite image cursor
    if (chartId === "satelliteImages" || v.charts["satelliteImages"] !== undefined && (chart.relatedSatelliteImage !== undefined && v.charts[chart.relatedSatelliteImage.chart].visible[chart.relatedSatelliteImage.sourceCategoryId])) {
        let x = ((v.satelliteImageDate - v.startDate) * pixelsPerMillisecond);
        if (x >= 0 && x <= v.dimensions.width) {
            if (!cursorDrawn) {
                drawingBackgroundHtml += `<line pointer-events="none" x1="${x.toFixed(1)}" y1="${-v.dimensions.topMargin/2}" x2="${x.toFixed(1)}" y2="${height}" stroke="${v.chartColors[0]}" stroke-width="1" stroke-dasharray="4" />`;
            }
            let dateObject = new Date(v.satelliteImageDate);
            let tooltipString = unsanitaryTranslate(t.tooltip, "satellite")({ dateString: `${dateObject.getUTCDate()}.${dateObject.getUTCMonth() + 1}.${dateObject.getUTCFullYear()} UTC` });
            drawingBackgroundHtml += getSatelliteSymbolHtml(x.toFixed(1), -v.dimensions.topMargin, v.chartColors[1], tooltipString);
            //drawingBackgroundHtml += `<text pointer-events="none" style="font: 14px sans-serif;" text-anchor="start" dominant-baseline="middle" x="${(x + 18).toFixed(1)}" y="${-v.dimensions.topMargin*3/4}">${dateObject.getUTCDate()}.${dateObject.getUTCMonth() + 1}.${dateObject.getUTCFullYear()}</text>`;
            cursorDrawn = true;
        }
    }
    if (loading) {
        let x = v.dimensions.width / 2;
        let y = height / 2
        drawingHtml += `
        <g stroke="none">
            <circle cx="${x - 14}" cy="${y}" r="3"><animate attributeType="XML" attributeName="fill" values="#fff;#808080;#000;#000;#000;#fff" dur="2s" repeatCount="indefinite"/></circle>
            <circle cx="${x}" cy="${y}" r="3"><animate attributeType="XML" attributeName="fill" values="#000;#fff;#808080;#000;#000;#000" dur="2s" repeatCount="indefinite"/></circle>
            <circle cx="${x + 14}" cy="${y}" r="3"><animate attributeType="XML" attributeName="fill" values="#000;#000;#fff;#808080;#000;#000" dur="2s" repeatCount="indefinite"/></circle>    
        </g>`;
    }
    return { drawingDefsHtml, drawingBackgroundHtml, drawingHtml };
}

function makeManagementEventCompatibleWithSchema(event) {
    // Convert grazing_period to date and end_date
    if (event.grazing_period !== undefined) {
        let date;
        let end_date;
        if (Array.isArray(event.grazing_period)) {
            date = event.grazing_period[0];
            end_date = event.grazing_period[1];
        } else {
            date = event.grazing_period.start_date;
            end_date = event.grazing_period.end_date;
        }
        // Reorder properties
        delete event.grazing_period;
        let newEvent = {
            mgmt_operations_event: event.mgmt_operations_event,
            date: date,
            end_date: end_date,
            ...event
        };
        for (var key in event){
            delete event[key];
        }
        Object.assign(event, newEvent);
    }
    if (event.start_date !== undefined) {
        event.date = event.start_date;
        delete event.start_date;
    }
    // Replace certain property ids
    let replacements = {
        "soil_organic_C_perc_layr": "soil_organic_C_perc_layer",
        "org_material_appl_depth": "fertilizer_applic_method",
        "org_material_applic_amnt": "fertilizer_total_amount",
        "mgmt_event_notes": "mgmt_event_short_notes",
        "harvest_notes": "mgmt_event_long_notes",
        "harvest_comments": "mgmt_event_long_notes",
        "planting_notes": "mgmt_event_long_notes",
        "fertilizer_notes": "mgmt_event_long_notes",
        "tillage_treatment_notes": "mgmt_event_long_notes",
        "chemical_applic_notes": "mgmt_event_long_notes",
        "grazing_notes": "mgmt_event_long_notes",
        "weeding_notes": "mgmt_event_long_notes",
        "irrigation_notes": "mgmt_event_long_notes",
        "mowing_notes": "mgmt_event_long_notes",
        "observation_notes": "mgmt_event_long_notes",
        "bed_prep_notes": "mgmt_event_long_notes",
        "mulch_placement_notes": "mgmt_event_long_notes",
        "mulch_removal_notes": "mgmt_event_long_notes",
        "other_notes": "mgmt_event_long_notes"
    };
    for (const [from, to] of Object.entries(replacements)) {
        if (event[from] !== undefined) {
            event[to] = event[from];
            delete event[from];
        }
    }
    // Replace certain values of certain properties:
    let value_replacements = {
        "mgmt_operations_event": {
            "organic_material": "fertilizer" // organic material application is considered a "fertilizer" event
        },
        "fertilizer_applic_method": {
            "AP999": "-99.0"
        },
        "mulch_type": {            
            "MT999": "-99.0"
        },
        "irrigation_operation": {
            "IR999": "-99.0"
        },
        "harvest_method": {
            "HM999": "-99.0"
        }
    }
    for (const [property, dict] of Object.entries(value_replacements)) {
        if (event[property] !== undefined && dict[event[property]] !== undefined) {            
            event[property] = dict[event[property]];
        }
    }
    // Remove certain properties
    let removables = [
        "soil_layer_count",
        "harv_operat_size_categor", // Should we make a note when discarding this information?
        "organic_material_N_conc" // Should we make a note when discarding this information?
    ];
    for (const removable of removables) {
        delete event[removable];
    }
    // Some events have a list of things like a list of items planted. Figure out the id of such list property
    let listId;
    listId = `${event.mgmt_operations_event}_list`;
    switch (event.mgmt_operations_event) {
        case "observation":
            switch (event.observation_type) {
                case "observation_type_soil":
                    listId = "soil_layer_list";
                    break;
            }
            break;
        case "chemicals":
            listId = "chemical_applic_material_list";
            break;
    }
    // Delete properties that have a value "-99.0" denoting a missing property
    for (const [propertyId, property] of Object.entries(event)) {
        if (property === "-99.0") {
            delete event[propertyId];
        }
    }
    // If the organic_material property exists, set fertilizer_type accordingly
    if (event["organic_material"] !== undefined) {
        event["fertilizer_type"] = "fertilizer_type_organic";
    }
    // Collect multiple arrays into a s
    for (let [propertyId, property] of Object.entries(event)) {
        // Some properties need to be arrays but come as a plain value. Put those into length-one arrays.
        if (!Array.isArray(property) && [
            "planted_crop", "planting_material_weight", "planting_depth", "planting_material_source",
            "harvest_crop", "harvest_yield_harvest_dw", "harv_yield_harv_f_wt", "yield_C_at_harvest", "harvest_moisture",  "harvest_method", "harvest_operat_component", "canopy_height_harvest", "harvest_cut_height", "plant_density_harvest", "harvest_residue_placement",
            "soil_layer_top_depth", "soil_layer_base_depth", "soil_classification_by_layer", "soil_bulk_density_moist", "soil_water_wilting_pt", "soil_water_field_cap_1", "soil_water_saturated", "soil_silt_fraction", "soil_sand_fraction", "soil_clay_fraction", "soil_organic_matter_layer", "soil_organic_C_perc_layer",
            "chemical_applic_material"
        ].includes(propertyId)) {            
            event[propertyId] = [property];
            property = event[propertyId];
        }
        // Combine multiple array properties into a single array of objects with properties, with the id we figured out earlier.
        if (Array.isArray(property)) {
            if (event[listId] === undefined) {
                event[listId] = Array.from({length:property.length}, Object);                                                        
            } else {
                if (event[listId].length != property.length) {
                    console.log("Old style management event JSON has mismatching array lengths:");
                    console.log(event);
                }
            }
            for (const [index, value] of property.entries()) {
                if (value !== "-99.0") {
                    event[listId][index][propertyId] = value;
                }
            }
            delete event[propertyId];
        }
    }
    // Calculate totals
    for (let [propertyId, property] of Object.entries(event)) {
        if (propertyId === "harvest_list") {
            let recalculate = {};
            const toTotal = {
                "harvest_yield_harvest_dw": "harvest_yield_harvest_dw_total",
                "harv_yield_harv_f_wt": "harv_yield_harv_f_wt_total",
                "yield_C_at_harvest": "yield_C_at_harvest_total"
            };
            for (let subEvent of property) {
                for (let [subPropertyId, subProperty] of Object.entries(subEvent)) {
                    let totalId = toTotal[subPropertyId];
                    if (totalId !== undefined) {
                        if (event[totalId] === undefined) {
                            event[totalId] = parseFloat(subProperty);
                            recalculate[totalId] = true;
                        } else {
                            if (recalculate[totalId]) {
                                event[totalId] += parseFloat(subProperty);
                            }
                        }
                    }
                }
            }
        }
    }
}

function getCacheRefreshDate(date) {
    date = new Date(date);
    return [date.getFullYear(), (date.getMonth() + 1).toString().padStart(2, '0'), date.getDate().toString().padStart(2, '0'), date.getHours().toString().padStart(2, '0')].join('-') + "h";
}
