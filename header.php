<!doctype html>
<html lang="<?php echo explode("_", get_locale())[0]?>">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <!-- <link href='https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,600italic,400italic,800,700' rel='stylesheet' type='text/css'> -->
    <!-- <link href='https://fonts.googleapis.com/css?family=Oswald:400,700,300' rel='stylesheet' type='text/css'> -->
    <link rel="stylesheet" href="https://use.typekit.net/htc8dba.css">
    <?php
        wp_head();
        $imageUrl = get_template_directory_uri();
    ?>
    <script>
        function toggleNavMenu() {
          let x = document.getElementById("navigation-element");
          if (x.className === "navigation") {
            x.className += " responsive";
          } else {
            x.className = "navigation";
          }
        }
    </script>
</head>
<body>
<?php 
    $defaults = array(
        'theme_location'  => 'primary',
        'menu'            => '',
        'container'       => 'nav',
        'container_class' => '',
        'container_id'    => '',
        'menu_class'      => 'menu',
        'menu_id'         => '',
        'echo'            => true,
        'fallback_cb'     => 'wp_page_menu',
        'before'          => '',
        'after'           => '',
        'link_before'     => '',
        'link_after'      => '',
        'items_wrap'      => '<ul id="%1$s" class="%2$s">%3$s</ul>',
        'depth'           => 0,
        'walker'          => ''
       );
       
    //    wp_nav_menu( $defaults );
?>
<header id="mainHeader">
    <div class="header-container">
        <div class="site-logo">
            <a href="<?php echo home_url(); ?>">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/images/fieldobslogowhitewithspaces.svg"/>
            </a>
        </div>
        <div class="navigation-container">
            <a href="javascript:void(0);" class="icon fieldobservatory-toggle-nav" onclick="toggleNavMenu()">&#9776;</a>
            <nav class="navigation" id="navigation-element">
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
</header>
            <!-- <header id="mainHeader">
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
        </header> -->


 </body>