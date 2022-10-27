<!-- \\ Begin Footer \\-->
<?php
     $imageUrl = get_template_directory_uri();
     $callOutEmail1 = 'fo-footer-callout-email1-' . pll_current_language();
     $callOutEmail2 = 'fo-footer-callout-email2-' . pll_current_language();
    ?>
    <footer id="mainFooter">
        <!-- <h3 style="color:#fff"><?php echo get_theme_mod('fo-footer-callout-headline-' . pll_current_language()) ?></h3>
        <address class="Email" style="font-size: 16px;">
            <a href="mailto:<?php echo get_theme_mod($callOutEmail1) ?>"><?php echo get_theme_mod($callOutEmail1) ?></a>
            <br />
            <a href="mailto:<?php echo get_theme_mod($callOutEmail2) ?>"><?php echo get_theme_mod($callOutEmail2) ?></a>
            <br />
            <div style="display:inline-flex;"><img src="<?php echo get_template_directory_uri(); ?>/assets/images/ArrowRightWhite.svg" style="width:14px; margin-right:10px;" /><a href="Privacy">Privacy policy</a></div>
        </address> -->
        <div >
            <h4 class="footer-contact-translation footer-area-contact has-white-color">
            <?php pll_e('Contact us'); ?>
            </h4>
        </div>
        <?php dynamic_sidebar('footer-contact') ?>
        <?php dynamic_sidebar('footer-logos') ?>
    </footer>