<!-- \\ Begin Footer \\-->
<?php
     $imageUrl = get_template_directory_uri();
     $callOutEmail1 = 'fo-footer-callout-email1-' . pll_current_language();
     $callOutEmail2 = 'fo-footer-callout-email2-' . pll_current_language();
    ?>
    <footer id="mainFooter">
       
        <div class="Contact_sec" id="contact">
            <div class="Contactside">
                <div class="Center" style="padding: 25px 60px; font-size: 32px;">

                    <h3 style="color:#fff"><?php echo get_theme_mod('fo-footer-callout-headline-' . pll_current_language()) ?></h3>
                    <address class="Email" style="font-size: 16px;">
                        <a href="mailto:<?php echo get_theme_mod($callOutEmail1) ?>"><?php echo get_theme_mod($callOutEmail1) ?></a>
                        <br />
                        <a href="mailto:<?php echo get_theme_mod($callOutEmail2) ?>"><?php echo get_theme_mod($callOutEmail2) ?></a>
                        <br />
                        <div style="display:inline-flex;"><img src="<?php echo get_template_directory_uri(); ?>/assets/images/ArrowRightWhite.svg" style="width:14px; margin-right:10px;" /><a href="Privacy">Privacy policy</a></div>
                    </address>
                </div>
            </div>
        </div>
        <div class="Cntr">
            
                
                     <?php dynamic_sidebar('footer-1') ?>
                
            
        </div>
    </footer>