TM.configure({
  baseUrl: 'assets/js',
  debugEnabled: false,

  dependencies: {
    first: ['jquery', 'carousel', 'menu', 'popover']
  },

  modules: {
    carousel: 'g-carousel.js',
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

      this.U.createInstance('gc.controller.PageMenuController');
    },

    resizeWindow: function() {
      // initialize the section height and position
      var height = $win.height();
      this._el.$sections.each(function(index, el) {
        $(el).css({height: height, top:  height * index});
      });
    }
  };
});

TM.declare('gc.controller.HomeController').inherit('thinkmvc.Controller').extend({
  initialize: function() {
    this.U.getClass('gc.model.CarouselList').addCarousel('home',
      this.U.createInstance('gc.controller.CarouselController', 'homeCarousel')
    );
  }
});

TM.declare('gc.controller.ChangeWithYouController').inherit('thinkmvc.Controller').extend(function() {
  return {
    initialize: function() {
      this.U.createInstance('gc.controller.PopoverController');
    }
  };
});