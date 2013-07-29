define(['jquery', 'gumhelper', 'videoshooter'],
  function($, gumHelper, VideoShooter) {

  'use strict';

  var body = $('body');
  var friendList = $('.friends ul');
  var chatList = $('.chats ul');
  var chatUser = $('#friend');
  var videoShooter;

  var renderFriend = function (f) {
    setTimeout(function () {
      var li = $('<li data-action="chat-friend" data-user="' +
        f.user + '"><img src="' + f.avatar + '" data-action="chat-friend" ' +
        'data-user="' + f.user + '"><li>');
      friendList.append(li);
   }, 1);
  };

  var renderChat = function (c) {
    setTimeout(function () {
      var li = $('<li data-action="chat-message" data-user="' +
        c.user + '"><p>' + c.chat + '</p><li>');
      chatList.append(li);
    }, 1);
  };

  var getScreenshot = function (callback) {
    if (videoShooter) {
      videoShooter.getShot(callback);
    } else {
      callback('');
    }
  };

  if (!!body.data('authenticated')) {
    $.get('/get/friends', function (data) {
      for (var i = 0; i < data.friends.length; i ++) {
        renderFriend(data.friends[i]);
      }
    });
  }

  if(navigator.getMedia) {
      gumHelper.startVideoStreaming(function errorCb() {
      }, function successCallback(stream, videoElement, width, height) {
          console.log('yay', videoElement, width, height);
          videoElement.width = width / 10;
          videoElement.height = height / 10;
          $('#header').append(videoElement);
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
            document.location.href = '/logout';
          } else {
            console.log('Logout failed because ' + data.reason);
          }
        });
        break;

      case 'chat-friend':
        ev.preventDefault();
        friendList.find('li').removeClass('on');
        body.find('#add-chat').removeClass('hidden');
        self.closest('li').addClass('on');
        chatUser.val(self.data('user'));
        chatList.empty();

        $.get('/get/chats/' + self.data('user'), function (data) {
          for (var i = 0; i < data.chats.chats.length; i ++) {
            var chat = {
              user: data.chats.chats[i].key.split('!')[1],
              chat: data.chats.chats[i].value
            };
            renderChat(chat);
          }
        });
        break;
    }
  });

  body.on('submit', function (ev) {
    var self = $(ev.target);

    switch (self.data('action')) {
      case 'add-friend':
        ev.preventDefault();
        $.post(self.attr('action'), self.serialize(), function (data) {
          renderFriend(data.friend);
          self.find('#add-friend').val('');
        });
        break;

      case 'add-chat':
        ev.preventDefault();

        getScreenshot(function(pictureData) {
          var picField = self.find('#picture');
          
          picField.val(pictureData);

          $.post(self.attr('action'), self.serialize(), function (data) {
            renderChat(data);
            self.find('#add-chat', '#friend').val('');
            picField.val('');

          });

        });
        break;
    }
  });
});
