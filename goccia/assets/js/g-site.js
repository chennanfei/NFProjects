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
    home: {
      controller: 'gc.controller.HomeController',
      module: 'first'
    }
  }
});

TM.declare('gc.controller.BaseController').inherit('thinkmvc.Controller').extend({});

TM.declare('gc.controller.PageMenuController').inherit('gc.controller.BaseController').extend(function() {
  var $win = $(window), $page = $('html,body');

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

  function getNextMenuItem(isPageDown) {
    var $items = this._el.$menuItems, activeClass = this.activeClass, nextIndex = 1;

    $items.each(function(index, el) {
      if ($(el).hasClass(activeClass)) {
        nextIndex = isPageDown ? index + 1 : index - 1;
      }
    });

    if (nextIndex >= 0 && nextIndex < $items.length) {
      return $items.eq(nextIndex);
    }
    return null;
  }

  function showClosestMenuItem() {
    if (this._timer) { // remove old timer
      clearTimeout(this._timer);
    }

    var self = this;
    this._timer = setTimeout(function() {
      var $item = getClosestMenuItem.call(self);
      if ($item) {
        $item.trigger('click');
      }
    }, 100);
  }

  function showNextMenuItem(curScroll) {
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
    var $items = this._el.$menuItems, activeClass = this.activeClass;
    if (!$item || $item.hasClass(activeClass)) {
      return;
    }

    $items.filter('.' + activeClass).removeClass(activeClass);
    $item.addClass(activeClass);

    // change the url in address bar
    history.pushState({}, null, '#' + $item.data('section'));
  }

  return {
    activeClass: 'g-section-menu-item-active',

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

      showClosestMenuItem.call(this);
    },

    clickMenuItem: function(event) {
      var $item = $(event.currentTarget), sectionId = $item.data('section'),
        $section = $('#' + sectionId), activeClass = this.activeClass,
        top = $section.offset().top, self = this;

      // lock animation
      self._isAnimationLocked = true;

      // if window scrolls fast, animation is invoked, but meanwhile window doesn't
      // stop scrolling yet. delay animation in order to avoid overlap of animation
      // and window scrolling
      setTimeout(function() {
        $page.animate({scrollTop: top}, 500, function() {
          toggleMenuItemStatus.call(self, $item);

          // delay releasing lock bcz when animation stops,
          // the scroll event is triggered for one time anyway
          if (self._isAnimationLocked) { // html and body both animate
            setTimeout(function() {
              self._isAnimationLocked = false;
            }, 100);
          }
        });
      }, 100);
    },

    pressMouse: function(event) {
      // record the mouse press status
      this._isMousePressed = event.type === 'mousedown';

      // press window scroll bar and scroll page. in this case,
      // look for the closest section
      if (!this._isMousePressed && this._isPressedScroll) {
        this._isPressedScroll = false;
        showClosestMenuItem.call(this);
      }
    },

    scrollWindow: function() {
      var scrollTop = $win.scrollTop();
      if (this._isAnimationLocked) {
        this._lastScrollTop = scrollTop;
        return;
      }

      if (this._isMousePressed) {
        this._isPressedScroll = true;
      } else {
        // scroll the mouse or use up/down keyboard
        showNextMenuItem.call(this, scrollTop);
      }

      this._lastScrollTop = scrollTop;
    }
  };
});

TM.declare('gc.controller.CarouselController').inherit('gc.controller.BaseController').extend({
  events: {
    'click .g-carousel-control-item': 'switchImages',
    'resize window': 'resizeWindow'
  },

  selectors: {
    sections: '.g-section'
  },

  initialize: function() {
    this.invoke('gc.controller.BaseController:initialize');
    this.resizeWindow();
  },

  resizeWindow: function() {
    var $win = $(window), width = $win.width(), height = $win.height();
    this._el.$sections.each(function(index, el) {
      $(this).css({
        height: height,
        top:  height * index
      });
    });
  },

  switchImages: function() {
    var $target = $(event.currentTarget),
      $control = $target.closest('.g-carousel-control'),
      $controlItems = $control.find('.g-carousel-control-item'),
      $activeItem = $controlItems.filter('.g-carousel-control-active');
    if ($target.is($activeItem)) {
      return;
    }
  }
});

TM.declare('gc.controller.HomeController').inherit('gc.controller.BaseController').extend(function() {
  var singleInstanceCreated = false;

  return {
    initialize: function() {
      this.invoke('gc.controller.BaseController:initialize');

      if (!singleInstanceCreated) {
        singleInstanceCreated = true;
        this.U.createInstance('gc.controller.PageMenuController');
        this.U.createInstance('gc.controller.CarouselController');
      }
    }
  };
});