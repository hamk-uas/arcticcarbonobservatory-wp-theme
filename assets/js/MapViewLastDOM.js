initPage();

async function initPage() {
    if (history.state.site !== undefined) {
        viewSiteBeforeLoadEssentials(); // SITE view initialization before loading jsons and map
    } else {
        viewAllSitesBeforeLoadEssentials(); // ALL SITES view initialization before loading jsons and map
    }

    await loadEssentials(); // Load sitesGeoJson, blocksGeoJson and chartsJson, and mappy things
    console.log("sitesGeoJson =");
    console.log(sitesGeoJson);
    console.log("blocksGeoJson =");
    console.log(blocksGeoJson);
    console.log("chartsJson =");
    console.log(chartsJson);

    // Add essential sources and layers

    whenMapLoadedDo(function () {
        map.addSource('empty', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
        map.addSource("fieldLocations", {
            type: "geojson",
            data: sitesGeoJson,
            cluster: false,
            clusterMaxZoom: 14,
            clusterRadius: 50
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
            "id": 'fieldLocationsLayerFar',
            "type": 'circle',
            "source": 'fieldLocations',
            /*"maxzoom": 6,*/
            "filter": ['!has', 'point_count'],
            "paint": {
                "circle-radius": 6,
                "circle-stroke-color": {
                    property: 'site_type',
                    type: 'categorical',
                    stops: [
                        ['Valio', '#114a9c'],
                        ['Advanced CarbonAction Site', '#349a80'],
                        ['Intensive Site', '#129bc7'],
                        ['Svensk Kolinlagring Site', '#292929'],
                    ]
                },
                "circle-color": {
                    property: 'site_type',
                    type: 'categorical',
                    stops: [
                        ['Valio', '#114a9c'],
                        ['Advanced CarbonAction Site', '#349a80'],
                        ['Intensive Site', '#129bc7'],
                        ['Svensk Kolinlagring Site', '#292929'],
                    ]
                },
                "circle-stroke-width": 3,
                "circle-opacity": 0.6,
                "circle-stroke-opacity": 1
            }
        });
        map.addLayer({
            "id": 'fieldLocationsLayerNear',
            "type": 'symbol',
            "source": 'fieldLocations',
            "minzoom": 5,
            "filter": ['!has', 'point_count'],
            'layout': {
                'icon-size': 0.8,
                'icon-allow-overlap': true,
                //'text-allow-overlap': true,
                "text-field": ["coalesce", ['get', `Name_${v.fieldobservatoryLanguage}`], ['get', 'Name']],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'icon-offset': [0, 6],
                'icon-image': {
                    property: 'site_type',
                    type: 'categorical',
                    stops: [
                        ['Valio', 'MapMarkerDarkBlue'],
                        ['Advanced CarbonAction Site', 'MapMarkerGreen'],
                        ['Intensive Site', 'MapMarkerBlue'],
                        ['Svensk Kolinlagring Site', 'MapMarkerDarkGrey'],
                    ]
                }
            },
            "paint": {
                "text-halo-width": 1,
                "text-halo-blur": 1,
                "text-halo-color": "#ffffff"
            }
        });
    });
    if (history.state.site !== undefined) {
        whenMapLoadedDo(function () { setAllSitesMapLayerVisibility("none") });
        await viewSiteAfterLoadingEssentials(0); // SITE view initialization after loading jsons and map
    } else {
        viewAllSitesAfterLoadingEssentials(); // ALL SITES view initialization after loading jsons and map
    }

    document.addEventListener("keydown", function (event) {
        if (event.keyCode === 27 && handleEsc !== undefined) {
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

function popUpMessageText(title, msg) {
    var popup = document.getElementById("PopUpMsg");
    popup.innerHTML = '<p class="h1p">' + title + '<p><p class="h2p">' + msg + '</p>';
}