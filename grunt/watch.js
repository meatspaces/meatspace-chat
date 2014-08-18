module.exports = {
  scripts: {
    files: [
      'tests/**/*.js',
      'public/**/*.js',
      'routes/**/*.js',
      'test/**/*.js',
      // Ignore these, they are someone else's problem
      '!public/javascripts/base/videoShooter.js',
      '!public/javascripts/build/*.js',
      '!public/javascripts/lib/**/*.js'
    ],
    tasks: ['jshint', 'nodeunit']
  }
};
