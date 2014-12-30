module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.initConfig({
        mochaTest: {
              test: {
                  options: {
                      reporter: 'spec'
                  },
                  /* N.B. These aren't really unit tests because they interface with the remote API.
                   * TODO: Rename as appropriate and create mock versions.
                   */
                  src: ['test/unit/*.js'],
              },
        },
        jsdoc : {
            dist : {
                src: ['*.js', 'src/*.js', 'README.md'],
                options: {
                    destination: 'doc',
                    template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                    configure : "conf/jsdoc.conf.json",
                    templates: {
                        "navType"               : "{vertical|inline}",
                        /*"inverseNav"            : "true",*/
                        "syntaxTheme"           : "cosmo"
                    }
                }
            }
        }
    });
};
