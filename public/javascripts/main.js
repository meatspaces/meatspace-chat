define(['jquery', './base/gumhelper', './base/videoShooter'],
  function($, gumHelper, VideoShooter) {
  'use strict';

  var html = $('html');
  var body = $('body');
  var addChat = $('#add-chat-form');
  var chatList = $('.chats ul');
  var footer = $('#footer');
  var posting = false;
  var videoShooter;
  var socket = io.connect(location.protocol + '//' + location.hostname +
    (location.port ? ':' + location.port : ''));

  var CHAT_LIMIT = 35;

  var escapeHtml = function (text) {
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    var txtArray = text.split(/\s/);
    var newTxt = [];

    for (var i = 0; i < txtArray.length; i ++) {
      if (txtArray[i].match(/^(http)+/)) {
        newTxt.push('<a href="' + txtArray[i] + '" target="_blank">' + txtArray[i] + '</a>');
      } else if (txtArray[i].match(/^(www)+/)) {
        newTxt.push('<a href="http://' + txtArray[i] + '" target="_blank">' + txtArray[i] + '</a>');
      } else if (txtArray[i].match(/(^|[^@\w])@(\w{1,15})/)) {
        newTxt.push('<a href="https://twitter.com/' + txtArray[i].replace(/[\W]/g,'') + '" target="_blank">' + txtArray[i] + '</a>');
      } else {
        newTxt.push(txtArray[i]);
      }
    }

    return newTxt.join(' ');
  };

  var renderChat = function (c) {
    var img = new Image();
    img.onload = function() {  
      if (body.find('li[data-key="' + c.chat.key + '"]').length === 0) {
        var li = $('<li data-action="chat-message" data-key="' + c.chat.key +
          '"><img src="' + escapeHtml(c.chat.value.media) + '"><p>' +
          escapeHtml(c.chat.value.message) + '</p><li>');
        chatList.append(li);
        var scrollHeight = body[0].scrollHeight;
        body[0].scrollTop = scrollHeight;
        html[0].scrollTop = scrollHeight;

        if (body.find('.chats.list > ul > li').length > CHAT_LIMIT) {
          body.find('.chats.list > ul > li')[0].remove();
        }
      }
    }
    img.src = escapeHtml(c.chat.value.media);
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

  if (navigator.getMedia) {
    gumHelper.startVideoStreaming(function errorCb() {
    }, function successCallback(stream, videoElement, width, height) {
      videoElement.width = width / 5;
      videoElement.height = height / 5;
      footer.append(videoElement);
      videoElement.play();
      videoShooter = new VideoShooter(videoElement);
      addChat.click();
    });
  } else {
    addChat.click();
  }

  addChat.on('submit', function (ev) {
    ev.preventDefault();

    var self = $(ev.target);
    var blocker = self.find('#add-chat-blocker');
    var addChat = self.find('#add-chat');

    if (!posting) {
      blocker.removeClass('hidden');
      posting = true;

      getScreenshot(function (pictureData) {
        var picField = self.find('#picture').val(pictureData);

        $.post('/add/chat', self.serialize(), function () {
          picField.val('');
          addChat.val('');
          blocker.addClass('hidden');
          posting = false;
        });
      }, 10, 0.2);
    }
  });
});
