// Bitdeli
// -------
// * [Documentation](https://bitdeli.com/docs)
// * [JavaScript API Reference](https://bitdeli.com/docs/javascript-api.html)

analytics.addProvider('Bitdeli', {

    defaults : {
        // Bitdeli has multiple required keys.
        inputId   : null,
        authToken : null,
        // Whether or not to track an initial pageview when the page first
        // loads. You might not want this if you're using a single-page app.
        initialPageview : true
    },

    // Setup the Bitdeli queue and load the latest version of their library.
    initialize : function (options) {
        // Setup the `_bdq` queue and add the account information.
        var _bdq = window._bdq = window._bdq || [];
        _bdq.push(["setAccount", options.inputId, options.authToken]);

        // If the `initialPageview` option is enabled, track a pageview.
        if (options.initialPageview) this.pageview();

        this.loadScript('//d2flrkr957qc5j.cloudfront.net/bitdeli.min.js');
    },

    // Bitdeli uses two separate methods: `identify` for storing the `userId`
    // and `set` for storing `traits`.
    identify : function (userId, traits) {
        if (userId) window._bdq.push(['identify', userId]);
        if (traits) window._bdq.push(['set', traits]);
    },

    // Track is just like ours.
    track : function (event, properties) {
        window._bdq.push(['track', event, properties]);
    },

    // If `url` is undefined, Bitdeli uses the current page's URL instead.
    pageview : function (url) {
        window._bdq.push(['trackPageview', url]);
    }

});


