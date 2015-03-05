(function($) {
  window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  var $w = $(window);
  var $b = $('body');

  function activeClass(){
     var url = window.location.href;
     var page = url.substr(url.lastIndexOf('/')+1);
     $('.navbar-nav li a[href*="'+page+'"]').parent().addClass('active');
  }

  activeClass();
  
  $w.on('load', function() {
    $b.addClass('page-ready');
    $('.skills').removeClass('loading');
    reflowMenu();
  });

    $('.carousel').carousel();



  // DOM cache
  var  $headerMenu = $('.navbar-nav')
    , $headerMenuItems = $headerMenu.children('li')
    , $menuBorder = $('.border-nav')
  ;

  

  function reflowMenu() {
    var $activeItem = $headerMenuItems.filter('.active');
    $menuBorder.css({
      'width': $activeItem.width(),
      'left': $activeItem.offset().left - $headerMenu.offset().left
    });
  }

  reflowMenu();

$headerMenuItems.on('mouseenter mouseleave', function(e) {
    var isEnter = (e.type === 'mouseenter'),
      borderWidth,
      borderLeft;

    $headerMenu.toggleClass('hover-menu', isEnter);

    if (isEnter) {
      borderWidth = $(this).width();
      borderLeft = $(this).offset().left;
    } else {
      var $activeItem = $headerMenuItems.filter('.active');
      borderWidth = $activeItem.width();
      borderLeft = $activeItem.offset().left;
    }

    $menuBorder.css({
      'width': borderWidth,
      'left': borderLeft - $headerMenu.offset().left
    });
  });



















  // --------------------------------------------
  // Hire Me Form
  // --------------------------------------------

  $b.on('submit.contact', '#contact-form', function(event) {
    event.preventDefault();

    var that = this;
    var $form = $(this);
    var $button = $form.find('button');
    var $formAction = $form.find('.form-actions');

    if ($.data(this, 'xhr')) {
      return;
    }

    if ($.data(that, 'messageTimeout')) {
      clearTimeout($.data(that, 'messageTimeout'));
    }

    if (!$button.data('originalText')) {
      $button.data('originalText', $button.text());
    }

    $button
      .prop('disabled', true)
      .text('Sending...');

    $form
      .find('.has-error')
      .removeClass('has-error')
      .end()
      .find('.form-message-error, .form-message-success')
      .remove();

    var xhr = $.post($form.attr('action'), $form.serialize(), function(data) {
      if (data.hasOwnProperty('errors')) {
        if (!$.isEmptyObject(data.errors)) {
          $.each(data.errors, function(name) {
            var $el = $form
              .find('[name="' + name + '"]')
              .parent()
              .addClass('has-error');
          });
        }

        $formAction.append('<span class="form-message-error"><b>Please check</b> fields with errors!</span>');
      } else if (data.hasOwnProperty('error')) {
        $formAction.append('<span class="form-message-error"><b>Something was wrong!</b> Please try again.</span>');
      } else {
        $formAction.append('<span class="form-message-success"><b>Succes!</b> Your Message was sent! Thank You!</span>');

        var timeout = setTimeout(function() {
          $formAction.find('.form-message-success').remove();
        }, 3000);

        $.data(that, 'messageTimeout', timeout);
      }
    }, 'json');

    xhr.fail(function() {
      $formAction.append('<span class="form-message-error"><b>Something was wrong!</b> Please try again.</span>');
    });

    xhr.always(function() {
      $.data(that, 'xhr', null);
      $button
        .prop('disabled', false)
        .text($button.data('originalText'));
    });

    $.data(this, 'xhr', xhr);
  });
})(jQuery);
