// FoxMetrics
// -----------
// [Documentation](http://foxmetrics.com/documentation)
// [Documentation - JS](http://foxmetrics.com/documentation/apijavascript)

analytics.addProvider('FoxMetrics', {

    key : 'appId',

    // Create the `_fxm` events queue and load the FoxMetrics library.
    initialize: function (options) {
        var _fxm = window._fxm || {};
        window._fxm = _fxm.events || [];
        this.loadScript('//d35tca7vmefkrc.cloudfront.net/scripts/' + options.appId + '.js');
    },

    identify: function (userId, traits) {
        // The `userId` is required.
        if (!userId) return;

        // FoxMetrics needs first and last name seperately.
        var firstName, lastName, email;
        if (traits && traits.name) {
            firstName = traits.name.split(' ')[0];
            lastName  = traits.name.split(' ')[1];
        }
        if (traits && traits.email) {
            email = traits.email;
        }

        // Remove the name and email traits, since they're sent separately.
        delete traits.name;
        delete traits.email;

        window._fxm.push([
            '_fxm.visitor.Profile',
            userId,    // ID
            firstName, // First name
            lastName,  // Last name
            email,     // Email address
            null,      // Address
            null,      // Social information
            null,      // Parter IDs
            traits     // Additional attributes
        ]);
    },

    track: function (event, properties) {
        // send in null as event category name
        window._fxm.push([event, null, properties]);
    },

    pageview: function (url) {
        // we are happy to accept traditional analytics :)
        // (title, name, categoryName, url, referrer)
        window._fxm.push(['_fxm.pages.view', null, null, null, (url || null), null]);
    }

});


