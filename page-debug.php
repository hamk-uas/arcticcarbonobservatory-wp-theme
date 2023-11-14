<?php include 'page.php'?>
<?php include 'foConfig.php'?>

<div id="debug-container"></div>

<script type="text/javascript">
    foConfig = {
        ...foConfig,
        mapEnabled: false,
    }
    //foConfig.language = "fi"; // Override language.
</script>

<script type="text/javascript" id="fieldobservatory-FODataViewerCoreJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCore.js?ver=<?php echo wp_get_theme()->version ?>"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/proj4js/proj4js -->

<script type="module" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataDebug.js?ver=<?php echo wp_get_theme()->version ?>"></script>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>