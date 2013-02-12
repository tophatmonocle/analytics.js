// CrazyEgg
// --------
// [Documentation](www.crazyegg.com).

analytics.addProvider('CrazyEgg', {

    defaults : {
        accountNumber : null
    },

    key : 'accountNumber',

    // Load the CrazyEgg library, concatenating in the `accountNumber`. CrazyEgg
    // displays the account number as `XXXXYYYY` in their interface, but the
    // library's path uses `XXXX/YYYY`, so we need to split it up.
    initialize : function (options) {
        var number      = options.accountNumber;
        var accountPath = number.slice(0, 4) + '/' + number.slice(4);

        analytics._.loadScript('//dnn506yrbagrg.cloudfront.net/pages/scripts/' + accountPath + '.js?' + Math.floor(new Date().getTime()/3600000));
    }

});


