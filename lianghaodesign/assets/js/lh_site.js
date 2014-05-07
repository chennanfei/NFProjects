TM.declare('lh.controller.BaseController').inherit('thinkmvc.Controller').extend({
  animateTime: {
    NORMAL: 300,
    FAST: 200,
    SLOW: 500,
    VERY_SLOW: 1000
  },
  preventedActions: {},
  selectedClass: 'background-stress',

  makeAjax: function(url, args) {
    if (!url) {
      throw new Error('No url was passed to ajax request.');
    }

    var self = this;
    return $.ajax(url, {
      async: true,
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      data: args.data,
      dataType: args.dataType || 'html',
      type: args.type || 'GET',

      beforeSend: function() {
        args.beforeSendHandler && args.beforeSendHandler.apply(self, arguments);
      },
      complete: function() {
        args.completeHandler && args.completeHandler.apply(self, arguments);
      },
      error: function() {
        args.errorHandler && args.errorHandler.apply(self, arguments);
      },
      success: function() {
        args.successHandler && args.successHandler.apply(self, arguments);
      }
    });
  },

  /* Prevent the same action being executed twice */
  preventDoubleAction: function(action, time) {
    var self = this;
    if (!self.preventedActions[action]) {
      self.preventedActions[action] = true;

      setTimeout(function() {
        self.preventedActions[action] = false;
      }, time || self.animateTime.NORMAL);

      return false;
    }
    return true;
  }
});

TM.declare('lh.controller.ItemMenuController').inherit('lh.controller.BaseController').extend((function() {
  function expandSubMenu($menuItem) {
    // When clicking menu items, the window will scroll. prevent this function being executed twice in short time.
    if (this.preventDoubleAction('window-scroll') || $menuItem.hasClass(this.selectedClass)) {
      return;
    }

    var el = this._el, slideTime = this.animateTime.NORMAL,
      selected = this.selectedClass, selectedEl = '.' + selected,
      $selectItem = el.$menuItems.filter(selectedEl);
    if ($selectItem.length) {
      $selectItem.removeClass(selected).siblings('.tm-sub-list').slideUp(slideTime);
      el.$subMenuItems.filter(selectedEl).removeClass(selected);
    }
    $menuItem.addClass(selected).siblings('.tm-sub-list').slideDown(slideTime);
  }

  /* retrieve section content by ajax */
  function retrieveSection($section) {
    var url = $section.data('url'), $loading = this._el.$pageLoading, self = this;
    if (!url) {
      return;
    }

    this.makeAjax(url, {
      beforeSendHandler: function() {
        $loading.fadeIn();
      },
      successHandler: function(data, status, xhr) {
        // remove url, no need request twice
        $section.html(data).data('url', null);
        // scroll the block to top
        scrollContentToTop.call(self, $section);
        $loading.fadeOut();
      }
    });
  }

  function scrollContentToTop($section) {
    var mainTop = this._el.$mainContent.offset().top,
      offset = $section.offset(), self = this;
    if (offset) {
      $('html,body').animate({scrollTop: offset.top - mainTop}, this.animateTime.NORMAL);
    }
  }

  return {
    events: {
      'click .close-btn': 'close',
      'click .menu-item': 'renderSubMenu',
      'click .sub-menu-item': 'renderItemContent',
      'scroll window': 'updateMenu'
    },

    selectors: {
      designList: '.design-list',
      mainContent: '#mainContent',
      menuItems: '#menu .menu-item',
      pageLoading: '#pageLoading',
      subMenuItems: '#menu .sub-menu-item'
    },

    close: function(event) {
      var el = this._el, $targetParent = $(event.currentTarget).parent(), selected = this.selectedClass;
      $targetParent.fadeOut(this.animateTime.NORMAL, function() {
        el.$subMenuItems.filter('.' + selected).removeClass(selected);
        $targetParent.siblings('.preview-content').show();
      });
    },

    renderSubMenu: function(event) {
      var $target = $(event.currentTarget);
      if ($target.hasClass(this.selectedClass)) {
        return;
      }

      // expand sub menu
      expandSubMenu.call(this, $target);

      var $section = $('#' + $target.data('itemId')), url = $section.data('url');
      if (url) {
        // retrieve section content
        retrieveSection.call(this, $section);
      } else {
        // scroll the block to top
        scrollContentToTop.call(this, $section);
      }
    },

    /* When clicking left menu, show sub menu and item content at the right side */
    renderItemContent: function(event) {
      var $target = $(event.currentTarget), contentId = $target.data('contentId'),
        selected = this.selectedClass;
      if (!contentId || $target.hasClass(selected)) {
        return;
      }

      var $content = $('#' + contentId);
      if (!$content.length) {
        return;
      }

      this._el.$subMenuItems.filter('.' + selected).removeClass(selected);
      $target.addClass(selected);

      $content.siblings('.content').hide();
      $content.fadeIn(this.animateTime.NORMAL);
    },

    /*
     * When window scrolls, update left menu according to first visible content
     * */
    updateMenu: function() {
      var el = this._el, $list = el.$designList, firstId,
        mainTop = el.$mainContent.offset().top;
      $list.each(function(index, el) {
        var $el = $(el), contentOffset = $el.offset().top + $el.height() - 100;
        if (contentOffset > $(window).scrollTop() + mainTop) {
          firstId = $el.attr('id');
          return false;
        }
      });

      var $menuItem = el.$menuItems.filter('[data-item-id=' + firstId + ']');
      expandSubMenu.call(this, $menuItem);
    }
  };
})());

