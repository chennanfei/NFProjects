TM.declare('gc.controller.PopoverController').inherit('thinkmvc.Controller').extend(function() {
  var $doc = $(document), $body = $('body'), popovers = {}, eventsBound = false, hasOpenPopover = false;

  function closePopover(event) {
    if (!hasOpenPopover) {
      return;
    }

    // check if the event is from popover itself
    var $target = $(event.target);
    if ($target.is('.g-popover-trigger') || $target.is('.g-popover')) {
      return;
    }

    var $popover = $target.closest('.g-popover');
    if ($popover.length) {
      if ($target.is('.g-popover-close')) {
        $popover.fadeOut();
      }
      return;
    }

    closeOpenPopover();
  }

  function closeOpenPopover() {
    for (var k in popovers) {
      if (popovers.hasOwnProperty(k) && popovers[k].is(':visible')) {
        popovers[k].fadeOut();
        hasOpenPopover = false;
        break;
      }
    }
  }

  function showPopover(event) {
    var $trigger = $(event.currentTarget), popoverId = $trigger.data('popoverId'),
      $popover = popovers.hasOwnProperty(popoverId) && popovers[popoverId];
    if (!$popover) {
      $popover = $('#' + popoverId);
      if (!$popover.length) {
        return;
      }

      if (!$popover.parent().is($body)) {
        $popover.detach();
        $body.append($popover);
      }

      popovers[popoverId] = $popover;
    }

    if ($popover.is(':visible')) {
      return;
    }

    closeOpenPopover();
    updatePosition($popover, $trigger);
    $popover.fadeIn();

    hasOpenPopover = true;
  }

  function updatePosition($popover, $trigger) {
    if (!($popover && $popover.length && $trigger && $trigger.length)) {
      return;
    }

    var offset = $trigger.offset();
    $popover.css({
      left: offset.left - $popover.width() / 2,
      top: offset.top - $popover.outerHeight() - 10
    });
  }

  return {
    initialize: function() {
      if (eventsBound) {
        return;
      }

      $doc.on('click', closePopover).on('click', '.g-popover-trigger', showPopover);
      eventsBound = true;
    }
  };
});