//     Analytics.js 0.6.0

//     (c) 2013 Segment.io Inc.
//     Analytics.js may be freely distributed under the MIT license.

(function () {

    // Analytics
    // =========

    // The `analytics` object that will be exposed to you on the global object.
    var analytics = {

        // Cache the `userId` when a user is identified.
        userId : null,

        // Store the date when the page loaded, for services that depend on it.
        date : new Date(),

        // Store window.onload state so that analytics that rely on it can be loaded
        // even after onload fires.
        loaded : false,

        // Whether analytics.js has been initialized with providers.
        initialized : false,

        // A queue for storing `ready` callback functions to get run when
        // analytics have been initialized.
        readyCallbacks : [],

        // The amount of milliseconds to wait for requests to providers to clear
        // before navigating away from the current page.
        timeout : 300,


        // Providers
        // ---------

        // A dictionary of analytics providers that _can_ be initialized.
        initializableProviders : {},

        // An array of analytics providers that are initialized.
        providers : [],

        // Adds a provider to the list of available providers that can be
        // initialized.
        addProvider : function (name, properties) {
            // Take the methods and add them to a Provider class's prototype.
            var Provider = analytics.Provider.extend(properties);
            this.initializableProviders[name] = Provider;
        },


        // Initialize
        // ----------

        // Call **initialize** to setup analytics.js before identifying or
        // tracking any users or events. Here's what a call to **initialize**
        // might look like:
        //
        //     analytics.initialize({
        //         'Google Analytics' : 'UA-XXXXXXX-X',
        //         'Segment.io'       : 'XXXXXXXXXXX',
        //         'KISSmetrics'      : 'XXXXXXXXXXX'
        //     });
        //
        // * `providers` is a dictionary of the providers you want to enabled.
        // The keys are the names of the providers and their values are either
        // an api key, or dictionary of extra settings (including the api key).
        initialize : function (providers) {
            // Reset our state.
            this.providers = [];
            this.userId = null;

            // Initialize each provider with the proper options, and copy the
            // provider into `this.providers`.
            for (var key in providers) {
                var Provider = this.initializableProviders[key];
                if (!Provider) throw new Error('Could not find a provider named "'+key+'"');

                var options = providers[key];
                this.providers.push(new Provider(options));
            }

            // Update the initialized state that other methods rely on.
            this.initialized = true;

            // Run any callbacks on our `readyCallbacks` queue.
            for (var i = 0, callback; callback = this.readyCallbacks[i]; i++) {
                callback();
            }

            // Try to use id and event parameters from the url
            var userId = this._.getUrlParameter(window.location.search, 'ajs_uid');
            if (userId) this.identify(userId);
            var event = this._.getUrlParameter(window.location.search, 'ajs_event');
            if (event) this.track(event);
        },


        // Identify
        // --------

        // Identifying a user ties all of their actions to an ID you recognize
        // and records properties about a user. An example identify:
        //
        //     analytics.identify('4d3ed089fb60ab534684b7e0', {
        //         name  : 'Achilles',
        //         email : 'achilles@segment.io',
        //         age   : 23
        //     });
        //
        // * `userId` (optional) is the ID you know the user by. Ideally this
        // isn't an email, because the user might be able to change their email
        // and you don't want that to affect your analytics.
        //
        // * `traits` (optional) is a dictionary of traits to tie your user.
        // Things like `name`, `age` or `friendCount`. If you have them, you
        // should always store a `name` and `email`.
        //
        // * `callback` (optional) is a function to call after the a small
        // timeout to give the identify requests a chance to be sent.
        identify : function (userId, traits, callback) {
            if (!this.initialized) return;

            // Allow for not passing traits, but passing a callback.
            if (this._.isFunction(traits)) {
                callback = traits;
                traits = null;
            }

            // Allow for identifying traits without setting a `userId`, for
            // anonymous users whose traits you learn.
            if (this._.isObject(userId)) {
                if (traits && this._.isFunction(traits)) callback = traits;
                traits = userId;
                userId = null;
            }

            // Cache the `userId` for next time, or use saved one.
            if (userId !== null) {
                this.userId = userId;
            } else {
                userId = this.userId;
            }

            // Call `identify` on all of our enabled providers that support it.
            for (var i = 0, provider; provider = this.providers[i]; i++) {
                if (provider.identify) provider.identify(userId, this._.clone(traits));
            }

            // If we have a callback, call it.
            if (callback && this._.isFunction(callback)) {
                setTimeout(callback, this.timeout);
            }
        },


        // Track
        // -----

        // Whenever a visitor triggers an event on your site that you're
        // interested in, you'll want to track it. An example track:
        //
        //     analytics.track('Added a Friend', {
        //         level  : 'hard',
        //         volume : 11
        //     });
        //
        // * `event` is the name of the event. The best names are human-readable
        // so that your whole team knows what they mean when they analyze your
        // data.
        //
        // * `properties` (optional) is a dictionary of properties of the event.
        // Property keys are all camelCase (we'll alias to non-camelCase for
        // you automatically for providers that require it).
        //
        // * `callback` (optional) is a function to call after the a small
        // timeout to give the track requests a chance to be sent.
        track : function (event, properties, callback) {
            if (!this.initialized) return;

            // Allow for not passing properties, but passing a callback.
            if (this._.isFunction(properties)) {
                callback = properties;
                properties = null;
            }

            // Call `track` on all of our enabled providers that support it.
            for (var i = 0, provider; provider = this.providers[i]; i++) {
                if (provider.track) provider.track(event, this._.clone(properties));
            }

            // If we have a callback, call it.
            if (callback && this._.isFunction(callback)) {
                setTimeout(callback, this.timeout);
            }
        },


        // ### trackLink

        // A helper for tracking outbound links that would normally leave the
        // page before the track calls went out. It works by wrapping the calls
        // in as short of a timeout as possible to fire the track call, because
        // [response times matter](http://theixdlibrary.com/pdf/Miller1968.pdf).
        //
        // * `link` is either a single link DOM element, or an array of link
        // elements like jQuery gives you.
        //
        // * `event` and `properties` are passed directly to `analytics.track`
        // and take the same options. `properties` can also be a function that
        // will get passed the link that was clicked, and should return a
        // dictionary of event properties.
        trackLink : function (link, event, properties) {
            if (!link) return;

            // Turn a single link into an array so that we're always handling
            // arrays, which allows for passing jQuery objects.
            if (this._.isElement(link)) link = [link];

            var self = this;

            // Bind to all the links in the array.
            for (var i = 0; i < link.length; i++) {
                (function (el) {
                    self.utils.bind(el, 'click', function (e) {

                        // Allow for properties to be a function. And pass it the
                        // link element that was clicked.
                        if (self.utils.isFunction(properties)) properties = properties(el);

                        // Fire a normal track call.
                        self.track(event, properties);

                        // To justify us preventing the default behavior we must:
                        //
                        // * Have an `href` to use.
                        // * Not have a `target="_blank"` attribute.
                        // * Not have any special keys pressed, because they might
                        // be trying to open in a new tab, or window, or download
                        // the asset.
                        //
                        // This might not cover all cases, but we'd rather throw out
                        // an event than miss a case that breaks the experience.
                        if (el.href && el.target !== '_blank' && !self.utils.isMeta(e)) {

                            // Prevent the link's default redirect in all the sane
                            // browsers, and also IE.
                            if (e.preventDefault)
                                e.preventDefault();
                            else
                                e.returnValue = false;

                            // Navigate to the url after a small timeout, giving the
                            // providers time to track the event.
                            setTimeout(function () {
                                window.location.href = el.href;
                            }, self.timeout);
                        }
                    });
                })(link[i]);
            }
        },


        // ### trackForm

        // Similar to `trackClick`, this is a helper for tracking form
        // submissions that would normally leave the page before a track call
        // can be sent. It works by preventing the default submit, sending a
        // track call, and then submitting the form programmatically.
        //
        // * `form` is either a single form DOM element, or an array of
        // form elements like jQuery gives you.
        //
        // * `event` and `properties` are passed directly to `analytics.track`
        // and take the same options. `properties` can also be a function that
        // will get passed the form that was submitted, and should return a
        // dictionary of event properties.
        trackForm : function (form, event, properties) {
            if (!form) return;

            // Turn a single element into an array so that we're always handling
            // arrays, which allows for passing jQuery objects.
            if (this._.isElement(form)) form = [form];

            var self = this;

            // Bind to all the forms in the array.
            for (var i = 0; i < form.length; i++) {
                (function (el) {
                    self.utils.bind(el, 'submit', function (e) {

                        // Allow for properties to be a function. And pass it the
                        // form element that was submitted.
                        if (self.utils.isFunction(properties)) properties = properties(el);

                        // Fire a normal track call.
                        self.track(event, properties);

                        // Prevent the form's default submit in all the sane
                        // browsers, and also IE.
                        if (e.preventDefault)
                            e.preventDefault();
                        else
                            e.returnValue = false;

                        // Submit the form after a small timeout, giving the event
                        // time to get fired.
                        setTimeout(function () {
                            el.submit();
                        }, self.timeout);
                    });
                })(form[i]);
            }
        },


        // Pageview
        // --------

        // For single-page applications where real page loads don't happen, the
        // **pageview** method simulates a page loading event for all providers
        // that track pageviews and support it. This is the equivalent of
        // calling `_gaq.push(['trackPageview'])` in Google Analytics.
        //
        // **pageview** is _not_ for sending events about which pages in your
        // app the user has loaded. For that, use a regular track call like:
        // `analytics.track('View Signup Page')`. Or, if you think you've come
        // up with a badass abstraction, submit a pull request!
        //
        // * `url` (optional) is the url path that you want to be associated
        // with the page. You only need to pass this argument if the URL hasn't
        // changed but you want to register a new pageview.
        pageview : function (url) {
            if (!this.initialized) return;

            // Call `pageview` on all of our enabled providers that support it.
            for (var i = 0, provider; provider = this.providers[i]; i++) {
                if (provider.pageview) provider.pageview(url);
            }
        },


        // Alias
        // -----

        // Alias combines two previously unassociated user identities. This
        // comes in handy if the same user visits from two different devices and
        // you want to combine their history. Some providers also don't alias
        // automatically for you when an anonymous user signs up (like
        // Mixpanel), so you need to call `alias` manually right after sign up
        // with their brand new `userId`.
        //
        // * `newId` is the new ID you want to associate the user with.
        //
        // * `originalId` (optional) is the original ID that the user was
        // recognized by. This defaults to the currently identified user's ID if
        // there is one. In most cases you don't need to pass this argument.
        alias : function (newId, originalId) {
            if (!this.initialized) return;

            // Call `alias` on all of our enabled providers that support it.
            for (var i = 0, provider; provider = this.providers[i]; i++) {
                if (!provider.alias) continue;
                provider.alias(newId, originalId);
            }
        },


        // Ready
        // -----

        // Ready lets you pass in a callback that will get called when your
        // analytics services have been initialized. It's like jQuery's `ready`
        // expect for analytics instead of the DOM.
        ready : function (callback) {
            // Not a function, get out of here.
            if (!this.utils.isFunction(callback)) return;

            // If we're already initialized, do it right away. Otherwise, add it
            // to the queue for when we do get initialized.
            if (this.initialized) {
                callback();
            } else {
                this.readyCallbacks.push(callback);
            }
        },


        // Utils
        // -----

        _ : {

            // Attach an event handler to a DOM element. Yes, even in IE.
            bind : function (el, event, callback) {
                if (el.addEventListener) {
                    el.addEventListener(event, callback, false);
                } else if (el.attachEvent) {
                    el.attachEvent('on' + event, callback);
                }
            },

            // A helper to extend objects with properties from other objects.
            // Based on the [underscore method](https://github.com/documentcloud/underscore/blob/master/underscore.js#L763).
            extend : function (obj) {
                if (!this.isObject(obj)) return;

                var args = Array.prototype.slice.call(arguments, 1);
                for (var i = 0, source; source = args[i]; i++) {
                    if (!this.isObject(source)) return;

                    for (var property in source) {
                        obj[property] = source[property];
                    }
                }
                return obj;
            },

            // A helper to shallow-ly clone objects, so that they don't get
            // mangled by different analytics providers because of the
            // reference.
            clone : function (obj) {
                if (!obj) return;
                return this.extend({}, obj);
            },

            // A helper to alias certain object's keys to different key names.
            // Useful for abstracting over providers that require specific keys.
            alias : function (obj, aliases) {
                if (!this.isObject(obj)) return;

                for (var prop in aliases) {
                    var alias = aliases[prop];
                    if (obj[prop] !== undefined) {
                        obj[alias] = obj[prop];
                        delete obj[prop];
                    }
                }
            },

            // Type detection helpers, copied from [underscore](https://github.com/documentcloud/underscore/blob/master/underscore.js#L926-L946).
            isElement : function(obj) {
                return !!(obj && obj.nodeType === 1);
            },
            isObject : function (obj) {
                return obj === Object(obj);
            },
            isArray : Array.isArray || function (obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            },
            isString : function (obj) {
                return Object.prototype.toString.call(obj) === '[object String]';
            },
            isFunction : function (obj) {
                return Object.prototype.toString.call(obj) === '[object Function]';
            },
            isNumber : function (obj) {
                return Object.prototype.toString.call(obj) === '[object Number]';
            },

            // Email detection helper to loosely validate emails.
            isEmail : function (string) {
                return (/.+\@.+\..+/).test(string);
            },

            // Given a timestamp, return its value in seconds. For providers
            // that rely on Unix time instead of millis.
            getSeconds : function (time) {
                return Math.floor((new Date(time)) / 1000);
            },

            // Given a DOM event, tell us whether a meta key or button was
            // pressed that would make a link open in a new tab, window,
            // start a download, or anything else that wouldn't take the user to
            // a new page.
            isMeta : function (e) {
                if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return true;

                // Logic that handles checks for the middle mouse button, based
                // on [jQuery](https://github.com/jquery/jquery/blob/master/src/event.js#L466).
                var which = e.which, button = e.button;
                if (!which && button !== undefined) {
                    return (!button & 1) && (!button & 2) && (button & 4);
                } else if (which === 2) {
                    return true;
                }

                return false;
            },

            getUrlParameter : function (urlSearchParameter, paramKey) {
                var params = urlSearchParameter.replace('?', '').split('&');
                for (var i = 0; i < params.length; i += 1) {
                    var param = params[i].split('=');
                    if (param.length === 2 && param[0] === paramKey) {
                        return decodeURIComponent(param[1]);
                    }
                }
            },

            // Takes a url and parses out all of the pieces of it. Pulled from
            // [Component's url module](https://github.com/component/url).
            parseUrl : function (url) {
                var a = document.createElement('a');
                a.href = url;
                return {
                    href     : a.href,
                    host     : a.host || location.host,
                    hash     : a.hash,
                    hostname : a.hostname || location.hostname,
                    pathname : a.pathname.charAt(0) !== '/' ? '/' + a.pathname : a.pathname,
                    protocol : !a.protocol || ':' === a.protocol ? location.protocol : a.protocol,
                    search   : a.search,
                    query    : a.search.slice(1)
                };
            },

            // A helper to asynchronously load a script by appending a script
            // element to the DOM. This way we don't need to keep repeating all that
            // crufty Javascript snippet code.
            loadScript : function (options) {
                // Allow for the simplest case, just passing a url fragment.
                if (this.isString(options)) options = { fragment : options };

                // Make the async script element.
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.async = true;

                // Handle optional attributes on the script.
                if (options.id) script.id = options.id;
                if (options.attributes) {
                    for (var attr in options.attributes) {
                        script.setAttribute(attr, options.attributes[attr]);
                    }
                }

                // Based on the protocol, allow for a simple fragment that is
                // the same regardless, or URLs specific to each protocol.
                var protocol = 'https:' === document.location.protocol ? 'https:' : 'http:';
                if (protocol === 'https:') {
                    script.src = options.https || (protocol + options.fragment);
                } else {
                    script.src = options.http || (protocol + options.fragment);
                }

                // Attach the script to the DOM.
                var firstScript = document.getElementsByTagName('script')[0];
                firstScript.parentNode.insertBefore(script, firstScript);
            },

            // A helper to get cookies
            getCookie : function (name) {
                if (document.cookie.length > 0) {
                    var start = document.cookie.indexOf(name + '=');
                    if (start !== -1) {
                        start = start + name.length + 1;
                        var end = document.cookie.indexOf(";", start);
                        if (end === -1)
                            end = document.cookie.length;
                        return unescape(document.cookie.substring(start, end));
                    }
                }
            },

            // A helper to set cookies
            setCookie : function (name, value, expirationDays) {
                var expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + expirationDays);
                var expirationAndPath = (expirationDays === null ? '' : ';expires=' + expirationDate.toGMTString() + ';path=' + escape('/'));
                document.cookie = name + '=' + escape(value) + expirationAndPath;
            }
        }
    };

    // Alias `trackClick` and `trackSubmit` for backwards compatibility.
    analytics.trackClick = analytics.trackLink;
    analytics.trackSubmit = analytics.trackForm;

    // Wrap any existing `onload` function with our own that will cache the
    // loaded state of the page.
    var oldonload = window.onload;
    window.onload = function () {
        analytics.loaded = true;
        if (analytics._.isFunction(oldonload)) oldonload();
    };



    // Provider
    // ========

    // Setup the Provider constructor.
    var Provider = analytics.Provider = function (options) {
        // Allow for `options` to only be a string if the provider has specified
        // a default `key`, in which case convert `options` into a dictionary.
        if (analytics._.isString(options) && this.key) {
            var key = options;
            options = {};
            options[this.key] = key;
        } else {
            throw new Error('Could not resolve options.');
        }

        // Extend the options passed in with the provider's defaults.
        analytics._.extend(this.options, options);

        // Call the provider's initialize object.
        this.initialize.call(this, this.options);
    };

    // Add some defaults to the Provider prototype.
    analytics._.extend(Provider.prototype, {

        // Override this with any default options.
        options : {},

        // Override this if our provider only needs a single API key to
        // initialize itself, in which case we can use the terse initialization
        // syntax:
        //
        //     analytics.initialize({
        //       'Provider' : 'XXXXXXX'
        //     });
        //
        key : undefined,

        // Override to provider your own initialization logic, usually a snippet
        // and loading a Javascript library.
        initialize : function (options) {}

    });

    // Helper to add provider methods to the prototype chain, for adding custom
    // providers. Modeled after [Backbone's `extend` method](https://github.com/documentcloud/backbone/blob/master/backbone.js#L1464).
    Provider.extend = function (name, provider) {
        var parent = this;
        var child = function () { return parent.apply(this, arguments); };
        var Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();
        analytics._.extend(child.prototype, provider);
        return child;
    };



    // Throw it onto the window.
    window.analytics = analytics;

})();
// Bitdeli
// -------
// * [Documentation](https://bitdeli.com/docs)
// * [JavaScript API Reference](https://bitdeli.com/docs/javascript-api.html)

