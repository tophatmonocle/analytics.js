// Clicky
// ------
// [Documentation](http://clicky.com/help/customization/manual?new-domain).

analytics.addProvider('Clicky', {

    settings : {
        siteId : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'siteId');
        analytics.utils.extend(this.settings, settings);

        var clicky_site_ids = window.clicky_site_ids = window.clicky_site_ids || [];
        clicky_site_ids.push(settings.siteId);

        analytics.utils.loadScript('//static.getclicky.com/js');
    },


    // Track
    // -----

    track : function (event, properties) {
        // We aren't guaranteed `clicky` is available until the script has been
        // requested and run, hence the check.
        if (window.clicky) window.clicky.log(window.location.href, event);
    }

});


