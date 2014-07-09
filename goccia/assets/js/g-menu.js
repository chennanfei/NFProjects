TM.declare('gc.controller.SectionMenuController').inherit('thinkmvc.Controller').extend(function() {
  var $doc = $(document), $win = $(window), $page = $('html,body'),// in some browsers $(body).animate does not work
    IMAGE_DIR = './assets/images/', ACTIVE_CLASS = 'g-section-menu-item-active', isKeyDown = false;

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

  function releaseAnimateLock() {
    var self = this;
    if (!self._isAnimationLocked) {
      return;
    }

    // delay releasing lock bcz when animation stops,
    // the scroll event is triggered for one time anyway
    setTimeout(function() {
      self._isAnimationLocked = false;
    }, 200);
  }

  function retrieveSectionContent($section) {
    var id = $section.attr('id'), url = $section.data('url');
    if (id && url) {
      $section.find('.g-page-loading-cover').show();
      this.U.createInstance('gc.model.Section', id, url);
    }
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

  function showItemPopover($item) {
    $item.find('.g-menu-item-popover').show().delay(500)
      .fadeOut(function() {
        $(this).removeAttr('style');
      });
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
      'mousedown window': 'pressMouse',
      'mouseup window': 'pressMouse',
      'resize window': 'resizeWindow',
      'scroll window': 'scrollWindow'
    },

    rootNode: '#sectionMenu',

    selectors: {
      menuItems: '.g-section-menu-item'
    },

    initialize: function() {
      this.invoke('thinkmvc.Controller:initialize');

      this._isAnimationLocked = false;
      this._isMousePressed = false;
      this._isPressedScroll = false;
      this._lastScrollTop = $win.scrollTop();
      this._timer = null;

      $doc.off('keydown').on('keydown', function(event) {
        isKeyDown = event.keyCode === 38 || event.keyCode === 40;
      });

      showClosestSection.call(this);
    },

    clickMenuItem: function(event) {
      var $item = $(event.currentTarget), sectionId = $item.data('section');
      if (!sectionId) {
        return;
      }

      var $section = $('#' + sectionId), CarouselList = this.U.getClass('gc.model.CarouselList'),
        top = $section.offset().top, self = this;

      // lock animation
      self._isAnimationLocked = true;

      // if window scrolls fast, animation is invoked, but meanwhile window doesn't
      // stop scrolling yet. delay animation in order to avoid overlap of animation
      // and window scrolling
      var alreadyDone = false, alreadyStarted = false;
      $page.animate({scrollTop: top}, {
        duration: 500,

        complete: function() {
          releaseAnimateLock.call(self);
        },

        done: function() {
          if (alreadyDone) {
            return;
          }
          alreadyDone = true;

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

    resizeWindow: function() {
      this._isWindowResized = true;

      if (this._resizeDelayTimer) {
        window.clearInterval(this._resizeDelayTimer);
      }

      // in case 'resize' event is triggered in short time
      var self = this;
      this._resizeDelayTimer = setTimeout(function() {
        showClosestSection.call(self);
      }, 500);
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
        // up/down keyboard
        if (isKeyDown) {
          isKeyDown = false;
          showNextSection.call(this, scrollTop);          
          this._lastScrollTop = scrollTop;
        } else {          
          if (this._scrollTimer) {            
            clearTimeout(this._scrollTimer);
            
            if (this._lastScrollTop !== scrollTop) {
              var diff = this._lastScrollTop < scrollTop ? 1 : -1;
              $win.scrollTop(this._lastScrollTop + diff);
            }
          }
          
          var self = this;
          this._scrollTimer = setTimeout(function() {
            showNextSection.call(self, scrollTop);
            self._lastScrollTop = scrollTop;
          }, 200);
        }
      } else {
        this._lastScrollTop = scrollTop; // update after animation finished
      }
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