// Gauges
// -------
// [Documentation](http://get.gaug.es/documentation/tracking/).

analytics.addProvider('Gauges', {

    settings : {
        siteId : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'siteId');
        analytics.utils.extend(this.settings, settings);

        var _gauges = window._gauges = window._gauges || [];

        analytics.utils.loadScript({
            fragment   : '//secure.gaug.es/track.js',
            id         : 'gauges-tracker',
            attributes : {
                'data-site-id' : settings.siteId
            }
        });
    },


    // Pageview
    // --------

    pageview : function (url) {
        window._gauges.push(['track']);
    }

});


