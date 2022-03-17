<?php $baseUri = get_template_directory_uri(); 
    get_header();
    $currentLang = get_locale();
    $maincontent = "mainContent-" . $currentLang;
    $maintitle = "mainTitle-" . $currentLang;
    $mapinfotext = "mapInfoText-" . $currentLang;
    ?>
<script src='https://api.tiles.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.js'></script>
<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
<link href="https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.css" rel="stylesheet" />
<script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.5.1/mapbox-gl-geocoder.min.js"></script>
<link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.5.1/mapbox-gl-geocoder.css" type="text/css" />

<!-- Promise polyfill script required to use Mapbox GL Geocoder in IE 11 -->
<script src="https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js"></script>
<!-- link rel="stylesheet" href="assets/css/theme.css" type="text/css" /-->
<link rel="stylesheet" href="<?php echo get_template_directory_uri(); ?>/assets/css/mapviewmedia.css" type="text/css" />
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
                
                <div class="map-overlay" id="mapFilterContainer">
                    <h2 style="padding-bottom:10px;">Show sites</h2>
                        <label class="filterCheckBox">
                            Intensive
                            <input type="checkbox" id="checkBoxIntensive" name="intensive" value="intensiveSite" onclick="checkCheckBoxes()" checked>
                            <span class="checkmark" style="background-color:#129bc7"></span>
                        </label>
                        <!--<label class="filterCheckBox">
                            Valio
                            <input type="checkbox" id="checkBoxValio" name="valio" value="valioSite" onclick="checkCheckBoxes()" checked>
                            <span class="checkmark" style="background-color:#114a9c"></span>
                        </label>--!>
                        <label class="filterCheckBox">
                            Carbon Action
                            <input type="checkbox" id="checkBoxCarbonAction" name="carbonAction" value="carbonActionSite" onclick="checkCheckBoxes()" checked>
                            <span class="checkmark" style="background-color: #349a80"></span>
                        </label>
                        <label class="filterCheckBox">
                            Svensk Kolinlagring
                            <input type="checkbox" id="checkBoxSvenskKolinlagring" name="svenskKolinlagrig" value="svenskKolinlagringSite" onclick="checkCheckBoxes()" checked>
                            <span class="checkmark" style="background-color: #292929"></span>
                        </label>
                </div>
                <div id="attribution" class="mapboxgl-ctrl mapboxgl-ctrl-attrib mapboxgl-ctrl-top-left" style="position: absolute; bottom: 0; height: 50px;">
                </div>

            </div>
        </div>
        <div id="afterMap">
            <div id="mapRightDiv" class="fieldInfoDiv">
                <h2 id="fieldInfo"></h2><div id="siteDescription"></div>
            </div>
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
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- http://proj4js.org/ -->-->
<script type="text/javascript">
    mapboxgl.accessToken = "pk.eyJ1IjoiaGFta3NtYXJ0IiwiYSI6ImNreG9sN3p0cDAweTkycG8yZ3B3NHV5cjUifQ.YfKxbZoIH0pR7x2ZU6bDIA";

    var storageUrl = 'https://ilmatieteenlaitos.blob.core.windows.net/fieldobservatory2021-03-19/data';
    var storageUrl2 = 'https://field-observatory.data.lit.fmi.fi';
    var demoStorageUrl = 'https://field-observatory-demo.data.lit.fmi.fi';
    if (!window.hasOwnProperty("v") || window.v === undefined || v.fieldobservatoryLanguage === undefined) {
        console.log("Using default language.");
        var v = {
            fieldobservatoryLanguage: "en"
        };
    } else {
        console.log(`Using language: ${window.fieldobservatoryLanguage}`);
    }
    var fieldobservatoryIsWordpress = true;

    if (fieldobservatoryIsWordpress) {
        var fieldobservatoryImagesUrl = "<?php echo get_template_directory_uri(); ?>/assets/images";
        var fieldobservatoryJSUrl = "<?php echo get_template_directory_uri(); ?>/assets/js";
    } else {
        var fieldobservatoryImagesUrl = "/img";
        var fieldobservatoryJSUrl = "js";
    }
</script>

<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewFirstDOM.js">console.log("FirstDOm js ready")</script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/charts.js">console.log("chart js ready")</script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewAllSitesDOM.js">console.log("All sites js ready")</script>
<script type="text/js-worker" id="fieldobservatory-MapViewSiteWorkerJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteWorker.js"></script>
<script type="text/javascript" id="fieldobservatory-MapViewSiteSharedJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteShared.js"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteDOM.js"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewLastDOM.js"></script>
<!-- END OF JAVASCRIPT DEVELOPED SEPARATELY-->
<script>
console.log("End of field-data.php");
document.addEventListener('DOMContentLoaded', (event) => {
  console.log("DOM loaded event");
})
</script>