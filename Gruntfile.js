module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.initConfig({
        mochaTest: {
              test: {
                  options: {
                      reporter: 'spec'
                  },
                  src: ['test/automated/*.js'],
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
