var slashme = require('../public/javascripts/slashme');
var tests = {};

slashmeables = {
  values: [
    '/me',
    '/me waves',
    '/me feels whimsy!',
    '/me sends a link: @horsejs and nothing happens because this is not linkify',
    '/mee',
    '/me  double space'
  ],
  expects: [
    '<em><b>* slashmebro</b></em>',
    '<em><b>* slashmebro</b> waves</em>',
    '<em><b>* slashmebro</b> feels whimsy!</em>',
    '<em><b>* slashmebro</b> sends a link: @horsejs and nothing happens because this is not linkify</em>',
    '/mee',
    '<em><b>* slashmebro</b>  double space</em>',
  ]
};

slashmeables.values.forEach(function(value, i) {
  tests[value] = function(test) {
    test.equal(slashme(value), slashmeables.expects[i]);
    test.done();
  };
})

module.exports = tests;