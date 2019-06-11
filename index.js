const file = 'siwoolee.txt';
let wholeText = '';

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
        setTimeout(function() {
          newString += char;
          $el.html(newString);
          updateCursor($el, newString);
        }, i * typingSpeed);
      })(i + 1, text[i]);
    }
  }, 1500);
}

$.get(file, function(data) {
  wholeText = data;
});

$(function() {
  autoType('.terminal', 20);
});
