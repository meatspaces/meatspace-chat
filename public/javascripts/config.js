requirejs.config({
  deps: ['main'],
  paths: {
    'jquery': 'lib/jquery/jquery',
    'Animated_GIF': 'lib/animated-gif/src/Animated_GIF',
    'GifWriter': 'lib/animated-gif/src/omggif',
    'fingerprint': 'lib/fingerprint/fingerprint',
    'linkify': 'linkify',
    'md5': 'lib/js-md5/js/md5'
  },
  shim: {
    'jquery': {
      exports: 'jQuery'
    },
    'Animated_GIF': ['GifWriter'],
    'fingerprint': {
      exports: 'Fingerprint'
    }
  }
});
