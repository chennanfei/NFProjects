TM.configure({
  baseUrl: 'assets/js',
  debugEnabled: false,

  dependencies: {
    first: ['background', 'jquery', 'carousel', 'expander', 'menu', 'popover']
  },

  modules: {
    background: 'g-background.js',
    carousel: 'g-carousel.js',
    expander: 'g-expander.js',
    first: 'g-site.js',
    jquery: 'lib/jquery-1.11.0.js', // 'http://code.jquery.com/jquery-1.11.0.min.js'
    menu: 'g-menu.js',
    popover: 'g-popover.js'
  },

  pages: {
    main: {
      controller: 'gc.controller.MainController',
      module: 'first'
    }
  }
});

TM.declare('gc.controller.MainController').inherit('thinkmvc.Controller').extend(function() {
  var $win = $(window);

  return {
    events: {
      'resize window': 'resizeWindow'
    },

    selectors: {
      sections: '.g-section'
    },

    initialize: function() {
      this.invoke('thinkmvc.Controller:initialize');
      this.resizeWindow();
      this.U.createInstance('gc.controller.SectionMenuController');
      this.U.createInstance('gc.controller.PopoverController');
    },

    resizeWindow: function() {
      // initialize the section height and position
      var height = $win.height();
      this._el.$sections.each(function(index, el) {
        var $el = $(el), maxHeight = $el.data('maxHeight'),
          ht = maxHeight < height ? maxHeight : height;

        $(el).css({height: ht});
      });
    }
  };
});

TM.declare('gc.controller.HomeController').inherit('thinkmvc.Controller').extend({
  initialize: function() {
    this.U.getClass('gc.model.CarouselList').add('home',
      this.U.createInstance('gc.controller.CarouselController', 'homeCarousel')
    );
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
    'support': '#support'
  },

  initialize: function() {
    this.invoke('thinkmvc.Controller:initialize');
    this.U.createInstance('gc.controller.ExpanderController');

    var win = window, data = win.GOCCIA_CY_DATA;
    this.initHelps(data.helps).initBackers(data.backers);

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
  },

  initHelps: function(helps) {
    var $template = this._el.$expanderTemplate,
      $fragment = $(document.createDocumentFragment());
    helps.forEach(function(help) {
      var $help = $template.clone().show().removeAttr('id');
      $help.find('.g-expander-title').html(help.title);
      $help.find('.g-expander-content').html('<p>' + help.content + '</p>');
      $fragment.append($help);
    });

    $template.parent().append($fragment);
    $template.remove();
    return this;
  }
});