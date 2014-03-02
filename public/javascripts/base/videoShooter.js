define(['Animated_GIF'], function (Animated_GIF) {
  'use strict';

  function VideoShooter (videoElement, gifWidth, gifHeight, videoWidth, videoHeight, crop) {
    this.getShot = function (callback, numFrames, interval, progressCallback) {
      numFrames = numFrames !== undefined ? numFrames : 3;
      interval = interval !== undefined ? interval : 0.1; // In seconds

      var canvas = document.createElement('canvas');
      canvas.width = gifWidth;
      canvas.height = gifHeight;
      var context = canvas.getContext('2d');

      var pendingFrames = numFrames;
      var ag = new Animated_GIF({
        workerPath: 'javascripts/lib/animated-gif/dist/Animated_GIF.worker.min.js'
      });
      ag.setSize(gifWidth, gifHeight);
      ag.setDelay(interval);

      var sourceX = Math.floor(crop.scaledWidth / 2);
      var sourceWidth = videoWidth - crop.scaledWidth;
      var sourceY = Math.floor(crop.scaledHeight / 2);
      var sourceHeight = videoHeight - crop.scaledHeight;

      var captureFrame = function() {
        context.drawImage(videoElement,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, gifWidth, gifHeight);

        ag.addFrameImageData(context.getImageData(0, 0, gifWidth, gifHeight));
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

  VideoShooter.getCropDimensions = function (width, height, gifWidth, gifHeight) {
    var result = { width: 0, height: 0, scaledWidth: 0, scaledHeight: 0 };
    if (width > height) {
      result.width = Math.round(width * (gifHeight / height)) - gifWidth;
      result.scaledWidth = Math.round(result.width * (height / gifHeight));
    } else {
      result.height = Math.round(height * (gifWidth / width)) - gifHeight;
      result.scaledHeight = Math.round(result.height * (width / gifWidth));
    }

    return result;
  };

  return VideoShooter;
});
