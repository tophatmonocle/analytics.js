// Chartbeat
// ---------
// [Documentation](http://chartbeat.com/docs/adding_the_code/),
// [documentation](http://chartbeat.com/docs/configuration_variables/),
// [documentation](http://chartbeat.com/docs/handling_virtual_page_changes/).

analytics.addProvider('Chartbeat', {

    defaults : {
        // Chartbeat has multiple required keys.
        uid    : null,
        domain : null
    },

    initialize : function (options) {
        // Since all the custom settings just get passed through, update the
        // Chartbeat `_sf_async_config` variable with settings.
        window._sf_async_config = options;

        // Chartbeat needs the stored time when the page was first rendered, so
        // it can calculate page load times for the user/server.
        window._sf_endpt = analytics.date.getTime();

        analytics._.loadScript({
            http  : 'http://static.chartbeat.com/js/chartbeat.js',
            https : 'https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/js/chartbeat.js'
        });
    },

    // Chartbeat supports virtual URLs and the `url` property is required, so we
    // default to the current URL.
    pageview : function (url) {
        if (!window.pSUPERFLY) return;

        window.pSUPERFLY.virtualPage(url || window.location.pathname);
    }

});


