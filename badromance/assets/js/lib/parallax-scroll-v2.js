TM.declare('thinkmvc.parallax.SequenceList').extend(function() {
  var sequenceList = {};

  return {
    initialize: function() {
      // create controller and listen window events
      this.U.createInstance('thinkmvc.controller.ParallaxScrollController', this);
    },

    get: function(options) {
      var argType = typeof options;
      if (argType === 'object') {
        var seq = options.sequence || 'seq_0';
        if (!sequenceList.hasOwnProperty(seq)) {
          sequenceList[seq] = this.U.createInstance('thinkmvc.parallax.Sequence', options);
        }
        return sequenceList[seq];
      }

      if (argType === 'string') {
        return sequenceList[seq];
      }
    },

    each: function(callback) {
      for (var k in sequenceList) {
        if (sequenceList.hasOwnProperty(k)) {
          callback.call(this, sequenceList[k]);
        }
      }
    }
  };
});

TM.declare('thinkmvc.parallax.Sequence').extend({
  modelPath: 'thinkmvc.parallax.Movement',
  scroll: { RATIO: 0, TRANSFORM: 190 },

  initialize: function(options) {
    this._configs = [];
    this._minPos = options.minPosition;
  },

  add: function(config) {
    var movement = this.U.createInstance('thinkmvc.parallax.Movement', config, this);
    this._configs.push(movement);
    return this;
  },

  /*
  * return a list of movements contain those with same order in the sequence
  * */
  getAvailableMovements: function() {
    var movementList, size = this.getMovementCount(), isPageUp = this._scrollStatus.isPageUp;
    for (var i = 0; i < size; i++) {
      var index = isPageUp ? i : size - i - 1, move = this.getMovement(index);
      if (move.getMovableElementIndex(isPageUp) < 0) {
        continue;
      }

      if (movementList) {
        var curOrder = movementList[0].getOrder(), order = move.getOrder();
        if ((isPageUp && curOrder > order) || (!isPageUp && curOrder < order)) {
          movementList = [move];
        } else if (curOrder === order) {
          movementList.push(move);
        }
      } else {
        movementList = [move];
      }
    }

    return movementList;
  },

  getMovement: function(index) {
    return this._configs[index];
  },

  getMovementCount: function() {
    return this._configs.length;
  },

  initScrollStatus: function() {
    var $win = $(window), scrollTop = $win.scrollTop();

    if (!this.scroll.RATIO) {
      // compute the max distance the window can scrolls
      var sceneHeight = $(document).height() - $win.height();
      if (sceneHeight <= 0) {
        throw new Error('Document height should be greater than window.');
      }

      // Window triggers scroll event every time when it scrolls for a distance,
      // scrollRatio will transform scrollTop to a smaller value so that elements' move
      // can be controlled more precisely.
      this.scroll.RATIO = sceneHeight / this.scroll.TRANSFORM;
    }

    // compute the scroll distance
    var lastPos = this._lastPos !== undefined ? this._lastPos : 0;
    this._lastPos = scrollTop;

    return this._scrollStatus = {
      isPageUp: scrollTop - lastPos > 0,
      minPosition: this._minPos,
      position: scrollTop / this.scroll.RATIO,
      scrollTop: scrollTop,
      winWidth: $win.width()
    };
  }
});

