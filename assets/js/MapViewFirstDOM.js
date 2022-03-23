window.onresize = onWindowResize;

if (!fieldobservatoryIsWordpress) {
    // Changes to _Layout.cshtml
    document.querySelector('#liHome').className = 'homeBtn';
    document.querySelector('#liMapView').className = 'active';
}

// Prepare map
initStateFromLocationUrl(); // Parse browser URL parameters

var handleEsc = undefined;

var allSitesMapView = {
    fitBoundsOptions: {
        padding: 40,
    },
    minZoom: 4,
    maxZoom: 10
};

var siteMapView = {
    fitBoundsOptions: {
        padding: 40,
    },
    minZoom: 10,
    maxZoom: 17
};

var map;
var mapLoaded; // Did the map already load?
var othersThanMapLoaded; // Did other things already load?
var popup;
var siteTypes = {}; // All encountered site types
var siteTypeList = []; // All encountered site types

// Json data needed for ALL SITES view
var sitesGeoJson;
var blocksGeoJson;
var mapbackgroundsJson;
var demoSitesGeoJson;
var demoBlocksGeoJson;
var demoMapbackgroundsJson;
// Json data needed for SITE view
var siteJson;

var geolocateControl;

async function loadEssentials() {
    async function getJson(response) {
        if (!response.ok) {
            throw new Error(`Failed to fetch ${response.url}: ${response.status}`);
        }
        return response.json();
    }

    let now = new Date(Date.now());
    let allSitesViewPromises = [
        fetch(`${storageUrl2}/fieldobs_sites_translated.geojson?date=${getCacheRefreshDate(now)}`).then(getJson).then(async (json) => { sitesGeoJson = json; })
    ];
    let siteViewPromises = [
        fetch(`${storageUrl2}/fieldobs_blocks_translated.geojson?date=${getCacheRefreshDate(now)}`).then(getJson).then(async (json) => { blocksGeoJson = json; }),
        fetch(`${storageUrl2}/fieldobs_sites_mapbackgrounds.geojson`).then(getJson).then(json => { mapbackgroundsJson = json; })
    ];
    if (history.state.demo !== undefined) {
        allSitesViewPromises.push(fetch(`${demoStorageUrl}/${history.state.demo}_sites_translated.geojson?date=${getCacheRefreshDate(now)}`).then(getJson).then(async (json) => { demoSitesGeoJson = json; demoSitesGeoJson.features.forEach(feature => feature.properties.demo = true); }));
        siteViewPromises.push(fetch(`${demoStorageUrl}/${history.state.demo}_blocks_translated.geojson?date=${getCacheRefreshDate(now)}`).then(getJson).then(async (json) => { demoBlocksGeoJson = json }));
        siteViewPromises.push(fetch(`${demoStorageUrl}/${history.state.demo}_site_mapbackgrounds.geojson?date=${getCacheRefreshDate(now)}`).then(getJson).then(async (json) => { demoMapbackgroundsJson = json }));
    }
    let promises = [
        Promise.all(allSitesViewPromises).then(async function () {
            sitesGeoJson.features.forEach(function (feature) {
                feature.properties.storageUrl = storageUrl2;
            });
            if (history.state.demo !== undefined) {
                demoSitesGeoJson.features.forEach(function (feature) {
                    feature.properties.storageUrl = demoStorageUrl;
                });
                sitesGeoJson.features.push(...demoSitesGeoJson.features);
            };
            // Find unique site types
            sitesGeoJson.features.forEach(function (feature) {
                if (siteTypes[feature.properties.site_type] === undefined) {
                    siteTypes[feature.properties.site_type] = feature; // sample feature
                    siteTypeList.push(feature.properties.site_type);
                }
            });
            allSitesMapView = {
                ...allSitesMapView,
                bounds: getBoundingBox(sitesGeoJson.features),
            }
            if (history.state.site === undefined) {
                return initMap(allSitesMapView);
            };
        }),
        Promise.all(siteViewPromises).then(async function () {
            if (history.state.demo !== undefined) {
                blocksGeoJson.features.push(...demoBlocksGeoJson.features);
                mapbackgroundsJson.features.push(...demoMapbackgroundsJson.features);
            };
            if (history.state.site !== undefined) {
                // Init map view to site blocks
                let filteredFeatures = blocksGeoJson.features.filter(feature => (feature.properties.site === history.state.site));
                if (filteredFeatures.length == 0) {
                    filteredFeatures = blocksGeoJson.features;
                }
                return initMap({
                    ...siteMapView,
                    bounds: getBoundingBox(filteredFeatures)
                });
            }
        })/*,
            fetch(`js/charts.json?version=2021-02-23c`).then(getJson).then(json => { chartsJson = json }) */
    ];/*
    if (history.state.site !== undefined) {
        // Fetch site.json early if possible:
        if (sitesGeoJson !== undefined) {
            for (let feature of sitesGeoJson.features) {
                if (feature.properties.site === history.state.site) {
                    promises.push(fetch(`${feature.properties.storageUrl}/${history.state.site}/site.json?date=${getCacheRefreshDate(now)}`).then(getJson).then(async (json) => {
                        siteJson = json;
                    }));
                }
            }
        }
        if (history.state.demo !== undefined) {
            siteViewPromises.push(fetch(`${demoStorageUrl}/${history.state.site}/site.json?date=${getCacheRefreshDate(now)}`).then(getJson).then(async (json) => {
                var demoSiteJson = json;
            }));
        }
    }*/
    await Promise.all(promises).catch(function (err) {
        console.log(err); // some coding error in handling happened
        popUpMessageText("Failed to load data", "Please try again later.");
    });
}

