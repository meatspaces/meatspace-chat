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
          'public/stylesheets/main-min.css': ['public/stylesheets/main.css', 'public/stylesheets/emojify.css']
        }
      }
    },
    nodeunit: {
      files: ['tests/**/*.js']
    },
    jshint: {
      all: [
        'public/**/*.js',
        'routes/**/*.js',
        'test/**/*.js',
        // Ignore these, they are someone else's problem
        '!public/javascripts/require.js',
        '!public/javascripts/base/*.js',
        '!public/javascripts/build/*.js',
        '!public/javascripts/lib/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.registerTask('build', ['cssmin', 'requirejs', 'concat']);
  grunt.registerTask('default', ['jshint', 'build', 'nodeunit']);
  grunt.registerTask('travis', ['jshint', 'nodeunit']);
};
