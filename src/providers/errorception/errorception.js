// Errorception
// ------------
// [Documentation](http://errorception.com/).

analytics.addProvider('Errorception', {

    settings : {
        projectId : null,

        // Whether to store metadata about the user on `identify` calls, using
        // the [Errorception `meta` API](http://blog.errorception.com/2012/11/capture-custom-data-with-your-errors.html).
        meta : true
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'projectId');
        analytics.utils.extend(this.settings, settings);

        var _errs = window._errs = window._errs || [settings.projectId];

        (function(a,b){
            a.onerror = function () {
                _errs.push(arguments);
            };
        })(window,document);

        analytics.utils.loadScript('//d15qhc0lu1ghnk.cloudfront.net/beacon.js');
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        if (!traits) return;

        // If the custom metadata object hasn't ever been made, make it.
        window._errs.meta || (window._errs.meta = {});

        // Add all of the traits as metadata.
        if (this.settings.meta) analytics.utils.extend(window._errs.meta, traits);
    }

});