analytics.addProvider('Bitdeli', {

    options : {
        // Bitdeli has multiple required keys.
        inputId   : null,
        authToken : null,
        // Whether or not to track an initial pageview when the page first
        // loads. You might not want this if you're using a single-page app.
        initialPageview : true
    },

    // Setup the Bitdeli queue and load the latest version of their library.
    initialize : function (options) {
        var _bdq = window._bdq = window._bdq || [];
        _bdq.push(['setAccount', options.inputId, options.authToken]);

        this.loadScript('//d2flrkr957qc5j.cloudfront.net/bitdeli.min.js');

        // Track an initial pageview.
        if (options.initialPageview) this.pageview();
    },

    // Bitdeli uses two separate methods: `identify` for storing the `userId`
    // and `set` for storing `traits`.
    identify : function (userId, traits) {
        if (userId) window._bdq.push(['identify', userId]);
        if (traits) window._bdq.push(['set', traits]);
    },

    track : function (event, properties) {
        window._bdq.push(['track', event, properties]);
    },

    // If `url` is undefined, Bitdeli automatically uses the current page's URL.
    pageview : function (url) {
        window._bdq.push(['trackPageview', url]);
    }

});


// Chartbeat
// ---------
// [Documentation](http://chartbeat.com/docs/adding_the_code/),
// [documentation](http://chartbeat.com/docs/configuration_variables/),
// [documentation](http://chartbeat.com/docs/handling_virtual_page_changes/).

