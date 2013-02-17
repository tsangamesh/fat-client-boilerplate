var path = require('path');
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

var folderMount = function folderMount(connect, point) {
  return connect.static(path.resolve(point));
};

module.exports = function (grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-hash');
  grunt.loadNpmTasks('grunt-regarde');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadTasks('tasks');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    'finalize-html': {
      dist: {
        src: 'index.html',
        dest: 'dist/index.html',
        manifest: 'dist/assets.json'
      }
    },
    jshint: {
      grunt: ['grunt.js'],
      src:   ['src/{collections,models,regions,views}/**/*.js', 'src/*.js'],
      test:  ['test/**/*.js'],
      options: {
        indent: 2,
        globals: {describe: true, define: true, require: true, it: true, jasmine: true, reporter: true}
      }
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: './src',
          out: './build/build.js',
          include: ['require-lib', 'config', 'main'],
          pragmasOnSave: {
            excludeJade : true
          },
          paths: {
            'require-lib': 'vendor/requirejs/require',
            'jquery': 'vendor/jquery/jquery.min',
            'underscore': 'vendor/underscore-amd/underscore-min',
            'backbone': 'vendor/backbone-amd/backbone-min',
            'backbone-validation': 'vendor/backbone-validation/dist/backbone-validation-amd',
            'backbone.wreqr': 'vendor/backbone.wreqr/lib/amd/backbone.wreqr',
            'backbone.babysitter': 'vendor/backbone.babysitter/lib/amd/backbone.babysitter',
            'jade': 'vendor/require-jade/jade',
            'marionette': 'vendor/marionette/lib/core/amd/backbone.marionette',
            'rivets': 'vendor/rivets/lib/rivets.min',
            'text': 'vendor/requirejs-text/text'
          }
        }
      }
    },
    shell: {
      'clean-build': {
        command: 'rm build/build.js build/main.min.css'
      },
      'clean-dist': {
        command: 'git rm dist/*.{css,js}'
      },
      update_dist: {
        command: 'git add dist/* build/*'
      },
      jasmine: {
        command: 'phantomjs test/support/jasmine-runner.coffee http://localhost:8001/headlessRunner.html',
        options: {
          stdout: true
        }
      },
      zombie: {
        command: '`npm bin`/jasmine-node test/integration',
        options: {
          stdout: true
        }
      },
      'sass-development': {
        command: 'sass -l -t expanded stylesheets/main.scss:build/main.css',
        options: {
          stdout: true
        }
      },
      'sass-production': {
        command: 'sass -t compressed stylesheets/main.scss:build/main.min.css',
        options: {
          stdout: true
        }
      }
    },
    hash: {
      src: ['build/*.js', 'build/main.min.css'],
      mapping: 'dist/assets.json',
      dest: 'dist/'
    },
    regarde: {
      grunt: {
        files: ['grunt.js'],
        tasks: ['jshint:grunt'],
        spawn: true
      },
      src: {
        files: ['src/*.js',
                'src/{collections,models,regions,views}/**/*.js'
        ],
        tasks: ['jshint:src', 'jshint:test', 'livereload', 'shell:jasmine', 'shell:zombie']
      },
      test: {
        files: ['test/**/*.js'],
        tasks: ['jshint:test', 'shell:jasmine', 'shell:zombie'],
        spawn: true
      },
      stylesheet: {
        files: ['stylesheets/*.scss'],
        tasks: ['shell:sass-development', 'livereload']
      }
    },
    connect: {
      livereload: {
        options: {
          port: 35729,
          middleware: function(connect, options) {
            return [lrSnippet, folderMount(connect, '.')]
          }
        }
      },
      development: {
        options: {
          port: 8000,
          base: '.'
        }
      },
      test: {
        options: {
          port: 8001,
          base: '.'
        }
      },
      production: {
        options: {
          port: 8002,
          base: './dist',
          keepalive: true
        }
      }
    }
  });

  // Default task
  grunt.registerTask('test', ['connect:test', 'shell:jasmine', 'shell:zombie']);
  grunt.registerTask('dist', ['shell:clean-build', 'shell:clean-dist', 'shell:sass-production', 'requirejs', 'hash', 'shell:update_dist', 'finalize-html']);
  grunt.registerTask('default', ['jshint', 'livereload-start', 'connect:development', 'shell:sass-development', 'test', 'regarde']);

};