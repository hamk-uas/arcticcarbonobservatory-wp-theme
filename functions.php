<?php 
function arcticcarbonobservatory_data_viewer_register_styles_and_scripts() {
    // Enqueue stylesheets
    wp_enqueue_style('arcticcarbonobservatory-ACODataViewer-css',get_theme_file_uri("/assets/css/ACODataViewer.css"),array(),wp_get_theme()->version,'all');

    // Register Arctic Carbon Observatory configuration script
    wp_register_script('arcticcarbonobservatory-ACOConfig-js',get_theme_file_uri("/assets/js/ACOConfig.js"),array('observatory-OConfig-js'),wp_get_theme()->version,true);

    // Get ready to launch data viewer for certain pages, requiring page-specific configuration js files
    if ( is_page(array('data')) ) {
        wp_enqueue_script('arcticcarbonobservatory-ACOConfig-js');
    }
}

add_action('wp_enqueue_scripts','arcticcarbonobservatory_data_viewer_register_styles_and_scripts');