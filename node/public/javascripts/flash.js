(function() {
  function hideFlashMessages() {
    $(this).fadeOut();
  }

  setTimeout(function() {
    $('.flash').each(hideFlashMessages);
  }, 3000);
  $('.flash').click(hideFlashMessages);
})();
