define(['jquery', 'linkify', './base/gumhelper', './base/videoShooter', 'fingerprint', 'md5'],
  function ($, linkify, gumHelper, VideoShooter, Fingerprint, md5) {
  'use strict';

  var html = $('html');
  var body = $('body');
  var addChatForm = $('#add-chat-form');
  var addChatBlocker = $('#add-chat-blocker');
  var addChat = $('#add-chat');
  var picField = $('#picture');
  var chatList = $('.chats ul');
  var chatsContainer = $('.chats');
  var footer = $('#footer');
  var muteBtn = $('.mute');
  var userId = $('#userid');
  var fp = $('#fp');
  var svg = $(null);
  var isPosting = false;
  var canSend = true;
  var fingerprint = new Fingerprint({ canvas: true }).get();
  var mutedArr = JSON.parse(localStorage.getItem('muted')) || [];
  var socket = io.connect(location.protocol + '//' + location.hostname +
    (location.port ? ':' + location.port : ''));
  var videoShooter;

  var CHAT_LIMIT = 25;

  var isMuted = function (fingerprint) {
    return mutedArr.indexOf(fingerprint) !== -1;
  };

  var renderChat = function (c) {
    var renderFP = c.chat.value.fingerprint;

    if (!isMuted(renderFP)) {
      var img = new Image();
      img.onload = function () {
        // Don't want duplicates and don't want muted messages
        if (body.find('li[data-key="' + c.chat.key + '"]').length === 0 &&
            !isMuted(renderFP)) {

          var li = document.createElement('li');
          li.dataset.action = 'chat-message';
          li.dataset.key = c.chat.key;
          li.dataset.fingerprint = renderFP;
          li.appendChild(img);

          // This is likely your own fingerprint so you don't mute yourself. Unless you're weird.
          if (userId.val() !== renderFP) {
            var btn = document.createElement('button');
            btn.textContent = 'mute';
            btn.className = 'mute';
            li.appendChild(btn);
          }

          var message = document.createElement('p');
          message.textContent = c.chat.value.message;
          message.innerHTML = linkify(message.innerHTML);
          li.appendChild(message);

          var size = addChat.is(":visible") ? addChat[0].getBoundingClientRect().bottom : $(window).innerHeight();
          var last = chatList[0].lastChild;
          var bottom = last ? last.getBoundingClientRect().bottom : 0;
          var follow = bottom < size + 50;

          chatList.append(li);

          // if scrolled to bottom of window then scroll the new thing into view
          // otherwise, you are reading the history... allow user to scroll up.
          if (follow) {
            var children = chatList.children();
            if (children.length > CHAT_LIMIT) {
              children.first().remove();
            }

            li.scrollIntoView();
          }
        }
      };
      img.src = c.chat.value.media;
    }
  };

  var getScreenshot = function (callback, numFrames, interval, progressCallback) {
    if (videoShooter) {
      videoShooter.getShot(callback, numFrames, interval, progressCallback);
    } else {
      callback('');
    }
  };

  var disableVideoMode = function () {
    addChatForm.hide();
    footer.hide();
    chatsContainer.addClass('lean');
  };

  var progressCircleTo = function (progressRatio) {
    var circle = $('path#arc');

    var angle = progressRatio * 360;
    var offsetX = 128 / 2;
    var offsetY = 64 / 2;
    var thickness = 10;
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

  $.get('/ip', function (data) {
    fp.val(fingerprint);
    userId.val(md5(fingerprint + data.ip));
  });

  $.get('/get/chats', function (data) {
    data.chats.chats.sort(function (a, b) {
      return a.value.created - b.value.created;
    }).forEach(function (chat) {
      renderChat({
        chat: chat
      });
    });
  });

  if (navigator.getMedia) {
    svg = $('<svg class="progress" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 128 64" preserveAspectRatio="xMidYMid" hidden><path d="M0,0 " id="arc" fill="none" stroke="rgba(226,38,97,0.8)" /></svg>');

    footer.prepend(svg);

    gumHelper.startVideoStreaming(function errorCb() {
      disableVideoMode();
    }, function successCallback(stream, videoElement, width, height) {
      videoElement.width = width / 5;
      videoElement.height = height / 5;
      footer.prepend(videoElement);
      videoElement.play();

      // set offset to video width if it isn't already set
      if (addChatForm.css('left') === '0px') {
        addChatForm.css('left', width / 5);
      }

      videoShooter = new VideoShooter(videoElement);
      addChatForm.click();
    });
  } else {
    disableVideoMode();
  }

  socket.on('connect', function () {
    socket.on('message', function (data) {
      renderChat(data);
    });
  });

  body.on('click', '.mute', function (ev) {
    var self = $(this);
    var fp = self.parent('[data-fingerprint]').data('fingerprint');

    if (!isMuted(fp)) {
      mutedArr.push(fp);
      localStorage.setItem('muted', JSON.stringify(mutedArr));
      self.text('muted!');
    }
  });

  // allow multiple lines of input with carriage return mapped to shift+enter
  addChatForm.on('keydown', function (ev) {
    // Enter was pressed without shift key
    if (ev.keyCode === 13 && !ev.shiftKey) {
      ev.preventDefault();
      addChatForm.submit();
    }
  }).on('submit', function (ev) {
    ev.preventDefault();

    var self = $(ev.target);


    if (!isPosting) {
      if (!canSend) {
        alert('please wait a wee bit...');
      }

      if (canSend) {
        canSend = false;
        addChatBlocker.removeClass('hidden');
        isPosting = true;

        setTimeout(function () {
          canSend = true;
        }, 5000);

        progressCircleTo(0);

        svg.attr('class', 'progress visible');

        getScreenshot(function (pictureData) {
          picField.val(pictureData);

          svg.attr('class', 'progress');

          $.post('/add/chat', self.serialize(), function () {

          }).error(function (data) {
            alert(data.responseJSON.error);
          }).always(function (data) {
            picField.val('');
            addChat.val('');
            isPosting = false;
            addChatBlocker.addClass('hidden');
            body.find('> img').remove();
          });
        }, 10, 0.2, function (captureProgress) {
          progressCircleTo(captureProgress);
        });
      }
    }
  });
});
