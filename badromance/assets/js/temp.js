TM.declare('br.controller.BaseController').inherit('thinkmvc.Controller').extend(function() {
  var actionList = [], // all controllers should use the exact same action list
    controllers = {},
    isLocked = false; // every time only one section is active

  function bindAction(controller, method) {
    actionList.push({
      controller: controller,
      method: method
    });

    if (!controllers.hasOwnProperty(controller)) {
      controllers[controller] = this;
    }
  }

  function triggerNextAction() {
    var act = actionList.unshift();
    if (!act) {
      return;
    }

    var controller = controllers[act.controller];
    if (controller.hasOwnProperty(act.method)) {
      controller[act.method].call(controller);
    }
  }

  return {
    effectTime: {
      TINY: 10,
      FAST: 200,
      NORMAL: 300,
      SLOW: 500
    },
    isDisplayed: false, // avoid section showing/hiding for times when window scrolls

    /* release the lock and trigger next action */
    end: function() {
      this.proto('isLocked', false);
      triggerNextAction(this);
    },

    start: function(controller, method) {
      var isLocked = this.proto('isLocked');
      if (isLocked) {
        bindAction.apply(this, arguments);
        return;
      }

      this.proto('isLocked', true);
    }
  };
});