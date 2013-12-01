define(function (){
  'use strict';

  function GumHelper () {
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia || navigator.msGetUserMedia;

    var video, cameraStream;

    function startVideoStreaming(errorCallback, okCallback) {
      if (!navigator.getUserMedia) {
        errorCallback('Native device media streaming isn\'t supported in this browser.');
      }

      video = document.createElement('video');
      video.autoplay = true;
      video.addEventListener('loadeddata', function(evt) {
        findVideoSize();
      });

      var attempts = 0;

      var findVideoSize = function() {
        if(video.videoWidth > 0 && video.videoHeight > 0) {
          video.removeEventListener('loadeddata', findVideoSize);
          onDimensionsReady(video.videoWidth, video.videoHeight);
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
        okCallback(cameraStream, video, width, height);
      };

      navigator.getUserMedia(
        { video: true },
        function (stream) {
          if (video.mozSrcObject) {
            video.mozSrcObject = stream;
          } else {
            video.src = window.URL.createObjectURL(stream);
          }

          cameraStream = stream;
          video.play();
        }, errorCallback);
    }

    function stopVideoStreaming() {
      if(cameraStream) {
        cameraStream.stop();
      }
      if(video) {
        video.pause();
        video.src = null; // TODO free src url object
        video = null;
      }
    }

    return {
      startVideoStreaming: startVideoStreaming,
      stopVideoStreaming: stopVideoStreaming
    };
  };

  return GumHelper();
})
