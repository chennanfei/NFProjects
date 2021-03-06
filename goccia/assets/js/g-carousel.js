TM.declare('gc.model.CarouselList').share({
  list: {},

  /* id: section which carousels live in */
  add: function(id, carousel) {
    if (!id) {
      throw new Error('Id is invalid.');
    }

    var carousels = Array.prototype.slice.call(arguments, 1);
    if (!(carousels && carousels.length)) {
      throw new Error('No carousels were passed in.');
    }

    this.list[id] = carousels;
    return this;
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
      if (list[id]) {
        list[id].forEach(function(carousel) {
          carousel[callback].call(carousel);
        });
      }
      return;
    }

    for (var k in list) {
      if (list[k]) {
        list[k].forEach(function(carousel) {
          carousel[callback].call(carousel);
        });
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

TM.declare('gc.controller.BaseCarouselController').inherit('thinkmvc.Controller').extend({
  controlTransition: function(event) {
    var $target = $(event.currentTarget);
    if (this.isPaused()) {
      $target.removeClass('g-icon-play').addClass('g-icon-pause');
      this.isPaused(0).startAutoTransition(true);
    } else {
      $target.removeClass('g-icon-pause').addClass('g-icon-play');
      this.isPaused(1).stopAutoTransition();
    }
  },

  isPaused: function(isPaused) {
    if (!this._$root) {
      return 0;
    }

    if (!this.hasOwnProperty('_isPaused')) {
      this._isPaused = this._$root.find('.g-icon-trans-control').data('isPaused');
    }

    if (arguments.length < 1) {
      return this._isPaused;
    } else {
      this._isPaused = isPaused;
      return this;
    }
  },

  stopAutoTransition: function() {
    if (this._timer) {
      clearInterval(this._timer);
    }
    this._timer = 0;
  }
});

TM.declare('gc.controller.CarouselController').inherit('gc.controller.BaseCarouselController').extend(function() {
  var $doc = $(document), $win = $(window), IMAGE_DIR = './assets/images/',
    ACTIVE_CLASS = 'g-carousel-control-active', AUTO_TRANS_TIME = 4000;

  function adjustItemWidth() {
    var el = this._el, wd = this._containerWidth;

    el.$itemsWrapper.css({
      height: this._$root.height()
    });

    // adjust the item container's width so that all items can be in one row
    el.$itemContainer.width(wd * el.$items.length);
    el.$items.width(wd);
  }

  function getActiveItem() {
    var $activeControlItem = this._el.$controlItems.filter('.' + ACTIVE_CLASS),
      index = $activeControlItem && $activeControlItem.data('index'),
      $activeItem = !isNaN(index) && this._el.$items.eq(index);
    if ($activeItem && $activeItem.length) {
      return $activeItem;
    }
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
    });

    // copy the first item to container tail
    var $item = el.$items.eq(0).clone(),
      $secondaryBK = $item.find('.g-background-secondary');
    el.$items.parent().append($item);
    el.$items = el.$items.add($item[0]);

    this.U.getClass('gc.controller.BackgroundController').addElement($secondaryBK);

    adjustItemWidth.call(this);
  }

  function getTransformProperties(index) {
    var offset = -1 * this._containerWidth * index,
      translateX = 'translate(' + offset + 'px)';

    return {
      '-webkit-transform': translateX,
      '-moz-transform': translateX,
      '-ms-transform': translateX,
      '-o-transform': translateX,
      transform: translateX
    }
  }

  function performCallback(cName) {
    var callback = this._callbacks && this._callbacks[cName];
    if (typeof callback === 'function') {
      // pass current carousel instance and active item
      callback(this, getActiveItem.call(this));
    }
  }

  function runTransition() {
    // look for next item
    var $controlItems = this._el.$controlItems,
      index = $controlItems.filter('.' + ACTIVE_CLASS).data('index') + 1,
      controlIndex = (this._shouldResetToFirstItem = index >= $controlItems.length) ? 0 : index;

    toggleControlItem.call(this, controlIndex);
    transformItem.call(this, index);

    // start to update backgrounds after the first image slides
    $doc.trigger('update-backgrounds');
  }

  function transformItem(index) {
    if (index < 0) {
      return;
    }

    performCallback.call(this, 'beforeSlide');

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
      'click .g-icon-trans-control': 'controlTransition',
      'click .g-carousel-control-item': 'clickControlItem',
      'resize window': 'resizeWindow',
      'transitionend .g-carousel-items': 'postTransition'
    },

    selectors: {
      itemContainer: '.g-carousel-items',
      items: '.g-carousel-item',
      itemsWrapper: '.g-carousel-items-wrapper',
      control: '.g-carousel-control',
      controlItems: '.g-carousel-control-item'
    },

    initialize: function(carouselId, callbacks, options) {
      this.rootNode = '#' + carouselId; // initialize the root node firstly
      this.invoke('gc.controller.BaseCarouselController:initialize');

      this._containerWidth = this._$root.width();
      this._callbacks = callbacks || {};
      this._options = options || { manualStart: false };

      initCarousel.call(this);

      if (!this._$root.closest('.g-section').data('loadOnNext')) {
        this.startAutoTransition();
      }
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
      performCallback.call(this, 'afterSlide');

      // last item in the carousel is the copy of the first one, need replace it
      // by updating the transform without transition
      if (this._shouldResetToFirstItem) {
        this._el.$itemContainer.addClass('g-carousel-items-terminate')
          .css(getTransformProperties.call(this, 0));
        this._shouldResetToFirstItem = false;
      }

      this.startAutoTransition();
    },

    resizeWindow: function() {
      this._containerWidth = this._$root.width();

      // reset the width of carousel items
      adjustItemWidth.call(this);

      // adjust the position of active item
      var index = this._el.$controlItems.filter('.' + ACTIVE_CLASS).data('index');
      toggleControlItem.call(this, index);
      transformItem.call(this, index);
    },

    startAutoTransition: function(runAtOnce) {
      if (this._timer || this.isPaused()) {
        return;
      }

      var self = this;
      if (runAtOnce) {
        runTransition.call(self);
      }

      this._timer = setInterval(function() {
        runTransition.call(self);
      }, AUTO_TRANS_TIME);
    }
  };
});

TM.declare('gc.controller.TimeCarouselController').inherit('gc.controller.BaseCarouselController').extend(function() {
  var $win = $(window), AUTO_TRANS_TIME = 3000,
    ITEM_LEFT_CLASS = 'g-time-carousel-item-left',
    ITEM_RIGHT_CLASS = 'g-time-carousel-item-right',
    ITEM_ACTIVE_CLASS = 'g-time-carousel-item-active';

  function getNextItem($itemList, $item) {
    var nextIndex = $item.data('index') + 1;
    return $itemList.eq(nextIndex >= $itemList.length ? 0 : nextIndex);
  }

  function runTransition($clockTick, $items) {
    var $activeItem = $items.filter('.' + ITEM_ACTIVE_CLASS),
      $content = $('#' + $activeItem.data('contentId')),
      $leftItem = $items.filter('.' + ITEM_LEFT_CLASS);
    if ($leftItem.length) {
      $leftItem.removeClass(ITEM_LEFT_CLASS).hide();

      if ($content.data('isHalf')) {
        $clockTick.fadeIn();
      }
      $content.fadeIn();
    } else {
      getNextItem($items, $activeItem).addClass(ITEM_ACTIVE_CLASS).show();
      $activeItem.removeClass(ITEM_ACTIVE_CLASS).addClass(ITEM_LEFT_CLASS);

      $content.fadeOut();
      if ($clockTick.is(':visible')) {
        $clockTick.fadeOut();
      }
    }
  }

  return {
    events: {
      'click .g-icon-trans-control': 'controlTransition',
      'resize window': 'resizeWindow'
    },

    rootNode: '#gocciaTimeCarousel',

    selectors: {
      items: '.g-time-carousel-item'
    },

    initialize: function() {
      this.invoke('gc.controller.BaseCarouselController:initialize');

      var width = $win.width();
      this._el.$items.each(function(index, item) {
        $(item).data('index', index).find('.g-background').width(width);
      });

      this.startAutoTransition();
    },

    resizeWindow: function() {
      var width = $win.width();
      this._el.$items.each(function(index, item) {
        $(item).find('.g-background').width(width);
      });
    },

    startAutoTransition: function() {
      if (this._timer || this.isPaused()) {
        return;
      }

      var $clockTick = $('#clockHalfTick'), $items = this._el.$items;
      runTransition($clockTick, $items);

      this._timer = setInterval(function() {
        runTransition($clockTick, $items);
      }, AUTO_TRANS_TIME);
    }
  };
});