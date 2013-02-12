// Customer.io
// -----------
// [Documentation](http://customer.io/docs/api/javascript.html).

analytics.addProvider('Customer.io', {

    key : 'siteId',

    // Setup the Customer.io queue and methods, and load in their library.
    initialize : function (options) {
        var _cio = window._cio = window._cio || [];
        (function() {
            var a,b,c;
            a = function (f) {
                return function () {
                    _cio.push([f].concat(Array.prototype.slice.call(arguments,0)));
                };
            };
            b = ['identify', 'track'];
            for (c = 0; c < b.length; c++) {
                _cio[b[c]] = a(b[c]);
            }
        })();

        analytics._.loadScript({
            http       : 'https://assets.customer.io/assets/track.js',
            https      : 'https://assets.customer.io/assets/track.js',
            id         : 'cio-tracker',
            attributes : {
                'data-site-id' : options.sideId
            }
        });
    },

    identify : function (userId, traits) {
        // Don't do anything if we just have traits, because Customer.io
        // requires a `userId`.
        if (!userId) return;

        traits || (traits = {});

        // Customer.io takes the `userId` as part of the traits object.
        traits.id = userId;

        // If there wasn't already an email and the userId is one, use it.
        if (!traits.email && analytics._.isEmail(userId)) {
            traits.email = userId;
        }

        // Swap the `created` trait to the `created_at` that Customer.io needs
        // (in seconds).
        if (traits.created) {
            traits.created_at = analytics._.getSeconds(traits.created);
            delete traits.created;
        }

        window._cio.identify(traits);
    },

    track : function (event, properties) {
        window._cio.track(event, properties);
    }

});


