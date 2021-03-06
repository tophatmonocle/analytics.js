
describe('Google Analytics', function () {

  describe('initialize', function () {

    it('should call ready and load library', function (done) {
      this.timeout(4000);

      expect(window._gaq).to.be(undefined);

      var spy = sinon.spy();
      analytics.ready(spy);
      analytics.initialize({ 'Google Analytics' : test['Google Analytics'] });
      expect(window._gaq).not.to.be(undefined);
      expect(window._gaq.push).to.eql(Array.prototype.push);
      expect(spy.called).to.be(true);

      // When the library loads, push will be overriden.
      setTimeout(function () {
        expect(window._gaq.push).not.to.eql(Array.prototype.push);
        done();
      }, 3500);
    });

    it('should store options', function () {
      analytics.initialize({ 'Google Analytics' : test['Google Analytics'] });
      expect(analytics.providers[0].options.trackingId).to.equal('x');
    });

    it('should set domain', function () {
      // Define `_gaq` so we can spy on it.
      window._gaq = [];
      var spy = sinon.spy(window._gaq, 'push');

      var options = extend(test['Google Analytics'], { domain : 'example.com' });
      analytics.initialize({ 'Google Analytics' : options });
      expect(spy.calledWith(['_setDomainName', 'example.com'])).to.be(true);

      spy.restore();
    });

    it('should add enhanced link attribution', function () {
      // Define `_gaq` so we can spy on it.
      window._gaq = [];
      var spy = sinon.spy(window._gaq, 'push');

      var options = extend(test['Google Analytics'], { enhancedLinkAttribution : true });
      analytics.initialize({ 'Google Analytics' : options });
      expect(spy.calledWith(['_require', 'inpage_linkid', 'http://www.google-analytics.com/plugins/ga/inpage_linkid.js'])).to.be(true);

      spy.restore();
    });

    it('should add site speed sample rate', function () {
      // Define `_gaq` so we can spy on it.
      window._gaq = [];
      var spy = sinon.spy(window._gaq, 'push');

      var options = extend(test['Google Analytics'], { siteSpeedSampleRate : 5 });
      analytics.initialize({ 'Google Analytics' : options });
      expect(spy.calledWith(['_setSiteSpeedSampleRate', 5])).to.be(true);

      spy.restore();
    });

    it('should add anonymize ip', function () {
      // Define `_gaq` so we can spy on it.
      window._gaq = [];
      var spy = sinon.spy(window._gaq, 'push');

      var options = extend(test['Google Analytics'], { anonymizeIp : true });
      analytics.initialize({ 'Google Analytics' : options });
      expect(spy.calledWith(['_gat._anonymizeIp'])).to.be(true);

      spy.restore();
    });

    it('should add canonical url', function () {
      // Add the meta tag we need.
      var $meta = $('<meta rel="canonical" href="http://google.com/a-thing">').appendTo('head');
      // Define `_gaq` so we can spy on it.
      window._gaq = [];
      var spy = sinon.spy(window._gaq, 'push');

      analytics.initialize({ 'Google Analytics' : test['Google Analytics'] });
      expect(spy.calledWith(['_trackPageview', '/a-thing'])).to.be(true);

      spy.restore();
      $meta.remove();
    });

    it('shouldnt add canonical url', function () {
      window._gaq = [];
      var spy = sinon.spy(window._gaq, 'push');

      analytics.initialize({ 'Google Analytics' : 'x' });
      expect(spy.calledWith(['_trackPageview', undefined])).to.be(true);

      spy.restore();
    });

  });


  describe('track', function () {

    it('should push "_trackEvent"', function () {
      var spy = sinon.spy(window._gaq, 'push');
      analytics.track(test.event);
      expect(spy.calledWith([
        '_trackEvent',
        'All',
        test.event,
        undefined,
        undefined,
        undefined
      ])).to.be(true);

      spy.restore();
    });

    it('should push category', function () {
      var spy = sinon.spy(window._gaq, 'push');
      analytics.track(test.event, {
        category : 'Category'
      });
      expect(spy.calledWith([
        '_trackEvent',
        'Category',
        test.event,
        undefined,
        undefined,
        undefined
      ])).to.be(true);

      spy.restore();
    });

    it('should push label', function () {
      var spy = sinon.spy(window._gaq, 'push');
      analytics.track(test.event, {
        label : 'Label'
      });
      expect(spy.calledWith([
        '_trackEvent',
        'All',
        test.event,
        'Label',
        undefined,
        undefined
      ])).to.be(true);

      spy.restore();
    });

    it('should push value', function () {
      var spy = sinon.spy(window._gaq, 'push');
      analytics.track(test.event, { value : 30 });
      expect(spy.calledWith([
        '_trackEvent',
        'All',
        test.event,
        undefined,
        30,
        undefined
      ])).to.be(true);

      spy.restore();
    });

    it('should push revenue', function () {
      var spy = sinon.spy(window._gaq, 'push');
      analytics.track(test.event, { revenue : 9.99 });
      expect(spy.calledWith([
        '_trackEvent',
        'All',
        test.event,
        undefined,
        10,
        undefined
      ])).to.be(true);

      spy.restore();
    });

    it('should push noninteraction', function () {
      var spy = sinon.spy(window._gaq, 'push');
      analytics.track(test.event, { noninteraction : true });
      expect(spy.calledWith([
        '_trackEvent',
        'All',
        test.event,
        undefined,
        undefined,
        true
      ])).to.be(true);

      spy.restore();
    });

  });


  describe('pageview', function () {

    it('should push "_trackPageview"', function () {
      var spy = sinon.spy(window._gaq, 'push');
      analytics.pageview();
      expect(spy.calledWith(['_trackPageview', undefined])).to.be(true);
      spy.restore();
    });

    it('should push a url', function () {
      var spy = sinon.spy(window._gaq, 'push');
      analytics.pageview(test.url);
      expect(spy.calledWith(['_trackPageview', test.url])).to.be(true);
      spy.restore();
    });

  });

});
