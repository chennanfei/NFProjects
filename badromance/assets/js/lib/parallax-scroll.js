/*
* Some issues to be addressed:
* 1. create a movement sequence
* 2. window resize
* 3. two movements for same element
* 4. identity the start and end of a movement
* 5. change the url in address bar when page scrolls to a section
* */
TM.declare('thinkmvc.controller.ParallaxScrollController').inherit('thinkmvc.Controller').extend(function() {
  // private static variables
  var scroll = { MULTIPLE: 25, RATIO: 0, TRANSFORM: 190 };


  function getOffset(config, index, pos) {
    return (pos - (config.minPos * (index + 1))) * scroll.MULTIPLE;
  }

  /*
  * compute the value for given css property
  * */
  function getPropValue(config, index, pos) {
    var $el = config.$el.eq(index), propValue,
      offset = getOffset(config, index, pos),
      startPoint = config.startPoint,
      endPoint = config.endPoint;

    if (endPoint > startPoint) {
      propValue = startPoint + offset;
      if (propValue > endPoint) {
        propValue = endPoint;
      } else if (propValue < startPoint) {
        propValue = startPoint;
      }
    } else {
      propValue = startPoint - offset;
      if (propValue > startPoint) {
        propValue = startPoint;
      } else if (propValue < endPoint) {
        propValue = endPoint;
      }
    }
    return propValue;
  }

  /*
  * look for next movable element. config.$el may be a set of elements,
  * in this case move them one by one
  * */
  function getMovableElIndex(config, isPageUp) {
    var index, maxIndex = config.$el.length - 1;

    if (isPageUp) {
      for (index = 0; index <= maxIndex; index++) {
        if (!isAtPosition(config.$el.eq(index), config, isPageUp)) {
          return index;
        }
      }
    } else {
      for (index = maxIndex; index >= 0; index--) {
        if (!isAtPosition(config.$el.eq(index), config, isPageUp)) {
          return index;
        }
      }
    }

    return -1;
  }

  function initScrollStatus() {
    var $win = $(window), scrollTop = $win.scrollTop();

    if (!scroll.RATIO) {
      // compute the max distance the window can scrolls
      var sceneHeight = $(document).height() - $win.height();
      if (sceneHeight <= 0) {
        throw new Error('Document height should be greater than window.');
      }

      // Window triggers scroll event every time when it scrolls for a distance,
      // scrollRatio will transform scrollTop to a smaller value so that elements' move
      // can be controlled more precisely.
      scroll.RATIO = sceneHeight / scroll.TRANSFORM;
    }

    // compute the scroll distance
    var lastPos = this._lastPos !== undefined ? this._lastPos : 0;
    this._lastPos = scrollTop;

    return {
      isPageUp: scrollTop - lastPos > 0,
      position: scrollTop / scroll.RATIO,
      scrollTop: scrollTop,
      winWidth: $win.width()
    };
  }

  // check whether element is already at expected position
  function isAtPosition($el, config, isPageUp) {
    var propValue = $el.data('propValue');
    return isPageUp
      ? propValue === config.endPoint
      : propValue === config.startPoint;
  }

  function move(config, scrollStatus) {
    var pos = scrollStatus.position;
    if (pos > config.maxPos) {
      return;
    }

    var isPageUp = scrollStatus.isPageUp, index = getMovableElIndex(config, isPageUp);
    if (index < 0) {
      return;
    }

    // put the element(s) in starting position
    if (!config._isInitialized) {
      config.$el.css(config.cssProp, config.startPoint);
      config._isInitialized = true;
    }

    var $el = config.$el.eq(index), propValue = getPropValue(config, index, pos);
    if (propValue !== config.startPoint) {
      // before the element moves, show it in case it is invisible
      if (!$el.is(':visible')) {
        $el.show();
      }
    }

    if (isPageUp) { // page goes up
      if (pos > (config.minPos * (index + 1))) {
        $el.css(config.cssProp, propValue);
      }
    } else { // page goes down
      $el.css(config.cssProp, propValue);
    }
    $el.data('propValue', propValue);
  }

  return {
    events: {
      'resize window': 'resize',
      'scroll window': 'scroll'
    },

    /*
     * Move element by position
     * @prams:
     * config = {
     $el: this._el.$foot, // element to move
     cssProp: 'bottom', // css property to be modified so element looks moving
     maxPos: 30, // element moves in a scope between minPos and maxPos
     minPos: 19,
     startPoint:
     endPoint:
     };
     * */
    add: function(config) {
      if (!this._configs) {
        this._configs = [];
      }

      var $el = config.$el;
      if (!($el && $el.length)) {
        throw new Error('Element is invalid');
      }

      this._configs.push(config);
      return this;
    },

    resize: function() {
      // adjust the movement parameters
    },

    scroll: function() {
      var configs = this._configs;
      if (!(configs && configs.length)) {
        return;
      }

      var scrollStatus = initScrollStatus.call(this);
      //DEBUG
      console.log(scrollStatus);

      for (var i = 0; i < configs.length; i++) {
        move(configs[i], scrollStatus);
      }
    }
  }
});