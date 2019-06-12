const file = 'siwoolee.txt';
let wholeText = '';
let timeoutList = [];

function updateCursor(that, cont) {
  if (that.html()[that.html().length - 1] === '|') {
    that.html(that.html().substring(0, cont.length - 1));
  } else {
    that.append('<span class="cursor">|</span>');
  }
}

function autoType(element, typingSpeed) {
  var $el = $(element);
  $el = $el.find('.typewriter');
  var text = wholeText.trim().split('');
  var amntOfChars = text.length;
  var newString = '';
  $el.append('<span class="cursor">|</span>');
  setTimeout(function() {
    $el.css('opacity', 1);
    $el.prev().removeAttr('style');
    $el.text('');
    for (var i = 0; i < amntOfChars; i++) {
      (function(i, char) {
        timeoutList.push(
          setTimeout(function() {
            newString += char;
            $el.html(newString);
            updateCursor($el, newString);
          }, i * typingSpeed)
        );
      })(i + 1, text[i]);
    }
  }, 1500);
}

$(function() {
  $.get(file, function(data) {
    wholeText = data;
    autoType('.terminal', 20);
  });

  $('#switch').on('click', () => {
    if ($('#switch').prop('checked')) {
      $('body').removeClass('light');
      $('.skip-btn').removeClass('light');
    } else {
      $('body').addClass('light');
      $('.skip-btn').addClass('light');
    }
  });

  $('.skip-btn').on('click', () => {
    if (timeoutList.length) {
      for (let i = 0; i < timeoutList.length; i++) {
        clearTimeout(timeoutList[i]);
      }
      timeoutList = [];
      $('.typewriter').html(wholeText);
    }
  });
});