analytics.addProvider('Chartbeat', {

    defaults : {
        // Chartbeat has multiple required keys.
        uid    : null,
        domain : null
    },

    initialize : function (options) {
        // Since all the custom settings just get passed through, update the
        // Chartbeat `_sf_async_config` variable with settings.
        window._sf_async_config = options;

        // Chartbeat needs the stored time when the page was first rendered, so
        // it can calculate page load times for the user/server.
        window._sf_endpt = analytics.date.getTime();

        this.loadScript({
            http  : 'http://static.chartbeat.com/js/chartbeat.js',
            https : 'https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/js/chartbeat.js'
        });
    },

    // Chartbeat supports virtual URLs and the `url` property is required, so we
    // default to the current URL.
    pageview : function (url) {
        if (!window.pSUPERFLY) return;

        window.pSUPERFLY.virtualPage(url || window.location.pathname);
    }

});


// Clicky
// ------
// [Documentation](http://clicky.com/help/customization/manual?new-domain).

analytics.addProvider('Clicky', {

    key : 'siteId',

    // Setup the current Clicky account and load in the Clicky library.
    initialize : function (options) {
        window.clicky_site_ids = window.clicky_site_ids || [];
        window.clicky_site_ids.push(options.siteId);

        this.loadScript('//static.getclicky.com/js');
    },

    // Clicky's `log` method only support event names, not properties.
    track : function (event, properties) {
        if (!window.clicky) return;

        // We aren't guaranteed `clicky` is available until the script has been
        // requested and run, hence the check.
        window.clicky.log(window.location.href, event);
    }

});


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


