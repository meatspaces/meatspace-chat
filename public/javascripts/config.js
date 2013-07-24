requirejs.config({
  deps: ['main'],
  paths: {
    'jquery': 'lib/jquery'
  },
  shim: {
    'jquery': {
      exports: 'jQuery'
    }
  }
});
