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
        settings = analytics.utils.resolveSettings(settings, 'pCode');
        analytics.utils.extend(this.settings, settings);

        var _qevents = window._qevents = window._qevents || [];
        _qevents.push({ qacct: settings.pCode });

        analytics.utils.loadScript({
            http  : 'http://edge.quantserve.com/quant.js',
            https : 'https://secure.quantserve.com/quant.js'
        });
    }

});


