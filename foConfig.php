<script type="text/javascript">    
    var foConfig = {
        rootDir: '<?php echo get_template_directory_uri(); ?>',
        mapboxgl: {
            accessToken: "pk.eyJ1IjoiaGFta3NtYXJ0IiwiYSI6ImNreG9sN3p0cDAweTkycG8yZ3B3NHV5cjUifQ.YfKxbZoIH0pR7x2ZU6bDIA"
        },
        storageUrl: 'https://field-observatory.data.lit.fmi.fi',
        demoStorageUrl: 'https://field-observatory-demo.data.lit.fmi.fi',
        managementEventSchemaJsonUrl: '<?php echo get_template_directory_uri(); ?>/assets/json/management-event.schema.json?ver=<?php echo wp_get_theme()->version ?>',
        language: "<?php echo pll_current_language()?>", // Was: explode("_", get_locale())[0] which did fi -> fi, sv_SE -> sv, en_US -> en
        imagesUrl: "<?php echo get_template_directory_uri(); ?>/assets/images",
        now: Date.now().valueOf()
    }
</script>