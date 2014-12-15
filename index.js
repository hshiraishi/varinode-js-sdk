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

var VarinodeApi = require('./api.js');
var ApiCache = require('./api.cache.js');

var Varinode = {
    /**
     * Configuration object:
     * { 
     *     // required
     *     appKey: varinode-app-key,
     *     appSecret: varinode-app-secret,
     *     appPrivateSecret: varinode-app-private-secret
     *     // optional
     *     debug: 1
     *  }
     *
     *  If debug is turned on, uses bunyan to log info+ to console and trace+ to /tmp/varinode.out. 
     *  See log.js
     */
    configure : function (config) {
        VarinodeApi.configure(config);
    },
    /**
     * API docs: http://www.varinode.com/api_doc
     *
     * Calls take the form 
     *   Varinode.api("section.method", {parameter1: ..., parameter2: ..., ..., parameterN: ...});
     *
     * For example,
     *   Varinode.api('products.getFromURLs', {
     *      product_urls: [
     *          'http://bananarepublic.gap.com/browse/product.do?cid=66299&vid=1&pid=423451022',
     *          'http://shop.nordstrom.com/s/halogen-stretch-woven-a-line-skirt-regular-petite/3627603'
     *      ]
     *   }); 
     *
     * The original PHP SDK is synchronous. To keep the same call structure in this Node module, we return
     * promises (using Q) for every call.
     *
     * Example:
     *      Varinode.api('products.getFromURLs', {product_urls: ['http://example.com']})
     *      .then(function(data) {
     *          // do something with returned data
     *      }).fail(function(error) {
     *          // handle a failed request
     *      });
     */
    api : function () {
        if (VarinodeApi.isConfigured()) {
            return VarinodeApi.api.apply(this, arguments);
        } else {
            throw new Error("Varinode API called, but has not been configured.");
        }
    },

    isConfigured : function () {
        return VarinodeApi.isConfigured();
    }
};

Varinode.ApiCache = ApiCache;

module.exports = Varinode;
