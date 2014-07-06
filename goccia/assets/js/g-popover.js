TM.declare('gc.controller.PopoverController').inherit('thinkmvc.Controller').extend(function() {
  var $doc = $(document), $win = $(window), $body = $('body'),
    popovers = {}, eventsBound = false, hasOpenPopover = false;

  function canShowPopover($trigger, evtType) {
    var data = $trigger.data();
    if (!data) {
      return false;
    }

    if (evtType === 'mouseenter') {
      return data.activate === 'hover';
    }
    return true;
  }

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

    return popovers[popoverId] = $popover;
  }

  function showPopover(event) {
    var $trigger = $(event.currentTarget), data = $trigger.data();
    if (!data) {
      return;
    }

    if (!canShowPopover($trigger, event.type)) {
      return;
    }

    var $popover = getPopover(data.popoverId);
    if (!$popover || $popover.is(':visible')) {
      return;
    }

    closeOpenPopover();
    updatePosition($popover, $trigger);

    var $popoverInner = $popover.children('.g-popover-inner').hide();
    $popover.show();
    $popoverInner.height($popover.height() - 52).fadeIn();

    hasOpenPopover = true;
  }

  function updatePosition($popover, $trigger) {
    if (!($popover && $popover.length && $trigger && $trigger.length)) {
      return;
    }

    if ($trigger.data('autoUpdate') === 0) {
      return;
    }

    var $triangle = $popover.children('.g-triangle'), offset = $trigger.offset(),
      left = offset.left - ($doc.width() - $popover.outerWidth() - $trigger.width()) / 2;
    if ($triangle.hasClass('g-triangle-bottom')) {
      // trigger is below the popover
      var $parent = $popover.parent(), parentOffset = $parent.offset(),
        bottom = parentOffset.top + $parent.height() - offset.top + 10;
      $popover.css('bottom', bottom).children('.g-triangle').css('left', left);
    } else if ($triangle.hasClass('g-triangle-top')) {
      // TODO
    }
  }

  return {
    initialize: function() {
      if (eventsBound) {
        return;
      }

      $doc.on('click', closePopover).on('click mouseenter', '.g-popover-trigger', showPopover);
      eventsBound = true;
    }
  };
});