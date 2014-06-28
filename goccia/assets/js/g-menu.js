TM.declare('gc.controller.PageMenuController').inherit('thinkmvc.Controller').extend(function() {
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

  function retrieveSectionContent($section) {
    var id = $section.attr('id'), url = $section.data('url');
    if (!(id && url)) {
      return;
    }

    this.U.createInstance('gc.model.Section', id, url);
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
      this.invoke('thinkmvc.Controller:initialize');

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

          retrieveSectionContent.call(self, $section);
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
  var SECTION_CONTROLLER = {
    changeWithYou: 'gc.controller.ChangeWithYouController',
    home: 'gc.controller.HomeController'
  };

  return {
    events: {
      'update-content': 'updateSectionContent'
    },

    updateSectionContent: function(result) {
      var data = result && result.data;
      if (!data) {
         return;
      }

      var $section = $('#' + data.sectionId)
          .append((data.htmlContent))
          .data('url', null),
        controller = SECTION_CONTROLLER[$section.attr('id')];

      $section.find('.g-page-loading').fadeOut(function() {
        $(this).remove();
      });

      // initialize section events
      if (controller) {
        this.U.createInstance(controller);
      }
    }
  }
});