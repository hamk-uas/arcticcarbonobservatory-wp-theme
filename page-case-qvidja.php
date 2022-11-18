<script type="text/javascript">
    var v = {
        fieldobservatoryLanguage: "<?php echo explode("_", get_locale())[0]?>" // fi -> fi, sv_SE -> sv, en_US -> en
    };
</script>
    
  <?php
        
        get_header();
        $imageUrl = get_template_directory_uri();

    global $post; 
    	$postid = $post->ID;
    	
    	if ($postid == '68') 
    	{
           // Use page-online-field-data.php and do not show banner
    	}
        else
        {
        	if(get_post_meta($post->ID, 'showFeaturedImage', true)=='false')
            {
             // do not show featured image at page
            }
            else
            {
           ?>
            <div class="DesignHolder">
                <!-- \\ Begin Frame \\ -->
                <div class="LayoutFrame">
                    <div class="clear"></div>
                </div>
            </div>
             <!-- <div class="bgcolorWhite"></div> -->
             <?php } ?>
            <div class="themeContainer"id="page">
                <?php if( have_posts())
                    {
                        while( have_posts())
                        {
                            the_post();
                            the_content();
                        }
                    } ?>
            </div>
            <script type="text/javascript">
                document.body.classList.remove('loader');
                document.body.classList.add('loaded');
                // Changes to _Layout.cshtml
            // document.getElementsByClassName('current-menu-item').className = 'active';
            </script>
            </div>
            <!-- // End Layout Frame // -->
        </div>
<?php
        }
	
?>


<?php
    wp_footer();
    get_footer();
    ?>

<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/proj4js/proj4js -->
<script src="https://cdn.jsdelivr.net/npm/geotiff@2.0.4/dist-browser/geotiff.min.js"></script> <!-- see https://cdn.jsdelivr.net/npm/geotiff@2.0.4/README.md -->
<script type="text/javascript">
    var storageUrl = 'https://ilmatieteenlaitos.blob.core.windows.net/fieldobservatory2021-03-19/data';
    var storageUrl2 = 'https://field-observatory.data.lit.fmi.fi';
    var demoStorageUrl = 'https://field-observatory-demo.data.lit.fmi.fi';
    if (!window.hasOwnProperty("v") || window.v === undefined || v.fieldobservatoryLanguage === undefined) {
        var v = {
            fieldobservatoryLanguage: "en"
        };
    }
    var v = {
            fieldobservatoryLanguage: "fi" // Override language
        };
    var fieldobservatoryImagesUrl = "<?php echo get_template_directory_uri(); ?>/assets/images";
    var fieldobservatoryJSUrl = "<?php echo get_template_directory_uri(); ?>/assets/js";
    v.siteId = "qvidja";
    v.mapEnabled = false;
    v.chartEnabled = {
        "carbonStorage": true
    }
    v.chartContainerElementId = "chart_container";
    v.creditContainerElementId = undefined;
    v.zoomLevel = 11;
    v.manageSiteLinkEnabled = false;
</script>
<div id="loader-wrapper">
        <div id="PopUpMsg" class="popuptext"></div>
        <div id="loader"></div>
</div>
<div id="tooltip" role="tooltip" class="tooltip_hidden"></div>
<?php $version = wp_get_theme()->version; ?>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewFirstDOM.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/charts.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewAllSitesDOM.js?ver=<?php echo $version ?>"></script>
<script type="text/js-worker" id="fieldobservatory-MapViewSiteWorkerJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteWorker.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" id="fieldobservatory-MapViewSiteSharedJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteShared.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewSiteDOM.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/MapViewLastDOM.js?ver=<?php echo $version ?>"></script>
