// HitTail
// -------
// [Documentation](www.hittail.com).

analytics.addProvider('HitTail', {

    settings : {
        siteId : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'siteId');
        analytics._.extend(this.settings, settings);

        analytics._.loadScript('//' + this.settings.siteId + '.hittail.com/mlt.js');
    }

});


