TM.declare('br.controller.BaseController').inherit('thinkmvc.Controller').extend({
  effectTime: {
    TINY: 10,
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
  },

  getPosition: function() {
    var $win = $(window), sceneHeight = $('#scene').height() - $win.height();
    return $win.scrollTop() / sceneHeight * 190;
  },

  getMovedOffset: function() {
    var pos = $(window).scrollTop(), lastPos = this.lastPos || 0;
    this.lastPos = pos;
    return pos - lastPos;
  },

  isPageUp: function() {
    return this.getMovedOffset() >= 0;
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
      //self.U.createInstance('br.controller.ShopController');
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

TM.declare('br.controller.HomeController').inherit('br.controller.BaseController').extend({
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

  markedPos: 60, // home section acts in [0, 1000]

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');
    this.loadShow();
  },

  loadShow: function() {
    var el = this._el, time = this.effectTime.SLOW, self = this;
    // show in order: home section, footer, header.
    el.$home.fadeIn(time, function() {
      el.$head.slideDown(time, function() {
        el.$foot.slideDown(time);
      });
    });

    el.$siteMenu.data('origin', parseInt(el.$siteMenu.css('left'), 10));
    el.$siteDesc.data('origin', parseInt(el.$siteDesc.css('left'), 10));
    el.$siteTitle.data('origin', parseInt(el.$siteTitle.css('left'), 10));
  },

  handleScrolling: function() {
    var pos = this.getPosition(), el = this._el, isPageUp = this.isPageUp(), multiple = 25;

    //DEBUG
    console.log('isPageUp:' + isPageUp + ', scrollTop:' + $(window).scrollTop() + ', pos:' + pos);

    // site menu
    if (pos < 32) {
      var offset = pos * multiple;
      el.$siteMenu.css('left', -1 * offset);
    }

    // site desc
    if (pos < 46) {
      var offset = (pos - 10.5) * multiple;
      if (isPageUp) {
        if (pos > 10) {
          el.$siteDesc.css('left', el.$siteDesc.data('origin') - offset);
        }
      } else if (el.$siteDesc.data('offset') !== 0) {
        offset = offset < 10 ? 0 : offset;
        el.$siteDesc.css('left', el.$siteDesc.data('origin') - offset);
      }
      el.$siteDesc.data('offset', offset);
    }

    // site title
    if (pos < 60) {
      var offset = (pos - 19.5) * multiple;
      if (isPageUp) {
        if (pos > 19) {
          el.$siteTitle.css('left', el.$siteTitle.data('origin') - offset);
        }
      } else if (el.$siteDesc.data('offset') !== 0) {
        // continue moving until the offset reaches to 0
        offset = offset < 12 ? 0 : offset;
        el.$siteTitle.css('left', el.$siteTitle.data('origin') - offset);
      }
      el.$siteTitle.data('offset', offset);
    }
  }
});

TM.declare('br.controller.ShopController').inherit('br.controller.BaseController').extend({
  events: {
    'scroll window': 'handleScrolling'
  },

  rootNode: '#shop',

  selectors: {
    firstCol: '#shop-col-first',
    secondCol: '#shop-col-second'
  },

  /* shop section shows [500, 1000]*/
  handleScrolling: function() {
    var scrollTop = $(window).scrollTop();

  },

  slideIn: function() {

  },

  slideOut: function() {

  }
});

