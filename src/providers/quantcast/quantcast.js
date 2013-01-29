// Quantcast
// ---------
// [Documentation](https://www.quantcast.com/learning-center/guides/using-the-quantcast-asynchronous-tag/)

analytics.addProvider('Quantcast', {

    settings : {
        pCode : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'pCode');
        analytics._.extend(this.settings, settings);

        var _qevents = window._qevents = window._qevents || [];
        _qevents.push({ qacct: settings.pCode });

        analytics._.loadScript({
            http  : 'http://edge.quantserve.com/quant.js',
            https : 'https://secure.quantserve.com/quant.js'
        });
    }

});