// CrazyEgg
// --------
// [Documentation](www.crazyegg.com).

analytics.addProvider('CrazyEgg', {

<<<<<<< HEAD
    key : 'apiKey',

    // Load the CrazyEgg library, concatenating in the `apiKey`.
    initialize : function (options) {
        this.loadScript('//dnn506yrbagrg.cloudfront.net/pages/scripts/' + options.apiKey + '.js?' + Math.floor(new Date().getTime()/3600000));
=======
    settings : {
        accountNumber : null
    },


    // Initialize
    // ----------

    // Changes to the CrazyEgg snippet:
    //
    // * Concatenate `accountNumber` into the URL.
    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'accountNumber');
        analytics.utils.extend(this.settings, settings);

        var accountNumber = this.settings.accountNumber;
        var accountPath = accountNumber.slice(0, 4) + '/' + accountNumber.slice(4);
        
        (function(){
            var a = document.createElement('script');
            var b = document.getElementsByTagName('script')[0];
            var protocol = ('https:' == document.location.protocol) ? 'https:' : 'http:';
            a.src = protocol+'//dnn506yrbagrg.cloudfront.net/pages/scripts/'+accountPath+'.js?'+Math.floor(new Date().getTime()/3600000);
            a.async = true;
            a.type = 'text/javascript';
            b.parentNode.insertBefore(a,b);
        })();
>>>>>>> master
    }

});


// Customer.io
// -----------
// [Documentation](http://customer.io/docs/api/javascript.html).

analytics.addProvider('Customer.io', {

    key : 'siteId',

    // Setup the Customer.io queue and methods, and load in their library.
    initialize : function (options) {
        var _cio = window._cio = window._cio || [];
        (function() {
            var a,b,c;
            a = function (f) {
                return function () {
                    _cio.push([f].concat(Array.prototype.slice.call(arguments,0)));
                };
            };
            b = ['identify', 'track'];
            for (c = 0; c < b.length; c++) {
                _cio[b[c]] = a(b[c]);
            }
        })();

        this.loadScript({
            http       : 'https://assets.customer.io/assets/track.js',
            https      : 'https://assets.customer.io/assets/track.js',
            id         : 'cio-tracker',
            attributes : {
                'data-site-id' : options.sideId
            }
        });
    },

    identify : function (userId, traits) {
        // Don't do anything if we just have traits, because Customer.io
        // requires a `userId`.
        if (!userId) return;

        traits || (traits = {});

        // Customer.io takes the `userId` as part of the traits object.
        traits.id = userId;

        // If there wasn't already an email and the userId is one, use it.
        if (!traits.email && analytics._.isEmail(userId)) {
            traits.email = userId;
        }

        // Swap the `created` trait to the `created_at` that Customer.io needs
        // (in seconds).
        if (traits.created) {
            traits.created_at = analytics._.getSeconds(traits.created);
            delete traits.created;
        }

        window._cio.identify(traits);
    },

    track : function (event, properties) {
        window._cio.track(event, properties);
    }

});


// Errorception
// ------------
// [Documentation](http://errorception.com/).

analytics.addProvider('Errorception', {

    key : 'projectId',

    defaults : {
        // Whether to store metadata about the user on `identify` calls, using
        // the [Errorception `meta` API](http://blog.errorception.com/2012/11/capture-custom-data-with-your-errors.html).
        meta : true
    },

    // Create the `_errs` queue with the `projectId`, setup the global `onerror`
    // handler and then load the Errorception library.
    initialize : function (options) {
        var _errs = window._errs = window._errs || [options.projectId];
        window.onerror = function () { _errs.push(arguments); };
        this.loadScript('//d15qhc0lu1ghnk.cloudfront.net/beacon.js');
    },

    // Errorception can store information about the user to help with debugging.
    // We keep this on by default, since it's useful.
    identify : function (userId, traits) {
        if (!traits) return;

        // If the custom metadata object hasn't ever been made, make it.
        window._errs.meta || (window._errs.meta = {});

        // Add all of the traits as metadata, keeping any exists ones.
        if (this.options.meta) analytics._.extend(window._errs.meta, traits);
    }

});


// FoxMetrics
// -----------
// [Documentation](http://foxmetrics.com/documentation)
// [Documentation - JS](http://foxmetrics.com/documentation/apijavascript)

analytics.addProvider('FoxMetrics', {

    key : 'appId',

    // Create the `_fxm` events queue and load the FoxMetrics library.
    initialize: function (options) {
        var _fxm = window._fxm || {};
        window._fxm = _fxm.events || [];
        this.loadScript('//d35tca7vmefkrc.cloudfront.net/scripts/' + options.appId + '.js');
    },

    identify: function (userId, traits) {
        // The `userId` is required.
        if (!userId) return;

        // FoxMetrics needs first and last name seperately.
        var firstName, lastName, email;
        if (traits && traits.name) {
            firstName = traits.name.split(' ')[0];
            lastName  = traits.name.split(' ')[1];
        }
        if (traits && traits.email) {
            email = traits.email;
        }

        // Remove the name and email traits, since they're sent separately.
        delete traits.name;
        delete traits.email;

        window._fxm.push([
            '_fxm.visitor.Profile',
            userId,    // ID
            firstName, // First name
            lastName,  // Last name
            email,     // Email address
            null,      // Address
            null,      // Social information
            null,      // Parter IDs
            traits     // Additional attributes
        ]);
    },

    track: function (event, properties) {
        // send in null as event category name
        window._fxm.push([event, null, properties]);
    },

    pageview: function (url) {
        // we are happy to accept traditional analytics :)
        // (title, name, categoryName, url, referrer)
        window._fxm.push(['_fxm.pages.view', null, null, null, (url || null), null]);
    }

});


