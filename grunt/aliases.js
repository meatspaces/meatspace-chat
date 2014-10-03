module.exports = function (grunt) {
  grunt.registerTask('build', ['cssmin', 'requirejs', 'concat']);
  grunt.registerTask('default', ['jshint', 'build', 'nodeunit']);
  grunt.registerTask('travis', ['jshint', 'nodeunit']);
};
