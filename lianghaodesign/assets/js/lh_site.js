TM.declare('lh.controller.BaseController').inherit('thinkmvc.Controller').extend( {
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
  var hasPendingAjax = false,
    $openItemContents = []; // record the latest item which is opened

  function canCloseItem($item) {
    var i,
      filteredAreas = [ // if the click event is from some areas, don't close the item
        '.design-list .item',
        '.design-list .content-detail',
        '.sub-menu-item'
      ];

    // travel all nodes in the event chain
    while ($item && $item.length) {
      for (i = 0; i < filteredAreas.length; i++) {
        if ($item.is(filteredAreas[i])) {
          return false;
        }
      }

      $item = $item.parent();
    }

    return true;
  }

  function updateLoadingPosition() {
    var $parent = this._el.$designList.parent(), $loading = this._el.$pageLoading,
      offset = $parent.offset().left + ($parent.width() - $loading.width()) / 2;
    $loading.css('left', offset);
  }

  /*
  * switch the selected status of menu items.
  * */
  function expandSubMenu($menuItem, subExpanded) {
    // When clicking menu items, the window will scroll. prevent this function being executed twice in short time.
    if (this.preventDoubleAction('expand-menu')) {
      return;
    }

    var isMenuItemSelected = $menuItem.hasClass(this.selectedClass);
    if (isMenuItemSelected && !subExpanded) {
      return;
    }

    var el = this._el, slideTime = this.animateTime.NORMAL,
      selected = this.selectedClass, selectedEl = '.' + selected,
      $selectItem = el.$menuItems.filter(selectedEl);
    if ($selectItem.length && !$selectItem.is($menuItem)) {
      $selectItem.removeClass(selected).siblings('.tm-sub-list').slideUp(slideTime);
    }

    if (subExpanded) {
      var $subMenu = $menuItem.addClass(selected).siblings('.tm-sub-list');
      if (!$subMenu.is(':visible')) {
        $subMenu.slideDown(slideTime);
      }
    } else {
      $menuItem.addClass(selected);
    }
  }

  // look for the latest open item
  function getLatestOpenItem() {
    var $openItem;
    do {
      $openItem = $openItemContents.pop();
    } while ($openItem && !$openItem.is(':visible'));
    return $openItem;
  }

  /*
  * replace image placeholders with img tags so images can be downloaded
  * */
  function retrieveImages($content) {
    var $imagePlaceholders = $content.find('.image-placeholder');
    if (!$imagePlaceholders.length) {
      return;
    }

    $imagePlaceholders.each(function(index, imageHolder) {
      var $imageHolder = $(imageHolder), $imageContainer = $imageHolder.parent(),
        numbers = $imageHolder.data('numbers'),
        path = $imageHolder.data('path'),
        i, len = numbers && numbers.length;
      if (!len) {
        return;
      }

      for (i = 0; i < len; i++) {
        var $img = $('<img>').attr('src', path + numbers[i] + '.jpg');
        $imageContainer.append($img);
      }
    });

    $imagePlaceholders.remove();
  }

  /* retrieve section content by ajax */
  function retrieveSection($section, autoScroll) {
    var url = $section.data('url'), $loading = this._el.$pageLoading, self = this;
    if (!url || hasPendingAjax) {
      return;
    }

    // set the loading's position
    updateLoadingPosition.call(this);

    this.makeAjax(url, {
      beforeSendHandler: function() {
        hasPendingAjax = true;
        $loading.fadeIn();
      },
      completeHandler: function() {
        hasPendingAjax = false
      },
      successHandler: function(data, status, xhr) {
        // remove url, no need request twice
        $section.html(data).data('url', null);

        if (autoScroll) {
          // scroll the block to top
          scrollContentToTop.call(self, $section);
        }
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
      'click document': 'closeOpenItem',
      'click .close-btn': 'close',
      'click .menu-item': 'toggleSubMenu',
      'click .sub-menu-item': 'renderItemContent',
      'scroll window': 'handleScrolling'
    },

    selectors: {
      designList: '.design-list',
      mainContent: '#mainContent',
      menuItems: '#menu .menu-item',
      pageLoading: '#pageLoading',
      subMenuItems: '#menu .sub-menu-item'
    },

    close: function(event) {
      event.stopPropagation();

      var el = this._el, $target = $(event.currentTarget), $parent = $target.closest('.content-detail'),
        selected = this.selectedClass, contentId = $parent.attr('id');

      $parent.fadeOut(this.animateTime.NORMAL, function() {
        var selector = '[data-content-id="' + contentId + '"]';
        el.$subMenuItems.filter(selector).removeClass(selected);

        // recover the button to beginning status
        $target.removeClass('close-btn-status-2');

        // show the corresponding previewed item
        $target.closest('.design-list')
          .find('.preview-content .image' + selector).parent().show();
      });
    },

    /*
    * close the latest open item
    * */
    closeOpenItem: function(event) {
      if (!canCloseItem($(event.target))) {
        return;
      }

      var $openItem = getLatestOpenItem();
      if ($openItem) {
        $openItem.find('.close-btn').click();
      }
    },

    handleScrolling: function() {
      var $win = $(window), $section,
        distance = $(document).height() - ($win.scrollTop() + $win.height());
      if (distance < 20) {
        // look for the first empty section.
        this._el.$designList.each(function(index, el) {
          var $el = $(el);
          if ($el.data('url')) {
            $section = $el;
            return false;
          }
        });
      }

      if ($section) {
        retrieveSection.call(this, $section);
      } else {
        this.updateMenu();
      }
    },

    /*
    * Click the item of left menu, expand sub menu and locate the right content
    * */
    toggleSubMenu: function(event) {
      event.stopPropagation();

      var $target = $(event.currentTarget),
        $subItem = $target.siblings('.tm-sub-list'),
        $section = $('#' + $target.data('itemId')), url = $section.data('url');

      // if the sub menu is open, then close it
      if ($subItem.is(':visible')) {
        $target.siblings('.tm-sub-list').slideUp(this.animateTime.NORMAL);
        return;
      }

      // expand sub menu
      expandSubMenu.call(this, $target, true);

      if (url) {
        // retrieve section content
        retrieveSection.call(this, $section, true);
      } else {
        // scroll the block to top
        scrollContentToTop.call(this, $section);
      }

      return false;
    },

    /* When clicking left menu, show sub menu and item content at the right side */
    renderItemContent: function(event) {
      event.stopPropagation();

      var $target = $(event.currentTarget), contentId = $target.data('contentId'),
        selected = this.selectedClass;
      if (!contentId || $target.hasClass(selected)) {
        return;
      }

      var $content = $('#' + contentId);
      if (!$content.length) {
        return;
      }

      var $designList = $content.parent(),
        $previewContent = $designList.children('.preview-content');

      // look for selected sub menu item and reset its status
      $target.closest('.tm-sub-list').find('.' + selected).removeClass(selected);
      $target.addClass(selected);

      // hide item siblings
      $content.siblings('.content-detail').hide();

      // show item content
      if (!$content.data('isMoved')) {
        $content.detach().insertBefore($previewContent).data('isMoved', true);
        retrieveImages.call(this, $content);
      }
      $content.fadeIn(this.animateTime.NORMAL);

      // hide the corresponding preview item
      var $previewItems = $previewContent.find('.item');
      $previewItems.not(':visible').show();
      $previewItems.has('.image[data-content-id=' + contentId + ']').hide();

      // after item shows, expand related sub menu and scroll page
      var $subItem = $target.closest('.tm-sub-list');
      if (!$subItem.is(':visible')) {
        expandSubMenu.call(this, $subItem.siblings('.menu-item'), true);

      }
      scrollContentToTop.call(this, $designList);

      // push the item to open item list
      $openItemContents.push($content);
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

      return false;
    }
  };
})());

TM.declare('lh.controller.PageController').inherit('lh.controller.BaseController').extend({
  events: {
    'mouseenter .close-btn': 'toggleCloseBtn',
    'mouseenter #footer': 'toggleFooter',
    'mouseleave .close-btn': 'toggleCloseBtn',
    'mouseleave #footer': 'toggleFooter',
    'scroll window': 'moveWords'
  },

  selectors: {
    floatLayer: '#floatLayer',
    footer: '#footer',
    mainContent: '#mainContent'
  },

  initialize: function() {
    this.invoke('lh.controller.BaseController:initialize');

    this._el.$floatLayer.children('span').each(function(index, layer) {
      var $el = $(layer);
      $el.data('origin', parseInt($el.css('top'), 10));
    });
  },

  moveWords: function() {
    var scrollTop = $(window).scrollTop(), offset = scrollTop * 0.8;
    this._el.$floatLayer.children('span').each(function(index, layer) {
      var $el = $(layer);
      $el.css('top', $el.data('origin') + offset);
    });
  },

  toggleCloseBtn: function(event) {
    var status = 0, $target = $(event.currentTarget), prefix = 'close-btn-status-';
    if (event.type === 'mouseenter') {
      var timer = setInterval(function() {
          if (status === 2) { // exist if the button is at last status
            clearInterval(timer);
            return;
          }

          $target.removeClass(prefix + status).addClass(prefix + (++status));
        }, this.animateTime.FAST);
    } else {
      // reset to the beginning status
      $target.removeClass('close-btn-status-2');
    }
  },

  toggleFooter: function(event) {
    var $footer = this._el.$footer, status = $footer.data('status'),
      slideTime = this.animateTime.NORMAL;

    // save the original bottom
    var curBottom = parseInt($footer.css('bottom'), 10);
    if ($footer.data('originalBottom') === undefined) {
      $footer.data('originalBottom', curBottom);
    }

    // status: 1 - hidden / showed, 2 - showing/hiding
    // when mouse enters in, shows up; moves out, then hides. But if the foot is
    // at the expected position, do nothing
    var isLeaving = event.type === 'mouseleave',
      bottom = isLeaving ? $footer.data('originalBottom') : 0;
    if (status === 2 || bottom === curBottom) {
      return;
    }

    $footer.data('status', 2);
    var toggle = function() {
      $footer.animate({bottom: bottom}, slideTime,
        function() { $footer.data('status', 1); });
    };

    // when mouse leaves, footer disappears after 1 second
    if (isLeaving) {
      setTimeout(toggle, 1000);
    } else {
      toggle();
    }
  }
});

TM.declare('lh.controller.PreviewImagesController').inherit('lh.controller.BaseController').extend({
  events: {
    'click .design-list .image': 'findRightItemInSubMenu',
    'load .preview-content .image img:first': 'initImageList',
    'mouseenter .preview-content .image': 'switchImages'
  },

  selectors: {
    menu: '#menu',
    previews: '#mainContent .preview-content'
  },

  /* find the item in sub menu according to content id and click the menu item */
  findRightItemInSubMenu: function(event) {
    var contentId = $(event.currentTarget).data('contentId');
    if (contentId) {
       this._el.$menu.find('[data-content-id=' + contentId + ']').click();
    }
  },

  initImageList: function(event) {
    var $firstImg = $(event.currentTarget),
      $container = $firstImg.closest('.image'),
      $images = $container.find('img'),
      size = {width: $firstImg.width(), height: $firstImg.height()},
      imgCount = $images.length;
    if (!imgCount || !size.width) {
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
    events: {
      'mouseenter a.page-link': 'toggleLinkText',
      'mouseleave a.page-link': 'toggleLinkText'
    },

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
    },

    toggleLinkText: function(event) {
      var $target = $(event.currentTarget);
      $target.children('span').toggle();
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