// Gauges
// -------
// [Documentation](http://get.gaug.es/documentation/tracking/).

analytics.addProvider('Gauges', {

    settings : {
        siteId : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'siteId');
        analytics._.extend(this.settings, settings);

        var _gauges = window._gauges = window._gauges || [];

        analytics._.loadScript({
            fragment   : '//secure.gaug.es/track.js',
            id         : 'gauges-tracker',
            attributes : {
                'data-site-id' : settings.siteId
            }
        });
    },


    // Pageview
    // --------

    pageview : function (url) {
        window._gauges.push(['track']);
    }

});


// Google Analytics
// ----------------
// [Documentation](https://developers.google.com/analytics/devguides/collection/gajs/).

analytics.addProvider('Google Analytics', {

    settings : {
        anonymizeIp             : false,
        enhancedLinkAttribution : false,
        siteSpeedSampleRate     : null,
        domain                  : null,
        trackingId              : null
    },


    // Initialize
    // ----------

    // Changes to the Google Analytics snippet:
    //
    // * Added `trackingId`.
    // * Added optional support for `enhancedLinkAttribution`
    // * Added optional support for `siteSpeedSampleRate`
    // * Added optional support for `anonymizeIp`
    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'trackingId');
        analytics.utils.extend(this.settings, settings);

        var _gaq = window._gaq = window._gaq || [];
        _gaq.push(['_setAccount', this.settings.trackingId]);
        if(this.settings.domain) {
            _gaq.push(['_setDomainName', this.settings.domain]);
        }
        if (this.settings.enhancedLinkAttribution) {
            var pluginUrl = (('https:' === document.location.protocol) ? 'https://www.' : 'http://www.') + 'google-analytics.com/plugins/ga/inpage_linkid.js';
            _gaq.push(['_require', 'inpage_linkid', pluginUrl]);
        }
        if (analytics.utils.isNumber(this.settings.siteSpeedSampleRate)) {
            _gaq.push(['_setSiteSpeedSampleRate', this.settings.siteSpeedSampleRate]);
        }
        if(this.settings.anonymizeIp) {
            _gaq.push(['_gat._anonymizeIp']);
        }

        // Check to see if there is a canonical meta tag to use as the URL.
        var canonicalUrl, metaTags = document.getElementsByTagName('meta');
        for (var i = 0, tag; tag = metaTags[i]; i++) {
            if (tag.getAttribute('rel') === 'canonical') {
                canonicalUrl = analytics.utils.parseUrl(tag.getAttribute('href')).pathname;
            }
        }
        _gaq.push(['_trackPageview', canonicalUrl]);


        analytics.utils.loadScript({
            http  : 'http://www.google-analytics.com/ga.js',
            https : 'https://ssl.google-analytics.com/ga.js'
        });
    },


    // Track
    // -----

    track : function (event, properties) {
        properties || (properties = {});

        var value;

        // Since value is a common property name, ensure it is a number
        if (analytics.utils.isNumber(properties.value)) value = properties.value;

        // Try to check for a `category` and `label`. A `category` is required,
        // so if it's not there we use `'All'` as a default. We can safely push
        // undefined if the special properties don't exist. Try using revenue
        // first, but fall back to a generic `value` as well.
        window._gaq.push([
            '_trackEvent',
            properties.category || 'All',
            event,
            properties.label,
            Math.round(properties.revenue) || value,
            properties.noninteraction
        ]);
    },


    // Pageview
    // --------

    pageview : function (url) {
        // If there isn't a url, that's fine.
        window._gaq.push(['_trackPageview', url]);
    }

});


// GoSquared
// ---------
// [Documentation](www.gosquared.com/support).
// [Tracker Functions](https://www.gosquared.com/customer/portal/articles/612063-tracker-functions)
// Will automatically [integrate with Olark](https://www.gosquared.com/support/articles/721791-setting-up-olark-live-chat).

analytics.addProvider('GoSquared', {

    settings : {
        siteToken : null
    },


    // Initialize
    // ----------

    // Changes to the GoSquared tracking code:
    //
    // * Use `siteToken` from settings.
    // * No longer need to wait for pageload, removed unnecessary functions.
    // * Attach `GoSquared` to `window`.

    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'siteToken');
        analytics._.extend(this.settings, settings);

        window.GoSquared = {
            acct : this.settings.siteToken,
            q    : []
        };
        window._gstc_lt =+ (new Date());

        analytics._.loadScript('//d1l6p2sc9645hc.cloudfront.net/tracker.js');
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        // TODO figure out if this will actually work. Seems like GoSquared will
        // never know these values are updated.
        if (userId) window.GoSquared.UserName = userId;
        if (traits) window.GoSquared.Visitor = traits;
    },


    // Track
    // -----

    track : function (event, properties) {
        // GoSquared sets a `gs_evt_name` property with a value of the event
        // name, so it relies on properties being an object.
        properties || (properties = {});

        window.GoSquared.q.push(['TrackEvent', event, properties]);
    },


    // Pageview
    // --------

    pageview : function (url) {
        var args = ['TrackView'];

        if (url) args.push(url);

        window.GoSquared.q.push(args);
    }

});


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


// HubSpot
// -------
// [Documentation](http://hubspot.clarify-it.com/d/4m62hl)

analytics.addProvider('HubSpot', {

    settings : {
        portalId : null
    },


    // Initialize
    // ----------

    // Changes to the HubSpot snippet:
    //
    // * Concatenate `portalId` into the URL.
    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'portalId');
        analytics._.extend(this.settings, settings);

        window._hsq = window._hsq || [];

        var url = 'https://js.hubspot.com/analytics/' + (Math.ceil(new Date()/300000)*300000) + '/' + this.settings.portalId + '.js';
        analytics._.loadScript({
            id    : 'hs-analytics',
            http  : url,
            https : url
        });
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        // HubSpot does not use a userId, but the email address is required on
        // the traits object.
        if (!traits) return;

        window._hsq.push(["identify", traits]);
    },


    // Track
    // -----

    // Event Tracking is available to HubSpot Enterprise customers only. In
    // addition to adding any unique event name, you can also use the id of an
    // existing custom event as the event variable.
    track : function (event, properties) {
        window._hsq.push(["trackEvent", event, properties]);
    },


    // Pageview
    // --------

    pageview : function () {
        // TODO http://performabledoc.hubspot.com/display/DOC/JavaScript+API
    }

});


