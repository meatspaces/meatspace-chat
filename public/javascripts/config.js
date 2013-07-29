requirejs.config({
  deps: ['main'],
  paths: {
    'jquery': 'lib/jquery',
    'gumhelper': 'gumhelper'
  },
  shim: {
    'jquery': {
      exports: 'jQuery'
    }
  }
});
