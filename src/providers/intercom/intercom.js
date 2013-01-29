// Intercom
// --------
// [Documentation](http://docs.intercom.io/).

analytics.addProvider('Intercom', {

    settings : {
        appId  : null,

        // An optional setting to display the Intercom inbox widget.
        activator : null
    },


    // Initialize
    // ----------

    // Intercom identifies when the script is loaded, so instead of initializing
    // in `initialize`, we store the settings for later and initialize in
    // `identify`.
    initialize: function (settings) {
        settings = analytics._.resolveSettings(settings, 'appId');
        analytics._.extend(this.settings, settings);
    },


    // Identify
    // --------

    // Changes to the Intercom snippet:
    //
    // * Add `appId` from stored `settings`.
    // * Add `userId`.
    // * Add `userHash` for secure mode
    identify: function (userId, traits) {
        // Don't do anything if we just have traits.
        if (!userId) return;

        // Pass traits directly in to Intercom's `custom_data`.
        var settings = window.intercomSettings = {
            app_id      : this.settings.appId,
            user_id     : userId,
            user_hash   : this.settings.userHash,
            custom_data : traits || {}
        };

        // Augment `intercomSettings` with some of the special traits.
        if (traits) {
            settings.email = traits.email;
            settings.name = traits.name;
            settings.created_at = analytics._.getSeconds(traits.created);
        }

        // If they didn't pass an email, check to see if the `userId` qualifies.
        if (analytics._.isEmail(userId) && (traits && !traits.email)) {
            settings.email = userId;
        }

        // Optionally add the widget.
        if (this.settings.activator) {
            settings.widget = {
                activator : this.settings.activator
            };
        }

        analytics._.loadScript({
            http  : 'https://api.intercom.io/api/js/library.js',
            https : 'https://api.intercom.io/api/js/library.js'
        });
    }

});


