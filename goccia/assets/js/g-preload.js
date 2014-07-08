TM.declare('gc.controller.PreloadController').inherit('thinkmvc.Controller').extend(function() {
  var IMAGE_DIR = './assets/images/';

  function preloadBackgroundImages($items) {
    var i, size = $items.length, count;
    for (count = 0; count < 2; count++) {
      for (i = 0; i < size; i++) {
        var $el = $items.eq(i).children('.g-background').eq(count),
          image = $el.data('image');
        if (!image) {
          continue;
        }

        var url = 'url("' + IMAGE_DIR + image + '")';
        $el.css('background-image', url);
      }
    }
  }

  function preloadImages($images, callback) {
    var size = 0, readyCount = 0, i;
    for (i = 0; i < $images.length; i++) {
      var $img = $images.eq(i);
      $img.attr('src', IMAGE_DIR + $img.data('src'));
      if ($img.data('onLoad')) {
        size++;

        $img.load(function() {
          readyCount++;

          if (readyCount === size) {
             callback && callback();
          }
        });
      }
    }
  }

  return {
    initialize: function($items, $images, callback) {
      preloadBackgroundImages($items);

      if ($images && $images.length) {
        preloadImages($images, callback);
      } else {
        callback && callback();
      }
    }
  };
});