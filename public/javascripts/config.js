requirejs.config({
  deps: ['main'],
  paths: {
    'jquery': 'lib/jquery/jquery',
    'Animated_GIF': 'lib/animated-gif/dist/Animated_GIF.min',
    'fingerprint': 'lib/fingerprint/fingerprint',
    'transform': 'transform',
    'md5': 'lib/js-md5/js/md5',
    'waypoints': 'lib/jquery-waypoints/waypoints'
  },
  shim: {
    'jquery': {
      exports: 'jQuery'
    },
    'fingerprint': {
      exports: 'Fingerprint'
    }
  }
});
