TM.configure({
  baseUrl: 'assets/js',
  debugEnabled: false,

  dependencies: {
    first: ['background', 'jquery', 'carousel', 'expander', 'menu', 'popover', 'preload']
  },

  modules: {
    background: 'g-background.js',
    carousel: 'g-carousel.js',
    expander: 'g-expander.js',
    first: 'g-site.js',
    jquery: 'lib/jquery-1.11.0.js', // 'http://code.jquery.com/jquery-1.11.0.min.js'
    menu: 'g-menu.js',
    popover: 'g-popover.js',
    preload: 'g-preload.js'
  },

  pages: {
    main: {
      controller: 'gc.controller.MainController',
      module: 'first'
    }
  }
});

TM.declare('gc.controller.MainController').inherit('thinkmvc.Controller').extend(function() {
  var win = window, $win = $(win),
    WIN_PARAMS = 'height=550, width=1000, toolbar=no, menubar=no, scrollbars=yes, resizable=yes,location=no, status=no';

  return {
    events: {
      'click .g-video-link': 'showWindowPopover',
      'resize window': 'resizeWindow',
      'scroll window': 'scrollWindow'
    },

    selectors: {
      main: '#mainContent',
      pageHeader: '#pageHeader',
      sections: '.g-section'
    },

    initialize: function() {
      this.invoke('thinkmvc.Controller:initialize');

      this._el.$main.css('position', 'fixed');

      this.resizeWindow();
      this.U.createInstance('gc.controller.SectionMenuController');
      this.U.createInstance('gc.controller.PopoverController');
    },

    resizeWindow: function() {
      // initialize the section height and position
      var height = $win.height(), width = $win.width(), totalHeight = 0;
      this._el.$sections.each(function(index, el) {
        var $el = $(el), maxHeight = $el.data('maxHeight'),
          ht = maxHeight < height ? maxHeight : height;

        $el.data('top', totalHeight).height(ht);
        totalHeight += ht;
      });
    },

    scrollWindow: function() {
      if (this._el.$pageHeader.width() > $win.width()) {
        this._el.$pageHeader.css('left', -1 * $win.scrollLeft());
      }
    },

    showWindowPopover: function(event) {
      event.preventDefault();

      var $link = $(event.currentTarget), title = $link.data('title') || 'Goccia';
      win.open($link.attr('href'), title, WIN_PARAMS);
    }
  };
});

TM.declare('gc.controller.HomeController').inherit('thinkmvc.Controller').extend({
  initialize: function() {
    var carousel = this.U.createInstance('gc.controller.CarouselController',
      'homeCarousel', {}, { manualStart: true });
    this.U.getClass('gc.model.CarouselList').add('home', carousel);
  }
});

TM.declare('gc.controller.ActivityController').inherit('thinkmvc.Controller').extend({
  initialize: function() {
    this.U.getClass('gc.model.CarouselList').add('activityCompanion',
      this.U.createInstance('gc.controller.CarouselController', 'activityCarousel')
    );
  }
});

TM.declare('gc.controller.TimeController').inherit('thinkmvc.Controller').extend({
  initialize: function() {
    this.invoke('thinkmvc.Controller:initialize');
    this.U.getClass('gc.model.CarouselList').add('gocciaTime',
      this.U.createInstance('gc.controller.TimeCarouselController'));
  }
});

TM.declare('gc.controller.MobileController').inherit('thinkmvc.Controller').extend({
  initialize: function() {
    this.U.getClass('gc.model.CarouselList').add('mobileApps',
      this.U.createInstance('gc.controller.CarouselController', 'mobileCarousel')
    );
  }
});

TM.declare('gc.controller.ChangeWithYouController').inherit('thinkmvc.Controller').extend({
  selectors: {
    'data': '#changeYouPageData',
    'expanderTemplate': '#expanderTemplate',
    'support': '#supports'
  },

  initialize: function() {
    this.invoke('thinkmvc.Controller:initialize');
    this.U.createInstance('gc.controller.ExpanderController');

    var win = window, data = win.GOCCIA_CY_DATA;
    this.initBackers(data.backers);

    win.GOCCIA_CY_DATA = null;
    this._el.$data.remove();
  },

  initBackers: function(backers) {
    var $groups = this._el.$support.find('.g-backer-group'), $parent = $groups.parent(),
      colNum = $groups.length;
    if (!colNum) {
      return;
    }
    $groups.detach();

    backers.forEach(function(backer, index) {
      $groups.eq([index % colNum]).append('<p>' + backer + '</p>');
    });

    $parent.append($groups);
  }
});