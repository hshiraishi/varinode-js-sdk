/**
 * Instantiates bunyan logger with some standard configuration for internal use.
 * Generally suppressed in production usage.
 *
 * @copyright 2014
 * @license Apache-2.0
 * @requires bunyan 
 */

var bunyan = require('bunyan');

var log = bunyan.createLogger({
    name: 'varinode-api',
    streams: [
            /*{
                level: 'info',
                stream: process.stdout
            },*/
            {
                level: 'trace',
                path: '/tmp/varinode.out'
            }
    ]
});

log.level(bunyan.OFF);
module.exports = log;
