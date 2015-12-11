$(document).ready(function () {
  // Handler for .ready() called.
  $('button').click(function () {
    $('html, body').animate({
      scrollTop: $('#what').offset().top
    }, 'slow');
  });
});