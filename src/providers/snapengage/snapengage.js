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
        settings = analytics.utils.resolveSettings(settings, 'apiKey');
        analytics.utils.extend(this.settings, settings);

        analytics.utils.loadScript('//commondatastorage.googleapis.com/code.snapengage.com/js/' + this.settings.apiKey + '.js');
    }

});


