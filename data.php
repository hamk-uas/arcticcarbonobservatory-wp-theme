<?php
get_header();
$maincontent = "mainContent-" . get_locale();
$maintitle = "mainTitle-" . get_locale();
$mapinfotext = "mapInfoText-" . get_locale();
?>

<div>
    <div class="Dataviewer">
        <div id="chart_container" class="chart_gridcontainer">
            <div class="map_container">
                <div id="mapInfoDiv">
                    <h1><?php echo get_post_meta($post->ID, $maintitle, true) ?></h1>
                    <p>
                        <?php echo get_post_meta($post->ID, $maincontent, true); ?>
                    </p>
                    <h4>
                        <?php echo get_post_meta($post->ID, $mapinfotext, true); ?>
                    </h4>
                </div>
                <div id="map" class="mapBoxMap">
                    <div id="attribution" class="mapboxgl-ctrl mapboxgl-ctrl-attrib mapboxgl-ctrl-top-left" style="position: absolute; bottom: 0; height: 50px;"></div>
                    <div class="map-overlay" id="mapFilterContainer"></div>
                </div>
            </div>
            <div id="afterMapDiv">
                <div class="fieldInfoDiv" id="fieldInfoDiv">
                    <svg width="150" height="200" id="regionMap"></svg>
                    <h2 id="siteName"></h2>
                    <div id="siteDescription"></div>
                    <div class="chart_title_div">
                        <h3 id="Satellite_images"></h3>
                    </div>
                </div>
                <div id="satelliteImageDiv"></div>
                <div id="Details" class="OPopup OJSONViewer hidden"></div>
                <div id="DownloadPopup" class="OPopup hidden"></div>
            </div>
        </div>
    </div>
    <?php
    wp_footer();
    get_footer();
    ?>
</div>

<?php include get_template_directory().'/oConfig.php' ?>
<script type="text/javascript">
    document.body.classList.add('mapLoading');
    document.body.classList.add('layoutNotReady');
</script>
<script id="observatory-markdown-it-js" src="https://cdnjs.cloudflare.com/ajax/libs/markdown-it/13.0.1/markdown-it.min.js" integrity="sha512-SYfDUYPg5xspsG6OOpXU366G8SZsdHOhqk/icdrYJ2E/WKZxPxze7d2HD3AyXpT7U22PZ5y74xRpqZ6A2bJ+kQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/markdown-it/markdown-it -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/proj4js/proj4js -->
<script src="https://cdn.jsdelivr.net/npm/geotiff@2.0.4/dist-browser/geotiff.min.js"></script> <!-- see https://cdn.jsdelivr.net/npm/geotiff@2.0.4/README.md -->
<script type="text/js-worker" id="observatory-ODataViewerWorkerJs-js" src="<?php echo get_parent_theme_file_uri('/assets/js/ODataViewerWorker.js?ver=').wp_get_theme()->parent->version ?>"></script>
<script type="text/javascript" id="observatory-ODataViewerCoreJs-js" src="<?php echo get_parent_theme_file_uri('/assets/js/ODataViewerCore.js?ver=').wp_get_theme()->parent->version ?>"></script>
<script type="text/javascript" src="<?php echo get_parent_theme_file_uri('/assets/js/ODataViewerDom.js?ver=').wp_get_theme()->parent->version ?>"></script>