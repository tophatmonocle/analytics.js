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
        settings = analytics._.resolveSettings(settings, 'siteId');
        analytics._.extend(this.settings, settings);

        var _gauges = window._gauges = window._gauges || [];

        analytics._.loadScript({
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


