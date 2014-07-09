TM.declare('gc.controller.BackgroundController').share(function() {
  var $doc = $(document), $elements = [], currentOpacity = 0, timer, INCREASE = 0.15, INTERVAL = 2000;

  function removePrimaryBackgrounds() {
    $('.g-background-primary').remove();
  }

  function updateBackgrounds() {
    if (timer) {
      return;
    }

    timer = setInterval(function() {
      if (currentOpacity >= 1) {
        if (timer) {
          clearInterval(timer);
        }

        removePrimaryBackgrounds();
        $elements = null;
      } else {
        currentOpacity += INCREASE;

        for (var i = 0; i < $elements.length; i++) {
          $elements[i].css('opacity', currentOpacity);
        }
      }
    }, INTERVAL);
  }

  return {
    addElement: function($el) {
      if (!$el.hasClass('g-background-secondary')) {
        return;
      }

      if (currentOpacity > 0) {
        $el.css('opacity', currentOpacity);
      }

      if (currentOpacity >= 1) {
        removePrimaryBackgrounds();
        return;
      }

      $elements.push($el);
      if (!timer) {
        $doc.one('update-backgrounds', updateBackgrounds);
      }
    }
  };
});