TM.declare('br.controller.BaseController').inherit('thinkmvc.Controller').extend(function() {
  // private static variables
  var lastPos, scrollTop;

  // private functions
  function getMovedOffset() {
    var lp = lastPos || 0;
    lastPos = scrollTop;
    return scrollTop - lp;
  }

  function getPosition() {
    if (!this.scroll.RATIO) {
      // compute the max distance the window can scrolls
      var sceneHeight = $('#scene').height() - $(window).height();
      if (isNaN(sceneHeight) || sceneHeight <= 0) {
        throw new Error('The height of #scene is invalue.');
      }

      // In this case, window triggers scroll event every time when it scrolls 100,
      // scrollRatio will transform scrollTop to a smaller value so that elements' move
      // can be controlled more precisely.
      this.scroll.RATIO = sceneHeight / this.scroll.TRANSFORM;
    }
    return scrollTop / this.scroll.RATIO;
  }

  return  {
    effectTime: {
      TINY: 10,
      FAST: 200,
      NORMAL: 300,
      SLOW: 500
    },

    scroll: {
      MULTIPLE: 25,
      RATIO: 0,
      TRANSFORM: 190
    },

    getScrollStatus: function() {
      return this._scrollStatus;
    },

    initScrollStatus: function() {
      var self = this, movedOffset = getMovedOffset.call(this), $win = $(window);
      scrollTop = $win.scrollTop();

      this._scrollStatus = {
        isPageUp: movedOffset >= 0,
        position: getPosition.call(self),
        scrollTop: scrollTop,
        winWidth: $win.width()
      };
    }
  }
});

TM.declare('br.controller.ParallaxScrollController').inherit('br.controller.BaseController').extend(function() {
  // private static variables
  var lastPos, scrollTop, scroll = { MULTIPLE: 25, RATIO: 0, TRANSFORM: 190 };

  // private functions
  function getMovedOffset() {
    var lp = lastPos || 0;
    lastPos = scrollTop;
    return scrollTop - lp;
  }

  function getPosition() {
    if (!scroll.RATIO) {
      // compute the max distance the window can scrolls
      var sceneHeight = $('#scene').height() - $(window).height();
      if (isNaN(sceneHeight) || sceneHeight <= 0) {
        throw new Error('The height of #scene is invalue.');
      }

      // In this case, window triggers scroll event every time when it scrolls 100,
      // scrollRatio will transform scrollTop to a smaller value so that elements' move
      // can be controlled more precisely.
      scroll.RATIO = sceneHeight / scroll.TRANSFORM;
    }
    return scrollTop / scroll.RATIO;
  }

  function getPropValue(config, pos) {
    var $el = config.$el, offset = (pos - config.minPos + 0.5) * scroll.MULTIPLE,
      startPoint = config.startPoint, endPoint = config.endPoint,
      propValue = startPoint + offset;

    if (endPoint > startPoint) {
      propValue = propValue > endPoint ? endPoint : propValue;
      propValue = propValue < startPoint ? startPoint : propValue;
    } else {
      propValue = propValue > startPoint ? startPoint : propValue;
      propValue = propValue < endPoint ? endPoint : propValue;
    }
    return propValue;
  }

  function initScrollStatus() {
    var self = this, movedOffset = getMovedOffset.call(this), $win = $(window);
    scrollTop = $win.scrollTop();

    return {
      isPageUp: movedOffset >= 0,
      position: getPosition.call(self),
      scrollTop: scrollTop,
      winWidth: $win.width()
    };
  }

  function isAtPosition(config, isPageUp) {
    if (isPageUp) {
      return config.$el.data('propValue') === config.endPoint;
    } else {
      return config.$el.data('propValue') === config.startPoint;
    }
  }

  function move(config, scrollStatus) {
    var pos = scrollStatus.position;
    if (pos > config.maxPos) {
      return;
    }

    var $el = config.$el, isPageUp = scrollStatus.isPageUp;
    if (isAtPosition(config, scrollStatus.isPageUp)) {
      return;
    }

    var propValue = getPropValue.call(this, config, pos);
    if (propValue === config.startPoint) {
      $el.hide();
    } else {
      $el.show();
    }

    if (isPageUp) { // page goes up
      if (pos > config.minPos) {
        $el.css(config.cssProp, propValue);
      }
    } else { // page goes down
      $el.css(config.cssProp, propValue);
    }
    $el.data('propValue', propValue);
  }

  return {
    /*
     * Move element by position
     * @prams:
     * config = {
         $el: this._el.$foot, // element to move
         cssProp: 'bottom', // css property to be modified so element looks moving
         maxPos: 30, // element moves in a scope between minPos and maxPos
         minPos: 19,
         minOffset: 12 // when offset to the original position is less than this value,
         // force offset to 0 so the element can go back to its original position
       };
     * */
    add: function(config) {
      if (!this._configs) {
        this._configs = [];
      }

      this._configs.push(config);
      return this;
    },

    scroll: function() {
      var configs = this._configs;
      if (!(configs && configs.length)) {
        return;
      }

      var scrollStatus = initScrollStatus.call(this);
      for (var i = 0; i < configs.length; i++) {
        move.call(this, configs[i], scrollStatus);
      }
    }
  }
});

