// KISSmetrics
// -----------
// [Documentation](http://support.kissmetrics.com/apis/javascript).

analytics.addProvider('KISSmetrics', {

    settings : {
        apiKey : null
    },


    // Initialize
    // ----------

    // Changes to the KISSmetrics snippet:
    //
    // * Concatenate the `apiKey` into the URL.
    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'apiKey');
        analytics.utils.extend(this.settings, settings);

        var _kmq = window._kmq = window._kmq || [];

        analytics.utils.loadScript('//i.kissmetrics.com/i.js');
        analytics.utils.loadScript('//doug1izaerwt3.cloudfront.net/' + this.settings.apiKey + '.1.js');
    },


    // Identify
    // --------

    // KISSmetrics uses two separate methods: `identify` for storing the
    // `userId`, and `set` for storing `traits`.
    identify : function (userId, traits) {
        if (userId) window._kmq.push(['identify', userId]);
        if (traits) window._kmq.push(['set', traits]);
    },


    // Track
    // -----

    track : function (event, properties) {
        window._kmq.push(['record', event, properties]);
    }

});


