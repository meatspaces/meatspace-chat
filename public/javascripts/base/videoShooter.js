define(['Animated_GIF'], function (Animated_GIF) {
  'use strict';

  function VideoShooter (videoElement, desiredWidth, desiredHeight) {
    this.getShot = function (callback, numFrames, interval, progressCallback) {
      numFrames = numFrames !== undefined ? numFrames : 3;
      interval = interval !== undefined ? interval : 0.1; // In seconds

      var canvas = document.createElement('canvas');
      canvas.width = desiredWidth;
      canvas.height = desiredHeight;
      var context = canvas.getContext('2d');
      context.fillStyle = 'rgb(0,0,0)';

      var pendingFrames = numFrames;
      var ag = new Animated_GIF({
        workerPath: 'javascripts/lib/animated-gif/dist/Animated_GIF.worker.min.js'
      });
      ag.setSize(desiredWidth, desiredHeight);
      ag.setDelay(interval);

      var desiredRatio = desiredWidth / desiredHeight;
      var videoRatio = videoElement.width / videoElement.height;
      var isLetterboxed = false;
      var scaledWidth;
      var scaledHeight;
      if (desiredWidth === videoElement.width && desiredHeight === videoElement.height) {
        scaledWidth = desiredWidth;
        scaledHeight = desiredHeight;
      } else if (Math.abs(videoRatio - desiredRatio) < 0.1) {
        scaledWidth = desiredWidth;
        scaledHeight = desiredHeight;
      } else {
        isLetterboxed = true;
        var scaleFactor = videoElement.width > videoElement.height ?
          (desiredWidth / videoElement.width) : (desiredHeight / videoElement.height);
        scaledWidth = Math.round(videoElement.width * scaleFactor);
        scaledHeight = Math.round(videoElement.height * scaleFactor);
      }

      var captureFrame = function() {
        if (isLetterboxed) {
          context.fillRect(0, 0, desiredWidth, desiredHeight);
        }

        context.drawImage(videoElement,
          Math.abs(desiredWidth - videoElement.width) / 2,
          Math.abs(desiredHeight - videoElement.height) / 2,
          scaledWidth, scaledHeight);

        ag.addFrameImageData(context.getImageData(0, 0, desiredWidth, desiredHeight));
        pendingFrames--;

        // Call back with an r value indicating how far along we are in capture
        progressCallback((numFrames - pendingFrames) / numFrames);

        if (pendingFrames > 0) {
          setTimeout(captureFrame, interval * 1000); // timeouts are in milliseconds
        } else {
          ag.getBase64GIF(function(image) {
            // Ensure workers are freed-so we avoid bug #103
            // https://github.com/meatspaces/meatspace-chat/issues/103
            ag.destroy();
            callback(image);
          });
        }
      };

      captureFrame();
    };
  }

  VideoShooter.getDimensions = function (actualWidth, actualHeight, desiredWidth, desiredHeight) {
    var result = { width: desiredWidth, height: desiredHeight };
    if (actualWidth > actualHeight) {
      result.height =
        Math.min(desiredHeight, Math.round(desiredWidth * actualHeight / actualWidth));
    } else {
      result.width =
        Math.min(desiredWidth, Math.round(desiredHeight * actualWidth / actualHeight));
    }

    return result;
  };

  return VideoShooter;
});
