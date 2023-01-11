window.onresize = onWindowResize;

var layerVisibilityBackup = {}
var filterSiteTypeEnabled = {}

function getSiteId() {
    if (foConfig.siteId !== undefined) {
        return foConfig.siteId;
    } else {
        return history.state.site;
    }
}

var siteTypeColors = {
    'Advanced CarbonAction Site': '#349a80',
    'Intensive Site': '#129bc7',
    'Valio': '#114a9c',
    'Svensk Kolinlagring Site': '#292929',
    'co-carbon': '#234832',
    'smear-agri': '#000000',
    'lantmannen': "#23A73F",
    'ACA-UVIDI': "#417400",
    'default': '#000000'
};


//Get color by siteType
function getSiteTypeColor(siteType) {
    let color = siteTypeColors[siteType];
    if (color === undefined) {
        color = siteTypeColors["default"];
    }
    return color;
}

// Prepare map
initStateFromLocationUrl(); // Parse browser URL parameters

function zoomToSiteSelectorInitialZoom() {
    map.fitBounds(siteSelectorMapView.bounds, { padding: 40, duration: 1000 });
}

var handleEsc = undefined;

var siteSelectorMapView = {
    fitBoundsOptions: {
        padding: 40,
    },    
    minZoom: 4,
    maxZoom: 10
};

var siteMapView = {
    minZoom: 10,
    maxZoom: 17
};

var map;
var mapLoaded; // Did the map already load?
var othersThanMapLoaded; // Did other things already load?
var popup;
var siteTypes = {}; // All encountered site types
var siteTypeList = []; // All encountered site types

// Json data needed for site selector view
var sitesGeoJson;
var mapbackgroundsJson;
var demoSitesGeoJson;
var demoMapbackgroundsJson;
// Json data needed for site view
var blocksGeoJson;
var demoBlocksGeoJson;
var siteJson;
var managementEventSchemaJson;

var geolocateControl;

