// comScore
// ---------
// [Documentation](http://direct.comscore.com/clients/help/FAQ.aspx#faqTagging)

analytics.addProvider('comScore', {

    settings : {
        c1 : '2',
        c2 : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'c2');
        analytics.utils.extend(this.settings, settings);

        var _comscore = window._comscore = window._comscore || [];
        _comscore.push(this.settings);

        analytics.utils.loadScript({
            http  : 'http://b.scorecardresearch.com/beacon.js',
            https : 'https://sb.scorecardresearch.com/beacon.js'
        });
    }

});


