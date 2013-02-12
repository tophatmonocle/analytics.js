// Clicky
// ------
// [Documentation](http://clicky.com/help/customization/manual?new-domain).

analytics.addProvider('Clicky', {

    key : 'siteId',

    // Setup the current Clicky account and load in the Clicky library.
    initialize : function (options) {
        window.clicky_site_ids = window.clicky_site_ids || [];
        window.clicky_site_ids.push(options.siteId);

        analytics._.loadScript('//static.getclicky.com/js');
    },

    // Clicky's `log` method only support event names, not properties.
    track : function (event, properties) {
        if (!window.clicky) return;

        // We aren't guaranteed `clicky` is available until the script has been
        // requested and run, hence the check.
        window.clicky.log(window.location.href, event);
    }

});


