# Meatspace Chat

## Setting up
    > cp local.json-dist local.json
    > cp clients.json-dist clients.json
    > cp blacklist.json-dist blacklist.json
    > npm install
    > npm -g install nodemon
    > bower install
    > npm run-script grunt build
    > npm start

## Mute feature

If you mute a user then you won't see any new posts from them at that machine and IP. If you want to unmute you will have to go to your web console on Firefox or Chrome and type the following and refresh:

    localStorage.clear()

## Native apps (iOS/Android) or Non-web clients

If you need an apiKey to post from your app, contact me at jen@meatspac.es and I will try to hook you up! You will get access to [staging server](http://chat-staging.meatspac.es) to see if everything works and see if it is appropriate for the production server (which I will give you a new apiKey).

### API

If you are doing native or non-web calls to the API, you will first need a valid apiKey and then you can make the following calls:

Push a new message through a socket request and provide the following data:

    {
      apiKey: <apiKey>,
      message: <text message or can be empty>,
      picture: <a base64 blob of the gif data>,
      fingerprint: <a unique identifier for the user posting from the client, preferably md5-hashed>
    }

You can listen to the socket to receive incoming messages or use long polling at either https://chat.meatspac.es or http://chat-staging.meatspac.es.