// Intercom
// --------
// [Documentation](http://docs.intercom.io/).

analytics.addProvider('Intercom', {

    // Whether Intercom has already been initialized or not. This is because
    // since we initialize Intercom on `identify`, people can make multiple
    // `identify` calls and we don't want that breaking anything.
    initialized : false,

    settings : {
        appId  : null,

        // An optional setting to display the Intercom inbox widget.
        activator : null
    },


    // Initialize
    // ----------

    // Intercom identifies when the script is loaded, so instead of initializing
    // in `initialize`, we store the settings for later and initialize in
    // `identify`.
    initialize: function (settings) {
        settings = analytics._.resolveSettings(settings, 'appId');
        analytics._.extend(this.settings, settings);
    },


    // Identify
    // --------

    // Changes to the Intercom snippet:
    //
    // * Add `appId` from stored `settings`.
    // * Add `userId`.
    // * Add `userHash` for secure mode
    identify: function (userId, traits) {
        // If we've already been initialized once, don't do it again since we
        // load the script when this happens. Intercom can only handle one
        // identify call.
        if (this.initialized) return;

        // Don't do anything if we just have traits.
        if (!userId) return;

        // Pass traits directly in to Intercom's `custom_data`.
        var settings = window.intercomSettings = {
            app_id      : this.settings.appId,
            user_id     : userId,
            user_hash   : this.settings.userHash,
            custom_data : traits || {}
        };

        // Augment `intercomSettings` with some of the special traits.
        if (traits) {
            settings.email = traits.email;
            settings.name = traits.name;
            settings.created_at = analytics._.getSeconds(traits.created);
        }

        // If they didn't pass an email, check to see if the `userId` qualifies.
        if (analytics._.isEmail(userId) && (traits && !traits.email)) {
            settings.email = userId;
        }

        // Optionally add the widget.
        if (this.settings.activator) {
            settings.widget = {
                activator : this.settings.activator
            };
        }

<<<<<<< HEAD
        analytics._.loadScript({
            http  : 'https://api.intercom.io/api/js/library.js',
            https : 'https://api.intercom.io/api/js/library.js'
        });
=======
        (function() {
            var s = document.createElement('script');
            s.type = 'text/javascript'; s.async = true;
            s.src = 'https://api.intercom.io/api/js/library.js';
            var x = document.getElementsByTagName('script')[0];
            x.parentNode.insertBefore(s, x);
        })();

        // Set the initialized state, so that we don't initialize again.
        this.initialized = true;
>>>>>>> master
    }

});


// Keen.io
// -------
// [Documentation](https://keen.io/docs/).

analytics.addProvider('Keen IO', {

    settings: {
        projectId : null,
        apiKey    : null
    },


    // Initialize
    // ----------

    initialize: function(settings) {
        if (typeof settings !== 'object' || !settings.projectId || !settings.apiKey) {
            throw new Error('Settings must be an object with properties projectId and apiKey.');
        }

        analytics._.extend(this.settings, settings);

        var Keen=window.Keen||{configure:function(a,b,c){this._pId=a;this._ak=b;this._op=c},addEvent:function(a,b,c,d){this._eq=this._eq||[];this._eq.push([a,b,c,d])},setGlobalProperties:function(a){this._gp=a},onChartsReady:function(a){this._ocrq=this._ocrq||[];this._ocrq.push(a)}};
        (function(){var a=document.createElement("script");a.type="text/javascript";a.async=!0;a.src=("https:"==document.location.protocol?"https://":"http://")+"dc8na2hxrj29i.cloudfront.net/code/keen-2.0.0-min.js";var b=document.getElementsByTagName("script")[0];b.parentNode.insertBefore(a,b)})();

        // Configure the Keen object with your Project ID and API Key.
        Keen.configure(settings.projectId, settings.apiKey);

        window.Keen = Keen;
    },


    // Identify
    // --------

    identify: function(userId, traits) {
        if (!window.Keen.setGlobalProperties) return;

        // Use Keen IO global properties to include `userId` and `traits` on
        // every event sent to Keen IO.
        var globalUserProps = {};
        if (userId) globalUserProps.userId = userId;
        if (traits) globalUserProps.traits = traits;
        if (userId || traits) {
            window.Keen.setGlobalProperties(function(eventCollection) {
                return {
                    'user': globalUserProps
                };
            });
        }
    },


    // Track
    // -----

    track: function(event, properties) {
        if (!window.Keen.addEvent) return;

        window.Keen.addEvent(event, properties);
    }

});


// KISSmetrics
// -----------
// [Documentation](http://support.kissmetrics.com/apis/javascript).

analytics.addProvider('KISSmetrics', {

    key : 'apiKey',

    // Create the `_kmq` queue and load in the KISSmetrics scripts,
    // concatenating the `apiKey` into the URL.
    initialize : function (options) {
        var _kmq = window._kmq = window._kmq || [];

        this.loadScript('//i.kissmetrics.com/i.js');
        this.loadScript('//doug1izaerwt3.cloudfront.net/' + options.apiKey + '.1.js');
    },

    // KISSmetrics uses two separate methods: `identify` for storing the
    // `userId`, and `set` for storing `traits`.
    identify : function (userId, traits) {
        if (userId) window._kmq.push(['identify', userId]);
        if (traits) window._kmq.push(['set', traits]);
    },

    track : function (event, properties) {
        // KISSmetrics handles revenue with the `'Billing Amount'` property by
        // default, although it's changeable in the interface.
        analytics.utils.alias(properties, {
            'revenue' : 'Billing Amount'
        });

        window._kmq.push(['record', event, properties]);
    },


    // Alias
    // -----

    // Although undocumented, KISSmetrics actually supports not passing a second
    // ID, in which case it uses the currenty identified user's ID.
    alias : function (newId, originalId) {
        window._kmq.push(['alias', newId, originalId]);
    }

});


// Klaviyo
// -------
// [Documentation](https://www.klaviyo.com/docs).

analytics.addProvider('Klaviyo', {

    settings : {
        apiKey : null
    },


    // Initialize
    // ----------

    // Changes to the Google Analytics snippet:
    //
    // * Added `apiKey`.
    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'apiKey');
        analytics._.extend(this.settings, settings);

        var _learnq = window._learnq = window._learnq || [];
        _learnq.push(['account', this.settings.apiKey]);

        analytics._.loadScript('//a.klaviyo.com/media/js/learnmarklet.js');
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        // Klaviyo takes the user ID on the traits object itself.
        traits || (traits = {});
        if (userId) traits.$id = userId;

        window._learnq.push(['identify', traits]);
    },


    // Track
    // -----

    track : function (event, properties) {
        window._learnq.push(['track', event, properties]);
    }

});


// LiveChat
// --------
// [Documentation](http://www.livechatinc.com/api/javascript-api).

