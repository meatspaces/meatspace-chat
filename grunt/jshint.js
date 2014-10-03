module.exports = {
  all: [
    'public/**/*.js',
    'routes/**/*.js',
    'test/**/*.js',
    // Ignore these, they are someone else's problem
    '!public/javascripts/base/videoShooter.js',
    '!public/javascripts/build/*.js',
    '!public/javascripts/lib/**/*.js'
  ],
  options: {
    jshintrc: '.jshintrc'
  }
};
