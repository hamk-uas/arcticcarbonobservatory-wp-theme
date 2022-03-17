<?php get_header(); ?>
<div class="bgcolorWhite" style="margin-top:150px"></div>
        <div class="themeContainer remove-list-bullet"id="home">
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

 <h1><?php the_title(); ?></h1>
 <?php the_content(); ?>
 <p><?php echo get_the_date(); ?></p>

<?php endwhile; ?>
<?php endif; ?>
</div>
</div>
<?php
    wp_footer();
    get_footer();
    ?>