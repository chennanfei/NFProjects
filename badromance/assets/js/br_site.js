TM.declare('br.controller.BaseController').inherit('thinkmvc.Controller').extend({
  effectTime: {
    TINY: 10,
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
  },

  getParallaxScroll: function() {
    return this.U.createInstance('thinkmvc.controller.ParallaxScrollController');
  }
});

TM.declare('br.controller.MainController').inherit('br.controller.BaseController').extend({
  controllers: [
    'br.controller.HomeController',
    'br.controller.ShopController'
    //'br.controller.DesignController'
    //'br.controller.FootController'
  ],

  selectors: {
    body: 'body',
    glass: '#glass',
    imgContainer: '#img-container',
    loading: '#loading',
    scene: '#scene'
  },

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    var el = this._el, left = 0, self = this;
    var timer = setInterval(function() {
      left++;
      el.$glass.css('margin-left', left);
      el.$imgContainer.css('left', -1 * left);

      if (left >= 0) {// DEBUG - 426
        clearInterval(timer);
        self.postShow();
      }
    }, self.effectTime.TINY);
  },

  postShow: function() {
    var self = this;

    setTimeout(function() {
      self._el.$loading.hide();
      self._el.$scene.show();

      for (var i = 0; i < self.controllers.length; i++) {
        self.U.createInstance(self.controllers[i]);
      }
    }, self.effectTime.FAST);
  }
});

TM.declare('br.controller.HomeController').inherit('br.controller.BaseController').extend({
  selectors: {
    head: '#home-head',
    home: '#home',
    foot: '#home-foot',
    siteDesc: '#site-desc',
    siteMenu: '#site-menu',
    siteTitle: '#site-title'
  },

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    var el = this._el, time = this.effectTime.SLOW, width = $(window).width() / 2;

    // show in order: home section, footer, header.
    el.$home.fadeIn(time, function() {
      el.$head.slideDown(time, function() {
        el.$foot.slideDown(time);
      });
    });

    this.getParallaxScroll()
      .add({
        $el: el.$siteMenu,
        cssProp: 'left',
        maxPos: 40,
        minPos: 0,
        startPoint: 0,
        endPoint: -1 * (width + el.$siteMenu.width())
      }).add({
        $el: el.$siteDesc,
        cssProp: 'left',
        maxPos: 60,
        minPos: 10,
        startPoint: parseInt(el.$siteDesc.css('left'), 10),
        endPoint: -1 * (width + el.$siteDesc.width())
      }).add({
        $el: el.$siteTitle,
        cssProp: 'left',
        maxPos: 70,
        minPos: 19,
        startPoint: parseInt(el.$siteTitle.css('left'), 10),
        endPoint: -1 * (width + el.$siteTitle.width())
      }).add({
        $el: el.$foot,
        cssProp: 'bottom',
        maxPos: 40,
        minPos: 19,
        startPoint: 0,
        endPoint: -1 * el.$foot.height()
      });
  }
});

TM.declare('br.controller.ShopController').inherit('br.controller.BaseController').extend({
  rootNode: '#shop',

  selectors: {
    leftCol: '#shop-col-first',
    rightCol: '#shop-col-second',
    sectionInner: '.br-section-inner'
  },

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    var $win = $(window), width = $win.width(), halfW = -width / 2, height = $win.height();

    // create parallax scroll object
    this.getParallaxScroll()
      .add({ // shop section moves out from right side
        $el: this._$root,
        cssProp: 'left',
        maxPos: 90,
        minPos: 20,
        startPoint: width,
        endPoint: 0
      }).add({ // left column moves out from left side
        $el: this._el.$leftCol,
        cssProp: 'left',
        maxPos: 110,
        minPos: 70,
        startPoint: halfW,
        endPoint: 0
      }).add({ // right column moves out from right side
        $el: this._el.$rightCol,
        cssProp: 'right',
        maxPos: 110,
        minPos: 70,
        startPoint: halfW,
        endPoint: 0
      });
  }
});

TM.declare('br.controller.DesignController').inherit('br.controller.BaseController').extend({
  rootNode: '#design',

  selectors: {
    content: '.br-design-content',
    imageContainer: '.br-design-scroll-images',
    leftImages: '.br-design-left-img',
    rightImages: '.br-design-right-img'
  },

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    var el = this._el, width = $(window).width() / 2;
    this.getParallaxScroll()
      .add({
        $el: this._$root.show(),
        cssProp: 'opacity',
        maxPos: 140,
        minPos: 80,
        startPoint: 0,
        endPoint: 1
      })
      .add({
        $el: el.$content,
        cssProp: 'top',
        maxPos: 160,
        minPos: 85,
        startPoint: 200,
        endPoint: -400
      }).add({
        $el: el.$imageContainer,
        cssProp: 'margin-top',
        maxPos: 160,
        minPos: 85,
        startPoint: 400,
        endPoint: -2000
      }).add({
        $el: el.$leftImages,
        cssProp: 'left',
        maxPos: 200,
        minPos: 105,
        startPoint: -1 * el.$leftImages.outerWidth(),
        endPoint: 0
      }).add({
        $el: el.$rightImages,
        cssProp: 'right',
        maxPos: 200,
        minPos: 105,
        startPoint: -1 * el.$leftImages.outerWidth(),
        endPoint: 0
      });
  }
});

TM.declare('br.controller.FootController').inherit('br.controller.BaseController').extend({
  rootNode: '#contact-footer',

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    var $root = this._$root;
    this.getParallaxScroll()
      .add({
        $el: $root,
        cssProp: 'bottom',
        maxPos: 60,
        minPos: 0,
        startPoint: -1 * $root.height() - 30,
        endPoint: 0
      });
  }
});