// USERcycle
// -----------
// [Documentation](http://docs.usercycle.com/javascript_api).

analytics.addProvider('USERcycle', {

    settings : {
        key : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'key');
        analytics._.extend(this.settings, settings);

        var _uc = window._uc = window._uc || [];
        window._uc.push(['_key', settings.key]);

        analytics._.loadScript('//api.usercycle.com/javascripts/track.js');
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        if (userId) window._uc.push(['uid', userId, traits]);
    },


    // Track
    // -----

    track : function (event, properties) {
        window._uc.push(['action', event, properties]);
    }

});


