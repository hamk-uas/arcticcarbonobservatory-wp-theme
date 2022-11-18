<?php $baseUri = get_template_directory_uri(); 
    get_header();    
    $maincontent = "mainContent-" . get_locale();
    $maintitle = "mainTitle-" . get_locale();
    $mapinfotext = "mapInfoText-" . get_locale();
    ?>
<script type="text/javascript">
    var v = {
    	fieldobservatoryLanguage: "<?php echo explode("_", get_locale())[0]?>" // fi -> fi, sv_SE -> sv, en_US -> en
    };
</script>
<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
<style type="text/css">

    /* MAP BOX STYLE*/

    .marker {
        background-image: url('../images/boxes.gif');
        background-size: contain;
        width: 38px;
        height: 38px;
        /*border-radius: 50%;*/
        opacity: 0.8;
        cursor: none;
    }

    @@keyframes opacityzerotoone {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    path.line {
        fill: none;
        stroke: red;
        opacity: 0.8;
        stroke-width: 3px;
    }
</style>
<div>
<div class="view">
    <div id="chart_container" class="chart_gridcontainer">
        <div>
            <div class="mapMainHeader" id="mapMainHeaderDiv">
                <h1><?php echo get_post_meta($post->ID, $maintitle, true)?></h1>
                <p class="h1p">
                    <?php echo get_post_meta($post->ID, $maincontent, true);?>
                </p>
                <h4>
                    <?php echo get_post_meta($post->ID, $mapinfotext, true);?>
                </h4>
            </div>
            <div id="map" class="mapBoxMap">
                <div class="map-overlay" id="mapFilterContainer"></div>
                <div id="attribution" class="mapboxgl-ctrl mapboxgl-ctrl-attrib mapboxgl-ctrl-top-left" style="position: absolute; bottom: 0; height: 50px;"></div>
            </div>
        </div>
        <div id="afterMap">
            <div id="mapRightDiv" class="fieldInfoDiv">
                <h2 id="fieldInfo"></h2><div id="siteDescription"></div>
            </div>
            <div id="tooltip" role="tooltip" class="tooltip_hidden"></div>
        </div>
    </div>
</div>
<?php
wp_footer();
get_footer();
?>    
</div>
<div id="loader-wrapper">
        <div id="PopUpMsg" class="popuptext"></div>
        <div id="loader"></div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/proj4js/proj4js -->
<script src="https://cdn.jsdelivr.net/npm/geotiff@2.0.4/dist-browser/geotiff.min.js"></script> <!-- see https://cdn.jsdelivr.net/npm/geotiff@2.0.4/README.md -->
<script type="text/javascript">
    mapboxgl.accessToken = "pk.eyJ1IjoiaGFta3NtYXJ0IiwiYSI6ImNreG9sN3p0cDAweTkycG8yZ3B3NHV5cjUifQ.YfKxbZoIH0pR7x2ZU6bDIA";

    var storageUrl = 'https://ilmatieteenlaitos.blob.core.windows.net/fieldobservatory2021-03-19/data';
    var storageUrl2 = 'https://field-observatory.data.lit.fmi.fi';
    var demoStorageUrl = 'https://field-observatory-demo.data.lit.fmi.fi';
    if (!window.hasOwnProperty("v") || window.v === undefined || v.fieldobservatoryLanguage === undefined) {
        var v = {
            fieldobservatoryLanguage: "en"
        };
    }
    var fieldobservatoryImagesUrl = "<?php echo get_template_directory_uri(); ?>/assets/images";
    var fieldobservatoryJSUrl = "<?php echo get_template_directory_uri(); ?>/assets/js";    
    v.mapElementId = "map";
    v.mapEnabled = true;
    v.chartContainerElementId = "chart_container";
    v.creditContainerElementId = "chart_container";
    v.zoomLevel = 6;
    v.manageSiteLinkEnabled = true;
</script>
<?php $version = wp_get_theme()->version; ?>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewFirstDOM.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/charts.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewAllSitesDOM.js?ver=<?php echo $version ?>"></script>
<script type="text/js-worker" id="fieldobservatory-MapViewSiteWorkerJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteWorker.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" id="fieldobservatory-MapViewSiteSharedJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteShared.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteDOM.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewLastDOM.js?ver=<?php echo $version ?>"></script>
<script>
console.log("End of field-data.php");
document.addEventListener('DOMContentLoaded', (event) => {
  console.log("DOM loaded event");
})
</script>