TM.declare('lh.controller.PageController').inherit('lh.controller.BaseController').extend({
  events: {
    'mouseenter .close-btn': 'toggleCloseBtn',
    'mouseenter #footer': 'toggleFooter',
    'mouseleave .close-btn': 'toggleCloseBtn',
    'mouseleave #footer': 'toggleFooter',
    'scroll window': 'animateOnScroll'
  },

  selectors: {
    floatLayer: '#floatLayer',
    footer: '#footer',
    mainContent: '#mainContent'
  },

  initialize: function() {
    this.invoke('lh.controller.BaseController:initialize');

    var $floatLayer = this._el.$floatLayer;
    $floatLayer.data('lastOffset', $(window).scrollTop())
      .children('span').each(function(index, layer) {
        var $el = $(layer);
        $el.data('origin', parseInt($el.css('top'), 10));
      });
  },

  animateOnScroll: function(event) {
    this.moveFloatLayer2();

    // toggle to show footer
    this.toggleFooter(event);
  },

  moveFloatLayer: function() {
    var $win = $(window), offset = $win.scrollTop() - this._el.$mainContent.offset().top;
    this._el.$floatLayer.children('span').each(function(index, layer) {
      var $layer = $(layer), lastOffset = $layer.data('lastOffset');
      $layer.data('lastOffset', offset);
      if (lastOffset === undefined) {
        return;
      }

      var isPageUp = offset > lastOffset ? 1 : 0;
      if ($layer.data('origin') === undefined || $layer.data('isPageUp') !== isPageUp) {
        $layer.data('origin', offset); // the offset when page scrolls in one direction at the beginning
        $layer.data('startPos', parseInt($layer.css('top'), 10));
        $layer.data('isPageUp', isPageUp);
      }

      var origin = $layer.data('origin'), move = offset - origin; // compute the offset comparing last direction
      if (Math.abs(move) < 100) {
        // stay at the fixed place in window for a while
        $layer.css('top', move + $layer.data('startPos'));
        return;
      }

      // catch up the page
      //var ratio = (offset - lastOffset) / origin + 1;
      //$layer.css('top', $layer.data('startPos') * ratio);
    });
  },

  moveFloatLayer2: function() {
    var $win = $(window), offset = $win.scrollTop(),
      $floatLayer = this._el.$floatLayer,
      lastOffset = $floatLayer.data('lastOffset');
    $floatLayer.data('lastOffset', offset);

    var diff = offset - lastOffset, speed = 0.6; // page goes up or goes down
    $floatLayer.data('isPageUp', diff > 0);
    $floatLayer.children('span').each(function(index, layer) {
      var $layer = $(layer), currentTop = parseInt($layer.css('top'), 10);
      $layer.css('top', currentTop - diff * speed);
    });
  },

  toggleCloseBtn: function(event) {
    var $target = $(event.currentTarget);
    if (event.type === 'mouseenter') {
      $target.animate({'font-size': '2.8em'}, this.animateTime.FAST);
    } else {
      $target.animate({'font-size': '1.8em'}, this.animateTime.FAST);
    }
  },

  toggleFooter: function(event) {
    var $win = $(window), $doc = $(document), $footer = this._el.$footer,
      isAtBottom = $win.scrollTop() + $win.height() === $doc.height(),
      isMouseEvent = event.type === 'mouseenter',
      isScrollEvent = event.type === 'scroll',
      slideTime = this.animateTime.SLOW;

    // save the original bottom
    var bottom = $footer.css('bottom');
    if (typeof $footer.data('originalBottom') === 'undefined') {
      $footer.data('originalBottom', bottom);
    }

    var ob = $footer.data('originalBottom');
    if ((isMouseEvent || (isScrollEvent && isAtBottom)) && bottom !== 0) {
      $footer.animate({'bottom': 0}, slideTime);
    } else if (bottom !== ob) {
      $footer.animate({'bottom': ob}, slideTime);
    }
  }
});

