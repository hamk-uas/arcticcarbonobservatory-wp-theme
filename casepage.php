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
        </div>`,
        countryMapSiteStyle: "fill: #fff;"
    }    
    //foConfig.language = "fi"; // Override language.
    document.body.classList.add('casepage');
    document.querySelector("#page > div.wp-block-cover-full-width > div").insertAdjacentHTML("afterbegin", '<svg width="200" height="300" id="countryMap"></svg>');
</script>

<div id="loader-wrapper">
        <div id="PopUpMsg" class="popuptext"></div>
        <div id="loader"></div>
</div>
<div id="Details" class="FOPopup hidden"></div>
<div id="DownloadPopup" class="FOPopup hidden"></div>
<script id="fieldobservatory-markdown-it-js" src="https://cdnjs.cloudflare.com/ajax/libs/markdown-it/13.0.1/markdown-it.min.js" integrity="sha512-SYfDUYPg5xspsG6OOpXU366G8SZsdHOhqk/icdrYJ2E/WKZxPxze7d2HD3AyXpT7U22PZ5y74xRpqZ6A2bJ+kQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/markdown-it/markdown-it -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js" integrity="sha512-Nwp3XMQKRvqr376bCa50Hs4X4z5zbsefo63QLa62poTx5o/GhYgjnToCoBZk7bxjeP2y84oEgKNUrpK2+2Czyg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script> <!-- https://github.com/proj4js/proj4js -->
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCharts.js?ver=<?php echo wp_get_theme()->version ?>"></script>
<script type="text/js-worker" id="fieldobservatory-FODataViewerWorkerJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerWorker.js?ver=<?php echo wp_get_theme()->version ?>"></script>
<script type="text/javascript" id="fieldobservatory-FODataViewerCoreJs-js" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerCore.js?ver=<?php echo wp_get_theme()->version ?>"></script>
<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/assets/js/FODataViewerDOM.js?ver=<?php echo wp_get_theme()->version ?>"></script>
