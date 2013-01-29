// Chartbeat
// ---------
// [Documentation](http://chartbeat.com/docs/adding_the_code/),
// [documentation](http://chartbeat.com/docs/configuration_variables/),
// [documentation](http://chartbeat.com/docs/handling_virtual_page_changes/).

analytics.addProvider('Chartbeat', {

    settings : {
        domain : null,
        uid    : null
    },


    // Initialize
    // ----------

    // Changes to the Chartbeat snippet:
    //
    // * Pass `settings` directly as the config object.
    // * Replaced the date with our stored `date` variable.
    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'uid');
        analytics.utils.extend(this.settings, settings);

        // Since all the custom settings just get passed through, update the
        // Chartbeat `_sf_async_config` variable with settings.
        window._sf_async_config = this.settings || {};

        // Chartbeat needs the stored time when the page was first rendered, so
        // it can calculate page load times for the user/server.
        window._sf_endpt = analytics.date.getTime();

        analytics.utils.loadScript({
            http  : 'http://static.chartbeat.com/js/chartbeat.js',
            https : 'https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/js/chartbeat.js'
        });
    },


    // Pageview
    // --------

    pageview : function (url) {
        window.pSUPERFLY.virtualPage(url || window.location.pathname);
    }

});


