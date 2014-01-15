if (!define || typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function() {

  var rentity = /["']/g;

  var rentities = {
    '"': '&quot;',
    '\'': '&apos;'
  };

  var KNOWN_TLDS = [
    'aero', 'asia', 'biz', 'cat', 'com', 'coop', 'info',
    'int', 'jobs', 'mobi', 'museum', 'name', 'net', 'org', 'post', 'pro',
    'tel', 'travel', 'xxx', 'edu', 'gov', 'mil', 'nyc', 'ac',
    'ad', 'ae', 'af', 'ag', 'ai', 'al', 'am', 'an', 'ao', 'aq', 'ar',
    'as', 'at', 'au', 'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'be', 'bf',
    'bg', 'bh', 'bi', 'bj', 'bm', 'bn', 'bo', 'br', 'bs', 'bt', 'bv',
    'no', 'bw', 'by', 'bz', 'ca', 'cc', 'cd', 'cf', 'cg', 'ch', 'ci',
    'ck', 'cl', 'cm', 'cn', 'co', 'cr', 'cs', 'cu', 'cv', 'cx', 'cy',
    'cz', 'dd', 'de', 'dj', 'dk', 'dm', 'do', 'dz', 'ec', 'ee', 'eg',
    'eh', 'er', 'es', 'et', 'eu', 'fi', 'fj', 'fk', 'fm', 'fo', 'fr',
    'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn',
    'gp', 'gq', 'gr', 'gs', 'gt', 'gu', 'gw', 'gy', 'hk', 'hm', 'hn',
    'hr', 'ht', 'hu', 'id', 'ie', 'il', 'im', 'in', 'io', 'iq', 'ir',
    'is', 'it', 'je', 'jm', 'jo', 'jp', 'ke', 'kg', 'kh', 'ki', 'km',
    'kn', 'kp', 'kr', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lk',
    'lr', 'ls', 'lt', 'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'me', 'mg',
    'mh', 'mk', 'ml', 'mm', 'mn', 'mn', 'mo', 'mp', 'mq', 'mr', 'ms',
    'mt', 'mu', 'mv', 'mw', 'mx', 'my', 'mz', 'na', 'nc', 'ne', 'nf',
    'ng', 'ni', 'nl', 'no', 'np', 'nr', 'nu', 'nz', 'om', 'pa', 'pe',
    'pf', 'pg', 'ph', 'pk', 'pl', 'pm', 'pn', 'pr', 'ps', 'pt', 'pw',
    'py', 'qa', 're', 'ro', 'rs', 'ru', 'su', 'рф', 'rw', 'sa', 'sb',
    'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sj', 'no', 'sk', 'sl', 'sm',
    'sn', 'so', 'sr', 'ss', 'st', 'su', 'sv', 'sx', 'sy', 'sz', 'tc',
    'td', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tp', 'tm', 'tn', 'to',
    'tp', 'tl', 'tr', 'tt', 'tv', 'tw', 'tz', 'ua', 'ug', 'uk', 'us',
    'gov', 'uy', 'uz', 'va', 'vc', 've', 'vg', 'vi', 'vn', 'vu', 'wf',
    'ws', 'ye', 'yt', 'yu', 'za', 'zm', 'zw'
  ];

  var linkables = {
    email: {
      pattern: /[\w.+-]+@[\w.-]+\.[a-z.]{2,6}/mgi,
      transformer: function (match) {
        var email = match[0];

        if (!email) {
          return null;
        }

        return template('mailto:' + match[0], match[0]);
      }
    },
    url: {
      ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      pattern: /(https?:\/\/)?((?:\.?[-\w]){1,256})(\.\w{1,10})(?::[0-9]{1,5})?(?:\.?\/(?:[^\s.,?:;!<]|[.,?:;!](?!\s|$)){0,2048})?/gim,
      transformer: function (match) {
        var href = '';
        var text = '';
        var candidate = match[0];
        var scheme = match[1];
        var domain = match[2];
        var tld = match[3].slice(1);

        // Look at the value that was matched as a TLD, if it's
        // a number, then this might be an IP address.
        if (isFinite(tld)) {
          if (!linkables.url.ipv4.test(domain + '.' + tld)) {
            return candidate;
          }
        } else {
          // Match the list of known TLDs.
          // * Previously invalidated only tld with length 1
          // but that was too lenient.
          if (!scheme && KNOWN_TLDS.indexOf(tld) === -1) {
            return candidate;
          }
        }

        if (match[1] === undefined) {
          href += 'http://';
        }

        if (candidate.indexOf('(') === -1 && candidate.slice(-1) === ')') {
          candidate = candidate.slice(0, -1);
        }

        href += candidate;
        text += candidate;

        href = sanitize(href);

        return template(href, text);
      }
    },
    twitter: {
      pattern: /@(\w{1,20})/g,
      transformer: function (match) {
        var handle = match[1];

        if (!handle) {
          return null;
        }

        return template('https://twitter.com/' + handle, match[0]);
      }
    },
    hashtag: {
      pattern: /#(\w+)/g,
      transformer: function (match) {
        var tag = match[1];

        if (!tag) {
          return null;
        }

        return template('https://twitter.com/search?q=%23' + tag + '&src=hash', match[0]);
      }
    },
    reddit: {
      pattern: /(\B|\s)(\/r\/(\w+))/g,
      transformer: function (match) {
        var subreddit = match[3];

        if (!subreddit) {
          return null;
        }

        return match[1] + template('http://www.reddit.com/r/' + subreddit, match[2]);
      }
    }
  };

  var slashables = {
    slashme: {
      pattern: /^\s*\/me(\s.+)?$/,
      transformer: function (match) {
        var message = match[1] || '';

        return '<em><b>*</b>' + (message) + '</em>';
      }
    }
  };

  var types = Object.keys(linkables);

  function sanitize(str) {
    if (typeof str !== 'string') {
      str += '';
    }
    return str.replace(rentity, function (s) {
      return rentities[s];
    });
  }

  function template(href, text) {
    return '<a href="' + href + '" target="_blank">' + text + '</a>';
  }

  function each(obj, fn) {
    return Object.keys(obj).forEach(fn);
  }

  function transform(text) {
    var matches = [];
    var index = 0;
    var fragments = [];

    each(slashables, function (type) {
      var pattern = slashables[type].pattern;
      var transformer = slashables[type].transformer;
      var match;

      if (match = pattern.exec(text)) {
        text = transformer(match);
      }
    });

    each(linkables, function (type) {
      var pattern = linkables[type].pattern;
      var transformer = linkables[type].transformer;
      var match, replace;

      while (match = pattern.exec(text)) {
        replace = transformer(match);

        if (replace !== null) {
          matches.push({
            index: match.index,
            length: match[0].length,
            replace: replace
          });
        }
      }
    });

    matches.sort(function (a, b) {
      return a.index - b.index;
    }).forEach(function (match) {
      if (index > match.index) {
        return;
      }
      fragments.push(text.substring(index, match.index));
      index = match.index + match.length;
      fragments.push(match.replace);
    });

    if (index < text.length) {
      fragments.push(text.substring(index));
    }

    return fragments.join('');
  }

  return transform;
});
