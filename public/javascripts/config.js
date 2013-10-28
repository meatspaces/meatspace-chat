requirejs.config({
  deps: ['main'],
  paths: {
    'jquery': 'lib/jquery',
    'Animated_GIF': 'lib/Animated_GIF/Animated_GIF',
    'GifWriter': 'lib/Animated_GIF/omggif',
    'linkify': 'lib/linkify',
    'fingerprint': 'lib/fingerprint'
  },
  shim: {
    'jquery': {
      exports: 'jQuery'
    },
    'Animated_GIF': ['GifWriter']
  }
});
