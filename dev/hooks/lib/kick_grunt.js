'use strict';

exports.exec = function (supportCommand) {
    var _supportCommand = supportCommand || [];

    var spawn = require('child_process').spawn;
    var _cmdline = (function () {
        var cmdIndex = process.env.CORDOVA_CMDLINE.lastIndexOf('cordova');
        return process.env.CORDOVA_CMDLINE.slice(cmdIndex + 'cordova '.length);
    })();

    // npm install
    function npm(callback) {
        var fs = require('fs');
        if (fs.existsSync('./node_modules')) {
            console.log('*** Skip npm install ***');
            console.log('node_module looks already exists.' + 
                        'Then skipping npm install.\n' +
                        'If you see any error that indicates missing module,\n' + 
                        'or want to run npm install again, remove node_modules dir.\n' );
            if (callback) {
                callback();
            }
            return;
        }

        console.log('*** Start npm install ***');

        var npmcmd = (process.platform === 'win32' ? 'npm.cmd' : 'npm');

        try {
            var npm = spawn(npmcmd, ['install'], { cwd: 'build', stdio: 'inherit' });
        } catch (er) {
            console.log('error: ' + er);
        }

        npm.on('error', function (err) { errorHandler(err); });
        npm.on('close', function (code) {
            if (0 === code) {
                console.log('*** End npm install ***\n');
                if (callback){ callback(); }
            } else {
                console.log('*** Faild npm install *** : error code = ' + code + '\n');
                // Returned exit code = 1(Fail)
                process.exit(1);
            }
        });
    }

    // grunt
    function grunt(callback, task) {
        console.log('*** Start grunt ***');

        var gruntcmd = (process.platform === 'win32' ? 'grunt.cmd' : 'grunt');
        var cmdTasks = parsePlatforms();
        cmdTasks.push(task);
        cmdTasks = cmdTasks.concat(parseGruntCommandLine());

        var grunt = spawn(gruntcmd, cmdTasks, { cwd: 'build', stdio: 'inherit' });

        grunt.on('error', function (err) { errorHandler(err); });
        grunt.on('close', function (code) {
            // Exit code from grunt refer to http://gruntjs.com/api/exit-codes.
            if (0 === code) {
                console.log('*** End grunt ***\n');
                if (callback){ callback(); }
            } else {
                console.log('*** Faild grunt *** : error code = ' + code + '\n');
                // Returned exit code = 1(Fail)
                process.exit(1);
            }
        });
    }

    // Error handler
    function errorHandler(err) {
        console.log('Error occurred: ' + err);
    }

    // check command line
    /** Judge the target build is for debug or release.
        * if the command line includes '--release', grunt think it as release build.
        * see '$ cordova compile --help'
        */
    function isDebug() {
        if (null != _cmdline.match(/--release/ig)) {
            return false;
        } else {
            return true;
        }
    }

    // check command line
    /** Judge the grunt task "cordova_build_(debug/release)" or "cordova_prepare:(debug/release)".
        * return the task string
        */
    function queryGruntTask() {
        var target = isDebug() ? 'debug' : 'release';

        for (var i = 0, n = _supportCommand.length; i < n; i++) {
            if (null != _cmdline.match(_supportCommand[i].regexp)) {
                return _supportCommand[i].prefix + (_supportCommand[i].no_target ? "" : target);
            }
        }
        return null;
    }

    // check command line
    /** Judge the target platforms.
        * if the command line includes platform names, call grunt cordova_register_platform:<platform>.
        * see '$ cordova compile --help'
        */
    function parsePlatforms() {
        var supportPlatforms = [
            { platform: 'android',          regexp: /android/ig         },
            { platform: 'ios',              regexp: /ios/ig             },
            { platform: 'firefoxos',        regexp: /firefoxos/ig       },
            { platform: 'windows8',         regexp: /windows8/ig        },
            { platform: 'browser',          regexp: /browser/ig         },
            { platform: 'amazon-fireos',    regexp: /amazon-fireos/ig   },
            { platform: 'blackberry10',     regexp: /blackberry10/ig    },
            { platform: 'windows',          regexp: /windows/ig         },
            { platform: 'wp8',              regexp: /wp8/ig             },
        ];

        var gruntTasks = [];

        supportPlatforms.forEach(function (checker) {
            if (null != _cmdline.match(checker.regexp)) {
                gruntTasks.push('cordova_register_platform:' + checker.platform);
            }
        });

        return gruntTasks;
    }

    // check command line
    /** Judge the grunt command line.
        * if the command line includes "--*", call set to the grunt command line.
        */
    function parseGruntCommandLine() {
        var cmdline = _cmdline.match(/--[\S]+\b/ig);

        if (null != cmdline) {
            for (var i = 0, n = cmdline.length; i < n; i++) {
                // if cmdline does not have "=", set "true" as default value.
                if (!cmdline[i].match(/=/i)) {
                    cmdline[i] += '=true';
                }
            }
        } else {
            cmdline = [];
        }

        return cmdline;
    }

    var gruntTask = queryGruntTask();

    if (gruntTask) {
        // run the command
        npm(function () {
            grunt(null, gruntTask);
        });
    }

};