async function loadEssentials() {
    async function getJson(response) {
        if (!response.ok) {
            throw new Error(`Failed to fetch ${response.url}: ${response.status}`);
        }
        return response.json();
    }

    let siteSelectorViewPromises = [
        fetch(`${foConfig.storageUrl}/fieldobs_sites_translated.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson).then(async (json) => { sitesGeoJson = json; })
    ];
    let siteViewPromises = [
        fetch(`${foConfig.storageUrl}/fieldobs_blocks_translated.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson).then(async (json) => { blocksGeoJson = json; }),
        fetch(`${foConfig.storageUrl}/fieldobs_mapbackgrounds_translated.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson).catch(async (e) => fetch(`${foConfig.storageUrl}/fieldobs_sites_mapbackgrounds.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson)).catch(async (e) => ({features: []})).then(json => { mapbackgroundsJson = json; }),
        fetch(foConfig.managementEventSchemaJsonUrl).then(getJson).then(json => {
            managementEventSchemaJson = json;
            compileJsonSchema(managementEventSchemaJson);
            console.log("managementEventSchemaJson:");
            console.log(managementEventSchemaJson);
        })
    ];
    if (history.state.demo !== undefined) {
        siteSelectorViewPromises.push(fetch(`${foConfig.demoStorageUrl}/${history.state.demo}_sites_translated.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson).then(async (json) => { demoSitesGeoJson = json; demoSitesGeoJson.features.forEach(feature => feature.properties.demo = true); }));
        siteViewPromises.push(fetch(`${foConfig.demoStorageUrl}/${history.state.demo}_blocks_translated.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson).then(async (json) => { demoBlocksGeoJson = json }));
        siteViewPromises.push(fetch(`${foConfig.demoStorageUrl}/${history.state.demo}_mapbackgrounds_translated.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson).catch(async (e) => fetch(`${foConfig.demoStorageUrl}/${history.state.demo}_site_mapbackgrounds.geojson?date=${getCacheRefreshDate(foConfig.now)}`).then(getJson)).catch(async (e) => ({features: []})).then(async (json) => {demoMapbackgroundsJson = json;}));
    }
    let promises = [
        Promise.all(siteSelectorViewPromises).then(async function () {
            sitesGeoJson.features.forEach(function (feature) {
                feature.properties.storageUrl = foConfig.storageUrl;
            });
            if (history.state.demo !== undefined) {
                demoSitesGeoJson.features.forEach(function (feature) {
                    feature.properties.storageUrl = foConfig.demoStorageUrl;
                });
                sitesGeoJson.features.push(...demoSitesGeoJson.features);
            };
            // Find unique site types
            sitesGeoJson.features.forEach(function (feature) {
                if (siteTypes[feature.properties.site_type] === undefined) {
                    siteTypes[feature.properties.site_type] = feature; // sample feature
                    siteTypeList.push(feature.properties.site_type);
                    filterSiteTypeEnabled[feature.properties.site_type] = true;
                }
            });
            siteSelectorMapView = {
                ...siteSelectorMapView,
                bounds: getBoundingBox(sitesGeoJson.features),
            }
            if (getSiteId() === undefined && foConfig.mapEnabled) {
                initMap(siteSelectorMapView);
            };
        }),
        Promise.all(siteViewPromises).then(async function () {
            if (history.state.demo !== undefined) {
                blocksGeoJson.features.push(...demoBlocksGeoJson.features);
                mapbackgroundsJson.features.push(...demoMapbackgroundsJson.features);
            };
            if (getSiteId() !== undefined) {
                // Init map view to site blocks
                let filteredFeatures = blocksGeoJson.features.filter(feature => (feature.properties.site === getSiteId()));
                if (filteredFeatures.length == 0) {
                    filteredFeatures = blocksGeoJson.features;
                }
                if (foConfig.mapEnabled) {
                    initMap({
                        ...siteMapView/*,
                        bounds: getBoundingBox(filteredFeatures)*/
                    });
                }
            }
        })
    ];
    await Promise.all(promises).catch(function (err) {
        console.log(err); // some coding error in handling happened
    });
}

// Set state. Keys for which the value is undefined are not stored.
function setState(state) {
    state = Object.entries(state).reduce((a, [k, v]) => (v === undefined ? a : (a[k] = v, a)), {}); // Remove everything that has value undefined
    let url = new URL(window.location.href);
    url.search = new URLSearchParams(state);
    history.replaceState(state, "", url.href);
    // Wordpress-specific: include url parameters in language selector
    for (let languageParent of document.getElementsByClassName("lang-item")) {        
        let languageA = languageParent.firstChild;
        if (languageA !== undefined) {
            let languageHref = languageA.href;
            if (languageHref !== undefined) {
                let languageUrl = new URL(languageHref);
                languageUrl.search = url.search;
                languageA.href = languageUrl.href;
            }
        }
    }      
}

// Init state from location URL parameters
function initStateFromLocationUrl() {
    let sanitized = {};
    for (let [key, value] of new URLSearchParams(window.location.search)) {
        sanitized[key] = value.replace(/[^a-zA-Z0-9.\-_]/g, '');
    }
    setState(sanitized);
}

// Update state. Keys for which the value is undefined are removed.
function updateState(update = {}) {
    setState({ ...history.state, ...update });
}

// Push state to history. Do this before any significant updateState.
function pushState() {
    history.pushState(history.state, "");
}

async function mapLoadImage(url, id) {
    return new Promise((resolve, reject) => {
        map.loadImage(url, function (error, res) {
            map.addImage(id, res);
            resolve();
        });
    });
}

function initMap(initMapView) {
    let mapParams = {
        accessToken: foConfig.mapboxgl.accessToken,
        container: foConfig.mapElementId,
        style: foConfig.mapStyleURL,
        ...initMapView,
        locale: {                       
            'AttributionControl.ToggleAttribution': translate(t.tooltip, "toggleAttribution"),
            'AttributionControl.MapFeedback': translate(t.tooltip, "mapFeedback"),
            'FullscreenControl.Enter': translate(t.tooltip, "enterFullscreen"),
            'FullscreenControl.Exit': translate(t.tooltip, "exitFullscreen"),
            'GeolocateControl.FindMyLocation': translate(t.tooltip, "findMyLocation"),
            'GeolocateControl.LocationNotAvailable': translate(t.tooltip, "locationNotAvailable"),
            'LogoControl.Title': translate(t.tooltip, "mapboxLogo"),
            'Map.Title': translate(t.tooltip, "map"),
            'NavigationControl.ResetBearing': translate(t.tooltip, "resetBearingToNorth"),
            'NavigationControl.ZoomIn': translate(t.tooltip, "zoomIn"),
            'NavigationControl.ZoomOut': translate(t.tooltip, "zoomOut"),
            'ScaleControl.Feet': translate(t.tooltip, 'ft'),
            'ScaleControl.Meters': translate(t.tooltip, 'm'),
            'ScaleControl.Kilometers': translate(t.tooltip, 'km'),
            'ScaleControl.Miles': translate(t.tooltip, 'mi'),
            'ScaleControl.NauticalMiles': translate(t.tooltip, 'nm'),
            'ScrollZoomBlocker.CtrlMessage': translate(t.tooltip, "useCtrlPlusScrollToZoomTheMap"),
            'ScrollZoomBlocker.CmdMessage': translate(t.tooltip, "useCmdPlusScrollToZoomTheMap"),
            'TouchPanBlocker.Message': translate(t.tooltip, "useTwoFingersToMoveTheMap"),
        },
        language: "fi"
/*        layout: {
            "country-label": {
                "text-field": ["get", "name"]
            }
        }*/
    };
    map = new mapboxgl.Map(mapParams);
    setOthersThanMapLoaded(false);
/*    map.once('load', function () {
        if (foConfig.language !== 'en') {
            console.log("set map language");
            map.setLayoutProperty('country-label', 'text-field', [
                'get',
                'name'
            ]);
        }    
    });*/
    map.once('load', function () {
        mapLoaded = true;
        setOthersThanMapLoaded();
    }); // Note: this cannot be done using map.loaded()
    map.dragRotate.disable(); // disable map rotation using right click + drag
    map.touchZoomRotate.disableRotation(); // disable map rotation using touch rotation gesture
    popup = new mapboxgl.Popup({ // Create a popup, but don't add it to the map yet.
        closeButton: false,
        closeOnClick: false,
        closeOnMove: false,
        //focusAfterOpen: false,
        className: 'map-popup'
    });
    nav = new mapboxgl.NavigationControl();
    map.addControl(
        new MapboxGeocoder({
            accessToken: foConfig.mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            countries: 'fi'
        })
    );
    geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    });
    map.addControl(geolocateControl);
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    /*map.addControl(
        new mapboxgl.FullscreenControl({
            container: document.querySelector('map')
        })
    );*/
}

function setLoader() {
    document.body.classList.remove('loaded');
    document.body.classList.add('loader');
}

function setLoaded() {
    document.body.classList.remove('loader');
    document.body.classList.add('loaded');
}

// Set loading status. Do not worry about map loading status. It is handled automatically.
function setOthersThanMapLoaded(loaded = othersThanMapLoaded) {
    othersThanMapLoaded = loaded;
    if (loaded) {
        if (mapLoaded) {
            setLoaded();
        }
    } else {
        setLoader();
    }
}

function onWindowResize() {
    if (getSiteId() !== undefined) {
        if (foConfig.mapEnabled) {
            whenMapLoadedDo(function () {
                map.resize()
            });
        }
        resizeCharts();
        if (foConfig.mapEnabled) {
            if (window.innerWidth <= 1024) {
                // One column
                document.getElementById("Satellite_images").after(document.getElementById("map"));
            } else {
                document.getElementById("mapMainHeaderDiv").after(document.getElementById("map"));
            }
        }
    }
}

function setSiteSelectorMapLayerVisibility(visibility) {
    map.setLayoutProperty("fieldLocationsLayerFarExt", 'visibility', visibility);
    map.setLayoutProperty("fieldLocationsLayerFar", 'visibility', visibility);
    map.setLayoutProperty("fieldLocationsLayerNear", 'visibility', visibility);
}

function whenMapLoadedDo(f) {
    if (!foConfig.mapEnabled || mapLoaded) {
        f();
    } else {
        map.once('load', f);
    }
}

function getCacheRefreshDate(date) {
    date = new Date(date);
    return [date.getFullYear(), (date.getMonth() + 1).toString().padStart(2, '0'), date.getDate().toString().padStart(2, '0'), date.getHours().toString().padStart(2, '0')].join('-') + "h";
}

// Get bounding box as [[minLng, maxLng], [minLat, maxLat]] of a feature or features, with or without a starting point boundingBox to be extended by modifying it.
function getBoundingBox(featureOrFeatures, boundingBox = [[Infinity, Infinity], [-Infinity, -Infinity]]) {
    function accumulate(feature) {
        if (feature.geometry.type === "Polygon") {
            // coordinates[0] is the exterior ring. We use that as holes in the field will always be inside it.
            boundingBox[0][0] = feature.geometry.coordinates[0].reduce((minLng, LngLat) => Math.min(minLng, parseFloat(LngLat[0])), boundingBox[0][0]);
            boundingBox[1][0] = feature.geometry.coordinates[0].reduce((maxLng, LngLat) => Math.max(maxLng, parseFloat(LngLat[0])), boundingBox[1][0]);
            boundingBox[0][1] = feature.geometry.coordinates[0].reduce((minLat, LngLat) => Math.min(minLat, parseFloat(LngLat[1])), boundingBox[0][1]);
            boundingBox[1][1] = feature.geometry.coordinates[0].reduce((maxLat, LngLat) => Math.max(maxLat, parseFloat(LngLat[1])), boundingBox[1][1]);
        } else if (feature.geometry.type === "Point") {
            boundingBox[0][0] = Math.min(boundingBox[0][0], parseFloat(feature.geometry.coordinates[0]));
            boundingBox[1][0] = Math.max(boundingBox[1][0], parseFloat(feature.geometry.coordinates[0]));
            boundingBox[0][1] = Math.min(boundingBox[0][1], parseFloat(feature.geometry.coordinates[1]));
            boundingBox[1][1] = Math.max(boundingBox[1][1], parseFloat(feature.geometry.coordinates[1]));
        }
    }
    if (Array.isArray(featureOrFeatures)) {
        if (featureOrFeatures.length == 0) {
            console.warn("Calculated bounding box for empty data");
            return boundingBox;
        }
        featureOrFeatures.forEach(accumulate);
    } else {
        accumulate(feature);
    }
    return boundingBox;
}

var tooltipOnceIds = {};
var tooltipInitiatorToOnceId = {};
var tooltipInitiatorId;
var pageX, pageY; // Current mouse position
let tooltip = document.getElementById("tooltip");
var tooltipTransitionStart = function() {};
var tooltipTransitionEnd = function() {};
var preventTooltipReappearElementId;

tooltip.addEventListener("transitionstart", function(e) {
    tooltipTransitionStart();
}, { once: false });
tooltip.addEventListener("transitionend", function(e) {
    tooltipTransitionEnd();
}, { once: false });

document.addEventListener('mousemove', trackMouse, false);
document.addEventListener('mouseenter', trackMouse, false);
document.addEventListener('click', (e) => {
    immediateHideTooltip(tooltipInitiatorId);    
}, false);
    
function trackMouse(e) {
    pageX = e.pageX;
    pageY = e.pageY;
}

function immediateHideTooltip(elementId) {
    let tooltip = document.getElementById("tooltip");
    tooltip.className = "tooltip_hidden";
    preventTooltipReappearElementId = elementId;
}

function showTooltip(e, initiatorId, text) {
    // console.log(`showTooltip ${initiatorId}`);
    if (initiatorId !== preventTooltipReappearElementId) {
        preventTooltipReappearElementId = undefined;
        function refreshTextAndPosition() {
            tooltip.innerHTML = text;
            tooltip.style.left = pageX + 10 + 'px';
            tooltip.style.top = pageY + 10 + 'px';
        }

        function reveal() {
            refreshTextAndPosition();
            tooltip.className = "tooltip_reveal";
        }

        function restartDelay() {
            tooltip.className = "tooltip_delay";
            tooltipTransitionStart = function() {
                tooltipTransitionStart = function() {};
                reveal();
            }
        }

        tooltipInitiatorId = initiatorId;
        if (tooltip.className === "tooltip_hidden") {
            window.requestAnimationFrame(restartDelay);
        } else if (tooltip.className === "tooltip_delay") {
            window.requestAnimationFrame(restartDelay);
        } else if (tooltip.className === "tooltip_reveal") {
            refreshTextAndPosition();
        } else if (tooltip.className === "tooltip_hide") {
            tooltipTransitionEnd = function() {};
            reveal();
        }
    }
}

function hideTooltip(e, initiatorId) {
    preventTooltipReappearElementId = undefined;
    if (tooltip.className === "tooltip_delay") {
        tooltipTransitionStart = function () {};
        tooltip.className = "tooltip_hidden";
    } else if (tooltip.className === "tooltip_reveal") {
        tooltipTransitionEnd = function () {        
            tooltipTransitionEnd = function() {};
            tooltip.className = "tooltip_hidden";
        }
        tooltip.className = "tooltip_hide";
    }
}

var mapEventsAndHandlers = [];
var nav;

function normalize(string) {
    return string.trim().toLowerCase();
}

function viewSiteSelector() {
    viewSiteSelectorBeforeLoadEssentials();
    viewSiteSelectorAfterLoadingEssentials();    
}

function viewSiteSelectorBeforeLoadEssentials() {
    document.body.classList.add('SiteSelector');
}


function addMapEventHandler(...args) {
    map.on(...args);
    mapEventsAndHandlers.push(args);
}

function removeMapEventHandlers() {
    mapEventsAndHandlers.forEach(function (event) {
        map.off(...event);
    });
    mapEventsAndHandlers = [];
}

// Open site selector view
function viewSiteSelectorAfterLoadingEssentials() {
    // Make essential layers visible
    var filterContainer = document.getElementById("mapFilterContainer");
    
    filterContainerInnerHTML = '';
    siteTypeList.forEach(function (siteTypeId) {
        siteType = siteTypes[siteTypeId];
        filterContainerInnerHTML += `
        <label class="filterCheckBox" title="${translate(t.tooltip, "mapFilter")}">
            ${translate(siteType.properties, "site_type_Name", siteTypeId)}${siteType.properties.demo ? " (demo)" : ""}
            <input type="checkbox" id="checkBox${siteTypeId.replaceAll(' ', '')}" name="${siteTypeId}" value="${siteTypeId}" onclick="checkCheckBoxes()" ${filterSiteTypeEnabled[siteTypeId]? "checked" : ""}>
            <span class="checkmark" style="background-color:${getSiteTypeColor(siteTypeId)}"></span>
        </label>`;
    });
    filterContainer.innerHTML = filterContainerInnerHTML;
    filterContainer.style.display = "block";
    whenMapLoadedDo(function () { setSiteSelectorMapLayerVisibility("visible") });

    map.resize();
    map.setMinZoom(siteSelectorMapView.minZoom);
    map.setMaxZoom(siteSelectorMapView.maxZoom);
    zoomToSiteSelectorInitialZoom();
    //map.flyTo({...defaultMapView, duration:1000 });
    setOthersThanMapLoaded(true);

    if (mapEventsAndHandlers.length == 0) {

        function createFarPopup(siteIndex, near = false) {
            var coordinates = sitesGeoJson.features[siteIndex].geometry.coordinates.slice();
            // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the popup appears over the copy being pointed to.
            /*while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }*/
            popup
                .setLngLat(coordinates)
                .setOffset([0, (near)? -25: 0])
                .setHTML('<h2>' + translate(t.plaintext_titles, "click_to_zoom") + '</h2>')
                .addTo(map);
        }        

        function createNearPopup(siteIndex) {
            var coordinates = sitesGeoJson.features[siteIndex].geometry.coordinates.slice();
            // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the popup appears over the copy being pointed to.
            /*while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }*/
            var siteType = sitesGeoJson.features[siteIndex].properties.site_type;
            popup
                .setLngLat(coordinates)
                .setOffset([0, -25])
                .setHTML('<h1>' + sitesGeoJson.features[siteIndex].properties.Name + '</h1><p>' + translate(siteTypes[siteType].properties, "site_type_Name", siteType) + '</p><h2>' + translate(t.plaintext_titles, "click_to_view_data") + '</h2>')
                .addTo(map);
        }

        addMapEventHandler('mouseover', 'fieldLocationsLayerFarExt', function (e) {
            map.getCanvas().style.cursor = 'pointer';
        });
        addMapEventHandler('mouseleave', 'fieldLocationsLayerFarExt', function (e) {
            map.getCanvas().style.cursor = 'default';
        });

        addMapEventHandler('mouseenter', 'fieldLocationsLayerFarExt', function (e) {
            popup.remove();
            const [clickedIndex, smallestDistanceSquared] = getSiteIndexAndSmallestDistanceSquared(e);
            createFarPopup(clickedIndex);
        });
        addMapEventHandler('mousemove', 'fieldLocationsLayerFarExt', function (e) {
            popup.remove();
            const [clickedIndex, smallestDistanceSquared] = getSiteIndexAndSmallestDistanceSquared(e);
            createFarPopup(clickedIndex);
        });
        addMapEventHandler('mouseleave', 'fieldLocationsLayerFarExt', function () {
            popup.remove();
        });

        function getSiteIndexAndSmallestDistanceSquared(e, near = false) {
            let clickedXY = undefined;
            let clickedIndex = undefined;
            let smallestDistanceSquared = undefined;
            if (near) {
                // Find clicked feature
                e.features.sort((a, b) => a.properties.lat - b.properties.lat) // Priorize based on latitude                
                clickedXY = map.project({lng: e.features[0].properties.lon, lat: e.features[0].properties.lat});
                for (let [index, feature] of sitesGeoJson.features.entries()) {
                    if (feature.properties.id === e.features[0].properties.id) {
                        clickedIndex = index;
                        break;
                    }
                }
                // Find nearest other feature
                for (let [index, feature] of sitesGeoJson.features.entries()) {
                    if (index != clickedIndex && filterSiteTypeEnabled[feature.properties.site_type]) {
                        let xy = map.project({lng: feature.properties.lon, lat: feature.properties.lat});
                        let distanceSquared = (xy.x - clickedXY.x)*(xy.x - clickedXY.x) + (xy.y - clickedXY.y)*(xy.y - clickedXY.y);
                        if (smallestDistanceSquared === undefined || distanceSquared < smallestDistanceSquared) {
                            smallestDistanceSquared = distanceSquared;
                        }
                    }
                }
            } else {                
                // Find clicked feature
                for (let [index, feature] of sitesGeoJson.features.entries()) {
                    if (filterSiteTypeEnabled[feature.properties.site_type]) {
                        let xy = map.project({lng: feature.properties.lon, lat: feature.properties.lat});
                        let distanceSquared = (xy.x - e.point.x)*(xy.x - e.point.x) + (xy.y - e.point.y)*(xy.y - e.point.y);
                        if (smallestDistanceSquared === undefined || distanceSquared < smallestDistanceSquared) {
                            smallestDistanceSquared = distanceSquared;
                            clickedXY = xy;
                            clickedIndex = index;                            
                        }
                    }
                }
                smallestDistanceSquared = undefined;
                // Find nearest other feature (using each feature under the pointer as a reference)
                for (let referenceFeature of e.features) {
                    let referenceXY = map.project({lng: referenceFeature.properties.lon, lat: referenceFeature.properties.lat});
                    for (let feature of sitesGeoJson.features) {
                        if (referenceFeature.properties.id !== feature.properties.id && filterSiteTypeEnabled[feature.properties.site_type]) {
                            let xy = map.project({lng: feature.properties.lon, lat: feature.properties.lat});
                            let distanceSquared = (xy.x - referenceXY.x)*(xy.x - referenceXY.x) + (xy.y - referenceXY.y)*(xy.y - referenceXY.y);
                            if (smallestDistanceSquared === undefined || distanceSquared < smallestDistanceSquared) {
                                smallestDistanceSquared = distanceSquared;
                            }
                        }
                    }
                }
            }
            return [clickedIndex, smallestDistanceSquared];
        }

        function zoomSite(clickedIndex, smallestDistanceSquared) {
            // Calculate zoom needed to make smallestDistance = targetDistance
            let zoom = map.getZoom() + 1.5;
            if (smallestDistanceSquared !== undefined) {
                let smallestDistance = Math.sqrt(smallestDistanceSquared);
                const targetDistance = 50;
                zoom = Math.max(zoom, map.getZoom() + Math.log2(targetDistance) - Math.log2(smallestDistance));
            }
            map.easeTo({
                center: {lng: sitesGeoJson.features[clickedIndex].properties.lon, lat: sitesGeoJson.features[clickedIndex].properties.lat},
                zoom: zoom
            });
            popup.remove();
        }

        addMapEventHandler('click', 'fieldLocationsLayerFarExt', function (e) {
            document.activeElement.blur(); // Disable Firefox mouse wheel scrolling of map
            const [clickedIndex, smallestDistanceSquared] = getSiteIndexAndSmallestDistanceSquared(e);
            zoomSite(clickedIndex, smallestDistanceSquared);
        });

        addMapEventHandler('mouseover', 'fieldLocationsLayerNear', function (e) {
            map.getCanvas().style.cursor = 'pointer';
        });
        addMapEventHandler('mouseleave', 'fieldLocationsLayerNear', function (e) {
            map.getCanvas().style.cursor = 'default';
        });
        

        addMapEventHandler('mouseenter', 'fieldLocationsLayerNear', function (e) {
            popup.remove();
            const [clickedIndex, smallestDistanceSquared] = getSiteIndexAndSmallestDistanceSquared(e, true);
            if (Math.sqrt(smallestDistanceSquared) < 40) {
                createFarPopup(clickedIndex, true);
            } else {
                createNearPopup(clickedIndex);
            }
        });
        addMapEventHandler('mousemove', 'fieldLocationsLayerNear', function (e) {
            popup.remove();
            const [clickedIndex, smallestDistanceSquared] = getSiteIndexAndSmallestDistanceSquared(e, true);
            if (Math.sqrt(smallestDistanceSquared) < 40) {
                createFarPopup(clickedIndex, true);
            } else {
                createNearPopup(clickedIndex);
            }
        });

        addMapEventHandler('mouseleave', 'fieldLocationsLayerNear', function () {
            popup.remove();
        });

        addMapEventHandler('click', 'fieldLocationsLayerNear', async function (e) {
            document.activeElement.blur(); // Disable Firefox mouse wheel scrolling of map
            const [clickedIndex, smallestDistanceSquared] = getSiteIndexAndSmallestDistanceSquared(e, true);
            if (Math.sqrt(smallestDistanceSquared) < 40) {
                zoomSite(clickedIndex, smallestDistanceSquared);
            } else {
                pushState();
                await unviewSiteSelectorAndViewSite(sitesGeoJson.features[clickedIndex].properties.id);
            }
        });

        addMapEventHandler('move', function () {
            popup.remove();
        });
        addMapEventHandler('moveend', function () {
            popup.remove();
        });
    }

    window.onpopstate = function () { unviewSiteSelectorAndViewSite(getSiteId()); };
    handleEsc = zoomToSiteSelectorInitialZoom;
}

//Filter mapbox layer data
function checkCheckBoxes() {
    map.setFilter(
        'fieldLocationsLayerFarExt',
        null
    );
    map.setFilter(
        'fieldLocationsLayerFar',
        null
    );
    map.setFilter(
        'fieldLocationsLayerNear',
        null
    );
    let siteTypePlainText = {
        "Advanced CarbonAction Site": "Advanced CarbonAction Site",
        "Intensive Site": "Intensive Site",
        "Svensk Kolinlagring Site": "Svensk Kolinlagring Site",
        "Valio": "Valio"
    }
    filterSiteTypeEnabled = {}
    let filterList = siteTypeList.filter(function (siteType) {
        filterSiteTypeEnabled[siteType] = document.getElementById(`checkBox${siteType.replaceAll(' ', '')}`).checked;
        return filterSiteTypeEnabled[siteType];
    }).map(siteType => ['==', ['get', 'site_type'], siteType]);

    let base = ['any'];
    let filter = base.concat(filterList);
    map.setFilter(
        'fieldLocationsLayerFarExt',
        filter
    );
    map.setFilter(
        'fieldLocationsLayerFar',
        filter
    );
    map.setFilter(
        'fieldLocationsLayerNear',
        filter
    );
}

async function unviewSiteSelectorAndViewSite(site) {
    //Hide filters
    var filterContainer = document.getElementById("mapFilterContainer");
    filterContainer.style.display = "none";
    window.onpopstate = defaultPopstateHandler;
    handleEsc = undefined;    
    updateState({ site: site });
    setOthersThanMapLoaded(false);
    removeMapEventHandlers();
    popup.remove();
    map.getCanvas().style.cursor = '';
    document.body.classList.remove('SiteSelector');
    await viewSite(1000);
}

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};

if (window.hasOwnProperty("proj4")) {
    proj4.defs([['EPSG:4326', 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]']]);
    for (let i = 1; i <= 60; i++) {
        proj4.defs([[`EPSG:${32600 + i}`, `PROJCS["WGS 84 / UTM zone ${i}N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",${i*6 - 183}],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","${32600 + i}"]]`],]);
    }
}

const cmapPrototype = [ // 257 entries
    [0.6470588235294118, 0.0, 0.14901960784313725,],
    [0.654718137254902, 0.007352941176470588, 0.14917279411764706,],
    [0.6623774509803921, 0.014705882352941176, 0.14932598039215686,],
    [0.6700367647058824, 0.022058823529411763, 0.14947916666666666,],
    [0.6776960784313726, 0.029411764705882353, 0.14963235294117647,],
    [0.6853553921568628, 0.03676470588235294, 0.14978553921568627,],
    [0.6930147058823529, 0.044117647058823525, 0.14993872549019607,],
    [0.7006740196078431, 0.051470588235294115, 0.15009191176470588,],
    [0.7083333333333334, 0.058823529411764705, 0.15024509803921568,],
    [0.7159926470588236, 0.0661764705882353, 0.15039828431372548,],
    [0.7236519607843137, 0.07352941176470588, 0.1505514705882353,],
    [0.7313112745098039, 0.08088235294117647, 0.1507046568627451,],
    [0.7389705882352942, 0.08823529411764705, 0.1508578431372549,],
    [0.7466299019607843, 0.09558823529411764, 0.1510110294117647,],
    [0.7542892156862745, 0.10294117647058823, 0.15116421568627453,],
    [0.7619485294117647, 0.11029411764705882, 0.15131740196078433,],
    [0.7696078431372549, 0.11764705882352941, 0.15147058823529413,],
    [0.7772671568627452, 0.125, 0.15162377450980394,],
    [0.7849264705882353, 0.1323529411764706, 0.15177696078431374,],
    [0.7925857843137255, 0.13970588235294118, 0.15193014705882354,],
    [0.8002450980392157, 0.14705882352941177, 0.15208333333333335,],
    [0.8079044117647058, 0.15441176470588236, 0.15223651960784315,],
    [0.8155637254901961, 0.16176470588235295, 0.15238970588235295,],
    [0.8232230392156863, 0.16911764705882354, 0.15254289215686276,],
    [0.8308823529411764, 0.1764705882352941, 0.15269607843137256,],
    [0.8385416666666666, 0.1838235294117647, 0.15284926470588237,],
    [0.8449142156862746, 0.19197303921568626, 0.15465686274509804,],
    [0.8493566176470588, 0.2013174019607843, 0.15894607843137257,],
    [0.8537990196078431, 0.21066176470588233, 0.16323529411764706,],
    [0.8582414215686275, 0.22000612745098036, 0.16752450980392158,],
    [0.8626838235294118, 0.22935049019607842, 0.17181372549019608,],
    [0.8671262254901961, 0.23869485294117646, 0.1761029411764706,],
    [0.8715686274509804, 0.2480392156862745, 0.1803921568627451,],
    [0.8760110294117647, 0.2573835784313725, 0.18468137254901962,],
    [0.8804534313725491, 0.2667279411764706, 0.1889705882352941,],
    [0.8848958333333333, 0.2760723039215686, 0.19325980392156863,],
    [0.8893382352941177, 0.28541666666666665, 0.19754901960784316,],
    [0.893780637254902, 0.2947610294117647, 0.20183823529411765,],
    [0.8982230392156862, 0.3041053921568627, 0.20612745098039215,],
    [0.9026654411764706, 0.31344975490196075, 0.21041666666666667,],
    [0.9071078431372549, 0.3227941176470588, 0.2147058823529412,],
    [0.9115502450980393, 0.3321384803921568, 0.21899509803921569,],
    [0.9159926470588236, 0.34148284313725485, 0.22328431372549018,],
    [0.9204350490196078, 0.3508272058823529, 0.2275735294117647,],
    [0.9248774509803922, 0.3601715686274509, 0.23186274509803922,],
    [0.9293198529411765, 0.369515931372549, 0.23615196078431372,],
    [0.9337622549019609, 0.378860294117647, 0.2404411764705882,],
    [0.9382046568627451, 0.3882046568627451, 0.24473039215686276,],
    [0.9426470588235294, 0.39754901960784306, 0.24901960784313726,],
    [0.9470894607843138, 0.40689338235294115, 0.25330882352941175,],
    [0.951531862745098, 0.4162377450980392, 0.25759803921568625,],
    [0.9559742647058824, 0.4255821078431372, 0.2618872549019608,],
    [0.9579656862745098, 0.4354166666666666, 0.266421568627451,],
    [0.959344362745098, 0.44537377450980387, 0.2710171568627451,],
    [0.9607230392156864, 0.4553308823529411, 0.2756127450980392,],
    [0.9621017156862746, 0.46528799019607836, 0.28020833333333334,],
    [0.9634803921568628, 0.4752450980392156, 0.28480392156862744,],
    [0.964859068627451, 0.48520220588235285, 0.28939950980392154,],
    [0.9662377450980393, 0.49515931372549016, 0.29399509803921564,],
    [0.9676164215686275, 0.5051164215686273, 0.2985906862745098,],
    [0.9689950980392157, 0.5150735294117647, 0.3031862745098039,],
    [0.970373774509804, 0.5250306372549018, 0.307781862745098,],
    [0.9717524509803922, 0.5349877450980391, 0.3123774509803921,],
    [0.9731311274509804, 0.5449448529411764, 0.31697303921568626,],
    [0.9745098039215686, 0.5549019607843136, 0.32156862745098036,],
    [0.9758884803921569, 0.5648590686274508, 0.32616421568627446,],
    [0.9772671568627451, 0.5748161764705881, 0.33075980392156856,],
    [0.9786458333333333, 0.5847732843137254, 0.3353553921568627,],
    [0.9800245098039216, 0.5947303921568626, 0.3399509803921568,],
    [0.9814031862745098, 0.6046874999999999, 0.3445465686274509,],
    [0.982781862745098, 0.6146446078431371, 0.3491421568627451,],
    [0.9841605392156862, 0.6246017156862744, 0.3537377450980392,],
    [0.9855392156862746, 0.6345588235294117, 0.3583333333333333,],
    [0.9869178921568628, 0.6445159313725489, 0.3629289215686274,],
    [0.988296568627451, 0.6544730392156861, 0.3675245098039215,],
    [0.9896752450980393, 0.6644301470588234, 0.37212009803921564,],
    [0.9910539215686275, 0.6743872549019607, 0.37671568627450974,],
    [0.9921875, 0.6838848039215686, 0.38167892156862737,],
    [0.9923406862745098, 0.6915441176470588, 0.3881127450980391,],
    [0.9924938725490197, 0.6992034313725489, 0.3945465686274509,],
    [0.9926470588235294, 0.7068627450980391, 0.40098039215686265,],
    [0.9928002450980392, 0.7145220588235294, 0.4074142156862744,],
    [0.992953431372549, 0.7221813725490196, 0.4138480392156862,],
    [0.9931066176470589, 0.7298406862745097, 0.42028186274509793,],
    [0.9932598039215687, 0.7374999999999999, 0.42671568627450973,],
    [0.9934129901960784, 0.7451593137254902, 0.4331495098039215,],
    [0.9935661764705882, 0.7528186274509803, 0.4395833333333332,],
    [0.9937193627450981, 0.7604779411764705, 0.446017156862745,],
    [0.9938725490196079, 0.7681372549019607, 0.4524509803921568,],
    [0.9940257352941176, 0.7757965686274509, 0.45888480392156855,],
    [0.9941789215686274, 0.7834558823529412, 0.4653186274509803,],
    [0.9943321078431373, 0.7911151960784313, 0.4717524509803921,],
    [0.9944852941176471, 0.7987745098039215, 0.47818627450980383,],
    [0.9946384803921569, 0.8064338235294117, 0.4846200980392156,],
    [0.9947916666666666, 0.8140931372549018, 0.49105392156862737,],
    [0.9949448529411765, 0.8217524509803921, 0.4974877450980391,],
    [0.9950980392156863, 0.8294117647058823, 0.5039215686274509,],
    [0.9952512254901961, 0.8370710784313725, 0.5103553921568627,],
    [0.9954044117647058, 0.8447303921568627, 0.5167892156862745,],
    [0.9955575980392157, 0.8523897058823529, 0.5232230392156862,],
    [0.9957107843137255, 0.8600490196078431, 0.5296568627450979,],
    [0.9958639705882353, 0.8677083333333333, 0.5360906862745097,],
    [0.9960171568627451, 0.8753676470588234, 0.5425245098039215,],
    [0.9961703431372549, 0.8812806372549019, 0.5498774509803921,],
    [0.9963235294117647, 0.8860294117647058, 0.5578431372549019,],
    [0.9964767156862745, 0.8907781862745098, 0.5658088235294116,],
    [0.9966299019607843, 0.8955269607843137, 0.5737745098039215,],
    [0.9967830882352942, 0.9002757352941176, 0.5817401960784313,],
    [0.9969362745098039, 0.9050245098039216, 0.5897058823529411,],
    [0.9970894607843137, 0.9097732843137255, 0.597671568627451,],
    [0.9972426470588235, 0.9145220588235294, 0.6056372549019607,],
    [0.9973958333333334, 0.9192708333333333, 0.6136029411764705,],
    [0.9975490196078431, 0.9240196078431372, 0.6215686274509803,],
    [0.9977022058823529, 0.9287683823529411, 0.6295343137254902,],
    [0.9978553921568627, 0.9335171568627451, 0.6375,],
    [0.9980085784313726, 0.938265931372549, 0.6454656862745097,],
    [0.9981617647058824, 0.9430147058823529, 0.6534313725490195,],
    [0.9983149509803921, 0.9477634803921569, 0.6613970588235294,],
    [0.9984681372549019, 0.9525122549019608, 0.6693627450980392,],
    [0.9986213235294118, 0.9572610294117647, 0.677328431372549,],
    [0.9987745098039216, 0.9620098039215687, 0.6852941176470588,],
    [0.9989276960784313, 0.9667585784313726, 0.6932598039215686,],
    [0.9990808823529411, 0.9715073529411764, 0.7012254901960784,],
    [0.999234068627451, 0.9762561274509804, 0.7091911764705883,],
    [0.9993872549019608, 0.9810049019607843, 0.717156862745098,],
    [0.9995404411764706, 0.9857536764705882, 0.7251225490196078,],
    [0.9996936274509804, 0.9905024509803921, 0.7330882352941177,],
    [0.9998468137254902, 0.9952512254901961, 0.7410539215686275,],
    [1.0, 1.0, 0.7490196078431373,],
    [0.9941789215686274, 0.9975490196078431, 0.7410539215686275,],
    [0.9883578431372549, 0.9950980392156863, 0.7330882352941177,],
    [0.9825367647058824, 0.9926470588235294, 0.7251225490196078,],
    [0.9767156862745098, 0.9901960784313726, 0.717156862745098,],
    [0.9708946078431373, 0.9877450980392157, 0.7091911764705883,],
    [0.9650735294117647, 0.9852941176470589, 0.7012254901960785,],
    [0.9592524509803921, 0.982843137254902, 0.6932598039215687,],
    [0.9534313725490197, 0.9803921568627452, 0.6852941176470588,],
    [0.9476102941176471, 0.9779411764705883, 0.6773284313725491,],
    [0.9417892156862746, 0.9754901960784313, 0.6693627450980393,],
    [0.935968137254902, 0.9730392156862745, 0.6613970588235295,],
    [0.9301470588235294, 0.9705882352941176, 0.6534313725490196,],
    [0.9243259803921569, 0.9681372549019608, 0.6454656862745098,],
    [0.9185049019607844, 0.9656862745098039, 0.6375000000000001,],
    [0.9126838235294118, 0.9632352941176471, 0.6295343137254903,],
    [0.9068627450980393, 0.9607843137254902, 0.6215686274509805,],
    [0.9010416666666667, 0.9583333333333334, 0.6136029411764706,],
    [0.8952205882352942, 0.9558823529411765, 0.6056372549019609,],
    [0.8893995098039217, 0.9534313725490197, 0.5976715686274511,],
    [0.8835784313725491, 0.9509803921568628, 0.5897058823529413,],
    [0.8777573529411766, 0.948529411764706, 0.5817401960784315,],
    [0.871936274509804, 0.9460784313725491, 0.5737745098039218,],
    [0.8661151960784315, 0.9436274509803922, 0.5658088235294119,],
    [0.8602941176470589, 0.9411764705882354, 0.5578431372549021,],
    [0.8544730392156864, 0.9387254901960785, 0.5498774509803923,],
    [0.8478553921568629, 0.9359068627450982, 0.5430759803921569,],
    [0.8400428921568629, 0.9325367647058824, 0.5380208333333334,],
    [0.8322303921568629, 0.9291666666666667, 0.5329656862745099,],
    [0.8244178921568629, 0.9257965686274511, 0.5279105392156863,],
    [0.8166053921568629, 0.9224264705882353, 0.5228553921568628,],
    [0.8087928921568629, 0.9190563725490197, 0.5178002450980392,],
    [0.8009803921568629, 0.915686274509804, 0.5127450980392158,],
    [0.7931678921568629, 0.9123161764705883, 0.5076899509803923,],
    [0.7853553921568629, 0.9089460784313727, 0.5026348039215687,],
    [0.7775428921568629, 0.9055759803921569, 0.4975796568627452,],
    [0.7697303921568629, 0.9022058823529412, 0.49252450980392165,],
    [0.7619178921568629, 0.8988357843137256, 0.4874693627450981,],
    [0.7541053921568629, 0.8954656862745098, 0.48241421568627463,],
    [0.7462928921568629, 0.8920955882352942, 0.4773590686274511,],
    [0.7384803921568629, 0.8887254901960785, 0.47230392156862755,],
    [0.7306678921568629, 0.8853553921568628, 0.467248774509804,],
    [0.7228553921568629, 0.8819852941176471, 0.46219362745098047,],
    [0.7150428921568629, 0.8786151960784314, 0.457138480392157,],
    [0.7072303921568629, 0.8752450980392157, 0.45208333333333345,],
    [0.6994178921568629, 0.8718750000000001, 0.4470281862745099,],
    [0.6916053921568629, 0.8685049019607843, 0.44197303921568637,],
    [0.6837928921568629, 0.8651348039215687, 0.43691789215686283,],
    [0.6759803921568629, 0.861764705882353, 0.43186274509803935,],
    [0.6681678921568629, 0.8583946078431373, 0.4268075980392158,],
    [0.6603553921568629, 0.8550245098039216, 0.42175245098039227,],
    [0.6525428921568629, 0.8516544117647059, 0.41669730392156873,],
    [0.6431372549019609, 0.8475490196078432, 0.41482843137254904,],
    [0.6333333333333335, 0.8432598039215686, 0.41375612745098045,],
    [0.6235294117647061, 0.8389705882352941, 0.4126838235294118,],
    [0.6137254901960786, 0.8346813725490196, 0.4116115196078432,],
    [0.6039215686274512, 0.8303921568627451, 0.41053921568627455,],
    [0.5941176470588238, 0.8261029411764707, 0.4094669117647059,],
    [0.5843137254901962, 0.8218137254901962, 0.4083946078431373,],
    [0.5745098039215688, 0.8175245098039217, 0.40732230392156865,],
    [0.5647058823529414, 0.8132352941176472, 0.40625000000000006,],
    [0.5549019607843139, 0.8089460784313726, 0.4051776960784314,],
    [0.5450980392156864, 0.8046568627450981, 0.40410539215686275,],
    [0.535294117647059, 0.8003676470588236, 0.40303308823529416,],
    [0.5254901960784315, 0.7960784313725491, 0.4019607843137255,],
    [0.5156862745098041, 0.7917892156862746, 0.4008884803921569,],
    [0.5058823529411767, 0.7875000000000001, 0.39981617647058826,],
    [0.49607843137254914, 0.7832107843137256, 0.39874387254901966,],
    [0.48627450980392173, 0.7789215686274511, 0.397671568627451,],
    [0.4764705882352943, 0.7746323529411765, 0.39659926470588236,],
    [0.46666666666666684, 0.770343137254902, 0.39552696078431376,],
    [0.45686274509803937, 0.7660539215686275, 0.3944546568627451,],
    [0.4470588235294119, 0.761764705882353, 0.3933823529411765,],
    [0.4372549019607844, 0.7574754901960785, 0.39231004901960786,],
    [0.427450980392157, 0.753186274509804, 0.3912377450980392,],
    [0.41764705882352954, 0.7488970588235295, 0.3901654411764706,],
    [0.40784313725490207, 0.7446078431372549, 0.38909313725490197,],
    [0.3976715686274511, 0.7400428921568628, 0.38765318627450984,],
    [0.386029411764706, 0.7343750000000001, 0.38474264705882355,],
    [0.37438725490196095, 0.7287071078431373, 0.3818321078431373,],
    [0.36274509803921584, 0.7230392156862746, 0.378921568627451,],
    [0.35110294117647073, 0.7173713235294118, 0.37601102941176473,],
    [0.3394607843137256, 0.7117034313725491, 0.3731004901960785,],
    [0.3278186274509805, 0.7060355392156864, 0.3701899509803922,],
    [0.3161764705882354, 0.7003676470588236, 0.3672794117647059,],
    [0.30453431372549034, 0.6946997549019609, 0.3643688725490196,],
    [0.2928921568627452, 0.6890318627450981, 0.3614583333333334,],
    [0.2812500000000001, 0.6833639705882354, 0.3585477941176471,],
    [0.269607843137255, 0.6776960784313726, 0.3556372549019608,],
    [0.2579656862745099, 0.6720281862745099, 0.35272671568627456,],
    [0.2463235294117648, 0.6663602941176471, 0.34981617647058827,],
    [0.2346813725490197, 0.6606924019607844, 0.346905637254902,],
    [0.2230392156862746, 0.6550245098039216, 0.3439950980392157,],
    [0.2113970588235295, 0.6493566176470589, 0.34108455882352945,],
    [0.1997549019607844, 0.6436887254901962, 0.33817401960784316,],
    [0.1881127450980393, 0.6380208333333334, 0.33526348039215687,],
    [0.1764705882352942, 0.6323529411764707, 0.33235294117647063,],
    [0.16482843137254907, 0.6266850490196079, 0.32944240196078434,],
    [0.15318627450980396, 0.6210171568627452, 0.32653186274509804,],
    [0.14154411764705888, 0.6153492647058824, 0.32362132352941175,],
    [0.12990196078431376, 0.6096813725490197, 0.3207107843137255,],
    [0.11825980392156865, 0.6040134803921569, 0.3178002450980392,],
    [0.1066176470588236, 0.5983455882352942, 0.314889705882353,],
    [0.09957107843137257, 0.5916666666666667, 0.3114276960784314,],
    [0.09558823529411767, 0.5843137254901961, 0.3075980392156863,],
    [0.09160539215686277, 0.5769607843137255, 0.3037683823529412,],
    [0.08762254901960786, 0.5696078431372549, 0.29993872549019607,],
    [0.08363970588235296, 0.5622549019607843, 0.296109068627451,],
    [0.07965686274509806, 0.5549019607843138, 0.2922794117647059,],
    [0.07567401960784315, 0.5475490196078432, 0.2884497549019608,],
    [0.07169117647058826, 0.5401960784313726, 0.28462009803921573,],
    [0.06770833333333334, 0.532843137254902, 0.2807904411764706,],
    [0.06372549019607845, 0.5254901960784314, 0.2769607843137255,],
    [0.05974264705882354, 0.5181372549019608, 0.2731311274509804,],
    [0.05575980392156864, 0.5107843137254902, 0.2693014705882353,],
    [0.051776960784313736, 0.5034313725490196, 0.2654718137254902,],
    [0.047794117647058834, 0.49607843137254903, 0.2616421568627451,],
    [0.04381127450980393, 0.48872549019607847, 0.2578125,],
    [0.03982843137254903, 0.48137254901960785, 0.25398284313725494,],
    [0.03584558823529413, 0.47401960784313724, 0.25015318627450983,],
    [0.03186274509803923, 0.4666666666666667, 0.24632352941176472,],
    [0.027879901960784326, 0.4593137254901961, 0.2424938725490196,],
    [0.02389705882352941, 0.4519607843137255, 0.23866421568627452,],
    [0.01991421568627451, 0.4446078431372549, 0.23483455882352944,],
    [0.015931372549019607, 0.4372549019607843, 0.23100490196078433,],
    [0.011948529411764705, 0.42990196078431375, 0.2271752450980392,],
    [0.007965686274509803, 0.42254901960784313, 0.22334558823529413,],
    [0.003982843137254902, 0.4151960784313725, 0.21951593137254904,],
    [0.0, 0.40784313725490196, 0.21568627450980393]
];

function cmapInterpolate(cmap, value) {
    if (value < 0) {
        return [0, 0, 0];
    }
    else if (value > 1) {
        return [1, 1, 1];
    }
    else {
        let cmapFract = value * (cmap.length / 3 - 1);
        let cmapIndex = Math.floor(cmapFract);
        cmapFract -= cmapIndex;
        if (cmapIndex >= cmap.Length / 3 - 1) {
            return [cmap[3 * cmapIndex + 0], cmap[3 * cmapIndex + 1], cmap[3 * cmapIndex + 2]];
        }
        else {
            // Linear interpolation of colormap
            return [cmap[3 * cmapIndex + 0] + cmapFract * (cmap[3 * (cmapIndex + 1) + 0] - cmap[3 * cmapIndex + 0]), cmap[3 * cmapIndex + 1] + cmapFract * (cmap[3 * (cmapIndex + 1) + 1] - cmap[3 * cmapIndex + 1]), cmap[3 * cmapIndex + 2] + cmapFract * (cmap[3 * (cmapIndex + 1) + 2] - cmap[3 * cmapIndex + 2])];
        }
    }
}

function getCmap(maxVal) {
    return cmapPrototype.map((triplet, index) => [maxVal * index / (cmapPrototype.length - 1), `rgb(${255 * triplet[0]}, ${255 * triplet[1]}, ${255 * triplet[2]})`]);
}

let cmap = {
    'laiImage': getCmap(8),
    'ndviImage': getCmap(1),
    'ndviNormalizedSumImage': getCmap(1)
};

var v;
var worker; // Web worker
var chartRefreshIndex = 0; // An identifying number for messages to web worker and the corresponding replies from web worker
var nonspecialChartId;
var mapbackgrounds;

//const versionHash = (new URL(document.getElementById("versioned_js").src)).searchParams.get('v');
const FODataViewerWorkerJsUrl = document.getElementById("fieldobservatory-FODataViewerWorkerJs-js").src;
const FODataViewerCoreJsUrl = document.getElementById("fieldobservatory-FODataViewerCoreJs-js").src;

function refreshChart(chartId, refreshIndex, xAxisHtml, drawingHtmls) {
    if (xAxisHtml === undefined) {
        xAxisHtml = getXAxisHtml(v);
    }
    document.getElementById(`chart_x_axis_${chartId}`).innerHTML = xAxisHtml;
    prepYGrid(v, chartId)
    document.getElementById(`chart_y_axis_${chartId}`).innerHTML = getYAxisHtml(v, chartId);
    if (drawingHtmls === undefined) {
        drawingHtmls = getDrawingHtmls(v, chartId);
    }
    document.getElementById(`chart_drawing_defs_${chartId}`).innerHTML = drawingHtmls.drawingDefsHtml;
    document.getElementById(`chart_drawing_background_${chartId}`).innerHTML = drawingHtmls.drawingBackgroundHtml;
    document.getElementById(`chart_drawing_${chartId}`).innerHTML = drawingHtmls.drawingHtml;
    addTransientDrawingListeners(chartId);
    v.charts[chartId].refreshIndex = refreshIndex;
}

function refreshCharts(chartIds, refreshIndex, xAxisHtml) {
    if (xAxisHtml === undefined) {
        xAxisHtml = getXAxisHtml(v);
    }
    chartIds.forEach(function (chartId) {
        refreshChart(chartId, refreshIndex, xAxisHtml)
    });
}

function refreshAllCharts(refreshIndex, xAxisHtml) {
    refreshCharts(v.chartIds.filter(chartId => !v.charts[chartId].hidden), refreshIndex, xAxisHtml);
}

function requestWorkerRefreshCharts(chartIds, refreshIndex) {
    //console.log(`requestWorkerRefreshCharts ${chartIds}, refreshIndex = ${refreshIndex}`)
    chartIds.forEach(function (chartId) {
        let chart = v.charts[chartId];
        if (!chart.awaitingWorkerRefresh) {
            worker.postMessage({
                command: "refreshCharts",
                refreshIndex: refreshIndex,
                chartIds: [chartId]
            });
            chart.awaitingWorkerRefresh = true;
        } else {
            chart.rerequestWorkerRefresh = true;
        }
    });
}

function requestWorkerLoadData() {
    worker.postMessage({
        command: "loadData"
    });
}

function workerUpdateView() {
    worker.postMessage({
        command: "vUpdate",
        vUpdate: {
            startDate: v.startDate,
            endDate: v.endDate
        }
    });
}

function addTooltip(elementId, text) {
    //console.log(`addTooltip ${elementId}`);
    let element = document.getElementById(elementId);
    if (element != null) {
        element.addEventListener("mouseover", (e) => showTooltip(e, elementId, text));
        element.addEventListener("mouseleave", (e) => hideTooltip(e, elementId));
    }
}

function addTransientDrawingListeners(chartId) {
    let chart = v.charts[chartId];
    if (!chart.hidden) {
        if (v.charts["global"] !== undefined) {
            v.charts["global"].sources.forEach(function (source, sourceIndex) {
                if (source.events) {
                    source.jsonList.forEach(function (json, jsonIndex) {
                        if (new Date(json.startTime) <= v.endDate && new Date(json.endTime) >= v.startDate && json.data !== undefined && json.data.management !== undefined && json.data.management.events !== undefined) {
                            json.data.management.events.forEach(function (event, eventIndex) {
                                let eventElementId = `chart_${chartId}_global_${source.id}_${jsonIndex}_${eventIndex}`;
                                let eventElement = document.getElementById(eventElementId);
                                if (eventElement != null) {
                                    if (event.start_date !== undefined && event.end_date !== undefined) {
                                        eventElement.onclick = function (e) {
                                            setEventDate(event.start_date, sourceIndex, eventIndex, chartId, e);
                                            e.stopPropagation();
                                            e.preventDefault();                            
                                        }
                                        eventElement.onmousedown = preventDefault;
                                    } else if (event.date !== undefined) {
                                        eventElement.onclick = function (e) {
                                            setEventDate(event.date, sourceIndex, eventIndex, chartId, e);
                                            e.stopPropagation();
                                            e.preventDefault();                            
                                        }
                                        eventElement.onmousedown = preventDefault;
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
        if (chartId === "satelliteImages") {
            chart.sourceCategoryList.forEach(function (sourceCategory) {
                if (chart.visible[sourceCategory.id]) {
                    sourceCategory.geoTiffDates.forEach(function (date, index) {
                        let circleId = `chart_${chartId}_sourceCategory_${sourceCategory}_index_${index}`;
                        let circle = document.getElementById(circleId);
                        if (circle != null) {
                            circle.onclick = (e) => setSatelliteImageDate(date, e);
                            circle.onmousedown = preventDefault;
                        }
                    });
                }
            });
        }
    }
}

function addPermanentDrawingListeners() {
    v.chartIds.forEach(function (chartId) {
        let chart = v.charts[chartId];
        if (!chart.hidden) {
            let panAreaElementId = `chart_pan_area_${chartId}`
            let panAreaElement = document.getElementById(panAreaElementId);
            panAreaElement.onpointerdown = function (e) {
                let clientXOrigin = e.clientX;
                let startDateOrigin = v.startDate;
                let endDateOrigin = v.endDate;
                panAreaElement.setPointerCapture(e.pointerId);
                panAreaElement.onpointermove = function (e) {
                    let timeShiftMilliseconds = Math.round((clientXOrigin - e.clientX) / v.dimensions.width * (endDateOrigin - startDateOrigin));
                    v.startDate = startDateOrigin + timeShiftMilliseconds;
                    v.endDate = v.startDate + (endDateOrigin - startDateOrigin);
                    prepXGrid(v);
                    chartRefreshIndex++;
                    refreshChart(chartId, chartRefreshIndex);
                    workerUpdateView();
                    requestWorkerRefreshCharts(v.chartIds.filter(function (id) {
                        if (v.charts[id].hidden) {
                            return false;
                        }
                        let rect = document.getElementById(`chart_svg_${id}`).getBoundingClientRect();                    
                        return (id !== chartId && rect.bottom >= 0 && rect.right >= 0 && rect.top < window.innerHeight && rect.left < window.innerWidth);
                    }), chartRefreshIndex);
                    requestWorkerLoadData();
                    e.stopPropagation();
                }
                e.stopPropagation();
                e.preventDefault();
            };
            panAreaElement.onpointerup = function (e) {
                requestWorkerRefreshCharts(v.chartIds.filter(function (id) {
                    if (v.charts[id].hidden) {
                        return false;
                    }
                    let rect = document.getElementById(`chart_svg_${id}`).getBoundingClientRect();
                    return (id !== chartId && !(rect.bottom >= 0 && rect.right >= 0 && rect.top < window.innerHeight && rect.left < window.innerWidth));
                }), chartRefreshIndex);
                panAreaElement.releasePointerCapture(e.pointerId);
                panAreaElement.onpointermove = null;
                e.stopPropagation();
            };
            let zoomXInElementId = `chart_zoom_x_in_${chartId}`;
            let zoomXIn = document.getElementById(zoomXInElementId);
            zoomXIn.onmousedown = function (e) {
                e.preventDefault();
            };
            zoomXIn.onclick = function (e) {
                if (v.zoomLevel > 0) {
                    let centerDate = (v.startDate + v.endDate) * 0.5;
                    v.zoomLevel--;
                    v.startDate = centerDate - v.zoomLevels[v.zoomLevel] * 0.5;
                    v.endDate = v.startDate + v.zoomLevels[v.zoomLevel];
                    prepXGrid(v);
                    chartRefreshIndex++;
                    refreshChart(chartId, chartRefreshIndex);
                    workerUpdateView();
                    requestWorkerRefreshCharts(v.chartIds.filter(id => id !== chartId && !v.charts[id].hidden), chartRefreshIndex);
                    requestWorkerLoadData();
                }
                e.stopPropagation();
                e.preventDefault();
            };
            let zoomXOutElementId = `chart_zoom_x_out_${chartId}`;
            let zoomXOut = document.getElementById(zoomXOutElementId);
            zoomXOut.onmousedown = function (e) {
                e.preventDefault();
            };
            zoomXOut.onclick = function (e) {
                if (v.zoomLevel < v.zoomLevels.length - 1) {
                    let centerDate = (v.startDate + v.endDate) * 0.5;
                    v.zoomLevel++;
                    v.startDate = centerDate - v.zoomLevels[v.zoomLevel] * 0.5;
                    v.endDate = v.startDate + v.zoomLevels[v.zoomLevel];
                    prepXGrid(v);
                    chartRefreshIndex++;
                    refreshChart(chartId, chartRefreshIndex);
                    workerUpdateView();
                    requestWorkerRefreshCharts(v.chartIds.filter(id => id !== chartId && !v.charts[id].hidden), chartRefreshIndex);
                    requestWorkerLoadData();
                }
                e.stopPropagation();
            };
            let download = document.getElementById(`chart_download_${chartId}`);
            if (download !== null) {
                function formatDateYYYYMinusMMMinusDD(date) {
                    return [date.getUTCFullYear(), (date.getUTCMonth() + 1).toString().padStart(2, '0'), date.getUTCDate().toString().padStart(2, '0')].join('-');
                }
                download.onclick = function (e) {
                    {
                        // download image
                        prepYGrid(v, chartId);
                        let svgBoundingClientRect = document.getElementById(`chart_svg_${chartId}`).getBoundingClientRect();                   
                        //console.log(svgBoundingClientRect);
                        let legendItemCoordinates = [];
                        chart.sources.forEach(function (source) {
                            let legendItemBoundingClientRect = document.getElementById(`chart_${chartId}_legend_element_${source.legendId}`).getBoundingClientRect();
                            legendItemCoordinates.push([legendItemBoundingClientRect.left - svgBoundingClientRect.left, legendItemBoundingClientRect.top - svgBoundingClientRect.top]);
                        });
                        let data = getChartSvgOuterHtml(v, chartId, true, legendItemCoordinates);
                        let blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
                        let url = URL.createObjectURL(blob);
                        let downloadLink = document.createElement("a");
                        downloadLink.href = url;
                        downloadLink.download = `retrieved_${formatDateYYYYMinusMMMinusDD(new Date(foConfig.now))}_${v.site.id}_${chartId}_${formatDateYYYYMinusMMMinusDD(new Date(v.startDate))}_to_${formatDateYYYYMinusMMMinusDD(new Date(v.endDate))}.svg`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    }

                    {
                        // download table
                        let data = getChartCsv(v, chartId);
                        let blob = new Blob([data], { type: "text/csv;charset=utf-8" });
                        let url = URL.createObjectURL(blob);
                        let downloadLink = document.createElement("a");
                        downloadLink.href = url;
                        downloadLink.download = `retrieved_${formatDateYYYYMinusMMMinusDD(new Date(foConfig.now))}_${v.site.id}_${chartId}_${formatDateYYYYMinusMMMinusDD(new Date(v.startDate))}_to_${formatDateYYYYMinusMMMinusDD(new Date(v.endDate))}.csv`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    }
                };
            }
        }
    });
}

function resizeCharts() {
    let chartDiv = document.getElementById(`chart_svg_div_${nonspecialChartId}`);
    if (chartDiv !== null) {
        v.dimensions.width = getChartWidth(chartDiv);
        prepXGrid(v);

        v.chartIds.forEach(function (chartId) {
            if (!v.charts[chartId].hidden) {
                document.getElementById(`chart_svg_div_${chartId}`).innerHTML = getChartSvgOuterHtml(v, chartId);
            }
        });
        refreshAllCharts();

        // Add pointer event listeners do drawings
        addPermanentDrawingListeners();

        worker.postMessage({
            command: "vUpdate",
            vUpdate: {
                dimensions: v.dimensions
            }
        });
    }
}

function getChartWidth(chartDiv) {
    return chartDiv.offsetWidth - v.dimensions.leftMargin - v.dimensions.yAxisAreaWidth - v.dimensions.rightMargin - parseInt(window.getComputedStyle(chartDiv).borderLeftWidth) - parseInt(window.getComputedStyle(chartDiv).borderRightWidth) - parseInt(window.getComputedStyle(chartDiv).paddingLeft) - parseInt(window.getComputedStyle(chartDiv).paddingRight);
}

async function viewSite(zoomDuration) {
    viewSiteBeforeLoadEssentials();
    await viewSiteAfterLoadingEssentials(zoomDuration);
}

function viewSiteBeforeLoadEssentials() {
    document.body.classList.add('Site');
    //Hide filter when Site
    if (foConfig.mapEnabled) {
        var filterContainer = document.getElementById("mapFilterContainer");
        filterContainer.style.display = "none";
    }
}

function updateColorbar() {
    document.getElementById("chart_colorbar_satelliteImages").style.visibility = v.satelliteImageLegendId !== "laiImage"? "visible" : "hidden";
    document.getElementById("chart_colorbar_lai_satelliteImages").style.visibility = v.satelliteImageLegendId === "laiImage"? "visible" : "hidden";
    document.getElementById("chart_colorbar_cumNDVI_title_satelliteImages").style.visibility = v.satelliteImageLegendId === "ndviNormalizedSumImage"? "visible" : "hidden";
    document.getElementById("chart_colorbar_nvdi_title_satelliteImages").style.visibility = v.satelliteImageLegendId === "ndviImage"? "visible" : "hidden";
    document.getElementById("chart_colorbar_lai_title_satelliteImages").style.visibility = v.satelliteImageLegendId === "laiImage"? "visible" : "hidden";    
}

async function viewSiteAfterLoadingEssentials(zoomDuration) {
    // Get all blocks of this site and find and zoom to the minimal bounding box
    let siteBlocks = blocksGeoJson.features.filter(feature => (feature.properties.site === getSiteId()));

    if (typeof (Worker) == "undefined") {
        throw new Error('Web workers not supported by the browser.')
    }

    // Load Web Worker script possibly not from same origin: https://stackoverflow.com/a/60252783/4770915
    const workerBlob = new Blob(['importScripts(' + JSON.stringify(FODataViewerWorkerJsUrl) + ')',], {type: 'application/javascript'});
    const blobUrl = window.URL.createObjectURL(workerBlob);
    worker = new Worker(blobUrl);
    
    worker.postMessage({
        command: "importScript",
        script: FODataViewerCoreJsUrl
    });

    //console.log(`Date: ${now.toUTCString()}`);  

    v = { // State variables and constants needed by web workers
        managementEventSchemaJson: managementEventSchemaJson,
        charts: {}, // Dictionary: chart id => chart object. These will have sources with parameters merged from sourceType and source.
        chartIds: [], // List of ids of available charts in same order as in chartsJson.
        sources: {}, // Dictionary: source ID => source object. These will not have parameters merged from sourceTypes.
        dimensions: { // Chart SVG dimensions in pixels.
            width: 640, // Drawing area width.
            height: 350, // Drawing area height. Was: 450
            satelliteImagesHeight: 98, // Drawing area height for satelliteImages chart. 53 is a good narrow value
            yAxisAreaWidth: 80, // Left axis area width.
            leftMargin: 20, // Left margin width.
            rightMargin: 20, // Right margin width.
            topMargin: 47, // Top margin height. (Was 25 until 16.6.2021)
            bottomMargin: 40 // Bottom axis area height.
        },
        satelliteImageDate: 0,        
        zoomLevels: [
            30 * 60 * 60 * 1000, // 1 day
            3 * 24 * 60 * 60 * 1000, // 2 days
            5 * 24 * 60 * 60 * 1000, // 4 days
            7 * 24 * 60 * 60 * 1000, // 1 week
            14 * 24 * 60 * 60 * 1000, // 2 weeks
            32 * 24 * 60 * 60 * 1000, // 1 month
            62 * 24 * 60 * 60 * 1000, // 2 months
            122 * 24 * 60 * 60 * 1000, // 4 months
            180 * 24 * 60 * 60 * 1000, // half a year
            365 * 24 * 60 * 60 * 1000, // 1 year
            2 * 365 * 24 * 60 * 60 * 1000, // 2 years
            5 * 365 * 24 * 60 * 60 * 1000, // 5 years
            10 * 365 * 24 * 60 * 60 * 1000 // 10 years
        ],
        timeZone: "Europe/Helsinki", // TODO: Currently this does nothing
        minPixelsPerHourTick: 7,
        minPixelsPerDayTick: 7,
        minPixelsPerMonthTick: 7,
        minPixelsPerValTick: 40,
        minPixelsPerHourTickLabel: 30,
        minPixelsPerDayTickLabel: 30,
        minPixelsPerMonthTickLabel: 30,
        minPixelsPerYearTickLabel: 30,
        minPixelsPerValTickLabel: 40,
        minPixelsPerUTCText: 30
    }
    addChartColors(v);

    if (foConfig.startDate === undefined) {
        v.zoomLevel = 6;
        v.startDate = foConfig.now - v.zoomLevels[v.zoomLevel];
        v.endDate = foConfig.now + v.zoomLevels[v.zoomLevel]*(15/62);
    } else {
        v.startDate = foConfig.startDate;
        for (v.zoomLevel = 0; v.zoomLevel < v.zoomLevels.length; v.zoomLevel++) {
            if (v.startDate + v.zoomLevels[v.zoomLevel]*1.10 > foConfig.now) {
                v.startDate = v.startDate + (foConfig.now - v.startDate)*0.5 - v.zoomLevels[v.zoomLevel]*0.5;
                v.endDate = v.startDate + v.zoomLevels[v.zoomLevel];
                break;                
            }
        }
        if (v.zoomLevel >= v.zoomLevels.length) {
            v.zoomLevel = v.zoomLevels.length - 1;
            v.endDate = foConfig.now + v.zoomLevels[v.zoomLevel]*0.05;
            v.startDate = v.endDate - v.zoomLevels[v.zoomLevel];
        }
    }

    // Set site description
    sitesGeoJson.features.forEach(feature => {
        if (feature.properties.site === getSiteId()) {          
            let managementHTML = (translate(feature.properties, "management", null) == null) ? '' : `
            <tr>
               <td>${translate(t.plaintext_titles, "management")}:</td>
               <td>${translate(feature.properties, "management")}</td>
            </tr>`;
            let speciesHTML = (translate(feature.properties, "species", null) == null) ? '' : `
            <tr>
               <td>${translate(t.plaintext_titles, "species")}:</td>
               <td>${translate(feature.properties, "species")}</td>
            </tr>`;
            let soilTypeHTML = undefined;
            let blocksWithDifferentSoilTexture = siteBlocks.filter(block => block.properties.soil_texture !== undefined && block.properties.soil_texture != null && block.properties.soil_texture !== feature.properties.soil_texture);
            if (blocksWithDifferentSoilTexture.length > 0) {
                soilTypeHTML = siteBlocks.map(block => `<td><span style="white-space: nowrap;">${translate(block.properties, "Name")}</span><br>${translate(t.soil_texture_choice_plaintext, block.properties.soil_texture)}</td>`).join(" ");
            } else {
                if (feature.properties.soil_texture != null) {
                    soilTypeHTML = `<td>${translate(t.soil_texture_choice_plaintext, feature.properties.soil_texture, "")}</td>`;
                }
            }
            let description = `
            <p style="animation:fadein 1s">${translate(feature.properties, "site_type_Name", (feature.properties.site_type === undefined) ? "" : feature.properties.site_type)}</p>
            <p style="animation:fadein 1s">${translate(feature.properties, "description", "")}</p>
            <!-- <h4 id="Farming_methods">Farming methods</h4> -->
            <table style="animation:fadein 1s;">
                ${managementHTML}
                ${speciesHTML}
                ${(soilTypeHTML !== undefined)? `
                <tr>
                    <td style="vertical-align: top;">${translate(t.plaintext_titles, "soil_texture")}:</td>
                    ${soilTypeHTML}
                </tr>`: ""}
            </table>
            <div id="satelliteImageDiv">
                <h4 id="Satellite_images">${translate(chartsJson.charts.find(chart => chart.id === "satelliteImages"), "title")}</h4>
            </div>`;
            if (foConfig.mapEnabled) {
                if (feature.properties.demo) {
                    document.getElementById('fieldInfo').innerHTML = `${translate(feature.properties, "Name", feature.properties.id)} (demo)`;
                } else {
                    document.getElementById('fieldInfo').innerHTML = translate(feature.properties, "Name", feature.properties.id);
                }
                document.getElementById('siteDescription').innerHTML = description;
            }
        }
    });
    if (v.mapElementId !== undefined) {
        if (window.innerWidth <= 1024) {
            // One column
            document.getElementById("Satellite_images").after(document.getElementById("map"));         // ***
        } else {
            document.getElementById("mapMainHeaderDiv").after(document.getElementById("map"));
        }
    }

    if (siteJson === undefined) {
        for (let feature of sitesGeoJson.features) {
            if (feature.properties.site === getSiteId()) {                
                siteJson = await fetch(`${feature.properties.storageUrl}/${getSiteId()}/site.json?date=${getCacheRefreshDate(new Date(foConfig.now))}`).then(async response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${response.url}: ${response.status}`);
                    }
                    return await response.json();
                });
            }
        }
    }

    onWindowResize(); // Reorganize layout for small screen

    console.log("siteJson =");
    console.log(JSON.parse(JSON.stringify(siteJson))); // Create deep copies so that console.log statements show what was loaded

    // Merge sitesGeoJson feature and siteJson properties into siteJson, with siteJson properties taking priority
    sitesGeoJson.features.forEach(feature => {
        if (feature.properties.site === getSiteId()) {
            siteJson = { ...feature.properties, ...siteJson };
        }
    });

    // Merge blocksGeoJson features and siteJson block properties into siteJson, with siteJson block properties taking priority
    siteJson.blocks.forEach((block, index) => {        
        blocksGeoJson.features.forEach(feature => {
            if (feature.properties.site === getSiteId() && feature.properties.id === `${getSiteId()}_${block.id}`) {
                siteJson.blocks[index] = { ...feature.properties, ...block };
            }
        });
    });

    // Create siteJson.blockIdToBlock
    siteJson.blockIdToBlock = {};
    siteJson.blocks.forEach((block, index) => {        
        siteJson.blockIdToBlock[block.id] = block;
    });

    // Find out which charts can be made and prepare chart data structures, discarding everything unnecessary
    prepCharts(v, siteJson, chartsJson);
    // console.log("Charts prepped");

    // Create chart DIV and SVG elements in the same order they appear in chartsJson.
    let hasSatelliteImages = false;
    v.chartIds.forEach(function (chartId) {        
        let chart = v.charts[chartId];
        if (chartId === "satelliteImages" && chart.sourceCategoryList.length > 0) {
            hasSatelliteImages = true;
            v.satelliteImageLegendId = chart.sourceCategoryList[0].id;
            // Choose the last date that has the maximum number of satellite images.
            let maxNumImages = -1;
            v.satelliteImageDate = foConfig.now;
            for (let i = 0; i < chart.sourceCategoryList[0].geoTiffDates.length; i++) {
                let date = chart.sourceCategoryList[0].geoTiffDates[i];
                if (chart.sourceCategoryList[0].dateToGeoTiffList[date].length >= maxNumImages) {
                    v.satelliteImageDate = date;
                    maxNumImages = Math.min(siteJson.blocks.length, chart.sourceCategoryList[0].dateToGeoTiffList[date].length); // For sanity
                }
            }
            if (!chart.hidden) {
                document.getElementById("afterMap").insertAdjacentHTML("beforeend", getChartDivOuterHtml(v, chartId));
            }
        } else {
            if (!chart.hidden) {                
                document.getElementById(foConfig.chartContainerElementId).insertAdjacentHTML("beforeend", getChartDivOuterHtml(v, chartId));
            }
        }
        if (!chart.hidden) {
            document.getElementById(`chart_title_div_${chartId}`).innerHTML = `<h4>${translate(v.charts[chartId], "title")}</h4>`;
            let title2Div = document.getElementById(`chart_title2_div_${chartId}`);
            if (title2Div !== null) {
                title2Div.innerHTML = `<h4>${translate(v.charts[chartId], "title")}</h4>`;
            }
            var legend = '';
            if (chartId === "satelliteImages") {
                let tooltipString = translate(t.tooltip, "selectSatelliteImageType");
                v.charts[chartId].sourceCategoryList.forEach(function (sourceCategory) {
                    let visibleSymbolHtml;
                    visibleSymbolHtml = getVisibleSymbolHtml(chartId, sourceCategory.id, v.chartColors[0], tooltipString, v.charts[chartId].visible[sourceCategory.id]);
                    legend += `<span class="chart_legend_element">${visibleSymbolHtml}<span class="chart_legend_text">${translate(sourceCategory, "title")}</span></span>`;
                });
            } else {
                let tooltipString = translate(t.tooltip, "legendItemVisibility");
                v.charts[chartId].sources.forEach(function (source) {
                    let visibleSymbolHtml;
                    if (chartId === 'temperature' && source.rainbow !== undefined) {
                        visibleSymbolHtml = getVisibleSymbolHtml(chartId, source.legendId, `url(#chart_${chartId}_visible_${source.id}_gradient)`, tooltipString, v.charts[chartId].visible[source.legendId], getTemperatureGradientHtml(`chart_${chartId}_visible_${source.id}_gradient`, 0, 620, 0, 584, -50, 50));
                    } else {
                        visibleSymbolHtml = getVisibleSymbolHtml(chartId, source.legendId, source.color, tooltipString, v.charts[chartId].visible[source.legendId]);
                    }
                    legend += `<span id="chart_${chartId}_legend_element_${source.legendId}" class="chart_legend_element"><span>${visibleSymbolHtml}</span><span class="chart_legend_text">${source.name}</span></span>`;
                });
            }
            document.getElementById(`chart_legend_div_${chartId}`).innerHTML = legend;
            document.getElementById(`chart_description_div_${chartId}`).innerHTML = 
            `${translate(v.charts[chartId], "description", null) != null ? `<p>${translate(v.charts[chartId], "description")}</p>` : ''}`;
            nonspecialChartId = chartId;
        }
    });
    if (!foConfig.mapEnabled || !hasSatelliteImages) {
        let satelliteImageDivElement = document.getElementById("satelliteImageDiv");
        if (satelliteImageDivElement !== null) {
            satelliteImageDivElement.remove();
        }
    }
    if (foConfig.creditContainerElementId !== undefined) {
        document.getElementById(foConfig.creditContainerElementId).insertAdjacentHTML("beforeend", '<div id="dataCredits"></div>');
    }
    v.dimensions.width = getChartWidth(document.getElementById(`chart_svg_div_${nonspecialChartId}`));
    //console.log("Style: " + chartDiv.style.marginLeft);
    //console.log("chart_container CALCULATED width: " + v.dimensions.width);
    //console.log("chart_container DEFAULT width: " + document.getElementById('chart_container').offsetWidth);
    v.chartIds.forEach(function (chartId) {
        //console.log(`Create chart ${chartId}`);
        if (!v.charts[chartId].hidden) {
            document.getElementById(`chart_svg_div_${chartId}`).innerHTML = getChartSvgOuterHtml(v, chartId);
        }
    });

    if (hasSatelliteImages) {
        updateColorbar();
    }

    // A scrollbar may have appeared. Change chart and map sizes accodingly.    
    resizeCharts();

    // Obfuscated map backgrounds
    mapbackgrounds = mapbackgroundsJson.features.filter(feature => feature.properties.site === v.site.id);
    
    // Add blocks to map
    if (foConfig.mapEnabled) {
        whenMapLoadedDo(function () {
            map.resize(); // Use this, because onWindowResize() screws up map fitBounds execution.
            if (siteBlocks.length > 0) {
                // Blocks source
                map.addSource("blocks", {
                    type: "geojson",
                    data: { ...blocksGeoJson, ...{ features: siteBlocks } }, // Only this site's blocks
                    cluster: false
                });
            }
            // *** Test aerial photo background        
            if (mapbackgrounds.length > 0) {
                document.body.classList.add('Obfuscated');
                for (let layer of map.getStyle().layers) {
                    if (layer.id === "satelliteZ") {
                        break;
                    }
                    if (layer.id !== "landcover-outdoors") {                        
                        if (map.getLayoutProperty(layer.id, 'visibility') === 'visible' || map.getLayoutProperty(layer.id, 'visibility') === undefined) {
                            layerVisibilityBackup[layer.id] = 'visible';
                            map.setLayoutProperty(layer.id, 'visibility', 'none');
                        }
                    }
                };
                //console.log(map.getStyle().layers);            
                mapbackgrounds.forEach(function (feature, index) {              
                    map.addSource(
                        `${v.site.id}_mapbackground_${index}`,
                        {
                            type: "image",
                            url: `${v.site.storageUrl}/${feature.properties.imagePath}`,
                            coordinates: feature.geometry.coordinates[0] // Order of coordinates: [small~20, big~60], [big~20, big~60], [big~20, small~60], [small~20, small~60]
                        }
                    );
                    map.addLayer({
                        'id': `${v.site.id}_mapbackground_${index}`,
                        'source': `${v.site.id}_mapbackground_${index}`,
                        'type': 'raster',
                        'paint': {
                            'raster-opacity': 1.0,
                            //'raster-resampling': 'nearest',
                            'raster-fade-duration': 0
                        }
                    }, 'satelliteZ');
                });
            }
            // Blocks layer
            map.addLayer({
                'id': 'blocks',
                'type': 'fill',
                'source': 'blocks',
                'paint': {
                    //'fill-color': '#fcea62',
                    'fill-opacity': 0
                },
            }, "blockZ");
            //Blocks lines
            map.addLayer({
                'id': 'blockLines',
                'type': 'line',
                'source': 'blocks',
                'paint': {
                    'line-color': v.chartColors[1], // Was: '#02B8CE'
                    'line-width': 2,                
                },
            }, "blockZ");
            //Block Name
            map.addLayer({
                "id": "blockNames",
                "type": "symbol",
                "source": "blocks",
                "layout": {
                    "text-field": ["coalesce", ['get', `Name_${foConfig.language}`], ['get', 'Name']],
                    "text-font": [
                        "DIN Offc Pro Medium",
                        "Arial Unicode MS Regular"
                    ],
                    "text-size": 12,
                    "text-anchor": "top",
                    "text-allow-overlap": true
                },
                "paint": {
                    "text-halo-width": 2,
                    "text-halo-blur": 1,
                    "text-halo-color": "#ffffff"
                }
            }, "blockZ");
            map.setLayoutProperty("blockNames", 'visibility', "none");
            map.once('moveend', function () {
                setSiteSelectorMapLayerVisibility("none");
                map.setLayoutProperty("blockNames", 'visibility', "visible");
                setOthersThanMapLoaded(true);
                handleEsc = function () {
                    pushState();
                    unviewSiteAndViewSiteSelector();
                };
                //document.getElementById("liMapView").onclick = function (e) {
                //    e.stopPropagation();
                //    e.preventDefault();
                //    handleEsc();
                //};
                window.onpopstate = unviewSiteAndViewSiteSelector;
            });
            
            map.setMaxZoom(siteMapView.maxZoom);
            map.setMinZoom(siteMapView.minZoom);
            if (siteBlocks.length > 0) {
                map.fitBounds(getBoundingBox(siteBlocks), { padding: 40, duration: zoomDuration });
            }
            //map.setMaxBounds(getBoundingBox(siteBlocks));
        });
    }

    let creditStr = "";

    // Add mapbackground credits
    if (mapbackgrounds.length > 0) {
        mapbackgrounds.forEach(function (mapbackground) {
            let creditId = mapbackground.properties.credit;
            if (creditId !== undefined) {
                if (v.mapbackgroundCreditDownloadDates === undefined) {
                    v.mapbackgroundCreditDownloadDates = {};
                }
                if (v.mapbackgroundCreditDownloadDates[creditId] === undefined) {
                    v.mapbackgroundCreditDownloadDates[creditId] = {};
                }
                v.mapbackgroundCreditDownloadDates[creditId][mapbackground.properties.downloadDate] = true;
            }
        });
        Object.keys(v.mapbackgroundCreditDownloadDates).forEach(function (creditId) {
            downloadDates = Object.keys(v.mapbackgroundCreditDownloadDates[creditId]).sort(function (a, b) {
                let a_month, a_year = a.split("/")
                a_month = parseInt(a_month)
                a_year = parseInt(a_year)
                let b_month, b_year = b.split("/")
                b_month = parseInt(b_month)
                b_year = parseInt(b_year)
                return a_year * 12 + a_month - b_year * 12 - b_month;
            }).join(', ');
            switch (creditId) {
                case "mmlOpen":
                    creditStr += `<p class="h4p">The aerial photo contains data from the National Land Survey of Finland Topographic Database (${downloadDates}). <a href="https://www.maanmittauslaitos.fi/en/opendata-licence-cc40" target="_blank">License</a>.</p>`;
                    break;
            }
        });
    }


    if (v.credits !== undefined) {
        for (const [creditId, credit] of Object.entries(v.credits)) {
            creditStr += '<p class="h4p">';
            let chartTitles = v.chartIds.filter(chartId => credit.charts[chartId] !== undefined).map(chartId => translate(v.charts[chartId], "title", chartId, "en"));
            let chartsStr = chartTitles.slice(0, -1).join(', ') + ((chartTitles.length > 1) ? " and " : "") + chartTitles.slice(-1);
            let years = Object.keys(credit.years).sort((a, b) => a - b);
            let yearsStr = years.join(', ');
            switch (creditId) {
                case "sentinelDerivative":
                    creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} modified <a href="https://scihub.copernicus.eu/dhus" target="_blank">Copernicus Sentinel</a> data (${yearsStr}). <a href="https://sentinel.esa.int/documents/247904/690755/Sentinel_Data_Legal_Notice/">License</a>.`;
                    break;
                case "camsModified":
                    creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} modified <a href="https://atmosphere.copernicus.eu/" target="_blank">Copernicus Atmosphere Monitoring Service</a> Information (${yearsStr}). <a href="https://confluence.ecmwf.int/display/CKB/How+to+reference+or+acknowledge+data+from+CAMS+%28Copernicus+Atmosphere+Monitoring+Service%29+in+a+publication">Reference and license</a>. Neither the European Commission nor <a href="https://www.ecmwf.int/" target="_blank">ECMWF</a> is responsible for any use that may be made of the information it contains.`;
                    break;
                case "fmiOpenData":
                    creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} open weather data from the <a href="https://en.ilmatieteenlaitos.fi/" target="_blank">Finnish Meteorological Institute</a> (FMI). <a href="https://en.ilmatieteenlaitos.fi/open-data-licence">License</a>.`;
                    break;
                case "smhiOpenData":
                    creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} open weather data from the <a href="https://www.smhi.se/en" target="_blank">Swedish Meteorological and Hydrological Institute</a> (SMHI). <a href="https://www.smhi.se/en/services/open-data/conditions-of-use-1.33347">License</a>.`;
                    break;
                case "ecmwf_ensemble_forecast":
                    creditStr += `The probability forecast in ${chartsStr} is produced by the <a href="https://www.ecmwf.int/" target="_blank">European Centre for Medium-Range Weather Forecasts</a> (ECMWF) and disseminated by the <a href="https://en.ilmatieteenlaitos.fi/" target="_blank">Finnish Meteorological Institute</a>.`;
                    break;
                case "fmiIntensiveSite":
                    {
                        let principalInvestigator;
                        if (v.site.id === "qvidja") {
                            principalInvestigator = " Laura Heimsch (laura.heimsch [at] fmi.fi)";
                        } else if (v.site.id === "ruukki") {
                            principalInvestigator = " Henriikka Vekuri (henriikka.vekuri [at] fmi.fi)";
                        }
                        creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} data produced by the <a href="https://en.ilmatieteenlaitos.fi/" target="_blank">Finnish Meteorological Institute</a> under the <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International license (CC BY 4.0)</a> and provided without warranty of any kind. Please note that the data are provisional and will be subject to further quality control.`;
                        v.principalInvestigator = principalInvestigator;
                    }
                    break;
                case "hy":
                    {
                        let principalInvestigator = undefined;
                        if (v.site.id === "haltiala") {
                            principalInvestigator = " Annalea Lohila (Annalea.Lohila [at] helsinki.fi)";
                        }
                        creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} data produced by the <a href="https://www2.helsinki.fi/en/inar-institute-for-atmospheric-and-earth-system-research" target="_blank">INAR Institute of University of Helsinki</a> under the <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International license (CC BY 4.0)</a> and provided without warranty of any kind. Please note that the data are provisional and will be subject to further quality control.`;
                        v.principalInvestigator = principalInvestigator;
                    }
                    break;
                case "datasense":
                    creditStr += `${chartsStr} contain${(chartTitles.length > 1) ? "" : "s"} data from <a href="https://www.datasense.fi/" target="_blank">Datasense</a> sensors.`;
                    break;
            }
            creditStr += "</p>";
        }
    }
    if (creditStr !== "") {
        creditStr = '<h4 id="Data_credits_and_licenses">Data credits and licenses</h4>' + creditStr;
    }
    let offlineDataStr = "";
    if (v.site.id === "mi" || v.site.id === "li" || v.site.id === "si" || v.site.id === "jo" || v.site.id === "pa" || v.site.id === "ki" || v.site.id === "vi" || v.site.id === "ja" || v.site.id === "mu" || v.site.id === "ru" || v.site.id === "ml" || v.site.id === "ai" || v.site.id === "mä" || v.site.id === "mo" || v.site.id === "ko" || v.site.id === "ky" || v.site.id === "se" || v.site.id === "ni" || v.site.id === "at" || v.site.id === "jn" || v.site.id === "me" || v.site.id === "pu" || v.site.id === "ka" || v.site.id === "kp" || v.site.id === "la" || v.site.id === "ke") {
        offlineDataStr += '<p class="h4p">Tuomas Mattila. (2020). Carbon action MULTA Finnish carbon sequestration experimental field dataset 2019 [Data set]. Zenodo. <a href="https://doi.org/10.5281/zenodo.3670653" target="_blank">http://doi.org/10.5281/zenodo.3670653</a></p>';
    }
    if (v.site.id === "ae" || v.site.id === "ai" || v.site.id === "ik" || v.site.id === "ja" || v.site.id === "jn" || v.site.id === "ki" || v.site.id === "ko" || v.site.id === "kp" || v.site.id === "la" || v.site.id === "li" || v.site.id === "mi" || v.site.id === "mo" || v.site.id === "mu" || v.site.id === "na" || v.site.id === "ne" || v.site.id === "ni" || v.site.id === "pa" || v.site.id === "pi" || v.site.id === "pu" || v.site.id === "si") {
        offlineDataStr += '<p class="h4p">Mattila, Tuomas, & Heinonen, Reija. (2021). Carbon action MULTA Finnish carbon sequestration experimental field dataset 2020 [Data set]. Zenodo. <a href="http://doi.org/10.5281/zenodo.4068271" target="_blank">http://doi.org/10.5281/zenodo.4068271</a></p>';
    }
    if (v.site.id === "la" || v.site.id === "pi" || v.site.id === "ni" || v.site.id === "ae" || v.site.id === "ki" || v.site.id === "mu" || v.site.id === "pa" || v.site.id === "jn" || v.site.id === "mi" || v.site.id === "ik" || v.site.id === "mo" || v.site.id === "ai" || v.site.id === "ja" || v.site.id === "ne" || v.site.id === "na" || v.site.id === "pu" || v.site.id === "si" || v.site.id === "li" || v.site.id === "ko" || v.site.id === "kp") {
        offlineDataStr += '<p class="h4p">Mattila Tuomas, & Girz Andrei. (2021). Carbon action MULTA Finnish carbon sequestration experimental field dataset 2021 [Data set]. Zenodo. <a href="https://doi.org/10.5281/zenodo.5575531" target="_blank">https://doi.org/10.5281/zenodo.5575531</a></p>';
    }
    if (offlineDataStr !== "") {
        creditStr += '<h4 id="Offline_data">Offline data</h4>';
        creditStr += offlineDataStr;
    }
    if (foConfig.manageSiteLinkEnabled) {
        creditStr += `<h4 id="Edit_data">Manage site</h4><p class="h4p"><a href="${foConfig.language === "fi"? "https://peltoobservatorio.fi/peltoapp": "https://fieldobservatory.org/fieldapp"}">Enter field management activity data</a> (login required)</p>`;
    }
    if (creditStr !== "") {
        let dataCreditsElement = document.getElementById("dataCredits");
        if (dataCreditsElement) {
            dataCreditsElement.innerHTML = creditStr;
        }
    }

    // console.log("v =");
    // console.log(v);

    function onRefreshChartsMessage(e) {
        //console.log(`Received refreshCharts, refreshIndex = ${e.data.refreshIndex}`);
        let rerequestWorkerRefreshChartIds = [];
        e.data.charts.forEach(function (chart) {
            if (v.charts[chart.id].refreshIndex === undefined || e.data.refreshIndex > v.charts[chart.id].refreshIndex) {
                // Replace chart drawings with newer drawings from worker
                 refreshChart(chart.id, e.data.refreshIndex, e.data.xAxisHtml, chart.drawingHtmls);
            }
            if (v.charts[chart.id].rerequestWorkerRefresh) {
                // There is a queued request for a new drawing. Make that request now.
                rerequestWorkerRefreshChartIds.push(chart.id);
                v.charts[chart.id].rerequestWorkerRefresh = false;
            }
            v.charts[chart.id].awaitingWorkerRefresh = false;
        });
        if (rerequestWorkerRefreshChartIds.length > 0) {
            chartRefreshIndex++;
            //console.log(`Rerequesting refresh for charts ${rerequestWorkerRefreshChartIds}`);
            requestWorkerRefreshCharts(rerequestWorkerRefreshChartIds, chartRefreshIndex);
        }
    }

    function onCSVSourceUpdateMessage(e) {
        //console.log(`Received csvSourceUpdate`);
        let mustRefreshChartIds = {};
        e.data.updates.forEach(function (update) {
            let source = v.sources[update.sourceId];
            source.csvList[update.csvListIndex] = { ...source.csvList[update.csvListIndex], ...update.update };
            for (let chartId in source.charts) {
                let chart = v.charts[chartId];
                if (!chart.hidden) {
                    mustRefreshChartIds[chartId] = true;
                }
            }
        });
        chartRefreshIndex++;
        requestWorkerRefreshCharts(Object.keys(mustRefreshChartIds), chartRefreshIndex);
    }

    function onJsonSourceUpdateMessage(e) {
        //console.log(`Received csvSourceUpdate`);
        let mustRefreshChartIds = {};
        e.data.updates.forEach(function (update) {
            let source = v.sources[update.sourceId];
            source.jsonList[update.jsonListIndex] = { ...source.jsonList[update.jsonListIndex], ...update.update };
            for (let [chartId, chart] of Object.entries(v.charts)) { // Update everything because the data is events that will be plotted in all charts
                if (!chart.hidden) {
                    mustRefreshChartIds[chartId] = true;
                }
            }
        });
        chartRefreshIndex++;
        requestWorkerRefreshCharts(Object.keys(mustRefreshChartIds), chartRefreshIndex);
    }
    
    function onGeoTiffSourceUpdateMessage(e) {
        let mustRefreshChartIds = {};
        e.data.updates.forEach(async function (update) {
            let source = v.sources[update.sourceId];
            let geoTiff = source.geoTiffList[update.geoTiffListIndex] = { ...source.geoTiffList[update.geoTiffListIndex], ...update.update };
            for (let chartId in source.charts) {
                let chart = v.charts[chartId];
                if (!chart.hidden) {
                    mustRefreshChartIds[chartId] = true;
                }
            }
            //viewSatelliteImage();
            if (geoTiff.arrayBuffer !== undefined) {
                whenMapLoadedDo(async function () {
                    let image = await(await GeoTIFF.fromArrayBuffer(geoTiff.arrayBuffer)).getImage();
                    if (!image.pixelIsArea()) {
                        console.log("Unsupported GeoTIFF with pixelIsArea = False");
                    } else {
                        const data = await image.readRasters();
                        const width = image.getWidth();
                        const height = image.getHeight();
                        const fileDirectory = image.getFileDirectory();
                        const geoKeys = image.getGeoKeys();
                        const modelTiePoint = fileDirectory.ModelTiepoint;
                        const modelPixelScale = fileDirectory.ModelPixelScale;
                        const modelTransformation = fileDirectory.ModelTransformation;
                        const transform = proj4(`EPSG:${geoKeys.ProjectedCSTypeGeoKey}`, 'EPSG:4326');
                        let mapSourceId = `satelliteImage_${source.id}_${geoTiff.index}`;
                        let geoJson = {
                            'type': 'FeatureCollection',
                            'features': []
                        };
                        let iter = data[0].values();
                        // Precalculate coordinates of pixel corners
                        let coords = []
                        for (let y = 0; y <= height; y++) {
                            let row = [];
                            for (let x = 0; x <= width; x++) {
                                if (modelTransformation !== undefined) {
                                    row.push(transform.forward([modelTransformation[3] + x*modelTransformation[0] + y*modelTransformation[1], modelTransformation[7] + x*modelTransformation[4] + y*modelTransformation[5]]));
                                } else {
                                    // y seems to work here...
                                    row.push(transform.forward([modelTiePoint[3] + (x - modelTiePoint[0]) * modelPixelScale[0], modelTiePoint[4] - (y - modelTiePoint[1]) * modelPixelScale[1]]));
                                }
                            }
                            coords.push(row);
                        }
                        // Add pixels to a GeoJson
                        for (let y = 0; y < height; y++) {
                            for (let x = 0; x < width; x++) {
                                let val = iter.next().value;
                                if (!isNaN(val)) {
                                    geoJson.features.push({
                                        'type': 'Feature',
                                        'properties': {
                                            "vegetationIndex": t.vegetationIndex[source.sourceType],
                                            "val": val
                                        },
                                        'geometry': {
                                            'type': 'Polygon',
                                            'coordinates': [[
                                                coords[y][x],
                                                coords[y + 1][x],
                                                coords[y + 1][x + 1],
                                                coords[y][x + 1],
                                                coords[y][x]
                                            ]]
                                        }
                                    });
                                }
                            }
                        };
                        map.addSource(mapSourceId, {
                            'type': 'geojson',
                            'data': geoJson
                        });
                        if (v.satelliteImageSourceToGeoTiff === undefined) {
                            v.satelliteImageSourceToGeoTiff = {};
                        }
                        v.satelliteImageSourceToGeoTiff[mapSourceId] = geoTiff;
                        if (geoTiff.source.sourceCategoryId === v.satelliteImageLegendId && new Date(geoTiff.time).valueOf() == v.satelliteImageDate) {
                            addSatelliteImageLayer(mapSourceId, cmap[geoTiff.source.sourceType]);
                        }
                    }
                });
            }
            /*if (geoTiff.mapboxSource !== undefined) {
                whenMapLoadedDo(function () {
                    let mapSourceId = `satelliteImage_${source.id}_${geoTiff.index}`;
                    map.addSource(mapSourceId, geoTiff.mapboxSource.source);
                    if (v.satelliteImageSourceToGeoTiff === undefined) {
                        v.satelliteImageSourceToGeoTiff = {};
                    }
                    v.satelliteImageSourceToGeoTiff[mapSourceId] = geoTiff;
                    if (geoTiff.source.sourceCategoryId === v.satelliteImageLegendId && new Date(geoTiff.time).valueOf() == v.satelliteImageDate) {
                        map.addLayer({
                            'id': mapSourceId,
                            'source': mapSourceId,
                            'type': 'raster',
                            'paint': {
                                'raster-opacity': 1.0,
                                'raster-resampling': 'nearest',
                                'raster-fade-duration': 0
                            }
                        }, 'satelliteZ');
                    }
                });
            };*/
        });
        chartRefreshIndex++;
        requestWorkerRefreshCharts(Object.keys(mustRefreshChartIds), chartRefreshIndex);
    }

    worker.onmessage = function (e) {
        switch (e.data.command) {
            case "refreshCharts":
                onRefreshChartsMessage(e)
                break;
            case "csvSourceUpdate":
                onCSVSourceUpdateMessage(e)
                break;
            case "jsonSourceUpdate":
                onJsonSourceUpdateMessage(e)
                break;
            case "geoTiffSourceUpdate":
                onGeoTiffSourceUpdateMessage(e)
                break;
        }
    }

    worker.postMessage({
        command: "vInit",
        foConfig: foConfig,
        v: v
    });

    prepXGrid(v);
    refreshAllCharts();

    // Add pointer event listeners to drawings
    //addPermanentDrawingListeners();

    requestWorkerLoadData();
};

function unviewSiteAndViewSiteSelector() {    
    //document.getElementById("liMapView").onclick = null;
    handleEsc = undefined;
    window.onpopstate = defaultPopstateHandler;
    worker.terminate();
    map.removeLayer("blocks");
    map.removeLayer("blockLines");
    map.removeLayer("blockNames");
    map.removeSource("blocks");
    removeSatelliteImageLayers();
    removeSatelliteImageSources();
    siteJson = undefined;
    v.chartIds.forEach(function (chartId) {
        let chart = v.charts[chartId];
        if (!chart.hidden) {
            document.getElementById(`chart_div_${chartId}`).remove(); // Remove charts if any
        }
    });
    document.getElementById("dataCredits").remove();
    updateState({ site: undefined });
    document.body.classList.remove('Site');
    document.body.classList.remove('Obfuscated');
    document.getElementById("mapMainHeaderDiv").after(document.getElementById("map"));
    // ***
    if (mapbackgrounds.length > 0) {
        for (let layer of map.getStyle().layers) {
            if (layer.id === "satelliteZ") {
                break;
            }
            if (layer.id !== "landcover-outdoors") {
                if (layerVisibilityBackup[layer.id] === 'visible') {
                    map.setLayoutProperty(layer.id, 'visibility', 'visible');
                }
            }
        };
        mapbackgrounds.forEach(function (feature, index) {
            map.removeLayer(`${v.site.id}_mapbackground_${index}`);
            map.removeSource(`${v.site.id}_mapbackground_${index}`);
        });        
    }
    popup.remove();
    viewSiteSelector()
}

function setSatelliteImageDate(date, event = null, refreshRelatedChart = true) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    if (v.satelliteImageDate != date) {
        v.satelliteImageDate = date;
    } else {
        v.satelliteImageDate = 0;
    }
    // Send update to worker
    worker.postMessage({
        command: "vUpdate",
        vUpdate: {
            satelliteImageDate: v.satelliteImageDate
        }
    });
    // Move cursor in related chart
    let mustRefreshChartIdList = [];
    let relatedChart = v.charts["satelliteImages"].sourceCategories[v.satelliteImageLegendId].relatedChart;
    if (relatedChart !== undefined) {
        mustRefreshChartIdList = [relatedChart];
    }
    // Remove old satellite image layers and add those layers for which there are sources
    whenMapLoadedDo(removeSatelliteImageLayers);
    whenMapLoadedDo(addSatelliteImageLayersFromAvailableSources);
    // Load more data
    requestWorkerLoadData();
    // Refresh chart
    chartRefreshIndex++;
    refreshChart("satelliteImages", chartRefreshIndex);
    if (refreshRelatedChart) {
        requestWorkerRefreshCharts(mustRefreshChartIdList, chartRefreshIndex);
    }
}

function setEventDate(date, sourceIndex, eventIndex, chartId, event = null, refreshRelatedChart = true) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    if (v.eventDate == date && v.eventSourceIndex == sourceIndex && v.eventIndex == eventIndex && v.eventChartId !== chartId) {
        // Click on the same event in different chart, simply change the chart
        v.eventChartId = chartId;
    } else {
        // Click on an event. Either a) show it or b) if it is already shown then hide it
        if (v.eventDate == date && v.eventSourceIndex == sourceIndex && v.eventIndex == eventIndex && v.eventChartId == chartId) {
            v.eventChartId = undefined;
            v.eventDate = undefined;
        } else {
            v.eventChartId = chartId;
            v.eventDate = date;
            v.eventSourceIndex = sourceIndex;
            v.eventIndex = eventIndex;
        }
    }
    // Send update to worker
    worker.postMessage({
        command: "vUpdate",
        vUpdate: {
            eventDate: v.eventDate,
            eventSourceIndex: v.eventSourceIndex,
            eventIndex: v.eventIndex,
            eventChartId: v.eventChartId
        }
    });
    // Refresh charts
    chartRefreshIndex++;
    refreshChart(chartId, chartRefreshIndex);
    requestWorkerRefreshCharts(v.chartIds.filter(testChartId => testChartId !== chartId && !v.charts[testChartId].hidden), chartRefreshIndex);
}

function toggleLegendItemVisibility(chartId, legendId, event = null) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    let chart = v.charts[chartId];
    let mustRefreshChartIds = {};
    if (chartId === "satelliteImages") {
        if (!chart.visible[legendId]) {
            for (otherLegendId in chart.sourceCategories) {
                if (chart.visible[otherLegendId]) {
                    // Hide others
                    document.getElementById(`chart_${chartId}_visible_${otherLegendId}_hidden`).style = "visibility: visible";
                    document.getElementById(`chart_${chartId}_visible_${otherLegendId}_visible`).style = "visibility: hidden";
                    chart.visible[otherLegendId] = false;
                    // Remove cursor from related chart
                    let relatedChart = chart.sourceCategories[otherLegendId].relatedChart;
                    if (relatedChart !== undefined && !v.charts[relatedChart].hidden) {
                        mustRefreshChartIds[chart.sourceCategories[otherLegendId].relatedChart] = true;
                    }
                }
            }
            // Make visible
            document.getElementById(`chart_${chartId}_visible_${legendId}_hidden`).style = "visibility: hidden";
            document.getElementById(`chart_${chartId}_visible_${legendId}_visible`).style = "visibility: visible";
            chart.visible[legendId] = true;            
            worker.postMessage({
                command: "chartUpdate",
                chartId: chartId,
                chartUpdate: {
                    visible: chart.visible
                }
            });
            v.satelliteImageLegendId = legendId;
            updateColorbar();
            // Add cursor to related chart
            let relatedChart = chart.sourceCategories[legendId].relatedChart;
            if (relatedChart !== undefined && !v.charts[relatedChart].hidden) {
                mustRefreshChartIds[relatedChart] = true;
            }
            // Send update to worker
            worker.postMessage({
                command: "vUpdate",
                vUpdate: {
                    satelliteImageLegendId: v.satelliteImageLegendId
                }
            });
            // Load more data
            requestWorkerLoadData();
            // Remove old satellite image layers and add those layers for which there are sources
            whenMapLoadedDo(removeSatelliteImageLayers);
            whenMapLoadedDo(addSatelliteImageLayersFromAvailableSources);
        }
    } else {
        if (chart.visible[legendId]) {
            // Hide
            document.getElementById(`chart_${chartId}_visible_${legendId}_hidden`).style = "visibility: visible";
            document.getElementById(`chart_${chartId}_visible_${legendId}_visible`).style = "visibility: hidden";
            chart.visible[legendId] = false;
        } else {
            // Make visible
            document.getElementById(`chart_${chartId}_visible_${legendId}_hidden`).style = "visibility: hidden";
            document.getElementById(`chart_${chartId}_visible_${legendId}_visible`).style = "visibility: visible";
            chart.visible[legendId] = true;
        }
        worker.postMessage({
            command: "chartUpdate",
            chartId: chartId,
            chartUpdate: {
                visible: chart.visible
            }
        });
    }
    chartRefreshIndex++;
    refreshChart(chartId, chartRefreshIndex);
    requestWorkerRefreshCharts(Object.keys(mustRefreshChartIds), chartRefreshIndex);
}

function removeSatelliteImageLayers() {
    map.getStyle().layers.forEach(function (layer) {
        if (layer.id.startsWith("satelliteImage_")) {
            map.removeLayer(layer.id);
        }
    });
}

function removeSatelliteImageSources() {
    for (let mapSourceId in map.getStyle().sources) {
        if (mapSourceId.startsWith("satelliteImage_")) {
            map.removeSource(mapSourceId);
        }
    }
}

function addVegetationIndexPopup(mapSourceId, e) {
    popup.setLngLat(e.lngLat)
        .setOffset([0, 0])
        .setHTML(`<p>${e.features[0].properties.vegetationIndex}: ${e.features[0].properties.val.toFixed(3)}</p>`)
        .addTo(map);
}

function satelliteImageLayerMouseMove(e) {
    map.getCanvas().style.cursor = 'pointer';
    let mapSourceId = e.features[0].layer.id;
    if (v.showVegetationIndexPopup) {
        addVegetationIndexPopup(mapSourceId, e);
    }
}
function satelliteImageLayerMouseEnter(e) {
    map.getCanvas().style.cursor = 'pointer';
}
function satelliteImageLayerMouseLeave(e) {
    map.getCanvas().style.cursor = '';
    if (v.showVegetationIndexPopup) {
        popup.remove();
    }
}

function satelliteImageLayerClick(e) {
    let mapSourceId = e.features[0].layer.id;
    if (v.showVegetationIndexPopup) {
        v.showVegetationIndexPopup = false;
        popup.remove();
    } else {
        v.showVegetationIndexPopup = true;
        addVegetationIndexPopup(mapSourceId, e);
    }
}

function addSatelliteImageLayer(mapSourceId, colorMap) {
    map.addLayer({
        'id': mapSourceId,
        'source': mapSourceId,
        'type': 'fill',
        'paint': {
            'fill-color': {
                "property": 'val',
                "stops": colorMap
            },
        }
    }, 'satelliteZ');

    map.off('mouseenter', mapSourceId, satelliteImageLayerMouseEnter);
    map.on('mouseenter', mapSourceId, satelliteImageLayerMouseEnter);
    map.off('mouseleave', mapSourceId, satelliteImageLayerMouseLeave);
    map.on('mouseleave', mapSourceId, satelliteImageLayerMouseLeave);
    map.off('mousemove', mapSourceId, satelliteImageLayerMouseMove);
    map.on('mousemove', mapSourceId, satelliteImageLayerMouseMove);
    map.off('click', mapSourceId, satelliteImageLayerClick);
    map.on('click', mapSourceId, satelliteImageLayerClick);
}

function addSatelliteImageLayersFromAvailableSources() {    
    for (let mapSourceId in map.getStyle().sources) {
        if (v.satelliteImageSourceToGeoTiff !== undefined && v.satelliteImageSourceToGeoTiff[mapSourceId] !== undefined) {
            let geoTiff = v.satelliteImageSourceToGeoTiff[mapSourceId];            
            if (geoTiff.source.sourceCategoryId === v.satelliteImageLegendId && new Date(geoTiff.time).valueOf() == v.satelliteImageDate) {
                addSatelliteImageLayer(mapSourceId, cmap[geoTiff.source.sourceType]);
            }
        }
    }
}

function selectNearestSatelliteImage(legendId, date, event = null) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }    
    let bestDistance = Infinity;
    let bestDate = v.satelliteImageDate;
    if (v.charts["satelliteImages"].sourceCategories[legendId] !== undefined) {
        v.charts["satelliteImages"].sourceCategories[legendId].geoTiffDates.forEach(function (geoTiffDate) {
            let distance = Math.abs(geoTiffDate - date);
            if (distance < bestDistance) {
                bestDate = geoTiffDate;
                bestDistance = distance;
            }
        });
        if (v.satelliteImageLegendId !== legendId) {
            setSatelliteImageDate(bestDate, null, false);
            toggleLegendItemVisibility("satelliteImages", legendId);
        } else {
            setSatelliteImageDate(bestDate);
        }
    }
}

function preventDefault(event) {
    event.preventDefault();
}

function toggleAutoZoom(chartId, event = null) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    let chart = v.charts[chartId];
    if (!chart.autoZoom) {
        chart.autoZoom = true;
        document.getElementById(`chart_${chartId}_auto_zoom_enabled`).style = "visibility: visible";
        document.getElementById(`chart_${chartId}_auto_zoom_disabled`).style = "visibility: hidden";
    } else {
        chart.autoZoom = false;
        document.getElementById(`chart_${chartId}_auto_zoom_enabled`).style = "visibility: hidden";
        document.getElementById(`chart_${chartId}_auto_zoom_disabled`).style = "visibility: visible";
    }
    worker.postMessage({
        command: "chartUpdate",
        chartId: chartId,
        chartUpdate: {
            autoZoom: chart.autoZoom
        }
    });
    chartRefreshIndex++;
    refreshChart(chartId, chartRefreshIndex);
}

function cycleTimeAggregation(chartId, event = null) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    let chart = v.charts[chartId];
    document.getElementById(`chart_${chartId}_time_aggregation_setting_${chart.timeAggregationSettingIndex}`).style = "visibility: hidden";
    chart.timeAggregationSettingIndex = (chart.timeAggregationSettingIndex + 1) % chart.timeAggregationSettings.length;
    document.getElementById(`chart_${chartId}_time_aggregation_setting_${chart.timeAggregationSettingIndex}`).style = "visibility: visible";    
    if (chart.timeAggregationSettings[chart.timeAggregationSettingIndex].enabled) {
        document.getElementById(`chart_${chartId}_time_aggregation_enabled`).style = "visibility: visible";
        document.getElementById(`chart_${chartId}_time_aggregation_disabled`).style = "visibility: hidden";
    } else {
        document.getElementById(`chart_${chartId}_time_aggregation_enabled`).style = "visibility: hidden";
        document.getElementById(`chart_${chartId}_time_aggregation_disabled`).style = "visibility: visible";
    }
    worker.postMessage({
        command: "chartUpdate",
        chartId: chartId,
        chartUpdate: {
            timeAggregationSettingIndex: chart.timeAggregationSettingIndex
        }
    });
    chartRefreshIndex++;
    refreshChart(chartId, chartRefreshIndex);
}

