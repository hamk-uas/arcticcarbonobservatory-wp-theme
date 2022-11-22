<?php $baseUri = get_template_directory_uri(); 
    get_header();    
    $maincontent = "mainContent-" . get_locale();
    $maintitle = "mainTitle-" . get_locale();
    $mapinfotext = "mapInfoText-" . get_locale();
    ?>
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
<?php include 'foConfig.php'?>
<script type="text/javascript">
    foConfig = {
        ...foConfig,
        mapElementId: "map",
        mapEnabled: true,
        chartContainerElementId: "chart_container",
        creditContainerElementId: "chart_container",
        zoomLevel: 6,
        manageSiteLinkEnabled: true
    }
</script>
<?php $version = wp_get_theme()->version; ?>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCharts.js?ver=<?php echo $version ?>"></script>
<script type="text/js-worker" id="fieldobservatory-FODataViewerWorkerJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerWorker.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" id="fieldobservatory-FODataViewerCoreJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCore.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerDOM.js?ver=<?php echo $version ?>"></script>
<script>
console.log("End of field-data.php");
document.addEventListener('DOMContentLoaded', (event) => {
  console.log("DOM loaded event");
})
</script>