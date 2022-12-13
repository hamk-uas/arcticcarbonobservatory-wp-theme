<script type="text/javascript">    
    var foConfig = {
        mapboxgl: {
            accessToken: "pk.eyJ1IjoiaGFta3NtYXJ0IiwiYSI6ImNreG9sN3p0cDAweTkycG8yZ3B3NHV5cjUifQ.YfKxbZoIH0pR7x2ZU6bDIA"
        },
        storageUrl: 'https://field-observatory.data.lit.fmi.fi',
        demoStorageUrl: 'https://field-observatory-demo.data.lit.fmi.fi',
        dataSchemaUrl: 'https://raw.githubusercontent.com/hamk-uas/fieldobservatory-data-schemas/main/management-event.schema.json',
        language: "<?php echo explode("_", get_locale())[0]?>", // fi -> fi, sv_SE -> sv, en_US -> en
        imagesUrl: "<?php echo get_template_directory_uri(); ?>/assets/images",
        now: Date.now().valueOf()
    }
</script>