TM.declare('thinkmvc.parallax.Movement').extend(function() {
  var scroll = { MULTIPLE: 25 };

  function getOffset() {
    return (this._position - this.getMinPosition()) * scroll.MULTIPLE;
  }

  function isAtPosition(elIndex, isPageUp) {
    var propValue = this.getElement(elIndex).data('propValue');

    return isPageUp
      ? propValue === this.getEndPoint()
      : propValue === this.getStartPoint();
  }

  return {
    initialize: function(config, sequence) {
      var $el = config.$el;
      if (!($el && $el.length)) {
        throw new Error('Element is invalid');
      }

      if (!config.hasOwnProperty('order')) {
        config.order = 0;
      }

      /*
      * startPoint, endPoint, $el, sequence, order
      * */
      this._config = config;
      this._sequence = sequence;
    },

    canUpdate: function() {
      if (this._isPageUp) { // page goes up
        return this._position > this.getMinPosition();
      } else { // page goes down
        return true;
      }
    },

    computePropValue: function () {
      var propValue, offset = getOffset.call(this),
        startPoint = this.getStartPoint(),
        endPoint = this.getEndPoint();

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
    },

    getAvailableElement: function() {
      return this.getElement(this.getAvailableElementIndex());
    },

    getAvailableElementIndex: function() {
      if (!this.hasOwnProperty('_cachedElIndex')) {
        if (this.hasOwnProperty('_isPageUp')) {
          throw new Error('_cachedElIndex and _isPageUp are not defined.');
        }
        this._cachedElIndex = this.getMovableElementIndex(this._isPageUp);
      }
      return this._cachedElIndex;
    },

    getCssProp: function() {
      return this._config.cssProp;
    },

    getElement: function(elIndex) {
      return arguments.length > 0
        ? this._config.$el.eq(elIndex)
        : this._config.$el;
    },

    getEndPoint: function() {
      return this._config.endPoint;
    },

    getMinPosition: function() {
      // compute moved elements count
      var count = 0, size = this._sequence.getMovementCount();
      for (var i = 0; i < size; i++) {
        var index = this._isPageUp ? i : size - i - 1,
          movement = this._sequence.getMovement(index);
        if (movement.getOrder() < this.getOrder()) {
          count += movement.getElement().length;
        }
      }
      count += this.getAvailableElementIndex() + 1;
      return this._baseMinPos * count;
    },

    /*
     * look for next movable element. config.$el may be a set of elements,
     * in this case move them one by one
     * */
    getMovableElementIndex: function (isPageUp) {
      var index, cachedIndex = -1, maxIndex = this.getElement().length - 1;

      if (isPageUp) {
        for (index = 0; index <= maxIndex; index++) {
          if (!isAtPosition.call(this, index, isPageUp)) {
            cachedIndex = index;
          }
        }
      } else {
        for (index = maxIndex; index >= 0; index--) {
          if (!isAtPosition.call(this, index, isPageUp)) {
            cachedIndex = index;
          }
        }
      }

      return this._cachedElIndex = cachedIndex;
    },

    getOrder: function() {
      return this._config.order;
    },

    getStartPoint: function() {
      return this._config.startPoint;
    },

    /*
    * initialize movement by current scrolling status
    * */
    initPosition: function(scrollStatus) {
      if (!this._isInitialized) {
        this.getElement().css(this.getCssProp(), this.getStartPoint());
        this._isInitialized = true;
      }

      this._baseMinPos = scrollStatus.minPosition;
      this._isPageUp = scrollStatus.isPageUp;
      this._position = scrollStatus.position;

      return this;
    }
  }
});

TM.declare('thinkmvc.controller.ParallaxScrollController').inherit('thinkmvc.Controller').extend({
  events: {
    //'resize window': 'resize',
    'scroll window': 'scroll'
  },

  initialize: function(sequences) {
    this.invoke('thinkmvc.Controller:initialize');
    this._sequences = sequences;
  },

  scroll: function() {
    this._sequences.each(function(sequence) {
      var scrollStatus = sequence.initScrollStatus(),
        movements = sequence.getAvailableMovements();

      //DEBUG
      //console.log(scrollStatus);

      for (var i = 0; movements && i < movements.length; i++) {
        var movement = movements[i], $el = movement.getAvailableElement();
        if (!$el) {
          return;
        }

        var propValue = movement.initPosition(scrollStatus).computePropValue();
        if (propValue !== movement.getStartPoint() && !$el.is(':visible')) {
          // before the element moves, show it in case it is invisible
          $el.show();
        }

        if (movement.canUpdate()) {
          $el.css(movement.getCssProp(), propValue);
        }
        $el.data('propValue', propValue);
      }
    });
  }
});