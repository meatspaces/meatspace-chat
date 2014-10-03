module.exports = {
  options: {
    separator: ';'
  },
  dist: {
    src: ['<%= JS_FILE_PATH %>' + 'lib/requirejs/require.js', '<%= JS_FILE_PATH %>' + 'build/optimized.js'],
    dest: '<%= JS_FILE_PATH %>' + 'build/<%= pkg.name %>.js'
  }
};
