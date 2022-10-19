<?php
    get_header();
?>
<div class="DesignHolder">
        <!-- <div class="LayoutFrame">
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
        </div> -->
        <div class="bgcolorWhite"></div>
        <div class="themeContainer"id="home">
            <?php
                $blocks = parse_blocks(get_the_content());
                // echo '<p>holder</p>';
                // foreach(array_keys($blocks) as $paramName) {
                //     echo $paramName['blockName'] . "<br>";
                // }

                // foreach($blocks as $block) {
                //     // echo $block;
                //     if ($block['blockName'] === 'core/cover') {
                //         // print_r($block['innerBlocks']);
                //         // print_r($block);
                //         print_r($block['blockName']);
                //         echo '<br/>';
                //         echo '<hr>';
                //         echo '<p>attrs</p>';
                //         print_r($block['attrs']);
                //         echo '<br/>';
                //         echo '<hr>';
                //         echo '<p>innerBlocks</p>';
                //         print_r($block['innerBlocks']);
                //         echo '<br/>';
                //         echo '<hr>';
                //         echo do_shortcode($block['innerHTML']);
                //         foreach($block['innerBlocks'] as $childBlock) {
                //             echo do_shortcode($childBlock['innerHTML']);
                //         }
                //         // print_r($block['attrs']);
                //         // echo '<br/>';
                //         // print_r($block['attrs']);
                //         // echo '<br/>';
                //         // print_r($block['attrs']);
                //         // echo '<br/>';
                //     }
                //     // if ($block['blockName'] === 'core/cover') {
                //     //     print_r($block);
                //     //     echo do_shortcode($block['innerHTML']);
                //     //     // foreach($block['innerContent'] as $childContent) {
                //     //     //     echo do_shortcode($childContent['innerHTML']);
                //     //     // }
                //     //     foreach($block['innerBlocks'] as $blockContent) {
                //     //         // echo "<p>";
                //     //         // echo $blockContent['blockName'];
                //     //         // echo "</p>";
                //     //         echo do_shortcode($blockContent['innerHTML']);
                //     //     }
                //     //     break;
                //     // }
                // }

                // $content_markup = '';
                // foreach ( $blocks as $block ) {
                //     if ( 'core/cover' === $block['blockName'] ) {
                //         continue;
                //     } else {
                //         $content_markup .= render_block( $block );
                //     }
                // }

                // // Remove wpautop filter so we do not get paragraphs for two line breaks in the content.
                // $priority = has_filter( 'the_content', 'wpautop' );
                // if ( false !== $priority ) {
                //     remove_filter( 'the_content', 'wpautop', $priority );
                // }

                // echo apply_filters( 'the_content', $content_markup );

                // if ( false !== $priority ) {
                //     add_filter( 'the_content', 'wpautop', $priority );
                // }
            ?>
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