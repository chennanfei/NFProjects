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

TM.declare('gc.controller.CarouselController').inherit('thinkmvc.Controller').extend(function() {
  var $win = $(window), IMAGE_DIR = './assets/images/',
    ACTIVE_CLASS = 'g-carousel-control-active', AUTO_TRANS_TIME = 5000;

  function adjustItemWidth() {
    var el = this._el, wd = this._containerWidth;

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
    });

    setBackgroundImages(el.$items);

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

  function setBackgroundImages($items) {
    var i, size = $items.length, count;
    for (count = 0; count < 2; count++) {
      var selector = count === 0 ? '.g-background-primary' : '.g-background-secondary';
      for (i = 0; i < size; i++) {
        var $el = $items.eq(i).children(selector),
          url = 'url("' + IMAGE_DIR + $el.data('image') + '")';
        $el.css('background-image', url);
      }
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
      this.invoke('thinkmvc.Controller:initialize');

      this._containerWidth = this._$root.width();

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
      this._containerWidth = this._$root.width();

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