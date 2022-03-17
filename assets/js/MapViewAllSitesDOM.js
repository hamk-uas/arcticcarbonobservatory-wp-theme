var mapEventsAndHandlers = [];
var nav;

function normalize(string) {
    return string.trim().toLowerCase();
}

function viewAllSites() {
    viewAllSitesBeforeLoadEssentials();
    viewAllSitesAfterLoadingEssentials();
}

function viewAllSitesBeforeLoadEssentials() {
    document.body.classList.add('ViewAllSites');
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

var siteTypeColors = {
    'Advanced CarbonAction Site': '#349a80',
    'Intensive Site': '#129bc7',
    'Valio': '#114a9c',
    'Svensk Kolinlagring Site': '#292929'
};

//Get color by siteType
function getSiteTypeColor(siteType) {
    let color = siteTypeColors[siteType];
    if (color === undefined) {
        color = "#349a80";
    }
    return color;
}
// Open ALL SITES view
function viewAllSitesAfterLoadingEssentials() {
    // Make essential layers visible
    var filterContainer = document.getElementById("mapFilterContainer");
    
    filterContainerInnerHTML = '';// `<h2 style="padding-bottom:10px;">${translate(w.plaintext, "show sites")}</h2>`;
    siteTypeList.forEach(function (siteTypeId) {
        siteType = siteTypes[siteTypeId];
        filterContainerInnerHTML += `
        <label class="filterCheckBox">            
            ${translate(siteType.properties, "site_type_Name", siteTypeId)}${siteType.properties.demo ? " (demo)" : ""}
            <input type="checkbox" id="checkBox${siteTypeId.replaceAll(' ', '')}" name="${siteTypeId}" value="${siteTypeId}" onclick="checkCheckBoxes()" checked>
            <span class="checkmark" style="background-color:${getSiteTypeColor(siteTypeId)}"></span>
        </label>`;
    });
    filterContainer.innerHTML = filterContainerInnerHTML;
    filterContainer.style.display = "block";
    whenMapLoadedDo(function () { setAllSitesMapLayerVisibility("visible") });

    map.resize();
    map.setMinZoom(allSitesMapView.minZoom);
    map.setMaxZoom(allSitesMapView.maxZoom);
    map.fitBounds(allSitesMapView.bounds, { padding: allSitesMapView.fitBoundsOptions.padding, duration: 1000 });
    //map.flyTo({...defaultMapView, duration:1000 });
    setOthersThanMapLoaded(true);

    if (mapEventsAndHandlers.length == 0) {
        function createNearPopup(e) {
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';
            var coordinates = e.features[0].geometry.coordinates.slice();
            var name = e.features[0].properties.Name;
            var siteType = e.features[0].properties.site_type;
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            // Populate the popup and set its coordinates
            // based on the feature found.
            if (popup.userData !== undefined) {
                delete popup.userData;
                popup.remove()
            }
            var styleColor = getSiteTypeColor(siteType);
            popup
                .setLngLat(coordinates)
                .setHTML('<h1 id="fieldLocationsLayerNearPopup">' + name + '</h1><p>' + translate(siteTypes[siteType].properties, "site_type_Name", siteType) + '</p><h2>' + translate(t.plaintext_titles, "click_to_view_data") + '</h2>')
                .addTo(map);
            popup.userData = "near";
        }
        addMapEventHandler('mouseenter', 'fieldLocationsLayerNear', createNearPopup);
        addMapEventHandler('mousemove', 'fieldLocationsLayerNear', function (e) {
            if (popup.userData === "far") {
                delete popup.userData;
                popup.remove();
            }
            createNearPopup(e);
        });

        addMapEventHandler('mouseleave', 'fieldLocationsLayerFar', function () {
            map.getCanvas().style.cursor = '';
            if (popup.userData === "far") {
                delete popup.userData;
                popup.remove();
            }
        });
        addMapEventHandler('mouseleave', 'fieldLocationsLayerNear', function () {
            map.getCanvas().style.cursor = '';
            if (popup.userData === "near") {
                delete popup.userData;
                popup.remove();
            }
        });

        addMapEventHandler('click', 'fieldLocationsLayerNear', async function (e) {
            document.activeElement.blur(); // Disable Firefox mouse wheel scrolling of map
            pushState();
            await unviewAllSitesAndViewSite(e.features[0].properties.site);
        });

        addMapEventHandler('mouseenter', 'fieldLocationsLayerFar', function (e) {
            if (popup.userData !== "near") {
                var coordinates = e.features[0].geometry.coordinates.slice();
                console.log(e);
                var styleColor = getSiteTypeColor(e.features[0].properties.site_type);
                popup
                    .setLngLat(coordinates)
                    .setHTML('<h2>' + translate(t.plaintext_titles, "click_to_zoom") + '</h2>')
                    .addTo(map);
                popup.userData = "far";
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = 'pointer';
            }
        });
        addMapEventHandler('mousemove', 'fieldLocationsLayerFar', function (e) {
            if (popup.userData !== "near") {
                var coordinates = e.features[0].geometry.coordinates.slice();
                popup.setLngLat(coordinates)
            }
        });
        addMapEventHandler('mouseleave', 'fieldLocationsLayerFar', function () {
            if (popup.userData === "far") {
                map.getCanvas().style.cursor = '';
                delete popup.userData;
                popup.remove();
            }
        });
        addMapEventHandler('click', 'fieldLocationsLayerFar', function (e) {
            document.activeElement.blur(); // Disable Firefox mouse wheel scrolling of map
            map.easeTo({
                center: e.lngLat,
                zoom: map.getZoom() + 1
            });
            delete popup.userData;
            popup.remove();
        });
        addMapEventHandler('movestart', function () {
            delete popup.userData;
            popup.remove();
        });
        /*
        addMapEventHandler('idle', () => {
        });
        addMapEventHandler('moveend', function () {
        });
        addMapEventHandler('sourcedata', function (e) {
        });
        addMapEventHandler('error', function (e) {
            console.log(e.error);
        });
        */
    }

    window.onpopstate = function () { unviewAllSitesAndViewSite(history.state.site); };
}

//Filter mapbox layer data
function checkCheckBoxes() {
    map.setFilter(
        'fieldLocationsLayerNear',
        null
    );
    map.setFilter(
        'fieldLocationsLayerFar',
        null
    );
    let siteTypePlainText = {
        "Advanced CarbonAction Site": "Advanced CarbonAction Site",
        "Intensive Site": "Intensive Site",
        "Svensk Kolinlagring Site": "Svensk Kolinlagring Site",
        "Valio": "Valio"
    }
    let filterList = siteTypeList.filter(function (siteType) {
        console.log(`checkBox${siteType.replaceAll(' ', '')}`);
        return document.getElementById(`checkBox${siteType.replaceAll(' ', '')}`).checked;
    }).map(siteType => ['==', ['get', 'site_type'], siteType]);

    let base = ['any'];
    let filter = base.concat(filterList);
    map.setFilter(
        'fieldLocationsLayerFar',
        filter
    );
    map.setFilter(
        'fieldLocationsLayerNear',
        filter
    );
}

async function unviewAllSitesAndViewSite(site) {
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
    document.body.classList.remove('ViewAllSites');    
    await viewSite(1000);
}

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};

