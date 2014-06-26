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

      this.U.createInstance('gc.controller.PopoverController');
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
  var $win = $(window), $page = $('html,body'),// in some browsers $(body).animate does not work
    ACTIVE_CLASS = 'g-section-menu-item-active';

  /* look for the section which is closest to the window top */
  function getClosestMenuItem() {
    var $items = this._el.$menuItems, winTop = $win.scrollTop(), min;

    $items.each(function(index, el) {
      var $el = $(el), $section = $('#' + $el.data('section'));
      if (!$section.length) {
        return;
      }

      var top = $section.offset().top, diff = Math.abs(top - winTop);
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
  function toggleMenuItem($item) {
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
      var alreadyDone = false, alreadyStarted = false;
      $page.delay(100).animate({scrollTop: top}, {
        duration: 500,

        complete: function() {
          if (!self._isAnimationLocked) {
            return;
          }

          // delay releasing lock bcz when animation stops,
          // the scroll event is triggered for one time anyway
          setTimeout(function() {
            self._isAnimationLocked = false;
          }, 100);
        },

        done: function() {
          if (alreadyDone) {
            return;
          }
          alreadyDone = true;

          toggleMenuItem.call(self, $item);

          // restart the carousel in the section
          CarouselList.updateAutoTransition(sectionId, 'start');

          // show the menu tooltip
          $item.find('.g-item-popover').show().delay(500).fadeOut(function() {
            $(this).removeAttr('style');
          });
        },

        start: function() {
          if (alreadyStarted) {
            return;
          }

          alreadyStarted = true;
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
        showClosestSection.call(this);
      }
    },

    scrollWindow: function() {
      var scrollTop = $win.scrollTop();
      if (this._isAnimationLocked) {
        this._lastScrollTop = scrollTop;
        return;
      }

      // set flag when mouse is pressed and window starts to scroll
      this._isPressedScroll = this._isMousePressed ? true : false;

      if (!this._isMousePressed) {
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
    var list = this.list;
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

      var url = 'url("' + IMAGE_DIR + $el.data('image') +'")';
      $el.css('background-image', url);
    });

    // copy the first item to container tail
    var $item = el.$items.eq(0).clone();
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

  function transformItem(index) {
    if (index < 0) {
      return;
    }

    this._el.$itemContainer.removeClass('g-carousel-items-terminate')
      .css(getTransformProperties.call(this, index));
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

      this._winWidth = $win.width();

      initCarousel.call(this);
      this.startAutoTransition();
    },

    clickControlItem: function(event) {
      var $target = $(event.currentTarget), index = $target.data('index');
      if ($target.hasClass(ACTIVE_CLASS) || this._shouldResetToFirstItem) {
        return;
      }

      this.stopAutoTransition();

      toggleControlItem.call(this, index);
      transformItem.call(this, index);
    },

    postTransition: function() {
      // last item in the carousel is the copy of the first one, need replace it
      // by updating the transform without transition
      if (this._shouldResetToFirstItem) {
        this._el.$itemContainer.addClass('g-carousel-items-terminate')
          .css(getTransformProperties.call(this, 0));
        this._shouldResetToFirstItem = false;
      }

      if (!this._timer) {
        this.startAutoTransition();
      }
    },

    resizeWindow: function() {
      this._winWidth = $win.width();

      // reset the width of carousel items
      adjustItemWidth.call(this);

      // adjust the position of active item
      var index = this._el.$controlItems.filter('.' + ACTIVE_CLASS).data('index');
      toggleControlItem.call(this, index);
      transformItem.call(this, index);
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
          controlIndex = (self._shouldResetToFirstItem = index >= $controlItems.length) ? 0 : index;

        toggleControlItem.call(self, controlIndex);
        transformItem.call(self, index);
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

TM.declare('gc.controller.PopoverController').inherit('gc.controller.BaseController').extend(function() {
  var $doc = $(document), popovers = {}, eventsBound = false, hasOpenPopover = false;

  function closePopover(event) {
    if (!hasOpenPopover) {
      return;
    }

    // check if the event is from popover itself
    var $target = $(event.target);
    if ($target.is('.g-popover-trigger') || $target.is('.g-popover')) {
      return;
    }

    var $popover = $target.closest('.g-popover');
    if ($popover.length) {
      if ($target.is('.g-popover-close')) {
        $popover.fadeOut();
      }
      return;
    }

    closeOpenPopover();
  }

  function closeOpenPopover() {
    for (var k in popovers) {
      if (popovers.hasOwnProperty(k) && popovers[k].is(':visible')) {
        popovers[k].fadeOut();
        hasOpenPopover = false;
        break;
      }
    }
  }

  function showPopover(event) {
    var $trigger = $(event.currentTarget), popoverId = $trigger.data('popoverId'),
      $popover = popovers.hasOwnProperty(popoverId) && popovers[popoverId];
    if (!$popover) {
      $popover = $('#' + popoverId);
      if ($popover.length) {
        popovers[popoverId] = $popover;
      } else {
        return;
      }
    }

    if ($popover.is(':visible')) {
      return;
    }

    closeOpenPopover();
    updatePosition($popover, $trigger);
    $popover.fadeIn();

    hasOpenPopover = true;
  }

  function updatePosition($popover, $trigger) {
    if (!($popover && $popover.length && $trigger && $trigger.length)) {
      return;
    }

    var offset = $trigger.offset();
    $popover.css({
      left: offset.left - $popover.width() / 2,
      top: offset.top - $popover.outerHeight() - 10
    });
  }

  return {
    initialize: function() {
      if (eventsBound) {
        return;
      }

      $doc.on('click', closePopover).on('click', '.g-popover-trigger', showPopover);
      eventsBound = true;
    }
  };
});

TM.declare('gc.controller.ChangeWithYouController').inherit('gc.controller.BaseController').extend(function() {
  return {
    initialize: function() {
      this.invoke('gc.controller.BaseController:initialize');
    }
  };
});