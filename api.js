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

var md5 = require('MD5'); // required for signing API requests
var Q = require('q');
var extend = require('extend'); 
var request = require('request');

var log = require('./log.js');
var VarinodeApiException = (require('./exception.js')).ApiException;

/**
 * Varinode API singleton.
 *
 * The configuration:
 * - appKey: the application Key
 * - appSecret: the application secret
 * - fileUpload: (optional) boolean indicating if file uploads are enabled
 *
 * @param array config The application configuration
 */
function VarinodeApi() {
    var VERSION = '0.0.0'; // TODO inject package.json
    var USER_AGENT = 'varinode-node-'+VERSION;
    var BASE_API_URL = 'http://apiv1.varinode.com';
    var BASE_API_ENDPOINT = '';
    var BASE_CAPI_URL = 'http://capiv1.varinode.com';
    var BASE_CAPI_ENDPOINT = '';
    var DEFAULT_FORMAT = 'json'; // TODO alternatives?
    var MAX_EXEC_TIME = 20000; // 20s api timeout
    var LOG_PERFORMANCE = 1;

    var appKey;
    var appSecret;
    var appPrivateSecret;

    var fileUploadSupport = false;
    var self = this;

    var state = {sites:{}};

    this.setAppKey = function(v) {
        appKey = v;
        return this;
    };

    this.setAppSecret = function(v) {
        appSecret = v;
        return this;
    };

    this.setAppPrivateSecret = function(v) {
        appPrivateSecret = v;
        return this;
    };

    this.getAppKey = function() { return appKey; };
    this.getAppSecret = function() { return appSecret; };
    this.getAppPrivateSecret = function() { return appPrivateSecret; };

    this.setFileUploadSupport = function (v) {
        fileUploadSupport = v;
        return this;
    };

    this.getFileUploadSupport = function() { return fileUploadSupport; };

    this.configure = function(config) {
        this
        .setAppKey(config.appKey)
        .setAppSecret(config.appSecret)
        .setAppPrivateSecret(config.appPrivateSecret);

        if (config.debug) log.level(10); 
        if (config.fileUpload !== undefined) {
            this.setFileUploadSupport(config.fileUpload);
        }
    };

    this.isConfigured = function() {
        return appKey !== undefined && appSecret !== undefined && appPrivateSecret !== undefined;
    };

    function build_query(obj, num_prefix, temp_key) {
        var output_string = [];
        Object.keys(obj).forEach(function (val) {
            var key = val;
            if (num_prefix && !isNaN(key)) (key = num_prefix + key);
            key = encodeURIComponent(key.replace(/[!'()*]/g, escape));

            // FIXME
            //if (temp_key) key = key ? (temp_key + '[' + key + ']') : key;

            if (typeof obj[val] === 'object') {
                var query = build_query(obj[val], null, key);
                output_string.push(query);
            } else {
                var value = encodeURIComponent(obj[val].replace(/[!'()*]/g, escape));
                output_string.push(key + '=' + value);
            }
        });

        return output_string.join('&');
    }

    this.getState = function() {
        return state;
    };

    function persistState (result) {
        // store static response data for later use
        // TODO encapsulate all this
        if (!result) return;

        if (result.customer) state.customer_id = result.customer.customer_id;
        if (result.card) state.card_id = result.card.card_id;
        if (result.address) state.address_id = result.address.address_id;
        if (result.cart_id) state.cart_id = result.cart_id;
        if (result.pre_order_id) state.pre_order_id = result.pre_order_id;
        if (result.processed_sites) {
            var sinfo = result.processed_sites[0].site_info;
            var sid = (sinfo||{}).site_id;
            var pid = ((result.processed_sites[0].products || [])[0] || {}).product_id;
            if (sid) state.site_id = sid;
            if (pid) state.product_id = pid;
            if (sinfo && sid) {
                state.site_info = sinfo;
                state.sites[sid] = sinfo;
            }
        }
        //log.debug('persisted', this.state);
    }

    this.getParameters = function (site) {
        var siteInfo = state.sites[site];
        if (siteInfo) return {required: siteInfo.required_parameters, optional: siteInfo.optional_parameters};
    };

    /**
     * appendParamsToUrl - Gracefully appends params to the URL.
     *
     * @param string url
     * @param array params
     *
     * @return string
     */
    function appendParamsToUrl (url, params)
    {
        var path, query_string, splitUrl;
        if (!params) {
            return url;
        }

        //log.debug('appending', params);
        if (url.indexOf('?') === -1) {
            return url + '?' + build_query(params); 
        }

        splitUrl = url.split('?');
        path = splitUrl.shift();
        query_string = splitUrl.slice(0).join('?');

        parse_str(query_string, query_array);

        // Favor params from the original URL over params
        params = array_merge(params, query_array);

        return path + '?' + build_query(params);
    }

    /**
     * Build the URL for given domain alias, path and parameters.
     *
     * @param base string The name of the domain
     * @param path string Optional path (without a leading slash)
     * @param params array Optional query parameters
     *
     * @return string The URL for the given parameters
     */
    function getRequestURL(base, path, params) {
        if (!base) base = '';
        if (!path) path = '';
        if (!params) params = {};

        var url = base + '/';
        if (path) {
            if (path[0] === '/') {
                path = path.substr(1);
            }
            url += path;
        }
        if (params) {
            url += '?' + build_query(params, null, '&');
        }

        return url;
    }

    function clean_string(input) {
        return input.trim().replace(/[^A-Za-z_0-9]/g,'');
    }

    function split_type_string(input) {
        var parts = input.split('.');
        return [clean_string(parts[0]),
            clean_string(parts[1])];
    }

    function generateSignature(sig_secret, params) {
        var s = '';

        for (var k in params) {
            if (params.hasOwnProperty(k)) {
                s += k + '=' + params[k];
            }
        }

        s += sig_secret;

        return md5(s);
    }

    /**
     * Make an API call.
     *
     * @return mixed The decoded response
     */
    this.api = function(method, params, callParams) {
        var api_base, api_endpoint, sig_secret, sig, sig_class_name, sig_method_name;
        var deferred = Q.defer();

        var base_url_params = {
            'appid': self.getAppKey(),
            'format': DEFAULT_FORMAT,
            'method': method
        };

        (function(s){
            sig_class_name = s[0];
            sig_method_name = s[1];
        })(split_type_string(method));

        if(sig_class_name == 'cards' || sig_class_name == 'customers' || sig_class_name == 'addresses') {
            sig_secret = self.getAppPrivateSecret();
            api_base = BASE_CAPI_URL;
            api_endpoint = BASE_CAPI_ENDPOINT;
        } else {
            sig_secret = self.getAppSecret();
            api_base = BASE_API_URL;
            api_endpoint = BASE_API_ENDPOINT;
        }

        sig = generateSignature(sig_secret, base_url_params);
        base_url_params.tt_sig = sig;

        url = getRequestURL(api_base,api_endpoint,base_url_params);

        if (callParams && callParams.method && callParams.method === "GET") {
            url = appendParamsToUrl(url, params);
            params = {};
        }

        var st = (new Date()).getTime();
        log.debug('api request', method, JSON.stringify(params));
        request.post(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept-Encoding': '*'
            },
            json: true, /* ? */
            form: params
        }, function(error, response, result) {
            if (!response) {
                deferred.reject(analyzeAPIException("No response"));
            }

            var rt = (new Date()).getTime();
            // Should throw `VarinodeSDKException` exception on HTTP client error.
            // Don't catch to allow it to bubble up.
            // TODO
            var responseCode = response.statusCode;
            var decodedResult = result; //JSON.parse(result);
            var headers = response.headers;

            log.debug('api response [' + response.statusCode + ']', method, response.body, response.statusCode > 200 ? response.socket._httpMessage._header : '');
            if (LOG_PERFORMANCE) log.debug('rt ' + ((rt - st)/1000) + 's');

            if (!decodedResult) {
                var out = {};
                // split result into out
                // TODO parse_str(result, out);
                log.warn('Result undecodeable', responseCode, headers);
                deferred.resolve(out);
            } else {
                if (!params.doNotPersist) {
                    persistState(decodedResult);
                }

                if (decodedResult.err) {
                    decodedResult.error_code = responseCode;
                    deferred.reject(analyzeAPIException(decodedResult));
                } else {
                    deferred.resolve(decodedResult);
                }
            }
        });

        return deferred.promise.timeout(MAX_EXEC_TIME, "Varinode API request timed out (exceeded "+MAX_EXEC_TIME+"ms)");  
    };

    /**
     * Analyzes the supplied result to see if it was thrown because the access token is no longer valid.  If that's
     * the case, then we destroy the session.
     *
     * @deprecated Possibly? TBD.
     * @param result array A record storing the error message returned by a failed API call.
     */
    function analyzeAPIException(result) {
        var e = new VarinodeApiException(result);

        switch (e.getType()) {
            // OAuth 2.0 Draft 00 style
            case 'OAuthException':
            // OAuth 2.0 Draft 10 style
            case 'invalid_token':
            // REST server errors are just Exceptions
            case 'Exception':
            message = e.getMessage();
            break;
        }

        return e;
    }

    function errorHandler(result) {
        log.error('Broken promise',result);
    }
}

var ApiSingleton = new VarinodeApi();

module.exports = ApiSingleton;
