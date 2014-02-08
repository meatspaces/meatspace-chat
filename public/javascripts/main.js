define(['jquery', './base/transform', 'gumhelper', './base/videoShooter', 'fingerprint', 'md5', 'moment', 'favico', 'waypoints'],
  function ($, transform, gumHelper, VideoShooter, Fingerprint, md5, moment, Favico) {
  'use strict';

  if (/liveDebug/.test(window.location.search)) {
    window.liveDebug = true;
  }

  var videoShooter;

  var CHAT_LIMIT = 25;
  var CHAR_LIMIT = 250;

  var auth = {
    userid: null,
    fingerprint: new Fingerprint({ canvas: true }).get()
  };
  var chat = {
    container: $('#chat-container'),
    list: $('#chat-list')
  };
  var composer = {
    blocker: $('#composer-blocker'),
    form: $('#composer-form'),
    message: $('#composer-message'),
    inputs: $('#composer-form input').toArray()
  };
  var menu = {
    button: $('#menu-button'),
    list: $('#menu-list')
  };
  var html = $('html');
  var body = $('body');
  var counter = $('#counter');
  var footer = $('#footer');
  var svg = $(null);
  var terms = $('#terms');
  var isPosting = false;
  var canSend = true;
  var muteText = body.data('mute');
  var mutes = JSON.parse(localStorage.getItem('muted')) || [];
  var favicon = new Favico({
    animation: 'none',
    position: 'up left'
  });
  var socket = io.connect(
    location.protocol + '//' + location.hostname +
    (location.port ? ':' + location.port : '')
  );
  var unreadMessages = 0;
  var pageHidden = 'hidden';
  var pageVisibilityChange = 'visibilitychange';

  if (typeof document.hidden === 'undefined') {
    ['webkit', 'moz', 'ms'].some(function (prefix) {
      var prop = prefix + 'Hidden';
      if (typeof document[prop] !== 'undefined') {
        pageHidden = prop;
        pageVisibilityChange = prefix + 'visibilitychange';
        return true;
      }
    });
  }

  var handleVisibilityChange = function () {
    if (!document[pageHidden]) {
      unreadMessages = 0;
      favicon.badge(0);
    }
  };

  var updateNotificationCount = function () {
    if (document[pageHidden]) {
      unreadMessages += 1;
      favicon.badge(unreadMessages);
    }
  };

  var isMuted = function (fingerprint) {
    return mutes.indexOf(fingerprint) !== -1;
  };

  var debug = function () {
    if (window.liveDebug) {
      console.log.apply(console, arguments);
    }
  };

  var setWaypoint = function (node) {
    var li = $(node);
    li.waypoint(function (direction) {
      li.toggleClass('out-of-view', direction === 'down');
    }, {
      offset: function () {
        return -li.height();
      }
    }).waypoint(function (direction) {
      li.toggleClass('out-of-view', direction === 'up');
    }, {
      offset: '100%'
    });
  };

  var render = function (incoming) {
    debug("Rendering chat: key='%s' fingerprint='%s' message='%s' created='%s' imageMd5='%s'",
      incoming.key,
      incoming.value.fingerprint,
      incoming.value.message,
      incoming.value.created,
      md5(incoming.value.media));

    var fingerprint = incoming.value.fingerprint;

    if (!isMuted(fingerprint)) {
      var img = new Image();
      var onComplete = function () {
        // Don't want duplicates and don't want muted messages
        if (body.find('li[data-key="' + incoming.key + '"]').length === 0 &&
            !isMuted(fingerprint)) {

          var li = document.createElement('li');
          li.dataset.key = incoming.key;
          li.dataset.fingerprint = fingerprint;
          li.appendChild(img);

          // This is likely your own fingerprint so you don't mute yourself. Unless you're weird.
          if (auth.userid !== fingerprint) {
            updateNotificationCount();

            var button = document.createElement('button');
            button.textContent = muteText;
            button.className = 'mute';
            li.appendChild(button);
          }

          var message = document.createElement('p');
          message.textContent = incoming.value.message;
          message.innerHTML = transform(message.innerHTML);
          li.appendChild(message);

          var created = moment(new Date(incoming.value.created));
          var time = document.createElement('time');
          time.setAttribute('datetime', created.toISOString());
          time.textContent = created.format('LT');
          time.className = 'timestamp';
          li.appendChild(time);

          var size = composer.message.is(":visible") ?
            composer.message[0].getBoundingClientRect().bottom :
            $(window).innerHeight();

          var last = chat.list[0].lastChild;
          var bottom = last ? last.getBoundingClientRect().bottom : 0;
          var follow = bottom < size + 50;

          chat.list.append(li);
          setWaypoint(li);

          debug('Appended incoming %s', incoming.key);

          // if scrolled to bottom of window then scroll the new thing into view
          // otherwise, you are reading the history... allow user to scroll up.
          if (follow) {
            var children = chat.list.children();
            var toRemove = children.length - CHAT_LIMIT;

            toRemove = toRemove < 0 ? 0 : toRemove;
            children.slice(0, toRemove).waypoint('destroy').remove();

            if (toRemove > 1) {
              // if we've removed more than one message, then the vertical
              // height of the chats has changed (since we've only added
              // one chat). Refresh waypoints to make gifs appear properly
              $.waypoints('refresh');
            }

            li.scrollIntoView();
          }
        }
      };

      img.onload = img.onerror = onComplete;
      img.src = incoming.value.media;
      img.title = fingerprint;
    }
  };

  var getScreenshot = function (callback, numFrames, interval, progressCallback) {
    if (videoShooter) {
      videoShooter.getShot(callback, numFrames, interval, progressCallback);
    } else {
      debug('Failed to install videoShooter');
      callback('');
    }
  };

  var disableVideoMode = function () {
    composer.form.hide();
    footer.hide();
    chat.container.addClass('lean');
  };

  var progressCircleTo = function (progressRatio) {
    var circle = $('path#arc');

    var thickness = 10;
    var angle = progressRatio * (360 + (thickness / 2)); // adding thickness accounts for overlap
    var offsetX = 128 / 2;
    var offsetY = 64 / 2;
    var radius = offsetY - (thickness / 2);

    var radians = (angle / 180) * Math.PI;
    var x = offsetX + Math.cos(radians) * radius;
    var y = offsetY + Math.sin(radians) * radius;
    var d;

    if (progressRatio === 0) {
      d = 'M0,0 M ' + x + ' ' + y;
    } else {
      d = circle.attr('d') + ' L ' + x + ' ' + y;
    }
    circle.attr('d', d).attr('stroke-width', thickness);
  };

  $.get('/ip?t=' + Date.now(), function (data) {
    auth.userid = md5(auth.fingerprint + data.ip);
  });

  if (navigator.getMedia) {
    svg = $('<svg class="progress" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 128 64" preserveAspectRatio="xMidYMid" hidden><path d="M0,0 " id="arc" fill="none" stroke="rgba(226,38,97,0.8)" /></svg>');

    footer.prepend(svg);

    gumHelper.startVideoStreaming(function callback(err, stream, videoElement) {
      if (err) {
        disableVideoMode();
      } else {
        videoElement.width = 135;
        videoElement.height = 101;
        footer.prepend(videoElement);
        videoElement.play();
        videoShooter = new VideoShooter(videoElement);
        composer.form.click();
      }
    });
  } else {
    disableVideoMode();
  }

  if (localStorage.getItem('terms') === null) {
    terms.addClass('on');
  }

  body.on('click', '#unmute, #tnc-accept', function (ev) {
    if (ev.target.id === 'unmute') {
      debug('clearing mutes');
      localStorage.removeItem('muted');
      mutes = [];
    }

    if (ev.target.id === 'tnc-accept') {
      debug('accepting terms');
      localStorage.setItem('terms', true);
      terms.removeClass('on');
    }
  }).on('keydown', function (ev) {
    if (!hasModifiersPressed(ev) && ev.target !== composer.message[0]) {
      composer.message.focus();
    }
  });

  chat.list.on('click', '.mute', function (ev) {
    var fingerprint = $(this).parent('[data-fingerprint]').data('fingerprint');
    var messages;

    if (!isMuted(fingerprint)) {
      debug('Muting %s', fingerprint);
      mutes.push(fingerprint);
      localStorage.setItem('muted', JSON.stringify(mutes));
      messages = chat.list.children().filter(function() {
        // using filter because we have no guarantee of fingerprint
        // formatting, and therefore cannot trust a string attribute selector.
        return this.dataset.fingerprint === fingerprint;
      });
      messages.waypoint('destroy').remove();

      $.waypoints('refresh');
    }
  });

  composer.form.on('keydown', function (ev) {
    if (ev.keyCode === 13) {
      ev.preventDefault();
      composer.form.submit();
    }
  }).on('keyup', function (ev) {
    counter.text(CHAR_LIMIT - composer.message.val().length);
  }).on('submit', function (ev) {
    ev.preventDefault();

    composer.message.prop('readonly', true);

    if (!isPosting) {
      if (!canSend) {
        alert('please wait a wee bit...');
        composer.message.prop('readonly', false);
      }

      if (canSend) {
        canSend = false;
        composer.blocker.removeClass('hidden');
        isPosting = true;

        setTimeout(function () {
          canSend = true;
        }, 5000);

        progressCircleTo(0);

        svg.attr('class', 'progress visible');

        getScreenshot(function (picture) {
          var submission = composer.inputs.reduce(function(data, input) {
            return (data[input.name] = input.value, data);
          }, { picture: picture });

          svg.attr('class', 'progress');

          debug('Sending chat');
          $.post('/add/chat', $.extend(submission, auth), function () {
            // nothing to see here?
          }).error(function (data) {
            alert(data.responseJSON.error);
          }).always(function (data) {
            composer.message.prop('readonly', false);
            composer.message.val('');
            composer.blocker.addClass('hidden');
            counter.text(CHAR_LIMIT);
            isPosting = false;
          });
        }, 10, 0.2, function (captureProgress) {
          progressCircleTo(captureProgress);
        });
      }
    }
  });

  menu.button.on('click', function (ev) {
    menu.list.toggle();
  });

  socket.on('message', function (data) {
    render(data.chat);
  });

  $(document).on(pageVisibilityChange, handleVisibilityChange);

  function hasModifiersPressed(ev) {
    // modifiers exclude shift since it's often used in normal typing
    return ev.altKey || ev.ctrlKey || ev.metaKey;
  }
});
