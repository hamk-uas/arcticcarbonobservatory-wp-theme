
<?php
    get_header();
    
?>
<div class="DesignHolder">
        <div class="LayoutFrame">
            <div class="BannerContainer">
                <div class="Banner_secWhite" style="background:url(<?php the_post_thumbnail_url() ?>)" id="home">
                    <div class="bannerside animationFade-ms200">
                        <a href=<?php echo get_post_meta($post->ID, 'fieldDataBtnHref', true); ?>>
                            <div class="image-containerBanner"><div class="btnToDataSiteText"><h2><?php echo get_post_meta($post->ID, 'fieldDataBtnTextFirstLine', true); ?></h2>
                            <h2><?php echo get_post_meta($post->ID, 'fieldDataBtnTextSecondLine', true); ?></h2></div><div class="whiteArrowRight"></div></div>
                        </a>
                    </div>
                <div class="clear"></div>
            </div>
        </div>
        <div class="bgcolorWhite"></div>
        <div class="themeContainer"id="home">
        <div class="Center">
            <?php if( have_posts())
                {
                    while( have_posts())
                    {
                        the_post();
                        the_content();
                    }
                } ?>
        </div>
<script type="text/javascript">
    document.body.classList.remove('loader');
    document.body.classList.add('loaded');
</script>
    </div>
</div>

<?php
    wp_footer();
    get_footer();
    ?>
<!--<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script type="text/javascript" src="js/jquery.sudoSlider.min.js"></script>
<script type="text/javascript" src="js/global.js"></script>
<script type="text/javascript" src="js/modernizr.js"></script>-->