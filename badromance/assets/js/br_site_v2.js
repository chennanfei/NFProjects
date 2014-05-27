TM.declare('br.controller.BaseController').inherit('thinkmvc.Controller').extend(function() {
  var sequenceList, isInitializedOnce = false, $doc = $(document);

  function closePopover(event) {
    $(event.target).closest('.br-popover').fadeOut();
  }

  function showPopover(event) {
    var $target = $(event.currentTarget), popoverName = $target.data('name');
    if (!popoverName) {
      return;
    }

    var $popover = $('#' + popoverName), offset = $target.offset();
    if (!($popover && $popover.length)) {
      return;
    }

    $popover.css({
      left: offset.left - $popover.width() / 2 + $target.width() / 2 - 10,
      top: offset.top - $(window).scrollTop() + $target.height() + 10 // 10 is the size of triangle
    }).show();
  }

  return {
    allSections: ['home', 'shop', 'sale'], // all sections on the page

    effectTime: {
      TINY: 10,
      FAST: 200,
      NORMAL: 300,
      SLOW: 500
    },

    initialize: function() {
      this.invoke('thinkmvc.Controller:initialize');

      if (!isInitializedOnce) {
        // bind shared events
        $doc.on('click', '.br-popover-action', showPopover);
        $doc.on('click', '.br-popover-close', closePopover);
        isInitializedOnce = true;
      }
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
    'br.controller.VideoController',
    'br.controller.HomeController',
    'br.controller.HeaderController',
    'br.controller.ShopController',
    'br.controller.SaleController'
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

TM.declare('br.controller.VideoController').inherit('br.controller.BaseController').extend({
  selectors: {
    videoBlock: '#home .br-home-video'
  },

  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    var video = document.getElementById('video-fly-flowers');
    // detect the browser's capacity
    if (!(video && video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.42E01E"'))) {
      return;
    }

    video.play();

    var $win = $(window), $videoBlock = this._el.$videoBlock;
    // when window scrolls, pause the video and hide it
    $win.on('scroll', function() {
      if ($win.scrollTop() > 10) {
        if (!video.paused) {
          $videoBlock.fadeOut();
          video.pause();
        }
      } else if (video.paused) {
        $videoBlock.fadeIn();
        video.play();
      }
    });
  }
});

TM.declare('br.controller.HomeController').inherit('br.controller.BaseController').extend({
  events: {
    'click .br-show-section-action': 'showSection' // clicking top menu items shows related section
  },

  selectors: {
    head: '#home-head',
    home: '#home',
    foot: '#home-foot',
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
      endPoint: -1 * (width + el.$siteMenu.width() / 2),
      section: 'home'
    });

    // create movement sequence 2
    sequenceList.get({
      minPosition: 10,
      sequence: 'seq_2'
    }).add({
      $el: el.$siteTitle,
      cssProp: 'left',
      order: 1,
      startPoint: parseInt(el.$siteTitle.css('left'), 10),
      endPoint: -1 * (width + 30),
      section: 'home'
    }).add({
      $el: el.$foot,
      cssProp: 'bottom',
      order: 1,
      startPoint: 0,
      endPoint: -1 * el.$foot.height(),
      section: 'home'
    });
  },

  /* click menu item and scroll window to given position */
  showSection: function(event) {
    var $target = $(event.currentTarget), section = $target.data('section');
    if (!section) {
      return;
    }

    var sectionPositions = {
      home: 0,
      shop: 8830,
      sale: 11754
    };

    if (!sectionPositions.hasOwnProperty(section)) {
      return;
    }

    $('html,body').animate({scrollTop: sectionPositions[section]}, 1500);
  }
});

TM.declare('br.controller.HeaderController').inherit('br.controller.BaseController').extend({
  initialize: function() {
    this.invoke('br.controller.BaseController:initialize');

    // switch different headers
    var $primaryHeader = $('#home-head'), $secondaryHeader = $('#home-head-secondary');
    this.getSequenceList().get({
      sequence: 'seq_2'
    }).add({
      $el: $primaryHeader,
      cssProp: 'opacity',
      order: 2,
      endPoint: 0
    }).add({
      $el: $secondaryHeader,
      cssProp: 'opacity',
      order: 2,
      endPoint: 1
    }).add({
      $el: $primaryHeader,
      cssProp: 'opacity',
      order: 5,
      startPoint: 0,
      endPoint: 1
    }).add({
      $el: $secondaryHeader,
      cssProp: 'opacity',
      order: 5,
      startPoint: 1,
      endPoint: 0
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
      order: 1,
      startPoint: width,
      endPoint: 0,
      section: 'shop'
    }).add({
      $el: this._el.$leftCol,
      cssProp: 'left',
      order: 3,
      startPoint: halfW,
      endPoint: 0,
      section: 'shop'
    }).add({
      $el: this._el.$rightCol,
      cssProp: 'right',
      order: 3,
      startPoint: halfW,
      endPoint: 0,
      section: 'shop'
    }).add({
      $el: this._$root,
      cssProp: 'top',
      order: 4,
      startPoint: 0,
      endPoint: -1 * (height + 50),
      section: 'shop'
    });
  }
});

TM.declare('br.controller.SaleController').inherit('br.controller.BaseController').extend(function() {
  function computeContentOffset() {
    var el = this._el, offset = 271; // sale head's height
    offset += parseFloat(el.$content.css('top'));
    return offset;
  }

  function renderImages() {
    var index = 1, maxIndex = 18, num = 3,
      $container = this._el.$imageContainer, $parentContainer = $container.parent();
      $template = $('#sale-image-template');

    $container.detach();

    var $row;
    while (index <= maxIndex) {
      var a = index % num, $img = $template.clone().show();

      $img.find('.br-item-image-block').data('item-id', 'sale-item-' + index)
        .find('img').attr('src', 'assets/images/item-' + index + '.jpg');

      // TODO br-image-cover
      $img.find('.br-sale-item-title').text('#001');

      if (a === 1) {
        $row = $('<div class="tm-row"></div>');
      }

      $row.append($img);

      if (a === 0) {
        $img.addClass('tm-row-col-last');
        $container.append($row);
      }
      index++;
    }

    $parentContainer.append($container);
  }

  return {
    events: {
      'click .br-item-close': 'closeItem',
      'click .br-item-image-block': 'showItem',
      'mouseenter .br-item-image': 'showImageCover',
      'mouseleave .br-image-cover': 'hideImageCover',
      'scroll window': 'closeVisibleItem'
    },

    rootNode: '#sale',

    selectors: {
      content: '.br-sale-content',
      head: '.br-sale-head',
      imageContainer: '.br-sale-scroll-images',
      itemDetails: '#sale-item-details',
      preview: '#sale-preview'
    },

    initialize: function() {
      this.invoke('br.controller.BaseController:initialize');

      var el = this._el;
      this.getSequenceList().get({
        sequence: 'seq_2'
      }).add({
        $el: this._$root,
        cssProp: 'opacity',
        order: 4,
        startPoint: 0,
        endPoint: 1,
        section: 'sale'
      }).add({
        $el: el.$content,
        cssProp: 'top',
        order: 5,
        endPoint: -1 * computeContentOffset.call(this),
        section: 'sale'
      }).add({
        $el: el.$imageContainer,
        cssProp: 'margin-top',
        order: 6,
        endPoint: -300,
        section: 'sale'
      });
    },

    closeItem: function(event) {
      var el = this._el;
      el.$itemDetails.fadeOut(function() {
        el.$preview.show();
        $(event.currentTarget).closest('.br-item').hide();
      });
    },

    closeVisibleItem: function() {
      var el = this._el, visibleItem = el.$itemDetails.find('.br-item:visible');
      if (visibleItem.length){
        el.$itemDetails.fadeOut(function() {
          el.$preview.show();
          visibleItem.hide();
        });
      }
    },

    hideImageCover: function(event) {
      $(event.currentTarget).fadeOut();
    },

    showItem: function(event) {
      var $target = $(event.currentTarget), itemId = $target.data('itemId');
      if (!itemId) {
        return;
      }

      var el = this._el, $item = el.$itemDetails.find('#' + itemId);
      if (!($item && $item.length)) {
        return;
      }

      el.$preview.hide();
      el.$itemDetails.show();
      $item.show();
    },

    showImageCover: function(event) {
      $(event.currentTarget).siblings('.br-image-cover').fadeIn();
    }
  }
});