// comScore
// ---------
// [Documentation](http://direct.comscore.com/clients/help/FAQ.aspx#faqTagging)

analytics.addProvider('comScore', {

    key : 'c2',

    defaults : {
        // Another required option, I'm assuming it's the snippet version.
        c1 : '2',
        // Your comScore account ID.
        c2 : null
    },

    // Setup the current comScore account and load their library. comScore needs
    // both of the options, so we just pass the entire dictionary straight in.
    initialize : function (options) {
        var _comscore = window._comscore = window._comscore || [];
        _comscore.push(options);

        this.loadScript({
            http  : 'http://b.scorecardresearch.com/beacon.js',
            https : 'https://sb.scorecardresearch.com/beacon.js'
        });
    }

});


