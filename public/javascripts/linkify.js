var define = typeof define !== 'function' ?
              require('amdefine')(module) : define;

define([], function() {
  var linkables = {
    url: {
      ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      pattern: /(https?:\/\/)?((?:\.?[-\w]){1,256})(\.\w{1,10})(?::[0-9]{1,5})?(?:\.?\/(?:[^\s.,?:;!]|[.,?:;!](?!\s|$)){0,2048})?/gim,
      transformer: function(match) {
        var href = '';
        var text = '';
        var tld = match[3].slice(1);

        // Look at the value that was matched as a TLD, if it's
        // a number, then this might be an IP address.
        if (isFinite(tld)) {
          if (!linkables.url.ipv4.test(match[2] + match[3])) {
            return match[0];
          }
        } else {
        // There are no single letter TLDs
          if (tld.length === 1) {
            return match[0];
          }
        }

        if (match[1] === undefined) {
          href += 'http://';
        }

        if (match[0].indexOf('(') === -1 && match[0].slice(-1) === ')') {
          match[0] = match[0].slice(0, -1);
        }

        href += match[0];
        text += match[0];

        return template(href, text);
      }
    },
    twitter: {
      pattern: /@(\w{1,20})/g,
      transformer: function(match) {
        var handle = match[1];

        if (!handle) {
          return null;
        }

        return template('https://twitter.com/' + handle, match[0]);
      }
    },
    reddit: {
      pattern: /^\/r\/(\w+)/,
      transformer: function(match) {
        var subreddit = match[1];

        if (!subreddit) {
          return null;
        }

        return template('http://www.reddit.com/r/' + subreddit, match[0]);
      }
    }
  };

  var types = Object.keys(linkables);

  function template(href, text) {
    return '<a href="' + href + '" target="_blank">' + text + '</a>';
  }

  function linkify(text) {
    var replacements = [];

    types.forEach(function(type) {
      var pattern = linkables[type].pattern;
      var transformer = linkables[type].transformer;
      var match, replace;

      while ((match = pattern.exec(text))) {
        replace = transformer(match);

        if (replace !== null) {
          replacements.push({
            search: match[0],
            replace: replace
          });
        }
      }
    });

    replacements.forEach(function(r) {
      text = text.replace(r.search, r.replace);
    });

    return text;
  }

  return linkify;
});
