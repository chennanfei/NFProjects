TM.declare('gc.controller.ExpanderController').inherit('thinkmvc.Controller').extend(function() {
  var BTN_CLASS = 'g-expander-btn', COLLAPSED_CLASS = 'g-expander-collapsed',
    EXPAND_CLASS = 'g-expander-expanded';

  function collapseContent($expander) {
    if (!$expander.length) {
      return;
    }

    $expander.removeClass(EXPAND_CLASS).addClass(COLLAPSED_CLASS)
      .find('.' + BTN_CLASS).text('+');
  }

  function expandContent($expander) {
    $expander.removeClass(COLLAPSED_CLASS).addClass(EXPAND_CLASS)
      .find('.' + BTN_CLASS).text('-');
  }

  return {
    events: {
      'click .g-expander-header': 'toggleExpanderContent'
    },

    toggleExpanderContent: function(event) {
      var $expander = $(event.currentTarget).closest('.g-expander');
      if ($expander.hasClass(COLLAPSED_CLASS)) { // open expander
        // close other expander
        var $visibleExpander = $expander.siblings('.' + EXPAND_CLASS);
        collapseContent($expander.siblings('.' + EXPAND_CLASS));
        expandContent($expander);
      } else {
        collapseContent($expander);
      }
    }
  };
});