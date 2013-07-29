define([], function () {
    'use strict';

    function VideoShooter(videoElement) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        canvas.width = videoElement.width;
        canvas.height = videoElement.height;

        this.getShot = function (callback) {
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            var imgData = canvas.toDataURL();
            callback(imgData);
        };
    };

    return VideoShooter;
});
