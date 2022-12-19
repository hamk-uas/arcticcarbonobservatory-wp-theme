    
  <?php get_header(); ?>
    





    <redoc spec-url="<?php echo get_template_directory_uri(); ?>/assets/json/api.json?ver=<?php echo wp_get_theme()->version ?>" json-sample-expand-level="all" schema-expansion-level="all"></redoc>
    <!-- redoc spec-url="https://raw.githubusercontent.com/hamk-uas/fieldobservatory-data-schemas/main/api.json" json-sample-expand-level="all" schema-expansion-level="all"></redoc -->
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>







<?php
wp_footer();
get_footer();
?>

<?php include 'foConfig.php'?>
<script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">

