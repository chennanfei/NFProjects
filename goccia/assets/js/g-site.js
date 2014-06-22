TM.configure({
  baseUrl: 'assets/js',
  debugEnabled: false,

  dependencies: {
    first: ['jquery']
  },

  modules: {
    config: 'g-site.js',
    jquery: 'lib/jquery-1.11.0.js' // 'http://code.jquery.com/jquery-1.11.0.min.js'
  },

  pages: {
    main: {
      controller: 'gc.controller.MainController',
      module: 'first'
    }
  }
});

TM.declare('gc.controller.BaseController').inherit('thinkmvc.Controller').extend({});

TM.declare('gc.controller.MainController').inherit('gc.controller.BaseController').extend(function() {
  var $win = $(window);

  return {
    events: {
      'resize window': 'resizeWindow'
    },

    selectors: {
      sections: '.g-section'
    },

    initialize: function() {
      this.invoke('gc.controller.BaseController:initialize');

      this.resizeWindow();

      this.U.createInstance('gc.controller.PageMenuController');

      this.U.getClass('gc.model.CarouselList').addCarousel('home',
        this.U.createInstance('gc.controller.CarouselController', 'homeCarousel')
      );
    },

    resizeWindow: function() {
      // initialize the section height and position
      var height = $win.height();
      this._el.$sections.each(function(index, el) {
        $(el).css({height: height, top:  height * index});
      });
    }
  };
});

TM.declare('gc.controller.PageMenuController').inherit('gc.controller.BaseController').extend(function() {
  var $win = $(window), $page = $('body'),
    ACTIVE_CLASS = 'g-section-menu-item-active';

  /* look for the section which is closest to the window top */
  function getClosestMenuItem() {
    var $items = this._el.$menuItems, winTop = $win.scrollTop(), min;

    $items.each(function(index, el) {
      var $el = $(el), $section = $('#' + $el.data('section')),
        top = $section.offset().top, diff = Math.abs(top - winTop);
      if (!min || diff < min.diff) {
        min = { $el: $el, diff: diff };
      }
    });

    return min && min.$el;
  }

  /* look for next section to show when scrolling up/down page */
  function getNextMenuItem(isPageDown) {
    var $items = this._el.$menuItems, nextIndex = 1;

    $items.each(function(index, el) {
      if ($(el).hasClass(ACTIVE_CLASS)) {
        nextIndex = isPageDown ? index + 1 : index - 1;
      }
    });

    return $items.eq(nextIndex);
  }

  function showClosestSection() {
    var $root = this._$root, self = this;
    $root.queue(function() {
      var $item = getClosestMenuItem.call(self);
      if ($item) {
        $item.trigger('click');
      }
    }).delay(100).dequeue();
  }

  function showNextSection(curScroll) {
    var lastScroll = this._lastScrollTop;
    if (curScroll === lastScroll) {
      return;
    }

    var $item = getNextMenuItem.call(this, curScroll > lastScroll);
    if ($item) {
      $item.trigger('click');
    }
  }

  /* change the selected status of menu items */
  function toggleMenuItemStatus($item) {
    var $items = this._el.$menuItems;
    if (!$item || $item.hasClass(ACTIVE_CLASS)) {
      return;
    }

    $items.filter('.' + ACTIVE_CLASS).removeClass(ACTIVE_CLASS);
    $item.addClass(ACTIVE_CLASS);

    /*
    // change the url in address bar
    history.pushState({}, null, '#' + $item.data('section'));
     */
  }

  return {
    events: {
      'click .g-section-menu-item': 'clickMenuItem',
      'mousedown window': 'pressMouse',
      'mouseup window': 'pressMouse',
      'scroll window': 'scrollWindow'
    },

    rootNode: '#sectionMenu',

    selectors: {
      menuItems: '.g-section-menu-item'
    },

    initialize: function() {
      this.invoke('gc.controller.BaseController:initialize');

      this._isAnimationLocked = false;
      this._isMousePressed = false;
      this._isPressedScroll = false;
      this._lastScrollTop = $win.scrollTop();
      this._timer = null;

      showClosestSection.call(this);
    },

    clickMenuItem: function(event) {
      var $item = $(event.currentTarget), sectionId = $item.data('section'),
        $section = $('#' + sectionId), CarouselList = this.U.getClass('gc.model.CarouselList'),
        top = $section.offset().top, self = this;

      // lock animation
      self._isAnimationLocked = true;

      // if window scrolls fast, animation is invoked, but meanwhile window doesn't
      // stop scrolling yet. delay animation in order to avoid overlap of animation
      // and window scrolling
      $page.delay(100).animate({scrollTop: top}, {
        duration: 500,

        done: function() {
          toggleMenuItemStatus.call(self, $item);

          // delay releasing lock bcz when animation stops,
          // the scroll event is triggered for one time anyway
          if (self._isAnimationLocked) { // html and body both animate
            setTimeout(function() {
              self._isAnimationLocked = false;
            }, 100);
          }

          // restart the carousel in the section
          CarouselList.updateAutoTransition(sectionId, 'start');
        },

        start: function() {
          // when switching to section, stop carousels in other sections
          CarouselList.updateOtherAutoTransitions(sectionId, 'stop');
        }
      });
    },

    pressMouse: function(event) {
      // record the mouse press status
      this._isMousePressed = event.type === 'mousedown';

      // press window scroll bar and scroll page. in this case,
      // look for the closest section
      if (!this._isMousePressed && this._isPressedScroll) {
        this._isPressedScroll = false;
        showClosestSection.call(this);
      }
    },

    scrollWindow: function() {
      var scrollTop = $win.scrollTop();
      if (this._isAnimationLocked) {
        this._lastScrollTop = scrollTop;
        return;
      }

      if (this._isMousePressed) {
        // set flag when mouse is pressed and window starts to scroll
        this._isPressedScroll = true;
      } else {
        // scroll the mouse or use up/down keyboard
        showNextSection.call(this, scrollTop);
      }

      this._lastScrollTop = scrollTop;
    }
  };
});

