// KISSmetrics
// -----------
// [Documentation](http://support.kissmetrics.com/apis/javascript).

analytics.addProvider('KISSmetrics', {

    key : 'apiKey',

    // Create the `_kmq` queue and load in the KISSmetrics scripts,
    // concatenating the `apiKey` into the URL.
    initialize : function (options) {
        var _kmq = window._kmq = window._kmq || [];

        this.loadScript('//i.kissmetrics.com/i.js');
        this.loadScript('//doug1izaerwt3.cloudfront.net/' + options.apiKey + '.1.js');
    },

    // KISSmetrics uses two separate methods: `identify` for storing the
    // `userId`, and `set` for storing `traits`.
    identify : function (userId, traits) {
        if (userId) window._kmq.push(['identify', userId]);
        if (traits) window._kmq.push(['set', traits]);
    },

    track : function (event, properties) {
        window._kmq.push(['record', event, properties]);
    }

});