TM.declare('lh.controller.PreviewImagesController').inherit('lh.controller.BaseController').extend({
  events: {
    'load .preview-content .image img:first': 'initImageList',
    'mouseenter .preview-content .image': 'switchImages'
  },

  selectors: {
    previews: '#mainContent .preview-content'
  },

  initImageList: function(event) {
    var $firstImg = $(event.currentTarget),
      $container = $firstImg.closest('.image'),
      $images = $container.find('img'),
      size = {width: $firstImg.width(), height: $firstImg.height()},
      imgCount = $images.length;
    if (!imgCount) {
      return;
    }

    $container.css(size).addClass('image-float').data('ready', 1);
    $images.css(size).show().parent().width(size.width * imgCount);
  },

  /* show next image when the mouse enters into image container */
  switchImages: function(event) {
    var $target = $(event.currentTarget), $images = $target.find('img');
    if (!$target.data('ready')) {
      this.initImageList({currentTarget: $images[0]});
    }

    // get next image and compute position of the image container
    var imgCount = $images.length, width = $images.eq(0).width(),
      nextImg = ($target.data('index') || 0) + 1;
    if (nextImg >= imgCount) {
      nextImg = 0;
    }

    var left = -1 * nextImg * width;
    $images.parent().animate({left: left}, this.animateTime.NORMAL, function() {
      $target.data('index', nextImg);
    });
  }
});

TM.declare('lh.controller.LoadingController').inherit('lh.controller.BaseController').extend(function() {
  // private functions
  function initImageList() {
    var $imgLinks, el = this._el;
    el.$preloadedImages.each(function(index, obj) {
      var $obj = $(obj), $img = el.$imgTemp.clone();
      $img.find('img').attr('src', $obj.attr('src'))
        .load(function(event) {
          $(this).parent().attr('href', $obj.data('url')).data('ready', 1);
        });
      $imgLinks = $imgLinks ? $imgLinks.add($img) : $img;
    });

    el.$imgList.prepend($imgLinks);
    el.$preloadedImages.remove();
  }

  function switchImages() {
    var index = 0, el = this._el, $imgLinks = el.$imgTemp.siblings('a');
    if (!$imgLinks.length) {
      return;
    }

    var animateTime = this.animateTime;
    setInterval(function() {
      var $imgLink, count = 0;
      while (true) {
        $imgLink = $imgLinks.eq(index++ % $imgLinks.length);
        if ($imgLink.data('ready')) {
          break;
        }

        if (++count === $imgLinks.length) {
          return;
        }
      }

      $imgLinks.filter(':visible').hide();
      $imgLink.show();

      if (!el.$realTitle.is(':visible')) {
        el.$loadingTitle.hide();
        el.$realTitle.slideDown(animateTime.NORMAL);
      }
    }, animateTime.SLOW);
  }

  // public properties
  return {
    rootNode: '#loadingImages',

    selectors: {
      imgList: '.image',
      imgTemp: '#image-template',
      loadingTitle: '#loadingTitle',
      preloadedImages: 'object',
      realTitle: '#realTitle'
    },

    initialize: function() {
      this.invoke('lh.controller.BaseController:initialize');
      initImageList.call(this);
      switchImages.call(this);
    }
  };
});

TM.declare('lh.controller.WorkController').inherit('lh.controller.BaseController').extend({
  initialize: function() {
    this.U.createInstance('lh.controller.PageController');
    this.U.createInstance('lh.controller.ItemMenuController');
    this.U.createInstance('lh.controller.PreviewImagesController');
  }
});

TM.declare('lh.controller.LifeController').inherit('lh.controller.BaseController').extend({
  initialize: function() {
    this.U.createInstance('lh.controller.PageController');
    this.U.createInstance('lh.controller.ItemMenuController');
    this.U.createInstance('lh.controller.PreviewImagesController');
  }
});