var define = typeof define !== 'function' ?
              require('amdefine')(module) : define;

define([], function() {
  var pattern = /^\/me(\s.+)?$/;

  function transformer(match) {
    var message = match[1] || '';

    return '<em><b>* slashmebro</b>' + (message) + '</em>';
  }

  function slashme(text) {
    var match;

    if (match = pattern.exec(text)) {
      text = transformer(match);
    }
    
    return text;
  }
    

  return slashme;
});