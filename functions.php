<?php 
function arcticcarbonobservatory_register_styles() {
    wp_enqueue_style('arcticcarbonobservatory-ACODataViewer',get_theme_file_uri("/assets/css/ACODataViewer.css"),array(),wp_get_theme()->version,'all');
}

add_action('wp_enqueue_scripts','arcticcarbonobservatory_register_styles', 11);

wp_enqueue_script('observatory-markdown-it-js','https://cdnjs.cloudflare.com/ajax/libs/markdown-it/13.0.1/markdown-it.min.js',array(),wp_get_theme()->version,true);
wp_enqueue_script('observatory-proj4','https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js',array(),wp_get_theme()->version,true);
wp_enqueue_script('observatory-ODataViewerCoreJs-js',get_parent_theme_file_uri("/assets/js/ODataViewerCore.js"),array(),wp_get_theme()->version,true);
wp_enqueue_script('arcticcarbonobservatory-ACOConfigJS',get_theme_file_uri("/assets/js/ACOConfig.js"),array(),wp_get_theme()->version,true);