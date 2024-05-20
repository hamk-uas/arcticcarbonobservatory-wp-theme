<?php
get_header();
$maincontent = "mainContent-" . get_locale();
$maintitle = "mainTitle-" . get_locale();
$mapinfotext = "mapInfoText-" . get_locale();
?>

<div>
    <div class="DataViewerContent SiteSelectorOnly">
        <?php
        $current_page = get_queried_object();
        $content      = apply_filters( 'the_content', $current_page->post_content );
        echo $content;
        ?>
    </div>
    <div class="DataViewer">
        <div id="chart_container" class="chart_gridcontainer">
            <div class="map_container">
                <div id="map" class="mapBoxMap">
                    <div id="attribution" class="mapboxgl-ctrl mapboxgl-ctrl-attrib mapboxgl-ctrl-top-left" style="position: absolute; bottom: 0; height: 50px;"></div>
                    <div class="map-overlay" id="mapFilterContainer"></div>
                </div>
            </div>
            <div id="afterMapDiv">
                <div class="siteInfoDiv" id="siteInfoDiv">
                    <svg width="150" height="200" id="regionMap"></svg>
                    <h2 id="siteName"></h2>
                    <div id="siteDescription"></div>
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
    let oDataViewer = new ODataViewer(oConfig);
</script>