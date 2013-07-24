module.exports = function(grunt) {

  var JS_FILE_PATH = 'public/javascripts/';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [JS_FILE_PATH + 'require.js', JS_FILE_PATH + 'build/optimized.js'],
        dest: JS_FILE_PATH + 'build/<%= pkg.name %>.js'
      }
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: JS_FILE_PATH,
          mainConfigFile: JS_FILE_PATH + 'config.js',
          out: JS_FILE_PATH + 'build/optimized.js',
          name: 'config'
        }
      }
    },
    cssmin: {
      compress: {
        files: {
          'public/stylesheets/main-min.css': ['public/stylesheets/main.css']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['cssmin', 'requirejs', 'concat']);
};
