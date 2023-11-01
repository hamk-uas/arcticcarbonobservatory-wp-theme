<?php get_header(); ?>
<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>    
<div id="redoc-container"></div>
<script>
  Redoc.init('<?php echo get_template_directory_uri(); ?>/assets/json/api.json?ver=<?php echo wp_get_theme()->version ?>', {
    "expandResponses": "all",
    "jsonSampleExpandLevel": "all",
    "schemaExpansionLevel": "all"
  }, document.getElementById('redoc-container'))
</script>

<?php
wp_footer();
get_footer();
?>

<?php include 'foConfig.php'?>
<script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">

