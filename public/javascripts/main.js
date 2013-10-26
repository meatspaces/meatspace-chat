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
  var canSend = true;
  var socket = io.connect(location.protocol + '//' + location.hostname +
    (location.port ? ':' + location.port : ''));

  var CHAT_LIMIT = 35;

  emojify.setConfig({
    emojify_tag_type: 'div',
    emoticons_enabled: true,
    people_enabled: true,
    nature_enabled: true,
    objects_enabled: true,
    places_enabled: true,
    symbols_enabled: true
  });

  var linkify = function (text) {
    var linkHtml = function(href, text) {
      return '<a href="' + href + '" target="_blank">' + text + '</a>';
    };

    return text.replace(
      //    [        urls        ]      [ twitter ]
      /(?:\b((?:https?:|www\.)\S+)|(\W?)@(\w{1,20}))/g,
      function(match, link, notWord, handle) {
        if (handle && handle.length > 0) {
          return notWord + linkHtml('https://twitter.com/' + handle,
            '@' + handle);
        }
        if (link.substr(0, 3) == 'www') {
          link = 'http://' + link;
        }
        return linkHtml(link, match);
    });
  };

  var renderChat = function (c) {
    var img = new Image();
    img.onload = function() {
      if (body.find('li[data-key="' + c.chat.key + '"]').length === 0) {
        var li = document.createElement('li');
        li.dataset.action = 'chat-message';
        li.dataset.key = c.chat.key;
        li.appendChild(img);
        var message = document.createElement('p');
        message.textContent = c.chat.value.message;
        message.innerHTML = linkify(message.innerHTML);
        li.appendChild(message);

        var size = body.find('#add-chat')[0].getBoundingClientRect().bottom
        var last = body.find('.chats > ul')[0].lastChild
        var bottom = last ? last.getBoundingClientRect().bottom : 0

        var follow = bottom < size + 50

        chatList.append(li)
        emojify.run(li);

        // if scrolled to bottom of window then scroll the new thing into view
        // otherwise, you are reading the history... allow user to scroll up.
        // TODO: play an annoying noise if user is not on this tab?
        if(follow) {
          if (body.find('.chats.list > ul > li').length > CHAT_LIMIT) {
            body.find('.chats.list > ul > li')[0].remove();
          }
          li.scrollIntoView()
        }
      }
    }
    img.src = c.chat.value.media;
  };


  socket.on('connect', function () {
    socket.on('message', function (data) {
      renderChat(data);
    });
  });

  $.get('/get/chats', function (data) {
    data.chats.chats.sort(function(a, b) {
      return a.value.created - b.value.created;
    }).forEach(function(chat) {
      renderChat({chat: chat});
    });
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

      $('.chats').css({'padding-bottom': height / 5});

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
      if (!canSend) {
        alert('please wait a wee bit...');
      }

      if (canSend) {
        canSend = false;
        blocker.removeClass('hidden');
        posting = true;

        setTimeout(function () {
          canSend = true;
        }, 5000);

        getScreenshot(function (pictureData) {
          var picField = self.find('#picture').val(pictureData);

          $.post('/add/chat', self.serialize(), function () {

          }).error(function (data) {
            alert(data.responseJSON.error);
          }).always(function (data) {
            picField.val('');
            addChat.val('');
            posting = false;
            blocker.addClass('hidden');
          });
        }, 10, 0.2);
      }
    }
  });
});
