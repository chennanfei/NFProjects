TM.declare('gc.controller.PopoverController').inherit('thinkmvc.Controller').extend(function() {
  var $doc = $(document), $body = $('body'), popovers = {}, eventsBound = false, hasOpenPopover = false;

  /* close popover when click event happens in document */
  function closePopover(event) {
    if (!hasOpenPopover) {
      return;
    }

    // check if the event is from popover itself
    var $target = $(event.target);
    if ($target.hasClass('g-popover-trigger') || $target.hasClass('g-popover')) {
      return;
    }

    // check if the event is from popover inside
    if (!$target.closest('.g-popover').length
        || $target.hasClass('g-popover-close')) {
      closeOpenPopover();
    }
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

  function getPopover(popoverId) {
    var $popover = popovers.hasOwnProperty(popoverId) && popovers[popoverId];
    if ($popover) {
      return $popover;
    }

    $popover = $('#' + popoverId);
    if (!$popover.length) {
      return null;
    }

    if (!$popover.parent().is($body)) {
      $popover.detach();
      $body.append($popover);
    }

    return popovers[popoverId] = $popover;
  }

  function showPopover(event) {
    var $trigger = $(event.currentTarget),
      $popover = getPopover.call(this, $trigger.data('popoverId'));
    if (!$popover || $popover.is(':visible')) {
      return;
    }

    closeOpenPopover();
    updatePosition($popover.fadeIn(), $trigger);

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