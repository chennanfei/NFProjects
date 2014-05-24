TM.declare('br.controller.BaseController').inherit('thinkmvc.Controller').extend(function() {
  var sequenceList;

  return {
    effectTime: {
      TINY: 10,
      FAST: 200,
      NORMAL: 300,
      SLOW: 500
    },

    getSequenceList: function() {
      if (!sequenceList) {
        sequenceList = this.U.createInstance('thinkmvc.parallax.SequenceList');
      }

      return sequenceList;
    }
  }
});

TM.declare('br.controller.MainController').inherit('br.controller.BaseController').extend({
  controllers: [
    'br.controller.HomeController',
    'br.controller.ShopController',
    'br.controller.DesignController'
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

      if (left >= 426) {// DEBUG - 426
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

    var el = this._el, time = this.effectTime.SLOW, width = $(window).width() / 2,
      sequenceList = this.getSequenceList();

    // show in order: home section, footer, header.
    el.$home.fadeIn(time, function() {
      el.$head.slideDown(time, function() {
        el.$foot.slideDown(time);
      });
    });

    // create movement sequence 0
    sequenceList.get({
      minPosition: 0,
      sequence: 'seq_0'
    }).add({
      $el: el.$siteMenu,
      cssProp: 'left',
      endPoint: -1 * (width + 100)
    });

    // create movement sequence 2
    sequenceList.get({
      minPosition: 10,
      sequence: 'seq_2'
    }).add({
      $el: el.$siteTitle,
      cssProp: 'left',
      startPoint: parseInt(el.$siteTitle.css('left'), 10),
      endPoint: -1 * (width + 30)
    }).add({
      $el: el.$foot,
      cssProp: 'bottom',
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
    this.getSequenceList().get({
      sequence: 'seq_2'
    }).add({
      $el: this._$root,
      cssProp: 'left',
      startPoint: width,
      endPoint: 0
    }).add({
      $el: this._el.$leftCol,
      cssProp: 'left',
      order: 1,
      startPoint: halfW,
      endPoint: 0
    }).add({
      $el: this._el.$rightCol,
      cssProp: 'right',
      order: 1,
      startPoint: halfW,
      endPoint: 0
    }).add({
      $el: this._$root,
      cssProp: 'top',
      order: 2,
      startPoint: 0,
      endPoint: -1 * (height + 50)
    });
  }
});

TM.declare('br.controller.DesignController').inherit('br.controller.BaseController').extend({
  rootNode: '#design',

  selectors: {
    content: '.br-design-content',
    imageContainer: '.br-design-scroll-images'
  },

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    var el = this._el;
    this.getSequenceList().get({
      sequence: 'seq_2'
    }).add({
      $el: this._$root,
      cssProp: 'opacity',
      order: 2,
      startPoint: 0,
      endPoint: 1
    }).add({
      $el: el.$content,
      cssProp: 'top',
      order: 3,
      endPoint: -400
    }).add({
      $el: el.$imageContainer,
      cssProp: 'margin-top',
      order: 4,
      endPoint: -300
    });
  }
});