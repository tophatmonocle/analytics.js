// SnapEngage
// ----------
// [Documentation](http://help.snapengage.com/installation-guide-getting-started-in-a-snap/).

analytics.addProvider('SnapEngage', {

    settings : {
        apiKey : null
    },


    // Initialize
    // ----------

    // Changes to the SnapEngage snippet:
    //
    // * Add `apiKey` from stored `settings`.
    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'apiKey');
        analytics._.extend(this.settings, settings);

        analytics._.loadScript('//commondatastorage.googleapis.com/code.snapengage.com/js/' + this.settings.apiKey + '.js');
    }

});


