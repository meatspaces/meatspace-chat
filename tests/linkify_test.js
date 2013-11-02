var requirejs = require('requirejs');

requirejs.config({
  nodeRequire: require
});

var linkify = requirejs('../public/javascripts/linkify');
var tests = {};
var valid, invalid, inline;

valid = {
  values: [
    'http://www.example.org/',
    'https://www.example.org',
    'http://www.example.co.uk/',
    'https://example.org',
    'chat.meatspac.es',
    '(chat.meatspac.es)',
    'chat.meatspac.es.',
    'chat.meatspac.es/channel',
    'https://example.org./path/to/stuff',
    'http://www.example.org:8080/',
    'http://example.org:8080/',
    'This is a link... example.org.',
    'This is a link... example.org, take a look!',
    '(This is a link... example.org)',
    'Link: chat.meatspac.es/channel?',
    'Link: chat.meatspac.es/channel:',
    'Link: chat.meatspac.es/channel;',
    'Link: chat.meatspac.es/channel!',
    '(This is a link... chat.meatspac.es/channel)',
    'This is a link... chat.meatspac.es/channel.',
    'This is a link... chat.meatspac.es/channel, or not',
    'http://example.com/channel/bar(parens)',
    'http://example.com/comma,here/',
    '@twitter',
    '@a @b @c',
    '@a @b @c',
    '@a @b @c',
    '/r/puppies',
    '1.1.1.1',
    'http://1.1.1.1',
    'http://meat.spaces should be treated like a link',
    'test.com/"/onmouseover="alert(document.cookie)'
  ],

  expects: [
    '<a href="http://www.example.org/" target="_blank">http://www.example.org/</a>',
    '<a href="https://www.example.org" target="_blank">https://www.example.org</a>',
    '<a href="http://www.example.co.uk/" target="_blank">http://www.example.co.uk/</a>',
    '<a href="https://example.org" target="_blank">https://example.org</a>',
    '<a href="http://chat.meatspac.es" target="_blank">chat.meatspac.es</a>',
    '<a href="http://chat.meatspac.es" target="_blank">chat.meatspac.es</a>',
    '<a href="http://chat.meatspac.es" target="_blank">chat.meatspac.es</a>',
    '<a href="http://chat.meatspac.es/channel" target="_blank">chat.meatspac.es/channel</a>',
    '<a href="https://example.org./path/to/stuff" target="_blank">https://example.org./path/to/stuff</a>',
    '<a href="http://www.example.org:8080/" target="_blank">http://www.example.org:8080/</a>',
    '<a href="http://example.org:8080/" target="_blank">http://example.org:8080/</a>',
    '<a href="http://example.org" target="_blank">example.org</a>',
    '<a href="http://example.org" target="_blank">example.org</a>',
    '<a href="http://example.org" target="_blank">example.org</a>',
    '<a href="http://chat.meatspac.es/channel" target="_blank">chat.meatspac.es/channel</a>',
    '<a href="http://chat.meatspac.es/channel" target="_blank">chat.meatspac.es/channel</a>',
    '<a href="http://chat.meatspac.es/channel" target="_blank">chat.meatspac.es/channel</a>',
    '<a href="http://chat.meatspac.es/channel" target="_blank">chat.meatspac.es/channel</a>',
    '<a href="http://chat.meatspac.es/channel" target="_blank">chat.meatspac.es/channel</a>',
    '<a href="http://chat.meatspac.es/channel" target="_blank">chat.meatspac.es/channel</a>',
    '<a href="http://chat.meatspac.es/channel" target="_blank">chat.meatspac.es/channel</a>',
    '<a href="http://example.com/channel/bar(parens)" target="_blank">http://example.com/channel/bar(parens)</a>',
    '<a href="http://example.com/comma,here/" target="_blank">http://example.com/comma,here/</a>',
    '<a href="https://twitter.com/twitter" target="_blank">@twitter</a>',
    '<a href="https://twitter.com/a" target="_blank">@a</a>',
    '<a href="https://twitter.com/b" target="_blank">@b</a>',
    '<a href="https://twitter.com/c" target="_blank">@c</a>',
    '<a href="http://www.reddit.com/r/puppies" target="_blank">/r/puppies</a>',
    '<a href="http://1.1.1.1" target="_blank">1.1.1.1</a>',
    '<a href="http://1.1.1.1" target="_blank">http://1.1.1.1</a>',
    '<a href="http://meat.spaces" target="_blank">http://meat.spaces</a> should be treated like a link',
    '<a href="http://test.com/"/onmouseover="alert(document.cookie)" target="_blank">test.com/"/onmouseover="alert(document.cookie)</a>'
  ]
};

valid.values.forEach(function(value, i) {
  tests[value] = function(test) {
    test.ok(linkify(value).indexOf(valid.expects[i]) !== -1);
    test.done();
  };
});

invalid = {
  values: [
    '7.0.3',
    'a.0.3',
    'a.b.c',
    'what happens when it\'s inline? 1.1.1 like that?',
    'meat.spaces is not a link'
  ],
  expects: [
    '7.0.3',
    'a.0.3',
    'a.b.c',
    'what happens when it\'s inline? 1.1.1 like that?',
    'meat.spaces is not a link'
  ]
};

invalid.values.forEach(function(value, i) {
  tests[value] = function(test) {
    test.equal(linkify(value), invalid.expects[i]);
    test.done();
  };
});


inline = {
  values: [
    'An inline link, like example.com, is replaced inline',
    'An inline link, like http://example.com, is replaced inline',
    'An inline twitter handle, like @twitter, is replaced inline',
    'An inline subreddit, like /r/puppies, is replaced inline',
    'All linkables, ie. example.com, @twitter, and /r/puppies are replaced inline',
    'Hey Edna is doing an AMA over on /r/iama, check it out http://www.reddit.com/r/IAmA/comments/1phhx1/we_are_mozilla_ask_us_anything'
  ],
  expects: [
    'An inline link, like <a href="http://example.com" target="_blank">example.com</a>, is replaced inline',
    'An inline link, like <a href="http://example.com" target="_blank">http://example.com</a>, is replaced inline',
    'An inline twitter handle, like <a href="https://twitter.com/twitter" target="_blank">@twitter</a>, is replaced inline',
    'An inline subreddit, like <a href="http://www.reddit.com/r/puppies" target="_blank">/r/puppies</a>, is replaced inline',
    'All linkables, ie. <a href="http://example.com" target="_blank">example.com</a>, <a href="https://twitter.com/twitter" target="_blank">@twitter</a>, and <a href="http://www.reddit.com/r/puppies" target="_blank">/r/puppies</a> are replaced inline',
    'Hey Edna is doing an AMA over on <a href="http://www.reddit.com/r/iama" target="_blank">/r/iama</a>, check it out <a href="http://www.reddit.com/r/IAmA/comments/1phhx1/we_are_mozilla_ask_us_anything" target="_blank">http://www.reddit.com/r/IAmA/comments/1phhx1/we_are_mozilla_ask_us_anything</a>'
  ]
};

inline.values.forEach(function(value, i) {
  tests[value] = function(test) {
    test.equal(linkify(value), inline.expects[i]);
    test.done();
  };
});


module.exports = tests;