TM.declare('gc.model.CarouselList').share({
  list: {},

  addCarousel: function(id, carousel) {
    if (!(id && carousel)) {
      throw new Error('Id or carousel is invalid.');
    }

    this.list[id] = carousel;
  },

  updateAutoTransition: function(id, action) {
    var list = this.list,
      callback = action === 'stop'
        ? 'stopAutoTransition'
        : action === 'start' ? 'startAutoTransition' : null;
    if (!callback) {
      return;
    }

    if (arguments.length) {
      if (list.hasOwnProperty(id)) {
        list[id][callback].call(list[id]);
      }
      return;
    }

    for (var k in list) {
      if (list.hasOwnProperty(k)) {
        list[k][callback].call(list[k]);
      }
    }
  },

  updateOtherAutoTransitions: function(id, action) {
    var list = this.list,
      callback = action === 'stop'
        ? 'stopAutoTransition'
        : action === 'start' ? 'startAutoTransition' : null;
    for (var k in list) {
      if (!list.hasOwnProperty(k) || k === id) {
        continue;
      }

      this.updateAutoTransition(k, action);
    }
  }
});

TM.declare('gc.controller.CarouselController').inherit('gc.controller.BaseController').extend(function() {
  var $win = $(window), IMAGE_DIR = './assets/images/',
    ACTIVE_CLASS = 'g-carousel-control-active', AUTO_TRANS_TIME = 2000;
    MODE = {auto: 1, manual: 2};

  function adjustItemWidth() {
    var el = this._el, wd = this._winWidth;

    // adjust the item container's width so that all items can be in one row
    el.$itemContainer.width(wd * el.$items.length);
    el.$items.width(wd);
  }

  function initCarousel() {
    var el = this._el, len = el.$items.length, self = this;
    if (!len) {
      return;
    }

    // set flag to items and set image background
    el.$items.each(function(index, ele) {
      var $el = $(ele), $cItem = el.$controlItems.eq(index);
      $el.data('index', index);

      if ($cItem) {
        $cItem.data('index', index);
      }

      var url = 'url("' + IMAGE_DIR + $el.data('image') +'.jpg")';
      $el.css('background-image', url);
    });

    // copy the first item to container tail
    var $item = el.$items.eq(0).clone().data({index: 0, isCopy: true});
    el.$items.parent().append($item);
    el.$items = el.$items.add($item[0]);

    adjustItemWidth.call(this);
  }

  function getTransformProperties(index) {
    var offset = -1 * this._winWidth * index,
      translateX = 'translate(' + offset + 'px)';

    return {
      '-webkit-transform': translateX,
      '-moz-transform': translateX,
      '-ms-transform': translateX,
      '-o-transform': translateX,
      transform: translateX
    }
  }

  function transformItem($item) {
    var index = $item.data('index');
    if (index < 0) {
      return;
    }

    toggleControlItem.call(this, index);
    this._el.$itemContainer.css(getTransformProperties.call(this, index));
  }

  function toggleControlItem(index) {
    var el = this._el, $item = el.$controlItems.eq(index);
    if (!$item.hasClass(ACTIVE_CLASS)) {
      el.$controlItems.filter('.' + ACTIVE_CLASS).removeClass(ACTIVE_CLASS);
      $item.addClass(ACTIVE_CLASS);
    }
  }

  return {
    events: {
      'click .g-carousel-control-item': 'clickControlItem',
      'resize window': 'resizeWindow',
      'transitionend .g-carousel-items': 'postTransition'
    },

    selectors: {
      itemContainer: '.g-carousel-items',
      items: '.g-carousel-item',
      control: '.g-carousel-control',
      controlItems: '.g-carousel-control-item'
    },

    initialize: function(carouselId) {
      this.rootNode = '#' + carouselId; // initialize the root node firstly
      this.invoke('gc.controller.BaseController:initialize');

      this._mode = MODE.auto;
      this._winWidth = $win.width();

      initCarousel.call(this);
      this.startAutoTransition();
    },

    clickControlItem: function(event) {
      var $target = $(event.currentTarget);
      if ($target.hasClass(ACTIVE_CLASS)) {
        return;
      }

      this.stopAutoTransition();
      transformItem.call(this, $target);
    },

    postTransition: function() {
      // last item in the carousel is the copy of the first one, need replace it
      // by updating the transform without transition
      if (this._isLastItem) {
        this._el.$itemContainer.addClass('g-carousel-items-terminate')
          .css(getTransformProperties.call(this, 0));
      }

      if (!this._timer && this._mode !== MODE.manual) {
        this.startAutoTransition();
      }
    },

    resizeWindow: function() {
      this._winWidth = $win.width();

      // reset the width of carousel items
      adjustItemWidth.call(this);

      // adjust the position of active item
      var $activeItem = this._el.$controlItems.filter('.' + ACTIVE_CLASS);
      transformItem.call(this, $activeItem);
    },

    startAutoTransition: function() {
      if (this._timer) {
        return;
      }

      var $controlItems = this._el.$controlItems, $itemContainer = this._el.$itemContainer,
        $items = this._el.$items, self = this;

      this._timer = setInterval(function() {
        // look for next item
        var index = $controlItems.filter('.' + ACTIVE_CLASS).data('index') + 1,
          controlIndex = (self._isLastItem = index >= $controlItems.length) ? 0 : index;
        toggleControlItem.call(self, controlIndex);

        $itemContainer.removeClass('g-carousel-items-terminate')
          .css(getTransformProperties.call(self, index));
      }, AUTO_TRANS_TIME);
    },

    stopAutoTransition: function() {
      if (this._timer) {
        clearInterval(this._timer);
      }
      this._timer = 0;
    }
  };
});