analytics.addProvider('LiveChat', {

    settings : {
        license : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'license');
        analytics.utils.extend(this.settings, settings);

        window.__lc = {};
        window.__lc.license = this.settings.license;

        (function() {
            var lc = document.createElement('script'); lc.type = 'text/javascript'; lc.async = true;
            lc.src = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'cdn.livechatinc.com/tracking.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(lc, s);
        })();
    },


    // Identify
    // --------

    // LiveChat isn't an analytics service, but we can use the `userId` and
    // `traits` to tag the user with their real name in the chat console.
    identify : function (userId, traits) {
        // We aren't guaranteed the variable exists.
        if (!window.LC_API) return;

        // We need either a `userId` or `traits`.
        if (!userId && !traits) return;

        // LiveChat takes them in an array format.
        var variables = [];

        if (userId) {
            variables.push({ name: 'User ID', value: userId });
        }
        if (traits) {
            for (var key in traits) {
                var trait = {};
                trait.name = key;
                trait.value = traits[key];
                variables.push(trait);
            }
        }

        window.LC_API.set_custom_variables(variables);
    }

});


// Mixpanel
// --------
// [Documentation](https://mixpanel.com/docs/integration-libraries/javascript),
// [documentation](https://mixpanel.com/docs/people-analytics/javascript),
// [documentation](https://mixpanel.com/docs/integration-libraries/javascript-full-api).

analytics.addProvider('Mixpanel', {

    settings : {
        // Whether to call `mixpanel.nameTag` on `identify`.
        nameTag : true,
        // Whether to use Mixpanel's People API.
        people  : false,
        token   : null
    },


    // Initialize
    // ----------

    // Changes to the Mixpanel snippet:
    //
    // * Use window for call to `init`.
    // * Add `token` and `settings` args to call to `init`.
    //
    // We don't need to set the `mixpanel` object on `window` ourselves because
    // they already do that.
    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'token');
        analytics._.extend(this.settings, settings);

        (function (c, a) {
            window.mixpanel = a;
            var b, d, h, e;
            b = c.createElement('script');
            b.type = 'text/javascript';
            b.async = true;
            b.src = ('https:' === c.location.protocol ? 'https:' : 'http:') + '//cdn.mxpnl.com/libs/mixpanel-2.2.min.js';
            d = c.getElementsByTagName('script')[0];
            d.parentNode.insertBefore(b, d);
            a._i = [];
            a.init = function (b, c, f) {
                function d(a, b) {
                    var c = b.split('.');
                    2 == c.length && (a = a[c[0]], b = c[1]);
                    a[b] = function () {
                        a.push([b].concat(Array.prototype.slice.call(arguments, 0)));
                    };
                }
                var g = a;
                'undefined' !== typeof f ? g = a[f] = [] : f = 'mixpanel';
                g.people = g.people || [];
                h = ['disable', 'track', 'track_pageview', 'track_links', 'track_forms', 'register', 'register_once', 'unregister', 'identify', 'alias', 'name_tag', 'set_config', 'people.set', 'people.increment'];
                for (e = 0; e < h.length; e++) d(g, h[e]);
                a._i.push([b, c, f]);
            };
            a.__SV = 1.2;
        })(document, window.mixpanel || []);

        // Pass settings directly to `init` as the second argument.
        window.mixpanel.init(this.settings.token, this.settings);
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        // If we have an email and no email trait, set the email trait.
        if (userId && analytics._.isEmail(userId) && (traits && !traits.email)) {
            traits || (traits = {});
            traits.email = userId;
        }

        // Alias the traits' keys with dollar signs for Mixpanel's API.
        if (traits) {
            analytics._.alias(traits, {
                'created'   : '$created',
                'email'     : '$email',
                'firstName' : '$first_name',
                'lastName'  : '$last_name',
                'lastSeen'  : '$last_seen',
                'name'      : '$name',
                'username'  : '$username'
            });
        }

        // Finally, call all of the identify equivalents. Verify certain calls
        // against settings to make sure they're enabled.
        if (userId) {
            window.mixpanel.identify(userId);
            if (this.settings.nameTag) window.mixpanel.name_tag(traits && traits.$email || userId);
        }
        if (traits) {
            window.mixpanel.register(traits);
            if (this.settings.people) window.mixpanel.people.set(traits);
        }
    },


    // Track
    // -----

    track : function (event, properties) {
        window.mixpanel.track(event, properties);

        // Mixpanel handles revenue with a `transaction` call in their People
        // feature. So if we're using people, record a transcation.
        if (properties && properties.revenue && this.settings.people) {
            window.mixpanel.people.track_charge(properties.revenue);
        }
    },


    // Pageview
    // --------

    // Mixpanel doesn't actually track the pageviews, but they do show up in the
    // Mixpanel stream.
    pageview : function (url) {
        window.mixpanel.track_pageview(url);
    },


    // Alias
    // -----

    // Although undocumented, Mixpanel actually supports the `originalId`. It
    // just usually defaults to the current user's `distinct_id`.
    alias : function (newId, originalId) {
        window.mixpanel.alias(newId, originalId);
    }

});


// Olark
// -----
// [Documentation](http://www.olark.com/documentation).

