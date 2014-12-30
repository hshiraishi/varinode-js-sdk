/**
 * Copyright (c) 2014.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

/**
* Make a new API Exception with the given result.
*
* @param array result The result from the API server
*/
function VarinodeApiException(serverResult) {
    var result = serverResult;
    var code = result.error_code ? result.error_code : 0;
    var message;

    // for V8 engines only
    this.constructor.prototype.__proto__ = Error.prototype;
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;


    if (result.error_description) {
        // OAuth 2.0 Draft 10 style
        message = result.error_description;
    } else if (result.error && result.error.message) {
        // OAuth 2.0 Draft 00 style
        message = result.error.message;
    } else if (result.error_msg) {
        // Rest server style
        message = result.error_msg;
    } else if (result.err) {
        // Rest server style
        message = result.err;
    }
    else {
        message = 'Unknown Error. Check getResult(). Server response=' + JSON.stringify(serverResult, null, 4);
    }

    this.getResult = function() {
        return result;
    };

    this.getMessage = function() {
        return message;
    }

    this.getType = function() {
        if (result.err) {
            var error = result.err;
            if (typeof(error) == 'string') {
                // OAuth 2.0 Draft 10 style
                return error;
            } else if (error.type) {
                // OAuth 2.0 Draft 00 style
                return error.type;
            }
        }

        return 'Exception';
    };

    this.toString = function() {
        var str = this.getType() + ': ';
        if (code !== 0) {
            str += code + ': ';
        }
        return str + message;
    };
}

module.exports.ApiException = VarinodeApiException;
