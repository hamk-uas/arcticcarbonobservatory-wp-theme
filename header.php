<?php
    function add_query_string($url) {
        return empty($_SERVER['QUERY_STRING'])? $url : $url.'?'.$_SERVER['QUERY_STRING'];
    }
    add_filter('pll_the_language_link', 'add_query_string');
?>
<!doctype html>
<html lang="<?php echo explode("_", get_locale())[0]?>">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link href='https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,600italic,400italic,800,700' rel='stylesheet' type='text/css'>
    <link href='https://fonts.googleapis.com/css?family=Oswald:400,700,300' rel='stylesheet' type='text/css'>
    <?php
        wp_head();
        $imageUrl = get_template_directory_uri();
    ?>
</head>
<body>
            <header id="mainHeader">
                <div class="Center">
                    <div class="site-logo">
                        <a href="<?php echo home_url(); ?>">
                            <img src="<?php echo get_template_directory_uri(); ?>/assets/images/fieldobslogowhitewithspaces.svg"/>
                        </a>
                    </div>
                    <div id="mobile_sec" style="width:100%">
                        <div class="mobile"><i class="fa fa-bars"></i><i class="fa fa-times"></i></div>
                        <div class="menumobile">
                            <nav class="Navigation">
                                <?php 
                                    wp_nav_menu(
                                      array(
                                          'menu'=>'primary',
                                          'container'=>'',
                                          'theme_location'=>'primary',
                                          'items_wrap'=>'<ul id="" class="">%3$s</ul>'
                                      )  
                                    );
                                ?>
                                
                        </nav>
                    </div>
                </div>
                <div class="clear"></div>
            </div>
        </header>
 </body>