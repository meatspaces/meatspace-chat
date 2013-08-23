define(['jquery', './base/gumhelper', './base/videoshooter'],
  function($, gumHelper, VideoShooter) {
  'use strict';

  var body = $('body');
  var addChat = $('#add-chat-form');
  var chatList = $('.chats ul');
  var header = $('#header');
  var videoShooter;
  var channel = 'public';
  var currUser = localStorage.getItem('personaEmail');
  var socket = io.connect(location.protocol + '//' + location.hostname +
    (location.port ? ':' + location.port : ''));

  var renderChat = function (c) {
    console.log('** ', c.chat.key)
    setTimeout(function () {
      if (body.find('li[data-key="' + c.chat.key + '"]').length === 0) {
        var li = $('<li data-action="chat-message" data-key="' + c.chat.key +
          '"><img src="' + c.chat.value.media + '"><p>' + c.chat.value.message +
          ' (TTL: ' + c.chat.value.ttl + ')</p><li>');
        chatList.append(li);
      }
    }, 1);
  };

  socket.on('connect', function () {
    socket.on('message', function (data) {
      console.log('emitted! ', data)
      renderChat(data);
    });
  });

  $.get('/get/chats', function (data) {
    for (var i = 0; i < data.chats.chats.length; i ++) {
      var chat = {
        chat: data.chats.chats[i]
      };
      renderChat(chat);
    }
  });

  var getScreenshot = function (callback, numFrames, interval) {
    if (videoShooter) {
      videoShooter.getShot(callback, numFrames, interval);
    } else {
      callback('');
    }
  };

  if (navigator.getMedia && !!body.data('authenticated')) {
    gumHelper.startVideoStreaming(function errorCb() {
    }, function successCallback(stream, videoElement, width, height) {
      videoElement.width = width / 5;
      videoElement.height = height / 5;
      header.append(videoElement);
      videoElement.play();
      videoShooter = new VideoShooter(videoElement);
    });
  }

  body.on('click touchstart', function (ev) {
    var self = $(ev.target);

    switch (self.data('action')) {
      case 'login':
        ev.preventDefault();

        navigator.id.get(function (assertion) {
          if (!assertion) {
            return;
          }

          $.ajax({
            url: '/persona/verify',
            type: 'POST',
            data: { assertion: assertion },
            dataType: 'json',
            cache: false
          }).done(function (data) {
            if (data.status === 'okay') {
              localStorage.setItem('personaEmail', data.email);
              document.location.href = '/login';
            } else {
              console.log('Login failed because ' + data.reason);
            }
          });
        });
        break;

      case 'logout':
        ev.preventDefault();

        $.ajax({
          url: '/persona/logout',
          type: 'POST',
          dataType: 'json',
          cache: false
        }).done(function (data) {
          if (data.status === 'okay') {
            localStorage.removeItem('personaEmail');
            document.location.href = '/logout';
          } else {
            console.log('Logout failed because ' + data.reason);
          }
        });
        break;
    }
  });

  addChat.on('submit', function (ev) {
    ev.preventDefault();

    var self = $(ev.target);

    self.find('#add-chat-blocker').removeClass('hidden');

    getScreenshot(function (pictureData) {
      var picField = self.find('#picture').val(pictureData);

      $.post('/add/chat', self.serialize(), function () {
        picField.val('');
        self.find('#add-chat').val('');
        self.find('#add-chat-blocker').addClass('hidden');
      });
    }, 5, 0.2);
  });
});
