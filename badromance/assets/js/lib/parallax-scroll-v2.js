TM.declare('thinkmvc.parallax.SequenceList').extend({
  initialize: function() {
    this._sequenceList = {};

    // create controller and listen window events
    this.U.createInstance('thinkmvc.controller.ParallaxScrollController', this);
  },

  get: function(options) {
    var argType = typeof options, sequenceList = this._sequenceList;
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
    var sequenceList = this._sequenceList;
    for (var k in sequenceList) {
      if (sequenceList.hasOwnProperty(k)) {
        callback.call(this, sequenceList[k]);
      }
    }
  }
});

TM.declare('thinkmvc.parallax.Sequence').extend({
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

  getMinPosition: function() {
    return this._minPos;
  },

  getMovement: function(index) {
    return this._configs[index];
  },

  getMovements: function() {
    return this._configs;
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
      position: scrollTop / this.scroll.RATIO,
      scrollTop: scrollTop,
      winWidth: $win.width()
    };
  }
});

TM.declare('thinkmvc.parallax.Movement').extend(function() {
  var scroll = { MULTIPLE: 25 };

  function getOffset() {
    var speed = this._config.speed || 1;
    return (this._position - this.getMinPosition()) * scroll.MULTIPLE * speed;
  }

  function isAtPosition(elIndex, isPageUp) {
    var propValue = this._propValues[elIndex];

    return isPageUp
      ? propValue === this.getEndPoint()
      : propValue === this.getStartPoint();
  }

  function updateEndPosition(isAtEnding) {
    // when window goes down and element reaches the ending point,
    // record the scroll position
    var curElIndex = this._cachedElIndex;
    if (isAtEnding && this._isPageUp && !this._endPositions[curElIndex]) {
        this._endPositions[curElIndex] = this._position;
    }

    // when window scrolls to the starting point, clear recorded positions
    if (this._position === 0) {
      this._endPositions = {};
    }
  }

  return {
    initialize: function(config, sequence) {
      var $el = config.$el;
      if (!($el && $el.length)) {
        throw new Error('Element is invalid');
      }

      if (!config.hasOwnProperty('cssProp')) {
        throw new Error('No cssProp was found');
      }

      if (!config.hasOwnProperty('order')) {
        config.order = 0;
      }

      if (!config.hasOwnProperty('startPoint')) {
        config.startPoint = parseFloat($el.css(config.cssProp));
      }

      /*
      * startPoint, endPoint, $el, sequence, order
      * */
      this._config = config;

      this._sequence = sequence;
      this._isInitialized = false; // elements' prop value is not set yet
      this._propValues = {};
      this._endPositions = {};
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

      // prop value should be always between [startPoint, endPoint]
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

      updateEndPosition.call(this, propValue === endPoint);

      return propValue;
    },

    getAvailableElement: function() {
      return this.getElement(this.getAvailableElementIndex());
    },

    getAvailableElementIndex: function() {
      if (!this.hasOwnProperty('_cachedElIndex')) {
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

    /* the movement's ending prop value */
    getEndPoint: function() {
      return this._config.endPoint;
    },

    /*
    * get the ending position of movement
    * */
    getEndPosition: function() {
      return this._endPositions[this.getElement().length - 1];
    },

    getMinPosition: function() {
      var curIndex = this._cachedElIndex;
      if (curIndex > 0 && this._endPositions[curIndex - 1]) {
        return this._endPositions[curIndex - 1];
      }

      var i, movements = this._sequence.getMovements(),
        curOrder = this.getOrder(), preMove, preEndPosition = null;
      if (movements.length < 1) {
        return 0;
      }

      // look for (order - 1) movements
      for (i = 0; i < movements.length; i++) {
        var order = movements[i].getOrder();
        if (order >= curOrder) {
          continue;
        }

        if (!preMove || order >= preMove.getOrder()) {
          preMove = movements[i];
          var preEnd = preMove.getEndPosition();
          if (!preEndPosition || preEndPosition < preEnd) {
            preEndPosition = preEnd;
          }
        }
      }

      return preEndPosition === null ? this._sequence.getMinPosition() : preEndPosition;
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

      this._isPageUp = scrollStatus.isPageUp;
      this._position = scrollStatus.position;

      return this;
    },

    /*
    * record the computed prop value after element is updated.
    * */
    recordPropValue: function(propValue) {
      if (this._cachedElIndex >= 0) {
        this._propValues[this._cachedElIndex] = propValue;
      }
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
    //DEBUG
    //console.log($(window).scrollTop());

    this._sequences.each(function(sequence) {
      var scrollStatus = sequence.initScrollStatus(),
        movements = sequence.getAvailableMovements();

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
        movement.recordPropValue(propValue);
      }
    });
  }
});