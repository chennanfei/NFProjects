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
  var $currentVisibleItem = null;
  var saleItems = [
    { name: 'forest', title: '#001' },
    { name: 'sweet', title: '#002' },
    { name: 'curious', title: '#003' },
    { name: 'mysterious', title: '#004' },
    { name: 'hormone', title: '#005' },
    { name: 'impulse', title: '#006' },
    { name: 'intense', title: '#007' },
    { name: 'mirage', title: '#008' },
    { name: 'desire', title: '#009' },
    { name: 'ego', title: '#010' },
    { name: 'pervaya', title: '#011' },
    { name: 'lover', title: '#012' },
    { name: 'tease', title: '#013' },
    { name: 'touching', title: '#014' },
    { name: 'indulge', title: '#015' },
    { name: 'dispel', title: '#016' },
    { name: 'ferity', title: '#017' },
    { name: 'soft', title: '#018' }
  ];
  
  function computeContentOffset() {
    var el = this._el, offset = 221 + 141; // sale head's height and sale desc image
    offset += parseFloat(el.$content.css('top'));
    return offset;
  }
  
  function displayImages() {
    var i, num = 3, size = saleItems.length, el = this._el, $row, $parent = el.$imageContainer.parent();
    el.$imageContainer.detach();

    for (i = 0; i < size; i++) {
      var pos = i % num, name = saleItems[i].name;
      if (pos === 0) {
        $row = $('<div class="tm-row"></div>');
      }
      
      var $node = el.$imageTemp.clone().show();
      $node.find('.br-item-image-block').data('name', name);
      $node.find('img').attr('src', 'assets/images/item-' + name + '.jpg');
      $node.find('.br-icon-item').addClass('br-icon-item-' + name);
      $node.find('.br-sale-item-title').text(saleItems[i].title);
      
      $row.append($node);
      if (pos === num - 1) {
        $node.addClass('tm-row-col-last');
        el.$imageContainer.append($row);
      }
    }
    
    $parent.append(el.$imageContainer);
  }

  return {
    events: {
      'click .br-item-close': 'closeItem',
      'click .br-item-image-block': 'showItem',
      'mouseenter .br-item-image': 'showImageCover',
      'mouseleave .br-image-cover': 'hideImageCover',
      'scroll window': 'closeItem'
    },

    rootNode: '#sale',

    selectors: {
      content: '.br-sale-content',
      head: '.br-sale-head',
      imageContainer: '.br-sale-scroll-images',
      imageTemp: '#preview-item-template',
      itemDetail: '#sale-item-detail',
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
        endPoint: -1000,
        section: 'sale'
      });
      
      displayImages.call(this);
    },

    closeItem: function() {
      var el = this._el;
      if ($currentVisibleItem) {
        $currentVisibleItem.fadeOut(function() {
          el.$preview.show();
        });

        $currentVisibleItem = null;
      }
    },

    hideImageCover: function(event) {
      $(event.currentTarget).fadeOut();
    },

    showItem: function(event) {
      var $target = $(event.currentTarget), name = $target.data('name');
      if (!name) {
        return;
      }

      var el = this._el, $node = el.$itemDetail.siblings('#sale-item-' + name);
      if (!$node.length) {
        $node = el.$itemDetail.clone();
        $node.attr('id', '#sale-item-' + name);
        $node.find('.br-item-detail-image').html($target.find('img').clone());
        $node.find('.br-icon-item-detail').addClass('br-icon-item-detail-' + name);
        el.$itemDetail.parent().append($node);
      }
      
      $currentVisibleItem = $node;

      el.$preview.hide();
      $currentVisibleItem.show();
    },

    showImageCover: function(event) {
      $(event.currentTarget).siblings('.br-image-cover').fadeIn();
    }
  }
});