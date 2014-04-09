TM.declare('lh.controller.SharedController').inherit('thinkmvc.Controller').extend({
  events:{
    'click .close-btn':'closeContent',
    'click .menu-item':'renderSubMenu',
    'click .sub-menu-item':'renderItemContent',
    'mouseenter .close-btn':'toggleCloseBtn',
    'mouseenter #footMarker':'toggleFooter',
    'mouseleave .close-btn':'toggleCloseBtn',
    'mouseleave #realFooter':'toggleFooter',
    'scroll window': 'toggleFooter'
  },

  selectors:{
    firstList: '.design-list:first',
    footer:'#footer',
    itemContents:'.design-list .content',
    menuItems:'#menu .menu-item',
    realFooter:'#realFooter',
    subMenuItems:'#menu .sub-menu-item'
  },

  slideTimeSlow:500,
  slideTimeNormal:300,
  selectedClass:'background-stress',

  closeContent:function(event) {
    var el = this._el, $target = $(event.currentTarget), selected = this.selectedClass, selectedEl = '.' + selected;
    $target.parents('.content').fadeOut(this.slideTimeNormal, function() {
      el.$subMenuItems.filter(selectedEl).removeClass(selected);
      $target.parents('.design-list').find('.preview-content').show();
    });
  },

  renderSubMenu:function(event) {
    var $target = $(event.currentTarget), selected = this.selectedClass, selectedEl = '.' + selected;
    if ($target.hasClass(selected)) {
      return;
    }

    var el = this._el, slideTime = this.slideTimeNormal,
      $selectItem = el.$menuItems.filter(selectedEl).removeClass(selected);
    if ($selectItem.length) {
      $selectItem.siblings('.tm-sub-list').slideUp(slideTime);
      el.$subMenuItems.filter(selectedEl).removeClass(selected);
    }
    $target.addClass(selected);
    $target.siblings('.tm-sub-list').slideDown(slideTime);

    // scroll the block to top
    var firstTop = el.$firstList.offset().top,
      offset = $('#' + $target.data('itemId')).offset();
    $('html,body').animate({scrollTop: offset.top - firstTop}, 500);
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
    $content.fadeIn(500);
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

TM.declare('lh.controller.LoadingController').inherit('thinkmvc.Controller').extend(function() {
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
      this.invoke('thinkmvc.Controller:initialize');
      initImageList.call(this);
      switchShowImages.call(this);
    }
  };
});

TM.declare('lh.controller.WorksController').inherit('thinkmvc.Controller').extend({
  initialize:function() {
    this.U.createInstance('lh.controller.SharedController');
  }
});

TM.declare('lh.controller.LifeController').inherit('thinkmvc.Controller').extend({
  initialize:function() {
    this.U.createInstance('lh.controller.SharedController');
  }
});