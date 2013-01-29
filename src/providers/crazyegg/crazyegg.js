// CrazyEgg
// --------
// [Documentation](www.crazyegg.com).

analytics.addProvider('CrazyEgg', {

    key : 'apiKey',

    // Load the CrazyEgg library, concatenating in the `apiKey`.
    initialize : function (options) {
        this.loadScript('//dnn506yrbagrg.cloudfront.net/pages/scripts/' + options.apiKey + '.js?' + Math.floor(new Date().getTime()/3600000));
    }

});


