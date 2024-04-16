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
                    <?php
                    $current_page = get_queried_object();
                    $content      = apply_filters( 'the_content', $current_page->post_content );
                    echo $content;
                    ?>
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

<script type="text/javascript">
    document.body.classList.add('mapLoading');
    document.body.classList.add('layoutNotReady');
    oDataViewerStart();    
</script>