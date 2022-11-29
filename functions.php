<?php

	function fieldobservatory_theme_support(){
		//adds dynamic title tag support	
		add_theme_support('title-tag');
		add_theme_support('custom-logo');
		add_theme_support('post-thumbnails');

		// add_theme_support('editor-styles');
		add_theme_support('editor-color-palette', array(
			array(
				'name'  => esc_attr__( 'Black', 'fieldobservatory' ),
				'slug'  => 'fieldobservatory-black',
				'color' => '#000000',
			),
			array(
				'name'  => esc_attr__( 'White', 'fieldobservatory' ),
				'slug'  => 'fieldobservatory-white',
				'color' => '#ffffff',
			),
			array(
				'name'  => esc_attr__( 'Highlight', 'fieldobservatory' ),
				'slug'  => 'fieldobservatory-highlight',
				'color' => '#71cdb6',
			),
			array(
				'name'  => esc_attr__( 'Body', 'fieldobservatory' ),
				'slug'  => 'fieldobservatory-body',
				'color' => '#5e5e5e',
			),
		));
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
		wp_enqueue_style('fieldobservatory-mapboxglGeocoder',"https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css",array(),'all');
		wp_enqueue_style('fieldobservatory-mapboxglcss',"https://api.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl.css",array(),'all');
		wp_enqueue_style('fieldobservatory-FODataViewer',get_template_directory_uri() . "/assets/css/FODataViewer.css",array(),$version,'all');
	}	
	
	add_action('wp_enqueue_scripts','fielobservatory_register_styles');
	
	function fieldobservatory_register_scripts(){
    	$version = wp_get_theme()->version;
		wp_enqueue_script('fieldobservatory-jquery','https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js',array(),'3.5.1',true);
		wp_enqueue_script('fieldobservatory-global',get_template_directory_uri() . '/assets/js/global.js',array(),$version,true);
		wp_enqueue_script('fieldobservatory-sudoSlider',get_template_directory_uri() .'/assets/js/jquery.sudoSlider.min.js',array(),$version,true);
		wp_enqueue_script('fieldobservatory-mapboxgl','https://api.tiles.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl.js',array(),true);
		wp_enqueue_script('fieldobservatory-mapboxglGeoCoderjs','https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js',array(),true);
	}	
	
	add_action('wp_enqueue_scripts','fieldobservatory_register_scripts');
	
	function fieldobservatory_widget_areas(){
		register_sidebar(
			array(
				'before_title'=>'<h4>',
				'after_title'=>'</h4>',
				'before_widget'=>'<section class="footer-area footer-area-contact footer-area-contact-contacts">',
				'after_widget'=>'</section>',
				'name'=>'Footer Area',
				'id'=>'footer-contact',
				'description'=>'Footer Widget Area Contact'
			)
		);

		register_sidebar(
			array(
				'before_title'=>'<h4>',
				'after_title'=>'</h4>',
				'before_widget'=>'<section class="footer-area footer-area-logos">',
				'after_widget'=>'</section>',
				'name'=>'Footer Area',
				'id'=>'footer-logos',
				'description'=>'Footer Widget Area logos'
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

function fieldobservatory_register_string_translations() {
	pll_register_string('fieldobservatory-contacts', 'Contact us');
}
add_action('init', 'fieldobservatory_register_string_translations');

function fieldobservatory_block_patterns() {
	register_block_pattern(
		'fieldobservatory/intro-pattern',
		array(
			'title' => __('Intro pattern', 'intro-pattern'),
			'description' => _x('Intro pattern description', 'intro-pattern'),
			'categories' => array('columns'),
			'content' => '<!-- wp:group {"style":{"color":{"background":"#71cdb6"}},"className":"intro-box-with-link"} -->
			<div class="wp-block-group intro-box-with-link has-background" style="background-color:#71cdb6"><!-- wp:heading {"textAlign":"center","textColor":"white"} -->
			<h2 class="has-text-align-center has-white-color has-text-color">Intro title</h2>
			<!-- /wp:heading -->
			
			<!-- wp:paragraph {"align":"center","textColor":"white"} -->
			<p class="has-text-align-center has-white-color has-text-color">Intro text content</p>
			<!-- /wp:paragraph -->
			
			<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"center"}} -->
			<div class="wp-block-group"><!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
			<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"fieldobservatory-highlight","textColor":"white","style":{"border":{"radius":"0px"}},"className":"intro-box-link"} -->
			<div class="wp-block-button intro-box-link"><a class="wp-block-button__link has-white-color has-fieldobservatory-highlight-background-color has-text-color has-background" style="border-radius:0px">Add title and link here</a></div>
			<!-- /wp:button --></div>
			<!-- /wp:buttons --></div>
			<!-- /wp:group --></div>
			<!-- /wp:group -->'
		)
	);

	register_block_pattern(
		'fieldobservatory/case-left-pattern',
		array(
			'title' => __('Case left pattern', 'case-left-pattern'),
			'description' => _x('Case left pattern', 'case-left-pattern'),
			'categories' => array('columns'),
			'content' => '<!-- wp:group {"className":"fieldobservatory-case-left fieldobservatory-case"} -->
			<div class="wp-block-group fieldobservatory-case-left fieldobservatory-case"><!-- wp:columns -->
			<div class="wp-block-columns"><!-- wp:column {"className":"fieldobservatory-case-column"} -->
			<div class="wp-block-column fieldobservatory-case-column"><!-- wp:image -->
			<figure class="wp-block-image"><img alt=""/></figure>
			<!-- /wp:image --></div>
			<!-- /wp:column -->
			
			<!-- wp:column {"backgroundColor":"fieldobservatory-highlight","className":"fieldobservatory-case-column"} -->
			<div class="wp-block-column fieldobservatory-case-column has-fieldobservatory-highlight-background-color has-background"><!-- wp:heading {"level":4,"textColor":"fieldobservatory-white"} -->
			<h4 class="has-fieldobservatory-white-color has-text-color">Add title</h4>
			<!-- /wp:heading -->
			
			<!-- wp:paragraph {"textColor":"fieldobservatory-white","fontSize":"small"} -->
			<p class="has-fieldobservatory-white-color has-text-color has-small-font-size">Add text</p>
			<!-- /wp:paragraph -->
			
			<!-- wp:group {"className":"fieldobservatory-case-row","layout":{"type":"flex","flexWrap":"nowrap"}} -->
			<div class="wp-block-group fieldobservatory-case-row"><!-- wp:buttons -->
			<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"fieldobservatory-highlight","textColor":"fieldobservatory-white","fontSize":"small"} -->
			<div class="wp-block-button has-custom-font-size has-small-font-size"><a class="wp-block-button__link has-fieldobservatory-white-color has-fieldobservatory-highlight-background-color has-text-color has-background">Add link</a></div>
			<!-- /wp:button --></div>
			<!-- /wp:buttons --></div>
			<!-- /wp:group --></div>
			<!-- /wp:column --></div>
			<!-- /wp:columns --></div>
			<!-- /wp:group -->'
		)
	);

	register_block_pattern(
		'fieldobservatory/case-right-pattern',
		array(
			'title' => __('Case right pattern', 'case-right-pattern'),
			'description' => _x('Case right pattern description', 'case-right-pattern'),
			'categories' => array('columns'),
			'content' => '<!-- wp:group {"className":"fieldobservatory-case-right fieldobservatory-case"} -->
			<div class="wp-block-group fieldobservatory-case-right fieldobservatory-case"><!-- wp:columns -->
			<div class="wp-block-columns"><!-- wp:column {"backgroundColor":"fieldobservatory-highlight","className":"fieldobservatory-case-column"} -->
			<div class="wp-block-column fieldobservatory-case-column has-fieldobservatory-highlight-background-color has-background"><!-- wp:heading {"level":4,"textColor":"fieldobservatory-white"} -->
			<h4 class="has-fieldobservatory-white-color has-text-color">Add title</h4>
			<!-- /wp:heading -->
			
			<!-- wp:paragraph {"textColor":"fieldobservatory-white","fontSize":"small"} -->
			<p class="has-fieldobservatory-white-color has-text-color has-small-font-size">Add text</p>
			<!-- /wp:paragraph -->
			
			<!-- wp:group {"className":"fieldobservatory-case-row","layout":{"type":"flex","flexWrap":"nowrap"}} -->
			<div class="wp-block-group fieldobservatory-case-row"><!-- wp:buttons -->
			<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"fieldobservatory-highlight","textColor":"fieldobservatory-white","fontSize":"small"} -->
			<div class="wp-block-button has-custom-font-size has-small-font-size"><a class="wp-block-button__link has-fieldobservatory-white-color has-fieldobservatory-highlight-background-color has-text-color has-background">Add link</a></div>
			<!-- /wp:button --></div>
			<!-- /wp:buttons --></div>
			<!-- /wp:group --></div>
			<!-- /wp:column -->
			
			<!-- wp:column {"className":"fieldobservatory-case-column"} -->
			<div class="wp-block-column fieldobservatory-case-column"><!-- wp:image -->
			<figure class="wp-block-image"><img alt=""/></figure>
			<!-- /wp:image --></div>
			<!-- /wp:column --></div>
			<!-- /wp:columns --></div>
			<!-- /wp:group -->'
		)
	);
}

add_action('init', 'fieldobservatory_block_patterns');

?>
