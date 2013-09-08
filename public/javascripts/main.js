define(['jquery', './base/gumhelper', './base/videoshooter'],
  function($, gumHelper, VideoShooter) {
  'use strict';

  var body = $('body');
  var addChat = $('#add-chat-form');
  var chatList = $('.chats ul');
  var footer = $('.footer');
  var videoShooter;
  var socket = io.connect(location.protocol + '//' + location.hostname +
    (location.port ? ':' + location.port : ''));

  var escapeHtml = function (text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  var renderChat = function (c) {
    setTimeout(function () {
      if (body.find('li[data-key="' + c.chat.key + '"]').length === 0) {
        var li = $('<li data-action="chat-message" data-key="' + c.chat.key +
          '"><img src="' + escapeHtml(c.chat.value.media) + '"><p>' +
          escapeHtml(c.chat.value.message) + '</p><li>');
        chatList.append(li);
        li[0].scrollIntoView(true);
      }
    }, 1);
  };

  socket.on('connect', function () {
    socket.on('message', function (data) {
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
      footer.append(videoElement);
      videoElement.play();
      videoShooter = new VideoShooter(videoElement);
    });
  }

  body.on('click', function (ev) {
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
    var blocker = self.find('#add-chat-blocker');
    var addChat = self.find('#add-chat');

    blocker.removeClass('hidden');
    //addChat.attr('disabled', 'disabled');

    getScreenshot(function (pictureData) {
      var picField = self.find('#picture').val(pictureData);

      $.post('/add/chat', self.serialize(), function () {
        picField.val('');
        //addChat.removeAttr('disabled')
        addChat.val('');
        blocker.addClass('hidden');
      });
    }, 5, 0.2);
  });
});
