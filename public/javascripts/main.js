define(['jquery'],
  function($) {

  'use strict';

  var body = $('body');
  var friendList = $('.friends ul');
  var chatList = $('.chats ul');

  body.on('click', '#login', function (ev) {
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
  });

  var renderFriend = function (avatar) {
    var li = $('<li><img src="' + avatar + '"><li>');
    friendList.append(li);
  };

  if (!!body.data('authenticated')) {
    $.get('/get/friends', function (data) {
      for (var i = 0; i < data.friends.length; i ++) {
        setTimeout(function () {
          renderFriend(data.friends[i - 1].avatar);
        }, 1);
      }
    });
  }

  body.on('click', '#logout', function(ev) {
    ev.preventDefault();

    $.ajax({
      url: '/persona/logout',
      type: 'POST',
      dataType: 'json',
      cache: false
    }).done(function (data) {
      if (data.status === 'okay') {
        document.location.href = '/';
      } else {
        console.log('Logout failed because ' + data.reason);
      }
    });
  });

  body.on('submit', function (ev) {
    var self = $(ev.target);

    switch (self.data('action')) {
      case 'add-friend':
        ev.preventDefault();
        $.post(self.attr('action'), self.serialize(), function (data) {
          renderFriend(data.friend.avatar);
        });
        break;
    }
  });
});
