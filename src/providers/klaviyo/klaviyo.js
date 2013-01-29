// Klaviyo
// -------
// [Documentation](https://www.klaviyo.com/docs).
// [Documentation](https://www.klaviyo.com/docs/http-api).

analytics.addProvider('Klaviyo', {

    settings : {
        apiKey : null
    },


    // Initialize
    // ----------

    // Changes to the Google Analytics snippet:
    //
    // * Added `apiKey`.
    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'apiKey');
        analytics._.extend(this.settings, settings);

        var _learnq = window._learnq = window._learnq || [];
        _learnq.push(['account', this.settings.apiKey]);

        analytics._.loadScript('//a.klaviyo.com/media/js/learnmarklet.js');
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        // Klaviyo takes the user ID on the traits object itself.
        traits || (traits = {});
        if (userId) traits.$id = userId;

        window._learnq.push(['identify', traits]);
    },


    // Track
    // -----

    track : function (event, properties) {
        window._learnq.push(['track', event, properties]);
    }

});


