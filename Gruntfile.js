module.exports = function(grunt) {
  // Load grunt config
  require('load-grunt-config')(grunt, {
    init: true,
    data: {
      pkg: grunt.file.readJSON('package.json'),
      JS_FILE_PATH: 'public/javascripts/'
    }
  });
};
