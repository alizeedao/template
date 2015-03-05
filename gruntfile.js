var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    paths: {
      dist: {
        root: 'dist',
        images: 'dist/img',
        js: 'dist/js',
        css: 'dist/css',
        views: 'dist'
      },
      src: {
        root: 'src',
        images: 'src/img',
        js: 'src/js',
        css: 'src/css',
        views: 'src/views'
      },
      build: {
        root: 'build',
        images: 'build/img',
        js: 'build/js',
        css: 'build/css',
        views: 'build'
      }
    },
    express: {
      all: {
        options: {
          port: 9000,
          hostname: "0.0.0.0",
          bases: ['<%= paths.dist.root %>'], // Replace with the directory you want the files served from
                              // Make sure you don't use `.` or `..` in the path as Express
                              // is likely to return 403 Forbidden responses if you do
                              // http://stackoverflow.com/questions/14594121/express-res-sendfile-throwing-forbidden-error
          livereload: true
        }
      }
    },
    copy: {
      dist: {
        files: [
          {
            expand: true,
            cwd: '<%= paths.src.root %>/',
            src: ['js/vendor/modernizr.custom.js', 'font/**/*', 'data/**/*', 'php/**/*'],
            dest: '<%= paths.dist.root %>'
          }
        ]
      },
      build: {
        files: [{
          expand: true,
          cwd: '<%= paths.dist.root %>/',
          src: ['js/vendor/modernizr.custom.js', 'font/**/*', 'data/**/*', 'php/**/*', 'img/**/*.{png,jpg,gif}'],
          dest: '<%= paths.build.root %>'
        }]
      }
    },
    clean: {
      working: {
        src: ['<%= paths.build.root %>', '<%= paths.dist.root %>']
      }
    },
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %> */' +
          "\n'use strict';\n",
        process: function(src, filepath) {
          return '// Source: ' + filepath + '\n' +
              src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
        }
      },
      dist: {
        src: [
          '<%= paths.src.js %>/vendor/jquery-1.11.1.js',
          '<%= paths.src.js %>/vendor/jquery.unveil.js',
          '<%= paths.src.js %>/vendor/jquery.viewport.js',
          '<%= paths.src.js %>/vendor/bootstrap.js',
          '<%= paths.src.js %>/lib/*.js',
          '<%= paths.src.js %>/*.js'
        ],
        dest: '<%= paths.dist.js %>/<%= pkg.name %>-<%= pkg.version %>.js',
      }
    },
    uglify: {
      options: {
        sourceMap: true
      },
      build: {
        src: '<%= paths.dist.js %>/<%= pkg.name %>-<%= pkg.version %>.js',
        dest: '<%= paths.build.js %>/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },
    sass: {
      dist: {
        options: {
          sourcemap: true,
          style: 'expanded'
        },
        files: {
          '<%= paths.dist.css %>/<%= pkg.name %>-<%= pkg.version %>.css': '<%= paths.src.css %>/<%= pkg.theme %>.scss'
        }
      },
      release: {
        options: {
          sourcemap: true,
          style: 'compressed'
        },
        files: {
          '<%= paths.build.css %>/<%= pkg.name %>-<%= pkg.version %>.css': '<%= paths.src.css %>/<%= pkg.theme %>.scss'
        }
      }
    },
    imagemin: {
      options: {
        cache: false,
        optimizationLevel: 0
      },
      dynamic: {
        files: [{
          expand: true,
          cwd: '<%= paths.src.images %>/',
          src: ['**/*.{png,jpg,gif}', '!themes/**/*.{png,jpg,gif}'],
          dest: '<%= paths.dist.images %>'
        }, {
          expand: true,
          cwd: '<%= paths.src.images %>/themes/<%= pkg.theme %>/',
          src: ['**/*.{png,jpg,gif}'],
          dest: '<%= paths.dist.images %>'
        }]
      }
    },
    nunjucks: {
      options: {
        preprocessData: function(data) {
          var page = path.basename(this.src[0], '.html');
          var result = {
            page: page,
            data: data
          };
          return result;
        },
        paths: ['<%= paths.src.views %>/layouts/', '<%= paths.src.views %>/partials/'],
        data: grunt.file.readJSON('package.json')
      },
      render: {
        files: [
          {
            expand: true,
            cwd: "<%= paths.src.views %>/",
            src: "*.html",
            dest: "<%= paths.dist.views %>/",
            ext: ".html"
         }
        ]
      }
    },
    htmlmin: {
      dist: {
        // options: {
        //   removeComments: true,
        //   collapseWhitespace: true
        // },
        files: [
          {
            expand: true,
            cwd: '<%= paths.dist.views %>/',
            src: '*.html',
            dest: '<%= paths.build.views %>'
          }
        ]
      }
    },
    open: {
      dist: {
        path: 'http://localhost:<%= express.all.options.port%>'
      }
    },
    watch: {
      dist: {
        files: [
          '<%=  paths.dist.root %>/*.html',
          '<%=  paths.dist.root %>/data/**/*.json',
          '<%=  paths.dist.css %>/**/*.css',
          '<%=  paths.dist.images %>/**/*',
          '<%=  paths.dist.js %>/**/*.js',
        ],
        options: {
          livereload: true
        }
      },
      sass: {
        files: '<%= paths.src.css %>/**/*.scss',
        tasks: 'sass'
      },
      js: {
        files: '<%= paths.src.js %>/**/*.js',
        tasks: 'concat'
      },
      images: {
        files: '<%= paths.src.images %>/**/*.{png,jpg,gif}',
        tasks: 'imagemin'
      },
      views: {
        files: '<%= paths.src.views %>/**/*.html',
        tasks: 'nunjucks'
      },
      data: {
        files: ['<%= paths.src.root %>/data/**/*.json'],
        files: ['<%= paths.src.root %>/data/**/*.svg'],
        tasks: 'copy:dist'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-nunjucks-2-html');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-open');

  grunt.registerTask('default', ['static', 'watch']);
  grunt.registerTask('static', ['clean:working', 'concat', 'copy:dist', 'sass:dist', 'imagemin', 'nunjucks']);
  grunt.registerTask('dev', ['static', 'express', 'open', 'watch']);
  grunt.registerTask('release', ['static', 'sass:release', 'copy:build', 'uglify', 'htmlmin']);
};
