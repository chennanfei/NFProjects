TM.declare('gc.controller.PageLoadingController').inherit('thinkmvc.Controller').extend(function() {
  function show() {
    var $loading = this._el.$loading;
    if (!$loading) {
      return;
    }

    var $text = $loading.children('.g-page-loading-text');
    $text.css('top', ($loading.height() - $text.height()) / 2);
    $loading.show();
  }

  return {
    selectors: {
      template: '#pageLoadingTempl'
    },

    initialize: function($container) {
      if (!($container && $container.length)) {
        return;
      }

      this.invoke('thinkmvc.Controller:initialize');

      var $loading = this._el.$loading = this._el.$template.clone();
      $loading.removeAttr('id');
      $container.append($loading);

      show.call(this);
    },

    destroy: function() {
      var $loading = this._el.$loading;
      if ($loading) {
        $loading.fadeOut(400, function() {
          $loading.remove();
        });
      }

      this.invoke('thinkmvc.Controller:destroy');
    }
  };
});