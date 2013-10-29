define(['jquery', 'linkify', './base/gumhelper', './base/videoShooter', 'fingerprint', 'md5'],
  function ($, linkify, gumHelper, VideoShooter, Fingerprint, md5) {
  'use strict';
  var win = $(window);
  var html = $('html');
  var body = $('body');
  var addChatForm = $('#add-chat-form');
  var addChatBlocker = $('#add-chat-blocker');
  var addChat = $('#add-chat');
  var picField = $('#picture');
  var chatList = $('.chats ul');
  var footer = $('#footer');
  var muteBtn = $('.mute');
  var userId = $('#userid');
  var fp = $('#fp');
  var posting = false;
  var videoShooter;
  var canSend = true;
  var fingerprint = new Fingerprint({ canvas: true }).get();
  var mutedArr = JSON.parse(localStorage.getItem('muted')) || [];
  var socket = io.connect(location.protocol + '//' + location.hostname +
    (location.port ? ':' + location.port : ''));

  var CHAT_LIMIT = 35;

  $.get('/ip', function (data) {
    fp.val(fingerprint);
    userId.val(md5(fingerprint + data.ip));
  });

  emojify.setConfig({
    emojify_tag_type: 'div',
    emoticons_enabled: true,
    people_enabled: true,
    nature_enabled: true,
    objects_enabled: true,
    places_enabled: true,
    symbols_enabled: true
  });

  var isMuted = function(fingerprint) {
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

          var size = addChat[0].getBoundingClientRect().bottom;
          var last = chatList[0].lastChild;
          var bottom = last ? last.getBoundingClientRect().bottom : 0;
          var follow = bottom < size + 50;

          chatList.append(li);
          emojify.run(li);

          // if scrolled to bottom of window then scroll the new thing into view
          // otherwise, you are reading the history... allow user to scroll up.
          if(follow) {
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

  socket.on('connect', function () {
    socket.on('message', function (data) {
      renderChat(data);
    });
  });

  $.get('/get/chats', function (data) {
    data.chats.chats.sort(function (a, b) {
      return a.value.created - b.value.created;
    }).forEach(function (chat) {
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
      addChatForm.hide();
      footer.hide();
    }, function successCallback(stream, videoElement, width, height) {
      videoElement.width = width / 5;
      videoElement.height = height / 5;
      footer.prepend(videoElement);
      videoElement.play();

      // set offset to video width if it isn't already set
      if ( addChatForm.css('left') === '0px' ) {
        addChatForm.css('left', width / 5);
      }

      videoShooter = new VideoShooter(videoElement);
      addChatForm.click();
    });
  } else {
    addChatForm.hide();
    footer.hide();
  }

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


    if (!posting) {
      if (!canSend) {
        alert('please wait a wee bit...');
      }

      if (canSend) {
        canSend = false;
        addChatBlocker.removeClass('hidden');
        posting = true;

        setTimeout(function () {
          canSend = true;
        }, 5000);

        getScreenshot(function (pictureData) {
          picField.val(pictureData);

          $.post('/add/chat', self.serialize(), function () {

          }).error(function (data) {
            alert(data.responseJSON.error);
          }).always(function (data) {
            picField.val('');
            addChat.val('');
            posting = false;
            addChatBlocker.addClass('hidden');
            body.find('> img').remove();
          });
        }, 10, 0.2);
      }
    }
  });
    var lastScroll = 0;
    win.on('scroll', function(e) {
      var winHeight = win.height(),
        scrollPosn = win.scrollTop(),
        //obvs this only works if chats are a uniform height
        chatHeight = chatList.children().height();

      //This is so all this stuff only happens when scrolling has progressed
      //more than one chat element's height. So if a scroll event gets triggered 40 times
      //but the movement is only 300px, this only gets called once
      if (Math.abs(scrollPosn - lastScroll) > chatHeight) {
        lastScroll = scrollPosn;
        var chats = chatList.children();
        var edge = Math.max(chatList.length, Math.floor(scrollPosn / chatHeight)) - 1;
        var outOfViewport = chats.slice(0, edge);
        outOfViewport.addClass('unrender');
        var inViewport = chats.slice(edge);
        inViewport.removeClass('unrender');
      }
    });

});
