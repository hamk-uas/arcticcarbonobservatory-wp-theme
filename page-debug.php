<div debug-container></div>

<script type="text/javascript">
    foConfig = {
        ...foConfig,
        mapEnabled: false,
    }    
    //foConfig.language = "fi"; // Override language.
</script>

<script type="text/javascript">
var sitesGeoJson;
var managementEventSchemaJson;
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
Promise.all(fetchPromises).then(async (values) => {
    let fetchPromises2 = []
    for (const siteFeature of sitesGeoJson.features) {
        let siteId = siteFeature.properties.id;
        fetchPromises2.push(fetch(`${foConfig.storageUrl}/${siteId}/site.json)`).then(getJson).then(async (json) => {
        }));

    }
    Promise.all(fetchPromises2);
});
</script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/proj4js/proj4js -->
<script type="text/javascript" id="fieldobservatory-FODataViewerCoreJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCore.js?ver=<?php echo wp_get_theme()->version ?>"></script>
