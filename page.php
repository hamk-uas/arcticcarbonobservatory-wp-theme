    
  <?php
        
        get_header();
        $imageUrl = get_template_directory_uri();

    global $post; 
    	$postid = $post->ID;
    	
    	if ($postid == '68') 
    	{
           // Use page-online-field-data.php and do not show banner
    	}
        else
        {
        	if(get_post_meta($post->ID, 'showFeaturedImage', true)=='false')
            {
             // do not show featured image at page
            }
            else
            {
           ?>
            <div class="DesignHolder">
                <!-- \\ Begin Frame \\ -->
                <div class="LayoutFrame">
                    <div class="clear"></div>
                </div>
            </div>
             <div class="bgcolorWhite"></div>
             <?php } ?>
            <div class="themeContainer"id="page">
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
                // Changes to _Layout.cshtml
            // document.getElementsByClassName('current-menu-item').className = 'active';
            </script>
            </div>
            <!-- // End Layout Frame // -->
        </div>
<?php
        }
	
?>


<?php
    wp_footer();
    get_footer();
    ?>