TM.declare('br.controller.MainController').inherit('br.controller.BaseController').extend({
  selectors: {
    body: 'body',
    glass: '#glass',
    imgContainer: '#img-container',
    loading: '#loading',
    scene: '#scene'
  },

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    // set the scrollTop to 0 when page is loaded
    $(window).scrollTop(0);

    this.startLoad();
  },

  postShow: function() {
    var self = this;

    setTimeout(function() {
      self._el.$loading.hide();
      self._el.$scene.show();

      self.U.createInstance('br.controller.HomeController'); // DEBUG - Home
      self.U.createInstance('br.controller.ShopController');
    }, self.effectTime.FAST);
  },

  startLoad: function() {
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
  }
});

TM.declare('br.controller.HomeController').inherit('br.controller.BaseController').extend(function() {
  function loadShow() {
    var el = this._el, time = this.effectTime.SLOW;

    // show in order: home section, footer, header.
    el.$home.fadeIn(time, function() {
      el.$head.slideDown(time, function() {
        el.$foot.slideDown(time);
      });
    });

    // save the original left value
    [el.$siteMenu, el.$siteDesc, el.$siteTitle].forEach(function($el) {
      $el.data('origin', parseInt($el.css('left'), 10));
    });
  }

  function move(config) {
    var scrollStatus = this.getScrollStatus(), pos = scrollStatus.position;
    if (pos > config.maxPos) {
      return;
    }

    var $el = config.$el, offset = (pos - config.minPos + 0.5) * this.scroll.MULTIPLE;
    if (scrollStatus.isPageUp) {
      if (pos > config.minPos) {
        $el.css(config.cssProp, ($el.data('origin') || 0) - offset);
      }
    } else if ($el.data('offset') !== 0) {
      offset = offset < config.minOffset ? 0 : offset; // if offset is less than 10px
      $el.css(config.cssProp, ($el.data('origin') || 0) - offset);
    }
    $el.data('offset', offset);
  }

  function moveFooter() {
    var config = {
      $el: this._el.$foot,
      cssProp: 'bottom',
      maxPos: 40,
      minPos: 19,
      minOffset: 12
    };

    move.call(this, config);
  }

  function moveSiteDesc() {
    var config = {
      $el: this._el.$siteDesc,
      cssProp: 'left',
      maxPos: 60,
      minPos: 10,
      minOffset: 10
    };

    move.call(this, config);
  }

  function moveSiteMenu() {
    var pos = this.getScrollStatus().position;
    // site-menu is active in [0, 32]
    if (pos > 40) {
      return;
    }

    var offset = pos * this.scroll.MULTIPLE;
    this._el.$siteMenu.css('left', -1 * offset);
  }

  function moveSiteTitle() {
    var config = {
      $el: this._el.$siteTitle,
      cssProp: 'left',
      maxPos: 70,
      minPos: 19,
      minOffset: 12
    };

    move.call(this, config);
  }

  return {
    events: {
      'scroll window': 'handleScrolling'
    },

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
      loadShow.call(this);
    },

    handleScrolling: function() {
      this.initScrollStatus();
      //DEBUG
      console.log(this.getScrollStatus());

      moveSiteMenu.call(this);
      moveSiteDesc.call(this);
      moveSiteTitle.call(this);
      moveFooter.call(this);
    }
  }
});

TM.declare('br.controller.ShopController').inherit('br.controller.BaseController').extend({
  events: {
    'scroll window': 'handleScrolling'
  },

  rootNode: '#shop',

  selectors: {
    leftCol: '#shop-col-first',
    rightCol: '#shop-col-second',
    sectionInner: '.br-section-inner'
  },

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    var width = $(window).width(), halfW = -width / 2;
    this._$root.css({left: 'auto', right: -width});
    this._el.$leftCol.css('left', halfW);
    this._el.$rightCol.css('right', halfW);

    // create parallax scroll object
    this._parallaxScroll = this.U.createInstance('br.controller.ParallaxScrollController')
      .add({ // shop section moves out from right side
        $el: this._$root,
        cssProp: 'right',
        maxPos: 90,
        minPos: 20,
        minOffset: 10,
        startPoint: -width,
        endPoint: 0
      }).add({ // left column moves out from left side
        $el: this._el.$leftCol,
        cssProp: 'left',
        maxPos: 120,
        minPos: 70,
        minOffset: 15,
        startPoint: halfW,
        endPoint: 0
      }).add({ // right column moves out from right side
        $el: this._el.$rightCol,
        cssProp: 'right',
        maxPos: 120,
        minPos: 70,
        minOffset: 15,
        startPoint: halfW,
        endPoint: 0
      });
  },

  handleScrolling: function() {
    this._parallaxScroll.scroll();
  }
});

