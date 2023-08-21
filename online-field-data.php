<?php $baseUri = get_template_directory_uri(); 
    get_header();    
    $maincontent = "mainContent-" . get_locale();
    $maintitle = "mainTitle-" . get_locale();
    $mapinfotext = "mapInfoText-" . get_locale();
    ?>

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
<div class="Dataviewer">
    <div id="chart_container" class="chart_gridcontainer">
        <div class="map_container">
            <div id="mapInfoDiv">
                <h1><?php echo get_post_meta($post->ID, $maintitle, true)?></h1>
                <p>
                    <?php echo get_post_meta($post->ID, $maincontent, true);?>
                </p>
                <h4>
                    <?php echo get_post_meta($post->ID, $mapinfotext, true);?>
                </h4>
            </div>
            <div id="map" class="mapBoxMap">
                <div id="attribution" class="mapboxgl-ctrl mapboxgl-ctrl-attrib mapboxgl-ctrl-top-left" style="position: absolute; bottom: 0; height: 50px;"></div>
                <div class="map-overlay" id="mapFilterContainer"></div>
            </div>
        </div>
        <div id="afterMapDiv">
            <div class="fieldInfoDiv" id="fieldInfoDiv">
                <svg width="150" height="200" id="countryMap"></svg>
                <h2 id="siteName"></h2>
                <div id="siteDescription"></div>
                <div class="chart_title_div">
                    <h3 id="Satellite_images"></h3>
                </div>
            </div>
            <div id="satelliteImageDiv"></div>
            <div id="Details" class="FOPopup hidden"></div>
            <div id="DownloadPopup" class="FOPopup hidden"></div>
        </div>
    </div>
</div>
<?php
wp_footer();
get_footer();
?>
</div>

<?php include 'foConfig.php'?>
<script type="text/javascript">
    foConfig = {
        ...foConfig,
        mapElementId: "map",
        mapEnabled: true,
        mapStyleURL: "mapbox://styles/hamksmart/clb3oj6mg000414p9riomkyt4?ver=<?php echo wp_get_theme()->version ?>", //'mapbox://styles/hamksmart/ckxpt8jt31cge14mu5nkf4qwa'
        chartContainerElementId: "chart_container",
        creditContainerElementId: "chart_container",
        zoomLevel: 6,
        manageSiteLinkEnabled: true,
        chartDivInnerHTMLTemplate: `
        <div id="chart_title_div_chartId" class="chart_title_div"></div>
        <div id="chart_svg_div_chartId" class="chart_svg_div"></div>
        <div id="chart_legend_div_chartId" class="chart_legend_div"></div>
        <div id="chart_description_div_chartId" class="chart_description"></div>`
    }
    document.body.classList.add('mapLoading');
    document.body.classList.add('layoutNotReady');
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/proj4js/proj4js -->
<script src="https://cdn.jsdelivr.net/npm/geotiff@2.0.4/dist-browser/geotiff.min.js"></script> <!-- see https://cdn.jsdelivr.net/npm/geotiff@2.0.4/README.md -->
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCharts.js?ver=<?php echo wp_get_theme()->version ?>"></script>
<script type="text/js-worker" id="fieldobservatory-FODataViewerWorkerJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerWorker.js?ver=<?php echo wp_get_theme()->version ?>"></script>
<script type="text/javascript" id="fieldobservatory-FODataViewerCoreJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCore.js?ver=<?php echo wp_get_theme()->version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerDOM.js?ver=<?php echo wp_get_theme()->version ?>"></script>