analytics.addProvider('Olark', {

    settings : {
        siteId   : null,
        track    : false,
        pageview : true
    },


    // Initialize
    // ----------

    // Changes to the Olark snippet:
    //
    // * Removed `CDATA` tags.
    // * Add `siteId` from stored `settings`.
    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'siteId');
        analytics._.extend(this.settings, settings);

        window.olark||(function(c){var f=window,d=document,l=f.location.protocol=="https:"?"https:":"http:",z=c.name,r="load";var nt=function(){f[z]=function(){(a.s=a.s||[]).push(arguments)};var a=f[z]._={},q=c.methods.length;while(q--){(function(n){f[z][n]=function(){f[z]("call",n,arguments)}})(c.methods[q])}a.l=c.loader;a.i=nt;a.p={0:+new Date};a.P=function(u){a.p[u]=new Date-a.p[0]};function s(){a.P(r);f[z](r)}f.addEventListener?f.addEventListener(r,s,false):f.attachEvent("on"+r,s);var ld=function(){function p(hd){hd="head";return["<",hd,"></",hd,"><",i,' onl' + 'oad="var d=',g,";d.getElementsByTagName('head')[0].",j,"(d.",h,"('script')).",k,"='",l,"//",a.l,"'",'"',"></",i,">"].join("")}var i="body",m=d[i];if(!m){return setTimeout(ld,100)}a.P(1);var j="appendChild",h="createElement",k="src",n=d[h]("div"),v=n[j](d[h](z)),b=d[h]("iframe"),g="document",e="domain",o;n.style.display="none";m.insertBefore(n,m.firstChild).id=z;b.frameBorder="0";b.id=z+"-loader";if(/MSIE[ ]+6/.test(navigator.userAgent)){b.src="javascript:false"}b.allowTransparency="true";v[j](b);try{b.contentWindow[g].open()}catch(w){c[e]=d[e];o="javascript:var d="+g+".open();d.domain='"+d.domain+"';";b[k]=o+"void(0);"}try{var t=b.contentWindow[g];t.write(p());t.close()}catch(x){b[k]=o+'d.write("'+p().replace(/"/g,String.fromCharCode(92)+'"')+'");d.close();'}a.P(2)};ld()};nt()})({loader: "static.olark.com/jsclient/loader0.js",name:"olark",methods:["configure","extend","declare","identify"]});
        window.olark.identify(this.settings.siteId);
    },


    // Identify
    // --------

    // Olark isn't an analytics service, but we can use the `userId` and
    // `traits` to tag the user with their real name in the chat console.
    identify : function (userId, traits) {
        // Choose the best name for the user that we can get.
        var name = userId;
        if (traits && traits.email) name = traits.email;
        if (traits && traits.name) name = traits.name;
        if (traits && traits.name && traits.email) name += ' ('+traits.email+')';

        // If we ended up with no name after all that, get out of there.
        if (!name) return;

        window.olark('api.chat.updateVisitorNickname', {
            snippet : name
        });
    },


    // Track
    // -----

    // Again, all we're doing is logging events the user triggers to the chat
    // console, if you so desire it.
    track : function (event, properties) {
        // Check the `track` setting to know whether log events or not.
        if (!this.settings.track) return;

        // To stay consistent with olark's default messages, it's all lowercase.
        window.olark('api.chat.sendNotificationToOperator', {
            body : 'visitor triggered "'+event+'"'
        });
    },


    // Pageview
    // --------

    // Again, not analytics, but we can mimic the functionality Olark has for
    // normal pageviews with pseudo-pageviews, telling the operator when a
    // visitor changes pages.
    pageview : function () {
        // Check the `pageview` settings to know whether they want this or not.
        if (!this.settings.pageview) return;

        // To stay consistent with olark's default messages, it's all lowercase.
        window.olark('api.chat.sendNotificationToOperator', {
            body : 'looking at ' + window.location.href
        });
    }

});


// Perfect Audience
// ----------------
// [Documentation](https://www.perfectaudience.com/docs#javascript_api_autoopen)

analytics.addProvider('Perfect Audience', {

    settings : {
        siteId : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'siteId');
        analytics.utils.extend(this.settings, settings);

        (function() {
            window._pa = window._pa || {};
            var pa = document.createElement('script'); pa.type = 'text/javascript'; pa.async = true;
            pa.src = ('https:' === document.location.protocol ? 'https:' : 'http:') + "//tag.perfectaudience.com/serve/" + settings.siteId + ".js";
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(pa, s);
        })();

    },


    // Track
    // -----

    track : function (event, properties) {
        // We're not guaranteed a track method.
        if (!window._pa.track) return;

        window._pa.track(event, properties);
    }

});


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


// USERcycle
// -----------
// [Documentation](http://docs.usercycle.com/javascript_api).

analytics.addProvider('USERcycle', {

    settings : {
        key : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'key');
        analytics._.extend(this.settings, settings);

        var _uc = window._uc = window._uc || [];
        window._uc.push(['_key', settings.key]);

        analytics._.loadScript('//api.usercycle.com/javascripts/track.js');
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        if (userId) window._uc.push(['uid', userId, traits]);
    },


    // Track
    // -----

    track : function (event, properties) {
        window._uc.push(['action', event, properties]);
    }

});


// UserVoice
// ---------
// [Documentation](http://feedback.uservoice.com/knowledgebase/articles/16797-how-do-i-customize-and-install-the-uservoice-feedb).

analytics.addProvider('UserVoice', {

    settings : {
        widgetId : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'widgetId');
        analytics.utils.extend(this.settings, settings);

        window.uvOptions = {};
        (function() {
            var uv = document.createElement('script'); uv.type = 'text/javascript'; uv.async = true;
            uv.src = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'widget.uservoice.com/' + settings.widgetId + '.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(uv, s);
        })();
    }

});


// GetVero.com
// -----------
// [Documentation](https://github.com/getvero/vero-api/blob/master/sections/js.md).

analytics.addProvider('Vero', {

    settings : {
        apiKey : null
    },


    // Initialize
    // ----------
    initialize : function (settings) {
        settings = analytics._.resolveSettings(settings, 'apiKey');
        analytics._.extend(this.settings, settings);

        var _veroq = window._veroq = window._veroq || [];
        _veroq.push(['init', { api_key: settings.apiKey }]);

        analytics._.loadScript('//www.getvero.com/assets/m.js');
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        // Don't do anything if we just have traits, because Vero
        // requires a `userId`.
        if (!userId) return;

        traits || (traits = {});

        // Vero takes the `userId` as part of the traits object.
        traits.id = userId;

        // If there wasn't already an email and the userId is one, use it.
        if (!traits.email && analytics._.isEmail(userId)) {
            traits.email = userId;
        }

        // Vero *requires* an email and an id
        if (!traits.id || !traits.email) return;

        window._veroq.push(['user', traits]);
    },


    // Track
    // -----

    track : function (event, properties) {
        window._veroq.push(['track', event, properties]);
    }

});// Woopra
// ------
// [Documentation](http://www.woopra.com/docs/setup/javascript-tracking/).

analytics.addProvider('Woopra', {

    settings : {
        domain : null
    },


    // Initialize
    // ----------

    initialize : function (settings) {
        settings = analytics.utils.resolveSettings(settings, 'domain');
        analytics.utils.extend(this.settings, settings);

        var self = this;
        window.woopraReady = function (tracker) {
            tracker.setDomain(self.settings.domain);
            tracker.setIdleTimeout(300000);
            tracker.track();
            return false;
        };

        (function(){
            var wsc = document.createElement('script');
            wsc.type = 'text/javascript';
            var protocol = ('https:' === document.location.protocol) ? 'https:' : 'http:';
            wsc.src = protocol + '//static.woopra.com/js/woopra.js';
            wsc.async = true;
            var ssc = document.getElementsByTagName('script')[0];
            ssc.parentNode.insertBefore(wsc, ssc);
        })();
    },


    // Identify
    // --------

    identify : function (userId, traits) {
        // TODO - we need the cookie solution, because Woopra is one of those
        // that requires identify to happen before the script is requested.
    },


    // Track
    // -----

    track : function (event, properties) {
        // We aren't guaranteed a tracker.
        if (!window.woopraTracker) return;

        // Woopra takes its event as dictionaries with the `name` key.
        var settings = {};
        settings.name = event;

        // If we have properties, add them to the settings.
        if (properties) settings = analytics.utils.extend({}, properties, settings);

        window.woopraTracker.pushEvent(settings);
    }

});


