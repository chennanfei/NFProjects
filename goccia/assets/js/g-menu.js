TM.declare('gc.controller.SectionMenuController').inherit('thinkmvc.Controller').extend(function() {
  var doc = document, win = window, $doc = $(doc), $win = $(window),
    $page = $('#mainContent'), IMAGE_DIR = './assets/images/', ACTIVE_CLASS = 'g-section-menu-item-active',
    userAgent = navigator.userAgent.toLowerCase();

  function animateSection($item, sectionId) {
    if (this._lockScrolling) {
      return;
    }

    this._lockScrolling = true;

    var $section = $('#' + sectionId), CarouselList = this.U.getClass('gc.model.CarouselList'),
      top = -$section.data('top'), self = this;
    $page.animate({top: top}, {
      duration: 400,

      done: function() {
        toggleMenuItem.call(self, $item);
        showItemPopover.call(self, $item);
        retrieveSectionContent.call(self, $section);

        // if the section's height is smaller than the screen,
        // try to retrieve next section, too
        if ($section.outerHeight() < $win.height()) {
          retrieveSectionContent.call(self, $section.next().data('loadOnNext', true));
        }

        // restart the carousel in the section
        CarouselList.updateAutoTransition(sectionId, 'start');

        setTimeout(function() {
          self._lockScrolling = false;
          self._completeTime = new Date().getTime();
        }, 100);
      },

      start: function() {
        // when switching to section, stop carousels in other sections
        CarouselList.updateOtherAutoTransitions(sectionId, 'stop');
      }
    });
  }

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

    if (nextIndex >= 0 && nextIndex < $items.length - 1) {
      return $items.eq(nextIndex);
    }
  }

  function initDocEvents() {
    var self = this;

    // handle key up/down
    $doc.off('keydown').on('keydown', function(event) {
      if (event.keyCode === 40) {
        showNextSection.call(self, true);
      } else if (event.keyCode === 38) {
        showNextSection.call(self, false);
      }
    });

    // handle mouse scroll
    var callback = function(event) {
      if (self._lockScrolling) {
        return;
      } else if (isMacSafari()) {
        // mac touch panel still triggers mousewheel event once the animation
        // stops, so need check the interval between two events
        var time = new Date().getTime();
        if (time - self._completeTime < 100) {
          self._completeTime = time;
          return;
        }
      }

      var delta = event.delta || event.wheelDelta || -event.detail;
      if (isNaN(delta) || delta === 0) {
        return;
      }

      showNextSection.call(self, delta < 0);
    };

    if (win.attachEvent) {
      win.attachEvent('mousewheel', callback);
      win.attachEvent('DOMMouseScroll', callback);
    } else if (win.addEventListener) {
      win.addEventListener('mousewheel', callback, false);
      win.addEventListener('DOMMouseScroll', callback, false);
    }
  }

  function isIE() {
    // the first condition works for IE10 or less but not for IE 11
    return /msie\s([\d\.]+)/.test(userAgent) || /trident\/7\./.test(userAgent);
  }

  function isMacSafari() {
    return /mac os.*safari/.test(userAgent);
  }

  function retrieveSectionContent($section) {
    var id = $section.attr('id'), url = $section.data('url');
    if (id && url) {
      $section.find('.g-page-loading-cover').show();
      this.U.createInstance('gc.model.Section', id, url);
    }
  }

  function showClosestSection() {
    var $root = this._$root, $item = getClosestMenuItem.call(this);
    if ($item) {
      $item.trigger('click');
    }
  }

  function showNextSection(isPageDown) {
    var $item = getNextMenuItem.call(this, isPageDown);
    if ($item) {
      $item.trigger('click');
    }
  }

  function showItemPopover($item) {
    $item.find('.g-menu-item-popover').show().delay(500)
      .fadeOut(function() { $(this).removeAttr('style'); });
  }

  /* change the selected status of menu items */
  function toggleMenuItem($item) {
    var $items = this._el.$menuItems;
    if (!$item || $item.hasClass(ACTIVE_CLASS)) {
      return;
    }

    $items.filter('.' + ACTIVE_CLASS).removeClass(ACTIVE_CLASS);
    $item.addClass(ACTIVE_CLASS);

    // change the url in address bar
    if (window.history) {
      history.pushState({}, null, '#' + $item.data('section'));
    }
  }

  return {
    events: {
      'click .g-section-menu-item': 'clickMenuItem',
      'resize window': 'resizeWindow'
    },

    rootNode: '#sectionMenu',

    selectors: {
      menuItems: '.g-section-menu-item'
    },

    initialize: function() {
      this.invoke('thinkmvc.Controller:initialize');

      this._completeTime = 0;
      this._timer = null;

      initDocEvents.call(this);
      showClosestSection.call(this);
    },

    clickMenuItem: function(event) {
      var $item = $(event.currentTarget), sectionId = $item.data('section');
      if (!sectionId) {
        return;
      }

      animateSection.call(this, $item, sectionId);
    },

    resizeWindow: function() {
      // in case 'resize' event is triggered in short time
      if (this._resizeDelayTimer) {
        clearInterval(this._resizeDelayTimer);
      }

      var self = this;
      this._resizeDelayTimer = setTimeout(function() {
        showClosestSection.call(self);
      }, 500);
    }
  };

});

TM.declare('gc.model.Section').inherit('thinkmvc.Model').extend({
  viewPath: 'gc.view.SectionView',

  initialize: function(sectionId, url) {
    if (!url) {
      return;
    }

    this.invoke('thinkmvc.Model:initialize');

    var self = this;
    $.ajax(url, {
      async: true,
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      dataType: 'html',
      type: 'GET',

      success: function(data) {
        if (!data) {
          return;
        }

        self.trigger('update-content', { htmlContent: data, sectionId: sectionId });
      }
    });
  }
});

TM.declare('gc.view.SectionView').inherit('thinkmvc.View').extend(function() {
  var $doc = $(document),
    SECTION_CONTROLLER = {
      activityCompanion: 'gc.controller.ActivityController',
      changeWithYou: 'gc.controller.ChangeWithYouController',
      gocciaTime: 'gc.controller.TimeController',
      home: 'gc.controller.HomeController',
      mobileApps: 'gc.controller.MobileController'
    };

  function postPreLoadImages($section) {
    var controller = SECTION_CONTROLLER[$section.attr('id')],
      $secondaryBKs = $section.find('.g-background-secondary');

    $section.children('.g-preload-backgrounds').remove();
    $section.children('.g-page-loading-cover').fadeOut(function() {
      $(this).remove();
    });

    this.U.getClass('gc.controller.BackgroundController').addElement($secondaryBKs);
    if (!$section.data('autoUpdate')) {
      $doc.trigger('update-backgrounds');
    }

    // initialize section controller
    if (controller) {
      this.U.createInstance(controller);
    }
  }

  return {
    events: {
      'update-content': 'updateSectionContent'
    },

    updateSectionContent: function(result) {
      var data = result && result.data;
      if (!data) {
         return;
      }

      var self = this,
        $section = $('#' + data.sectionId).append(data.htmlContent).data('url', null),
        $items = $section.find('.g-carousel-item, .g-time-carousel-item'),
        $images = $section.find('img.g-preload-image');

      if ($items.length || $images.length) {
        this.U.createInstance('gc.controller.PreloadController', $items, $images, function() {
          postPreLoadImages.call(self, $section);
        });
      } else {
        postPreLoadImages.call(self, $section);
      }
    }
  }
});