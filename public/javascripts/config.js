requirejs.config({
  deps: ['main'],
  paths: {
    'jquery': 'lib/jquery',
    'Animated_GIF': 'lib/Animated_GIF/Animated_GIF',
    'GifWriter': 'lib/Animated_GIF/omggif',
    'fingerprint': 'lib/fingerprint',
    'linkify': 'linkify',
    'md5': 'lib/md5'
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
