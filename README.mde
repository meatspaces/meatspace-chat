# Meatspace Chat
[![Build Status](https://travis-ci.org/meatspaces/meatspace-chat.png)](https://travis-ci.org/meatspaces/meatspace-chat)

## Before you send a pull request

Note that we are not taking any new features or changes - if you feel like something is that important to the chat, please contact [jen@meatspac.es](mailto:jen@meatspac.es) or [ednapiranha](http://twitter.com/ednapiranha) before sending something that might be rejected.

If you want to create a browser add-on or plugin feel free to do so and follow the API instructions below. Then send us a pull request with your link at [https://github.com/meatspaces/meatspace-chat-hackers](https://github.com/meatspaces/meatspace-chat-hackers).

## Setting up
    brew install zeromq
    cp local.json-dist local.json
    cp clients.json-dist clients.json
    npm install
    npm -g install nodemon
    bower install
    npm run-script grunt build
    npm start

# Messages

You can listen to the socket to receive incoming messages or use long polling at either https://chat.meatspac.es or http://chat-staging.meatspac.es.

A meatspace chat message is a nested dictionary in the form

    {
        chat:
        {
            value:
            {
                media: data:image/gif;base64,<base64 data>,
                message: '<message; may be empty>,
                ttl: 600000,
                created: <time-string>,
                fingerprint: <32-byte hex>
            },

            key: <unique message key>
        }
    }

## Mute feature

If you mute a user then you won't see any new posts from them at that machine and IP. There is an unmute button below the meatcube logo on the page.

## Native apps (iOS/Android) or Non-web clients

If you need an apiKey to post from your app, contact me at jen@meatspac.es and I will try to hook you up! You will get access to [staging server](http://chat-staging.meatspac.es) to see if everything works and see if it is appropriate for the production server (which I will give you a new apiKey).

### API

If you are doing native or non-web calls to the API, you will first need a valid apiKey and then you can make the following calls:

Push a new message through a socket request and provide the following data:

    {
        apiKey: <apiKey>,
        message: <text message; can be empty>,
        picture: data:image/gif;base64,<a base64 blob of the gif data>,
        fingerprint: <a unique identifier for the user posting from the client, preferably md5-hashed>
    }


