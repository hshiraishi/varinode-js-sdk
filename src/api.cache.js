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

var extend = require('extend'); 
var Varinode = require('./api.js');

function ApiCache() {
    var self = this;

    var NOT_DESTRUCTIVE = 1;
    var WAITING = 1;
    var RECEIVED = 2;

    var calls = {};
    var blocked;
    var handlers = [];

    this.addHandler = function(responseKey, method) {
        handlers.push({filter: responseKey, method: method}); 
    };

    this.api = function(call, params, notDestructive) {
        if (!notDestructive) calls[call] = WAITING;

        var apiWrapper = function () {
            return Varinode.api(call, params).then(function(response) {
                calls[call] = RECEIVED;

                if (response) {
                    for (var i = 0; i < handlers.length; i++) {
                        if (response[handlers[i].filter]) handlers[i].method(response[handlers[i].filter]);
                    }
                }
            });
        };

        //console.log('calling',call,params);

        if (blocked) blocked.then(apiWrapper);
        else blocked = apiWrapper();

        return blocked;
    };

    this.apiWithCacheCheck = function(call, params, notDestructive) {
        if (hasLoaded(call)) return Q.fcall(function() { return self; });
        else return api(call, params, notDestructive);
    };

    this.hasLoaded = function(call) {
        return calls[call] == RECEIVED;
    };

    this.isWaiting = function(call) {
        return calls[call] == WAITING;
    };

    this.asPromise = function() {
        return Q.fcall(function() { return self; });
    };
}

module.exports = ApiCache;
