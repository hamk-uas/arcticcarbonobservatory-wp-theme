<script type="text/javascript">
    foConfig = {
        ...foConfig,
        storageUrl: 'https://field-observatory.data.lit.fmi.fi',
        demoStorageUrl: 'https://field-observatory-demo.data.lit.fmi.fi',
        language: "<?php echo explode("_", get_locale())[0]?>", // fi -> fi, sv_SE -> sv, en_US -> en
        imagesUrl: "<?php echo get_template_directory_uri(); ?>/assets/images",
        mapEnabled: false,
        chartFilter: {
            "carbonStorage": true
        },
        chartContainerElementId: "chart_container",
        creditContainerElementId: undefined,
        zoomLevel: 11,
        manageSiteLinkEnabled: false,
        now: Date.now().valueOf()
    }
    foConfig.language = "fi"; // Override language.
</script>

<div id="loader-wrapper">
        <div id="PopUpMsg" class="popuptext"></div>
        <div id="loader"></div>
</div>
<div id="tooltip" role="tooltip" class="tooltip_hidden"></div>
<?php $version = wp_get_theme()->version; ?>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCharts.js?ver=<?php echo $version ?>"></script>
<script type="text/js-worker" id="fieldobservatory-FODataViewerWorkerJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerWorker.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" id="fieldobservatory-FODataViewerCoreJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCore.js?ver=<?php echo $version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerDOM.js?ver=<?php echo $version ?>"></script>
