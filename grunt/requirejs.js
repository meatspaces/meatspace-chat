module.exports = {
  compile: {
    options: {
      baseUrl: '<%= JS_FILE_PATH %>',
      mainConfigFile: '<%= JS_FILE_PATH %>' + 'config.js',
      out: '<%= JS_FILE_PATH %>' + 'build/optimized.js',
      name: 'config'
    }
  }
};
