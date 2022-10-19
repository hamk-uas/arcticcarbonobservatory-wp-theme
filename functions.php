<?php

	function fieldobservatory_theme_support(){
		//adds dynamic title tag support	
		add_theme_support('title-tag');
		add_theme_support('custom-logo');
		add_theme_support('post-thumbnails');
	}
	
	add_action('after_setup_theme','fieldobservatory_theme_support');
	
	
	function fieldobservatory_menus()
	{
		$locations = array(
			'primary'=>"Desktop primary"
		);
		register_nav_menus($locations);
	}
	add_action('init','fieldobservatory_menus');
	
	function fielobservatory_register_styles(){
    	$version = wp_get_theme()->version;
		wp_enqueue_style('fieldobservatory-theme', get_template_directory_uri() . "/assets/css/theme.css",array(),$version,'all');
		wp_enqueue_style('fieldobservatory-fontawesome',get_template_directory_uri() . "/assets/css/fontawesome.min.css",array(),'all');
		wp_enqueue_style('fieldobservatory-mapboxglGeocoder',"https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.5.1/mapbox-gl-geocoder.css",array(),'all');
		wp_enqueue_style('fieldobservatory-mapboxglcss',"https://api.mapbox.com/mapbox-gl-js/v2.7.1/mapbox-gl.css",array(),'all');
		wp_enqueue_style('fieldobservatory-mapViewMedia',get_template_directory_uri() . "/assets/css/mapviewmedia.css",array(),$version,'all');
	}	
	
	add_action('wp_enqueue_scripts','fielobservatory_register_styles');
	
	function fielobservatory_register_scripts(){
    	$version = wp_get_theme()->version;
		wp_enqueue_script('fieldobservatory-jquery','https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js',array(),'3.5.1',true);
		wp_enqueue_script('fieldobservatory-global',get_template_directory_uri() . '/assets/js/global.js',array(),$version,true);
		wp_enqueue_script('fieldobservatory-sudoSlider',get_template_directory_uri() .'/assets/js/jquery.sudoSlider.min.js',array(),$version,true);
		wp_enqueue_script('fieldobservatory-mapboxgl','https://api.tiles.mapbox.com/mapbox-gl-js/v2.7.1/mapbox-gl.js',array(),true);
		wp_enqueue_script('fieldobservatory-mapboxglGeoCoderjs','https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.5.1/mapbox-gl-geocoder.min.js',array(),true);
	}	
	
	add_action('wp_enqueue_scripts','fielobservatory_register_scripts');
	
	function fieldobservatory_widget_areas(){
		register_sidebar(
			array(
				'before_title'=>'',
				'after_title'=>'',
				'before_widget'=>'<div class="grid-itemLogo">',
				'after_widget'=>'</div>',
				'name'=>'Footer Area',
				'id'=>'footer-1',
				'description'=>'Footer Widget Area'
			)
		);
	}
	add_action('widgets_init','fieldobservatory_widget_areas');
	
	//Add footer callout section to admin appearence customize screen
	
	function fieldobservatory_footer_callout($wp_customize){
		
		//ENG
		$wp_customize->add_section('fo-footer-callout-section-en',array(
			'title'=> "Footer en"
		));
		$wp_customize->add_setting('fo-footer-callout-headline-en',array(
			'default'=>'CONTACT US'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-headline-control-en',array(
			'label'=>"Headline",
			'section'=> "fo-footer-callout-section-en",
			'settings'=> "fo-footer-callout-headline-en"
		)));
		$wp_customize->add_setting('fo-footer-callout-email1-en',array(
			'default'=>'asa.stam@fmi.fi'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-email1-control-en',array(
			'label'=>"Email1",
			'section'=> "fo-footer-callout-section-en",
			'settings'=> "fo-footer-callout-email1-en",
			'type'=>'email'
		)));
		$wp_customize->add_setting('fo-footer-callout-email2-en',array(
			'default'=>'pieta.jarva@bsag.fi'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-email2-control-en',array(
			'label'=>"Email2",
			'section'=> "fo-footer-callout-section-en",
			'settings'=> "fo-footer-callout-email2-en",
			'type'=>'email'
		)));
		
		//FI
		$wp_customize->add_section('fo-footer-callout-section-fi',array(
			'title'=> "Footer fi"
		));
		$wp_customize->add_setting('fo-footer-callout-headline-fi',array(
			'default'=>'OTA YHTEYTTÄ'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-headline-control-fi',array(
			'label'=>"Headline",
			'section'=> "fo-footer-callout-section-fi",
			'settings'=> "fo-footer-callout-headline-fi"
		)));
		$wp_customize->add_setting('fo-footer-callout-email1-fi',array(
			'default'=>'asa.stam@fmi.fi'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-email1-control-fo',array(
			'label'=>"Email1",
			'section'=> "fo-footer-callout-section-fi",
			'settings'=> "fo-footer-callout-email1-fi",
			'type'=>'email'
		)));
		$wp_customize->add_setting('fo-footer-callout-email2-fi',array(
			'default'=>'pieta.jarva@bsag.fi'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-email2-control-fi',array(
			'label'=>"Email2",
			'section'=> "fo-footer-callout-section-fi",
			'settings'=> "fo-footer-callout-email2-fi",
			'type'=>'email'
		)));
		
		//SWE
		$wp_customize->add_section('fo-footer-callout-section-sv',array(
			'title'=> "Footer sv"
		));
		$wp_customize->add_setting('fo-footer-callout-headline-sv',array(
			'default'=>'TA KONTAKT'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-headline-control-sv',array(
			'label'=>"Headline",
			'section'=> "fo-footer-callout-section-sv",
			'settings'=> "fo-footer-callout-headline-sv"
		)));
		$wp_customize->add_setting('fo-footer-callout-email1-sv',array(
			'default'=>'asa.stam@fmi.fi'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-email1-control-sv',array(
			'label'=>"Email1",
			'section'=> "fo-footer-callout-section-sv",
			'settings'=> "fo-footer-callout-email1-sv",
			'type'=>'email'
		)));
		$wp_customize->add_setting('fo-footer-callout-email2-sv',array(
			'default'=>'pieta.jarva@bsag.fi'
			
		));
		$wp_customize->add_control(new WP_Customize_Control($wp_customize,'fo-footer-callout-email2-control-sv',array(
			'label'=>"Email2",
			'section'=> "fo-footer-callout-section-sv",
			'settings'=> "fo-footer-callout-email2-sv",
			'type'=>'email'
		)));
	}
	
	add_action('customize_register','fieldobservatory_footer_callout');
	
    function font_mime_types($mimes) {
  $mimes['svg'] = 'image/svg+xml';
  $mimes['svgz'] = 'image/svg+xml';
  $mimes['woff'] = 'font/woff';
  $mimes['woff2'] = 'font/woff2';
  $mimes['otf'] = 'font/otf';
  $mimes['html'] = 'text/html';
  return $mimes;
}
add_filter('upload_mimes', 'font_mime_types');

function fieldobservatory_block_wrapper( $block_content, $block ) {
	if ( $block['blockName'] === 'core/cover' ) {
		$content = '<div class="wp-block-cover-full-width">';
		$content .= $block_content;
		$content .= '</div>';
		return $content;
	}
	return $block_content;
}

add_filter( 'render_block', 'fieldobservatory_block_wrapper', 10, 2 );

function add_query_string($url) {
	return empty($_SERVER['QUERY_STRING'])? $url : $url.'?'.$_SERVER['QUERY_STRING'];
}
add_filter('pll_the_language_link', 'add_query_string');

?>