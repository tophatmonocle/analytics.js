// CrazyEgg
// --------
// [Documentation](www.crazyegg.com).

analytics.addProvider('CrazyEgg', {

    settings : {
        apiKey : null
    },


    // Initialize
    // ----------

    // Changes to the CrazyEgg snippet:
    //
    // * Concatenate `apiKey` into the URL.
    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'apiKey');
        analytics.utils.extend(this.settings, settings);

        var fragment = '//dnn506yrbagrg.cloudfront.net/pages/scripts/' + this.settings.apiKey + '.js?' + Math.floor(new Date().getTime()/3600000);
        analytics.utils.loadScript(fragment);
    }

});


