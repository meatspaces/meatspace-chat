requirejs.config({
  deps: ['main'],
  paths: {
    'jquery': 'lib/jquery',
    'gumhelper': 'gumhelper',
    'videoshooter': 'videoShooter'
  },
  shim: {
    'jquery': {
      exports: 'jQuery'
    }
  }
});
