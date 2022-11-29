<script type="text/javascript">
    foConfig = {
        ...foConfig,
        mapEnabled: false,
        chartFilter: {
            "global": true,
            "carbonStorage": true
        },
        chartContainerElementId: "chart_container",
        creditContainerElementId: undefined,
        zoomLevel: 11,
        manageSiteLinkEnabled: false,
        chartDivInnerHTMLTemplate: `
        <div class="casepage_chart_svg_and_legend_div">
            <div id="chart_title_div_chartId" class="chart_title_div"></div>
            <div id="chart_svg_div_chartId" class="chart_svg_div"></div>
            <div id="chart_legend_div_chartId" class="chart_legend_div"></div>
        </div>
        <div class="casepage_chart_title_and_description_div">
            <div id="chart_title2_div_chartId" class="chart_title2_div"></div>
            <div id="chart_description_div_chartId" class="chart_description"></div>
        </div>`
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
