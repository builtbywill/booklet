'use strict';

module.exports = function(grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	// Time how long tasks take. Can help when optimizing build times
	require('time-grunt')(grunt);

	var config = require('./package.json');

	// Define the configuration for all the tasks
	grunt.initConfig({

		// Load package config
		pkg: config,

		// Watches files for changes and runs tasks based on the changed files
		watch: {
			bower: {
				files: ['bower.json'],
				tasks: ['wiredep']
			},
			js: {
				files: ['<%= pkg.src %>/gh-pages-src/app/**/*.js'],
				tasks: ['newer:jshint:all'],
				options: {
					livereload: '<%= connect.options.livereload %>'
				}
			},
			jsTest: {
				files: ['<%= pkg.src %>/gh-pages-src/app/**/*.spec.js'],
				tasks: ['newer:jshint:test', 'karma']
			},
			gruntfile: {
				files: ['gruntfile.js']
			},
			livereload: {
				options: {
					livereload: '<%= connect.options.livereload %>'
				},
				files: [
					'<%= pkg.src %>/gh-pages-src/**/*.html',
					'<%= pkg.src %>/gh-pages-src/content/styles/{,*/}*.css',
					'<%= pkg.src %>/gh-pages-src/content/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
				]
			}
		},

		// The actual grunt server settings
		connect: {
			options: {
				port: 9000,
				// Change this to '0.0.0.0' to access the server from outside.
				hostname: 'localhost',
				livereload: 35729
			},
			livereload: {
				options: {
					open: true,
					middleware: function(connect) {
						return [
							connect.static('.tmp'),
							connect().use(
								'/bower_components',
								connect.static('./<%= pkg.src %>/bower_components')
							),
							connect.static('./<%= pkg.src %>')
						];
					}
				}
			},
			test: {
				options: {
					port: 9001,
					middleware: function(connect) {
						return [
							connect.static('.tmp'),
							connect.static('test'),
							connect().use(
								'/bower_components',
								connect.static('./<%= pkg.src %>/bower_components')
							),
							connect.static('./<%= pkg.src %>')
						];
					}
				}
			},
			debug: {
				options: {
					open: true,
					base: '<%= pkg.src %>'
				}
			},
			release: {
				options: {
					open: true,
					base: '<%= pkg.output %>'
				}
			}
		},

		// Make sure code styles are up to par and there are no obvious mistakes
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			all: {
				src: [
					'gruntfile.js',
					'<%= pkg.src %>/gh-pages-src/app/**/!(*spec).js'
				]
			},
			test: {
				options: {
					jshintrc: '<%= pkg.test %>/.jshintrc'
				},
				src: ['<%= pkg.src %>/**/*.spec.js']
			}
		},

		// Empties folders to start fresh
		clean: {
			release: {
				files: [{
					dot: true,
					src: [
						'.tmp',
						'<%= pkg.output %>/{,*/}*',
						'!<%= pkg.output %>/.git{,*/}*'
					]
				}]
			},
			server: '.tmp'
		},

		// Add vendor prefixed styles
		autoprefixer: {
			options: {
				browsers: ['last 2 versions']
			},
			release: {
				files: [{
					expand: true,
					cwd: '<%= pkg.output %>/content/styles/',
					src: '{,*/}*.css',
					dest: '<%= pkg.output %>/content/styles/'
				}]
			}
		},

		// Automatically inject Bower components into the app
		wiredep: {
			app: {
				src: ['<%= pkg.src %>/index.html'],
				ignorePath: /\.\.\//
			},
			test: {
				devDependencies: true,
				src: '<%= karma.unit.configFile %>',
				ignorePath: /\.\.\//,
				fileTypes: {
					js: {
						block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
						detect: {
							js: /'(.*\.js)'/gi
						},
						replace: {
							js: '\'{{filePath}}\','
						}
					}
				}
			}
		},

		// Renames files for browser caching purposes
		filerev: {
			release: {
				src: [
					'<%= pkg.output %>/content/scripts/{,*/}*.js',
					'<%= pkg.output %>/content/styles/{,*/}*.css',
					'<%= pkg.output %>/content/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
					'<%= pkg.output %>/content/fonts/*',
					'<%= pkg.output %>/content/json/*',
					'<%= pkg.output %>/app/**/{,*/}*.html'
				]
			}
		},

		// Reads HTML for usemin blocks to enable smart builds that automatically
		// concat, minify and revision files. Creates configurations in memory so
		// additional tasks can operate on them
		useminPrepare: {
			html: '<%= pkg.src %>/index.html',
			options: {
				staging: '<%= pkg.output %>/src',
				dest: '<%= pkg.output %>',
				flow: {
					html: {
						steps: {
							js: ['concat', 'uglifyjs'],
							css: ['cssmin']
						},
						post: {}
					}
				}
			}
		},

		// Performs rewrites based on filerev and the useminPrepare configuration
		usemin: {
			html: ['<%= pkg.output %>/**/*.html'],
			css: ['<%= pkg.output %>/content/styles/{,*/}*.css'],
			js: ['<%= pkg.output %>/**/scripts*.js'], // do not target vendor.js, target file name starts with "scripts."
			json: ['<%= pkg.output %>/content/json/{,*/}*.json'],
			options: {
				assetsDirs: [
					'<%= pkg.output %>',
					'<%= pkg.output %>/content/images',
					'<%= pkg.output %>/content/styles',
					'<%= pkg.output %>/content/fonts',
					'<%= pkg.output %>/content/json'
				],
				patterns: {
					html: [
						[
							/["']([^:"']+\.(?:png|gif|jpg|jpeg|webp|svg))["']/img,
							'Update HTML to reference revved images'
						],
						[
							/([^:"']+\.(?:html))/gm,
							'Update HTML to reference revved html files'
						]
					],
					js: [
						[
							/["']([^:"']+\.(?:png|gif|jpg|jpeg|webp|svg))["']/img,
							'Update JS to reference revved images'
						],
						[
							/([^:"']+\.(?:html))/gm,
							'Update JS to reference revved html files'
						],
						[
							/([^:"']+\.(?:json))/gm,
							'Update JS to reference revved json files'
						]
					],
					json: [
						[
							/["']([^:"']+\.(?:png|gif|jpg|jpeg|webp|svg))["']/img,
							'Update JSON to reference revved images'
						]
					]
				}
			}
		},

		concat: {
			options: {
				sourceMap: true
			}
		},

		uglify: {
			options: {
				sourceMap: true,
				compress: {},
				mangle: true
			}
		},

		imagemin: {
			release: {
				files: [{
					expand: true,
					cwd: '<%= pkg.src %>/gh-pages-src/content/images',
					src: '{,*/}*.{png,jpg,jpeg,gif}',
					dest: '<%= pkg.output %>/content/images'
				}]
			}
		},

		svgmin: {
			release: {
				files: [{
					expand: true,
					cwd: '<%= pkg.src %>/gh-pages-src/content/images',
					src: '{,*/}*.svg',
					dest: '<%= pkg.output %>/content/images'
				}]
			}
		},

		htmlmin: {
			release: {
				options: {
					collapseWhitespace: false,
					conservativeCollapse: true,
					collapseBooleanAttributes: true,
					removeCommentsFromCDATA: true,
					removeOptionalTags: true,
					removeComments: true
				},
				files: [{
					expand: true,
					cwd: '<%= pkg.output %>',
					src: ['*.html', '**/*.html'],
					dest: '<%= pkg.output %>'
				}]
			}
		},

		// ng-annotate tries to make the code safe for minification automatically
		// by using the Angular long form for dependency injection.
		ngAnnotate: {
			release: {
				files: [{
					expand: true,
					cwd: '.tmp/concat/scripts',
					src: ['*.js', '!oldieshim.js'],
					dest: '.tmp/concat/scripts'
				}]
			}
		},

		// replace variables in app code, matched variables should start with '@@'
		replace: {
			release: {
				options: {
					patterns: [{
						match: 'version',
						replacement: config.version
					}, {
						match: 'year',
						replacement: grunt.template.today('yyyy')
					}, {
						match: 'debug',
						replacement: 'false'
					}]
				},
				files: [{
					expand: true,
					src: [
						'<%= pkg.output %>/*.html',
						'<%= pkg.output %>/gh-pages-src/app/**/*.html',
						'<%= pkg.output %>/content/**/*.js'
					]
				}]
			}
		},

		// Copies remaining files to places other tasks can use
		copy: {
			release: {
				files: [{
					expand: true,
					dot: true,
					cwd: '<%= pkg.src %>',
					dest: '<%= pkg.output %>',
					src: [
						'*.{ico,png,txt,ini,xml}',
						'.htaccess',
						'*.html',
						'gh-pages-src/app/**/{,*/}*.html',
						'gh-pages-src/app/**/{,*/}*.json',
						'gh-pages-src/app/**/{,*/}*.csv',
						'gh-pages-src/content/images/{,*/}*.{png,jpg,jpeg,gif,webp}',
						'gh-pages-src/content/fonts/*.*',
						'gh-pages-src/content/json/*.*',
						'gh-pages-src/vendor/**/{,*/}*.png',
						'gh-pages-src/vendor/**/{,*/}*.swf'
					]
				}, {
					expand: true,
					dot: true,
					flatten: true,
					cwd: '<%= pkg.src %>/src/images',
					dest: '<%= pkg.output %>/content/styles/images',
					src: ['{,*/}*.{png,jpg,jpeg,gif,webp,cur}']
				}, {
					expand: true,
					dot: true,
					flatten: true,
					cwd: '<%= pkg.src %>/bower_components',
					dest: '<%= pkg.output %>/content/fonts',
					src: ['**/dist/fonts/*.*']
				}]
			}
		},

		// Run some tasks in parallel to speed up the build process
		concurrent: {
			server: [],
			test: [],
			release: [
				'imagemin',
				'svgmin'
			]
		},

		// Test settings
		karma: {
			unit: {
				configFile: '<%= pkg.test %>/karma.conf.js',
				singleRun: true
			}
		}
	});


	/**
	 * TASKS
	 * ------------------------------------------------------------------------------------------------------
	 */

	var configurations = {
		debug: 'debug',
		release: 'release'
	};

	grunt.registerTask('build', 'Build Project for Configuration', function(config) {

		// Argument Validation
		if (config == null || (config !== configurations.debug && config !== configurations.release)) {
			grunt.log.warn('"grunt build:config": `config` is required and must be set to `debug` or `release`.');
			return;
		}

		grunt.task.run([
			'wiredep', // inject bower packages into html
			//'ngconstant:' + tier    // create 'app.constants' module with ENV variable
		]);

		if (config === configurations.release) {
			grunt.task.run([
				'clean:release', // clear out .tmp/ and release/ folders
				'useminPrepare', // congifure usemin, targets <!-- build --> blocks in HTML
				'concurrent:release', // start concurrent dist tasks (imgmin, svgmin)
				'concat', // concatenate JS into new files in '.tmp'
				'cssmin', // concatenate and minify CSS into new 'release' files
				'uglify', // minify JS files from '.tmp' and copy to 'release'
				'copy:release', // copy all remaining files to 'release' (e.g. HTML, Fonts, .htaccess, etc.)
				'replace:release', // replace variables, e.g. '@@foo' with 'bar'
				'filerev', // rename CSS, JS and Font files with unique hashes
				'usemin', // update references in HTML with new minified, rev-ed files
				'htmlmin' // minify HTML markup,
			]);
		}

	});

	grunt.registerTask('serve', 'Compile then start and connect web server', function(config) {

		// Defaults
		config = config || configurations.debug;

		// Argument Validation
		if (config !== configurations.debug && config !== configurations.release) {
			grunt.log.warn('"grunt serve:config:tier": `config` is required and must be set to `debug` or `release`.');
			return;
		}

		var tasks = [
			'build:' + config
		];

		if (config === configurations.release) {
			grunt.task.run(tasks.concat([
				'connect:release:keepalive'
			]));
			return;
		}

		grunt.task.run(tasks.concat([
			'clean:server',
			'concurrent:server',
			'connect:debug:livereload',
			'watch'
		]));
	});

	grunt.registerTask('test', [
		'concurrent:test',
		'newer:jshint:test',
		'karma'
	]);

	grunt.registerTask('default', [
		'newer:jshint',
		'test',
		'build:debug'
	]);
};
