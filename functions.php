<script id="fieldobservatory-markdown-it-js" src="https://cdnjs.cloudflare.com/ajax/libs/markdown-it/13.0.1/markdown-it.min.js" integrity="sha512-SYfDUYPg5xspsG6OOpXU366G8SZsdHOhqk/icdrYJ2E/WKZxPxze7d2HD3AyXpT7U22PZ5y74xRpqZ6A2bJ+kQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/markdown-it/markdown-it -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/proj4js/proj4js -->
<script type="text/javascript" id="fieldobservatory-FODataViewerCoreJs-js" src="<?php echo get_parent_theme_file_uri("/assets/js/FODataViewerCore.js")?>?ver=<?php echo wp_get_theme()->version ?>"></script>
<?php 
wp_enqueue_style('arcticcarbonobservatory-ACODataViewer',get_theme_file_uri("/assets/css/ACODataViewer.css"),array(),wp_get_theme()->version,'all');
wp_enqueue_script('arcticcarbonobservatory-ACOConfigJS',get_theme_file_uri("/assets/js/ACOConfig.js"),array(),wp_get_theme()->version,true);
?> 
