TM.declare('lh.controller.BaseController').inherit('thinkmvc.Controller').extend({
  preventedActions:{},
  slideTimeSlow:500,
  slideTimeNormal:300,
  selectedClass:'background-stress',

  preventDoubleAction:function(action) {
    var self = this;
    if (!self.preventedActions[action]) {
      self.preventedActions[action]= true;

      setTimeout(function() {
        self.preventedActions[action] = false;
      }, self.slideTimeSlow);

      return false;
    }
    return true;
  }
});

TM.declare('lh.controller.ItemMenuController').inherit('lh.controller.BaseController').extend((function(){
  function expandSubMenu($menuItem) {
    // When clicking menu items, the window will scroll. prevent this function being executed twice in short time.
    if (this.preventDoubleAction('window-scroll') || $menuItem.hasClass(this.selectedClass)) {
      return;
    }

    var el = this._el, slideTime = this.slideTimeNormal,
      selected = this.selectedClass, selectedEl = '.' + selected,
      $selectItem = el.$menuItems.filter(selectedEl).removeClass(selected);
    if ($selectItem.length) {
      $selectItem.siblings('.tm-sub-list').slideUp(slideTime);
      el.$subMenuItems.filter(selectedEl).removeClass(selected);
    }
    $menuItem.addClass(selected);
    $menuItem.siblings('.tm-sub-list').slideDown(slideTime);
  }

  function scrollContentToTop($menuItem) {
    var mainTop = this._el.$mainContent.offset().top,
      offset = $('#' + $menuItem.data('itemId')).offset();
    $('html,body').animate({scrollTop: offset.top - mainTop}, this.slideTimeNormal);
  }

  return {
    events:{
      'click .close-btn':'close',
      'click .menu-item':'renderSubMenu',
      'click .sub-menu-item':'renderItemContent',
      'scroll window':'updateMenu'
    },

    selectors:{
      designList: '.design-list',
      itemContents:'.design-list .content',
      mainContent: '#mainContent',
      menuItems:'#menu .menu-item',
      subMenuItems:'#menu .sub-menu-item'
    },

    close:function(event) {
      var el = this._el, $target = $(event.currentTarget), selected = this.selectedClass, selectedEl = '.' + selected;
      $target.parents('.content').fadeOut(this.slideTimeNormal, function() {
        el.$subMenuItems.filter(selectedEl).removeClass(selected);
        $target.parents('.design-list').find('.preview-content').show();
      });
    },

    renderSubMenu:function(event) {
      var $target = $(event.currentTarget), self = this;
      if ($target.hasClass(this.selectedClass)) {
        return;
      }

      // expand sub menu
      expandSubMenu.call(this, $target);

      // scroll the block to top
      scrollContentToTop.call(this, $target);
    },

    renderItemContent:function(event) {
      var $target = $(event.currentTarget), contentId = $target.data('contentId'),
        selected = this.selectedClass, selectedEl = '.' + selected;
      if (!contentId || $target.hasClass(selected)) {
        return;
      }

      var $content = $('#' + contentId);
      if (!$content.length) {
        return;
      }

      this._el.$subMenuItems.filter(selectedEl).removeClass(selected);
      $target.addClass(selected);

      this._el.$itemContents.filter(':visible').hide();
      $content.fadeIn(this.slideTimeNormal);
    },

    /*
    * When window scrolls, update left menu according to first visible content
    * */
    updateMenu:function() {
      var el = this._el, $list = el.$designList, $win = $(window), firstId,
        mainTop = el.$mainContent.offset().top;
      $list.each(function(index, el) {
        var $el = $(el), contentOffset = $el.offset().top + $el.height() - 100;
        if (contentOffset > $win.scrollTop() + mainTop) {
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
  events:{
    'mouseenter .close-btn':'toggleCloseBtn',
    'mouseenter #footMarker':'toggleFooter',
    'mouseleave .close-btn':'toggleCloseBtn',
    'mouseleave #realFooter':'toggleFooter',
    'scroll window': 'toggleFooter'
  },

  selectors:{
    footer:'#footer',
    realFooter:'#realFooter'
  },

  toggleCloseBtn:function(event) {
    var $target = $(event.currentTarget);
    if (event.type === 'mouseenter') {
      $target.animate({'font-size':'2.8em'}, 200);
    } else {
      $target.animate({'font-size':'1.8em'}, 200);
    }
  },

  toggleFooter:function(event) {
    var $footer = this._el.$footer, $win = $(window), $doc = $(document),
      $marker = $footer.find('#footMarker'),
      $realFooter = $footer.find('#realFooter'),
      isAtBottom = $win.scrollTop() + $win.height() === $doc.height(),
      isMouseEvent = event.type === 'mouseenter',
      isScrollEvent = event.type === 'scroll',
      slideTimeSlow = this.slideTimeSlow, slideTimeNormal = this.slideTimeNormal;
    if ((isMouseEvent || (isScrollEvent && isAtBottom)) && $marker.is(':visible')) {
      $marker.slideUp(slideTimeNormal, function() {
        $realFooter.slideDown(slideTimeSlow);
      });
    } else if (!$marker.is(':visible')) {
      $realFooter.slideUp(slideTimeSlow, function() {
        $marker.slideDown(slideTimeNormal);
      });
    }
  }
});

TM.declare('lh.controller.LoadingController').inherit('lh.controller.BaseController').extend(function() {
  // private functions
  function initImageList() {
    var $images, el = this._el;
    this._el.$preloadedImages.each(function(index, img) {
      var $img = $("<img>").hide().attr('src', $(img).attr('src'))
        .load(function(event) { $(this).data('ready', 1); });
      $images = $images ? $images.add($img) : $img;
    });

    el.$imgList.prepend($images);
    el.$preloadedImages.remove();
  }

  function switchShowImages() {
    var index = 0, el = this._el, $images = el.$imgList.find('img');
    if (!$images.length) {
      return;
    }

    setInterval(function() {
      var $img, count = 0;
      while(true) {
        $img = $images.eq(index++ % $images.length);
        if ($img.data('ready')) {
          break;
        }

        if (++count === $images.length) {
          return;
        }
      }

      $images.filter(':visible').hide();
      $img.show();

      if (!el.$realTitle.is(':visible')) {
        el.$loadingTitle.hide();
        el.$realTitle.slideDown(300);
      }
    }, 500);
  }

  // public properties
  return {
    rootNode: '#loadingImages',

    selectors:{
      imgList:'.image',
      loadingTitle:'#loadingTitle',
      preloadedImages:'object',
      realTitle:'#realTitle'
    },

    initialize:function() {
      this.invoke('lh.controller.BaseController:initialize');
      initImageList.call(this);
      switchShowImages.call(this);
    }
  };
});

TM.declare('lh.controller.WorksController').inherit('lh.controller.BaseController').extend({
  initialize:function() {
    this.U.createInstance('lh.controller.PageController');
    this.U.createInstance('lh.controller.ItemMenuController');
  }
});

TM.declare('lh.controller.LifeController').inherit('lh.controller.BaseController').extend({
  initialize:function() {
    this.U.createInstance('lh.controller.SharedController');
    this.U.createInstance('lh.controller.ItemMenuController');
  }
});