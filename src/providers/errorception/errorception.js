// Errorception
// ------------
// [Documentation](http://errorception.com/).

analytics.addProvider('Errorception', {

    key : 'projectId',

    defaults : {
        // Whether to store metadata about the user on `identify` calls, using
        // the [Errorception `meta` API](http://blog.errorception.com/2012/11/capture-custom-data-with-your-errors.html).
        meta : true
    },

    // Create the `_errs` queue with the `projectId`, setup the global `onerror`
    // handler and then load the Errorception library.
    initialize : function (options) {
        var _errs = window._errs = window._errs || [options.projectId];
        window.onerror = function () { _errs.push(arguments); };
        analytics._.loadScript('//d15qhc0lu1ghnk.cloudfront.net/beacon.js');
    },

    // Errorception can store information about the user to help with debugging.
    // We keep this on by default, since it's useful.
    identify : function (userId, traits) {
        if (!traits) return;

        // If the custom metadata object hasn't ever been made, make it.
        window._errs.meta || (window._errs.meta = {});

        // Add all of the traits as metadata, keeping any exists ones.
        if (this.options.meta) analytics._.extend(window._errs.meta, traits);
    }

});