// Set state. Keys for which the value is undefined are not stored.
function setState(state) {
    state = Object.entries(state).reduce((a, [k, v]) => (v === undefined ? a : (a[k] = v, a)), {}); // Remove everything that has value undefined
    let url = new URL(window.location.href);
    url.search = new URLSearchParams(state);
    history.replaceState(state, "", url.href);
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
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/hamksmart/ckxpt8jt31cge14mu5nkf4qwa',
        ...initMapView,
    });
    setOthersThanMapLoaded(false);
    map.once('load', function () {
        mapLoaded = true;
        setOthersThanMapLoaded();
    }); // Note: this cannot be done using map.loaded()
    map.dragRotate.disable(); // disable map rotation using right click + drag
    map.touchZoomRotate.disableRotation(); // disable map rotation using touch rotation gesture
    popup = new mapboxgl.Popup({ // Create a popup, but don't add it to the map yet.
        closeButton: false,
        closeOnClick: false
    });
    nav = new mapboxgl.NavigationControl();
    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
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
    return Promise.all([
        mapLoadImage(`${fieldobservatoryImagesUrl}/MapMarkerDarkBlue.png`, 'MapMarkerDarkBlue'),
        mapLoadImage(`${fieldobservatoryImagesUrl}/MapMarkerBlue.png`, 'MapMarkerBlue'),
        mapLoadImage(`${fieldobservatoryImagesUrl}/MapMarkerGreen.png`, 'MapMarkerGreen'),
        mapLoadImage(`${fieldobservatoryImagesUrl}/MapMarkerDarkGrey.png`, 'MapMarkerDarkGrey')
    ]);
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
    // const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    /*
    if (window.innerWidth <= 1024 && history.state && history.state.site !== undefined) {
        // One column
        let satelliteImages = document.getElementById("satellite_images");
        if (satelliteImages !== null) {
            satelliteImages.before(document.getElementById("map"));
        }
    } else {
        // Two column
        document.getElementById("mapMainHeaderDiv").after(document.getElementById("map"));
    }*/

    if (history.state.site !== undefined) {
        if (map !== undefined) {
            whenMapLoadedDo(function () {
                map.resize()
            });
        }
        resizeCharts();
        if (window.innerWidth <= 1024) {
            // One column
            document.getElementById("Satellite_images").after(document.getElementById("map"));
        } else {
            document.getElementById("mapMainHeaderDiv").after(document.getElementById("map"));
        }
    }
}

function setAllSitesMapLayerVisibility(visibility) {
    map.setLayoutProperty("fieldLocationsLayerFar", 'visibility', visibility);
    map.setLayoutProperty("fieldLocationsLayerNear", 'visibility', visibility);
    //map.setLayoutProperty("cluster-countFieldLocations", 'visibility', visibility);
    //map.setLayoutProperty("clustersFieldLocations", 'visibility', visibility);
}

function whenMapLoadedDo(f) {
    if (mapLoaded) {
        f();
    } else {
        map.once('load', f);
    }
}

function getCacheRefreshDate(date) {
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

function showTooltip(initiatorId, text) {
    
}