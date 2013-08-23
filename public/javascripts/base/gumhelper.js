'use strict';

// A couple of shims for having a common interface

window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

navigator.getMedia = ( navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
);


//

var video;
var cameraStream;
var noGUMSupportTimeout;


/**
 * Requests permission for using the user's camera,
 * starts reading video from the selected camera, and calls
 * `okCallback` when the video dimensions are known (with a fallback
 * for when the dimensions are not reported on time),
 * or calls `errorCallback` if something goes wrong
 */
function startStreaming(errorCallback, onStreaming, okCallback) {

    var videoElement;
    var cameraStream;
    var attempts = 0;
    var readyListener = function(event) {

        findVideoSize();

    };
    var findVideoSize = function() {

        if(videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {

            videoElement.removeEventListener('loadeddata', readyListener);
            onDimensionsReady(videoElement.videoWidth, videoElement.videoHeight);

        } else {

            if(attempts < 10) {

                attempts++;
                setTimeout(findVideoSize, 200);

            } else {

                onDimensionsReady(640, 480);

            }

        }

    };
    var onDimensionsReady = function(width, height) {
        okCallback(cameraStream, videoElement, width, height);
    };
    
    videoElement = document.createElement('video');
    videoElement.autoplay = true;

    videoElement.addEventListener('loadeddata', readyListener);

    navigator.getMedia({ video: true }, function (stream) {

        onStreaming();

        if(videoElement.mozSrcObject) {
            videoElement.mozSrcObject = stream;
        } else {
            videoElement.src = window.URL.createObjectURL(stream);
        }

        cameraStream = stream;
        videoElement.play();

    }, errorCallback);

}

/**
 * Try to initiate video streaming, and transparently handle cases
 * where that is not possible (includes 'deceptive' browsers, see inline
 * comment for more info)
 */
function startVideoStreaming(errorCallback, okCallback) {
    
    if(navigator.getMedia) {

        // Some browsers apparently have support for video streaming because of the
        // presence of the getUserMedia function, but then do not answer our
        // calls for streaming.
        // So we'll set up this timeout and if nothing happens after a while, we'll
        // conclude that there's no actual getUserMedia support.
        noGUMSupportTimeout = setTimeout(onNoGUMSupport, 10000);

        startStreaming(errorCallback, function() {
                
                // The streaming started somehow, so we can assume /there is/
                // gUM support
                clearTimeout(noGUMSupportTimeout);

            }, function(stream, videoElement, width, height) {


                // Keep references, for stopping the stream later on.
                cameraStream = stream;
                video = videoElement;

                okCallback(stream, videoElement, width, height);

            }
        );

    } else {

        onNoGUMSupport();
    }

    function onNoGUMSupport() {
        errorCallback('Native device media streaming (getUserMedia) not supported in this browser.');
    }
}


function stopVideoStreaming() {
    
    if(cameraStream) {

        cameraStream.stop();

    }

    if(video) {

        video.pause();
        // TODO free src url object
        video.src = null;
        video = null;

    }

}

var GumHelper = {
    startVideoStreaming: startVideoStreaming,
    stopVideoStreaming: stopVideoStreaming
};

// Make it compatible for require.js/AMD loader(s)
if(typeof define === 'function' && define.amd) {
    define(function() { return GumHelper; });
} else if(module !== undefined && module.exports) {
    // And for npm/node.js
    module.exports = GumHelper;
}

