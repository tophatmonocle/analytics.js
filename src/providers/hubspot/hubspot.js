// HubSpot
// -------
// [Documentation](http://hubspot.clarify-it.com/d/4m62hl)

analytics.addProvider('HubSpot', {

    settings : {
        portalId : null
    },


    // Initialize
    // ----------

    // Changes to the HubSpot snippet:
    //
    // * Concatenate `portalId` into the URL.
    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'portalId');
        analytics._.extend(this.settings, settings);

        window._hsq = window._hsq || [];

        var url = 'https://js.hubspot.com/analytics/' + (Math.ceil(new Date()/300000)*300000) + '/' + this.settings.portalId + '.js';
        analytics._.loadScript({
            id    : 'hs-analytics',
            http  : url,
            https : url
        });
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        // HubSpot does not use a userId, but the email address is required on
        // the traits object.
        if (!traits) return;

        window._hsq.push(["identify", traits]);
    },


    // Track
    // -----

    // Event Tracking is available to HubSpot Enterprise customers only. In
    // addition to adding any unique event name, you can also use the id of an
    // existing custom event as the event variable.
    track : function (event, properties) {
        window._hsq.push(["trackEvent", event, properties]);
    },


    // Pageview
    // --------

    pageview : function () {
        // TODO http://performabledoc.hubspot.com/display/DOC/JavaScript+API
    }

});


