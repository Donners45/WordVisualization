module.exports = function(grunt) {
	
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		compass: {
			dev: {
				options: {
					sassDir: 'app/assets/styles',
					cssDir: '.tmp/assets/styles',
					imagesDir: "app/assets/images/",
					generatedImagesDir: "app/assets/images/",
					generatedImagesPath: "app/assets/images/",
					httpGeneratedImagesPath: "../images/",
					sourcemap: true,
					outputStyle: 'nested',
					noLineComments: true
				}
			},
			dist: {
				options: {
					sassDir: 'app/assets/styles',
					cssDir: 'dist/assets/styles',
					imagesDir: "app/assets/images/",
					generatedImagesDir: "app/assets/images/",
					generatedImagesPath: "app/assets/images/",
					httpGeneratedImagesPath: "../images/",
					sourcemap: false,
					outputStyle: 'compressed',
					noLineComments: true
				}
			}
		},

		watch: {
			scss: {
				files: ['app/**/*.scss'],
				tasks: ['compass:dev'],
				options: {
					livereload: true,
				},
			},
			css: {
				files: ['app/**/*.css'],
				tasks: ['copy:dev'],
				options: {
					livereload: true,
				},
			},
			html: {
				files: ['app/**/*.html'],
				tasks: ['copy:dev'],
				options: {
					livereload: true,
				},
			},
			img: {
				files: ['app/**/*.{png,jpg,gif,svg}'],
				tasks: ['imagemin:dev'],
				options: {
					livereload: true,
				},
			},
			js: {
				files: ['app/**/*.js'],
				tasks: ['copy:dev'],
				options: {
					livereload: true,
				},
			},
			json: {
				files: ['app/**/*.json'],
				tasks: ['copy:dev'],
				options: {
					livereload: true,
				},
			}
		},

		connect: {
			dist: {
				options: {
					port: 9000,
					base: '.tmp'
				}
			}
		},

		copy: {
			dev: {
				files: [
					{
						expand: true,
						cwd: 'app/',
						src: ['**/*.html'],
						dest: '.tmp/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['**/*.css'],
						dest: '.tmp/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['**/*.js'],
						dest: '.tmp/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['**/*.json'],
						dest: '.tmp/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['assets/fonts/**/*.*'],
						dest: '.tmp/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['**/*.svg'],
						dest: '.tmp/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['assets/videos/*.*'],
						dest: '.tmp/'
					}
				]
			},
			dist: {
				files: [
					{
						expand: true,
						cwd: 'app/',
						src: ['**/*.html'],
						dest: 'dist/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['**/*.css'],
						dest: 'dist/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['**/thirdparty/*.js'],
						dest: 'dist/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['assets/fonts/**/*.*'],
						dest: 'dist/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['**/*.svg'],
						dest: 'dist/'
					},
					{
						expand: true,
						cwd: 'app/',
						src: ['assets/videos/*.*'],
						dest: 'dist/'
					}
				]
			}
		},

		imagemin: {
			dev: {
				files: [{
					expand: true,
					cwd: 'app/',
					src: ['**/*.{png,jpg,gif}'],
					dest: '.tmp/' 
				}]
			},
			dist: {
				files: [{
					expand: true,
					cwd: 'app/',
					src: ['**/*.{png,jpg,gif}', '!**/icons/**'],
					dest: 'dist/' 
				}]
			}
		},

		clean: {
			dev: [".tmp"],
			dist: ["dist"]
		},

		processhtml: {
			dist: {
				files: {
					'dist/index.html': ['app/index.html'],
					'dist/graph.html': ['app/graph.html']
				}
			}
		},

		uglify: {
			my_target: {
				files: {
					'dist/assets/scripts/scripts.min.js': ['app/**/*.js', '!**/thirdparty/**']
				}
			}
		},

		csscomb: {
			dist: {
				files: {
					'dist/assets/styles/main.css': ['dist/assets/styles/main.css'],
				},
			}
		},

		// uncss: {
		// 	dist: {
		// 		options: {
		// 			stylesheets: ['assets/styles/main.css']
		// 		},
		// 		files: {
		// 			'dist/assets/styles/main.css': ['dist/index.html']
		// 		}
		// 	}
		// },

		'ftp-deploy': {
			build: {
				auth: {
					host: 'ftp.bleepyevans.com',
					port: 21,
					authKey: 'key1'
				},
				src: 'dist/',
				dest: '/public_html/wordvisualization_basic'
			}
		}

	});
	
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-imagemin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-processhtml');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-ftp-deploy');
	grunt.loadNpmTasks('grunt-csscomb');
	// grunt.loadNpmTasks('grunt-uncss');

	grunt.registerTask('server', [
		'clean:dev',
		'compass:dev',
		'copy:dev',
		'imagemin:dev',
		'connect',
		'watch',
	]);

	grunt.registerTask('deploy', [
		'clean:dist',
		'compass:dist',
		'copy:dist',
		'imagemin:dist',
		'processhtml',
		'uglify',
		// 'uncss'
	]);

	grunt.registerTask('ftp', [
		'deploy',
		'ftp-deploy'
	]);

};