function getTranslationTable() { // Can be called from the browser's debug console
    let data = "";
    chartsJson.charts.forEach(function (chart) {
        data += `chart\t${chart.id}\t\t\ttitle\t${chart.title}\n`;
        data += `chart\t${chart.id}\t\t\ttitle_fi\t${chart.title_fi}\n`;
        data += `chart\t${chart.id}\t\t\ttitle_sv\t${chart.title_sv}\n`;
        if (chart.description !== undefined) {
            data += `chart\t${chart.id}\t\t\tdescription\t${chart.description}\n`;
            data += `chart\t${chart.id}\t\t\tdescription_fi\t${chart.description_fi}\n`;
            data += `chart\t${chart.id}\t\t\tdescription_sv\t${chart.description_sv}\n`;
        }
        if (chart.yLabel !== undefined) {
            data += `chart\t${chart.id}\t\t\tyLabel\t${chart.yLabel}\n`;
            data += `chart\t${chart.id}\t\t\tyLabel_fi\t${chart.yLabel_fi}\n`;
            data += `chart\t${chart.id}\t\t\tyLabel_sv\t${chart.yLabel_sv}\n`;
        }
        if (chart.sourceCategoryList !== undefined) {
            chart.sourceCategoryList.forEach(function (sourceCategory) {
                data += `chart\t${chart.id}\tsourceCategory\t${sourceCategory.id}\ttitle\t${sourceCategory.title}\n`;
                data += `chart\t${chart.id}\tsourceCategory\t${sourceCategory.id}\ttitle_fi\t${sourceCategory.title_fi}\n`;
                data += `chart\t${chart.id}\tsourceCategory\t${sourceCategory.id}\ttitle_sv\t${sourceCategory.title_sv}\n`;
            });
        }
        data += "\n";
    });
    let blob = new Blob([data], { type: "text/csv;charset=utf-8" });
    let url = URL.createObjectURL(blob);
    let downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `charts_translations.tsv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

initPage();

async function initPage() {
    if (getSiteId() !== undefined) {
        viewSiteBeforeLoadEssentials(); // Site view initialization before loading jsons and map
    } else {
        viewSiteSelectorBeforeLoadEssentials(); // Site selector initialization before loading jsons and map
    }

    await loadEssentials(); // Load sitesGeoJson, blocksGeoJson and chartsJson, and mappy things
    console.log("map:");
    console.log(map);
    /*sitesGeoJson.features = sitesGeoJson.features
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)*/

    console.log("sitesGeoJson =");
    console.log(JSON.parse(JSON.stringify(sitesGeoJson))); // Create deep copies so that console.log statements show what was loaded rather than later modified variables
    console.log("blocksGeoJson =");
    console.log(JSON.parse(JSON.stringify(blocksGeoJson)));
    console.log("chartsJson =");
    console.log(JSON.parse(JSON.stringify(chartsJson)));

    // Add essential sources and layers

    if (foConfig.mapEnabled) {
        whenMapLoadedDo(function () {
            map.addSource('empty', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
            map.addSource("fieldLocations", {
                type: "geojson",
                data: sitesGeoJson
            });
            map.addLayer({
                id: 'satelliteZ',
                type: 'symbol',
                source: 'empty'
            });
            map.addLayer({
                id: 'blockZ',
                type: 'symbol',
                source: 'empty'
            });
            map.addLayer({
                "id": 'fieldLocationsLayerFarExt',
                "type": 'circle',
                "source": 'fieldLocations',
                "filter": ['!has', 'point_count'],
                "paint": {
                    "circle-radius": 20,
                    "circle-stroke-width": 0,
                    "circle-opacity": 0,
                }
            });
            map.addLayer({
                "id": 'fieldLocationsLayerFar',
                "type": 'circle',
                "source": 'fieldLocations',
                //"maxzoom": 5.5,
                "filter": ['!has', 'point_count'],
                "paint": {
                    "circle-radius": 6,
                    "circle-stroke-color": {
                        property: 'site_type',
                        type: 'categorical',
                        stops: Object.entries(siteTypeColors)
                    },
                    "circle-color": {
                        property: 'site_type',
                        type: 'categorical',
                        stops: Object.entries(siteTypeColors)
                    },
                    "circle-stroke-width": 3,
                    "circle-opacity": 0.6,
                    "circle-stroke-opacity": 1
                }
            });
            // Generate icon
            const width = 41;
            const height = 49;
            const bigCenterX = 19.5;
            const bigCenterY = 19.5;
            const bigOuterRadius = 14*Math.sqrt(2);
            const bigInnerRadius = 15;
            const centerDotData = new Float32Array(width * height);
            const coloredAreaData = new Float32Array(width * height);
            let offset = 0;
            for (let pixelCenterRelY = - 0.5 - bigCenterY; pixelCenterRelY < height - bigCenterY - 1; pixelCenterRelY++) {
                let absPixelCenterRelY = Math.abs(pixelCenterRelY);
                for (let pixelCenterRelX = - 0.5 - bigCenterX; pixelCenterRelX < width - bigCenterX - 1; pixelCenterRelX++) {
                    let absPixelCenterRelX = Math.abs(pixelCenterRelX);
                    let rotatedX = Math.sqrt(2)*0.5 * (pixelCenterRelX + pixelCenterRelY);
                    let rotatedY = Math.sqrt(2)*0.5 * (pixelCenterRelY - pixelCenterRelX);
                    if (rotatedX >= 0 && rotatedY >= 0) {
                        // Colored tip using rotated coordinates
                        if (rotatedX <= bigOuterRadius + 0.25 && rotatedY <= bigOuterRadius + 0.25) {
                            if (rotatedX > bigOuterRadius - 0.25 || rotatedY > bigOuterRadius - 0.25) {
                                // Antialiasing
                                if (rotatedX > bigOuterRadius - 0.25 && rotatedY > bigOuterRadius - 0.25) {
                                    coloredAreaData[offset] = 0.25; 
                                } else {
                                    coloredAreaData[offset] = 0.5;
                                }
                            } else {
                                coloredAreaData[offset] = 1;
                            }
                        }
                    } else {
                        // Round colored area
                        if ((absPixelCenterRelX - Math.sqrt(2)*0.25)*(absPixelCenterRelX - Math.sqrt(2)*0.25) + (absPixelCenterRelY - Math.sqrt(2))*(absPixelCenterRelY - Math.sqrt(2)*0.25) < bigOuterRadius*bigOuterRadius) {
                            if ((absPixelCenterRelX + Math.sqrt(2)*0.25)*(absPixelCenterRelX + Math.sqrt(2)*0.25) + (absPixelCenterRelY + Math.sqrt(2)*0.25)*(absPixelCenterRelY + Math.sqrt(2)*0.25) > bigOuterRadius*bigOuterRadius) {
                                // Antialising of the edge
                                let overSample = 16;
                                for (let y = absPixelCenterRelY - 0.5 + 0.5/overSample; y < absPixelCenterRelY + 0.5; y += 1/overSample) {
                                    for (let x = absPixelCenterRelX - 0.5 + 0.5/overSample; x < absPixelCenterRelX + 0.5; x += 1/overSample) {
                                        if (x*x + y*y < bigOuterRadius*bigOuterRadius) {
                                            coloredAreaData[offset] += 1/(overSample*overSample);
                                        }
                                    }
                                }
                            } else {
                                coloredAreaData[offset] = 1;
                            }
                        }
                    }
                    // Center dot
                    if (coloredAreaData[offset] > 0) {
                        if ((absPixelCenterRelX - Math.sqrt(2)*0.25)*(absPixelCenterRelX - Math.sqrt(2)*0.25) + (absPixelCenterRelY - Math.sqrt(2)*0.25)*(absPixelCenterRelY - Math.sqrt(2)*0.25) < bigInnerRadius*bigInnerRadius) {
                            if ((absPixelCenterRelX + Math.sqrt(2)*0.25)*(absPixelCenterRelX + Math.sqrt(2)*0.25) + (absPixelCenterRelY + Math.sqrt(2)*0.25)*(absPixelCenterRelY + Math.sqrt(2)*0.25) > bigInnerRadius*bigInnerRadius) {
                                // Antialising of the edge
                                let overSample = 16;
                                for (let y = absPixelCenterRelY - 0.5 + 0.5/overSample; y < absPixelCenterRelY + 0.5; y += 1/overSample) {
                                    for (let x = absPixelCenterRelX - 0.5 + 0.5/overSample; x < absPixelCenterRelX + 0.5; x += 1/overSample) {
                                        if (x*x + y*y < bigInnerRadius*bigInnerRadius) {
                                            centerDotData[offset] += 1/(overSample*overSample);
                                        }
                                    }
                                }
                            } else {
                                centerDotData[offset] = 1;
                            }
                        }
                    }
                    offset++;
                }
            }
            let iconImages = {};
            for (const [siteType, color] of Object.entries(siteTypeColors)) {
                let rgb = [];
                for (let c = 0; c < 3; c++) {
                    rgb.push(parseInt(color.substring(1 + c*2, 1 + c*2 + 2), 16));
                }
                const imageData = new Uint8Array(width * height * 4);
                let offset = 0;
                for (let y = 0; y < height; y++) {                    
                    for (let x = 0; x < width; x++) {
                        imageData[offset*4] = Math.round(255*centerDotData[offset] + rgb[0]*(1 - centerDotData[offset]));
                        imageData[offset*4 + 1] = Math.round(255*centerDotData[offset] + rgb[1]*(1 - centerDotData[offset]));
                        imageData[offset*4 + 2] = Math.round(255*centerDotData[offset] + rgb[2]*(1 - centerDotData[offset]));
                        imageData[offset*4 + 3] = Math.round(coloredAreaData[offset]*255);
                        offset++;
                    }
                }
                map.addImage(`icon_image_${siteType}`, { width: width, height: height, data: imageData });
                iconImages[siteType] = `icon_image_${siteType}`;
            }
            map.addLayer({
                "id": 'fieldLocationsLayerNear',
                "type": 'symbol',
                "source": 'fieldLocations',
                "minzoom": 5.5,
                "filter": ['!has', 'point_count'],
                'layout': {
                    'icon-size': 1.0,
                    'icon-allow-overlap': true,
                    'symbol-sort-key': ['-', 90, ['get', "lat"]],
                    'symbol-z-order': "source",
                    'text-ignore-placement': true,
                    'text-optional': true,
                    'text-padding': 0,
                    //'text-variable-anchor': ["center", "left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"],
                    'text-allow-overlap': true,
                    "text-field": ["coalesce", ['get', `Name_${foConfig.language}`], ['get', 'Name']],
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                    'text-offset': [0, -2.3],
                    'icon-offset': [0, 1-height/2],
                    'icon-image': {
                        property: 'site_type',
                        type: 'categorical',
                        stops: Object.entries(iconImages),
                        default: iconImages["default"]
                    }
                },
                "paint": {
                    "text-halo-width": 2,
                    "text-halo-blur": 1,
                    "text-halo-color": "#ffffff"
                }
            });
            // Custom zoom-dependent layer visibility. Keeps the disappearing layer visible all the way through zooming
            map.on('moveend', function () {
                //console.log(map.getZoom());
                if (getSiteId() === undefined) {
                    if (map.getZoom() < 5.5) {
                        map.setLayoutProperty("fieldLocationsLayerFarExt", 'visibility', "visible");
                        map.setLayoutProperty("fieldLocationsLayerFar", 'visibility', "visible");
                        map.setLayoutProperty("fieldLocationsLayerNear", 'visibility', "none");
                    } else {
                        map.setLayoutProperty("fieldLocationsLayerFarExt", 'visibility', "none");
                        map.setLayoutProperty("fieldLocationsLayerFar", 'visibility', "none");
                        map.setLayoutProperty("fieldLocationsLayerNear", 'visibility', "visible");
                        map.setLayerZoomRange("fieldLocationsLayerNear", 0, 24);
                    }
                }
            });
        });
    }
    if (getSiteId() !== undefined) {
        if (foConfig.mapEnabled) {
            whenMapLoadedDo(function () { setSiteSelectorMapLayerVisibility("none") });
        }
        await viewSiteAfterLoadingEssentials(0); // Site view initialization after loading jsons and map
    } else {
        viewSiteSelectorAfterLoadingEssentials(); // Site selector view initialization after loading jsons and map
    }

    document.addEventListener("keydown", function (event) {
        if ((event.key === "Esc" || event.key === "Escape") && handleEsc !== undefined) {
            handleEsc();
        }
    });
}

window.onpopstate = defaultPopstateHandler;

function defaultPopstateHandler() {
    location.reload();
}

// A $( document ).ready() block.
window.onload = function () {
};
