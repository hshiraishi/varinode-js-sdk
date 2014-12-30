/**
 * @copyright 2014
 * @license Apache-2.0
 */

var util = require('util');
var extend = require('extend'); 
var Q = require('q'); 
Q.longStackSupport = true;
var log = require('./Log.js');
var Varinode = require('./api.js');
var Product = require('./Product.js');
var Sites = require('./Sites.js');

/**
 * @classdesc 
 * Shopping Cart for buying via the Varinode SDK. 
 * Carts are not direct jcitizens of the Varinode API. They can only be instantiated, technically, by
 * adding a product to them. Here, we elevate them to first class objects.
 *
 * @class Cart
 */
function Cart(config) {
    this._requests = [];
    this._unloadedProducts = [];

    this._loaded = null;
    this._lastRequest = null;
    this.id = null;
    this.details = null;

    this.products = {};
    this.selected_products = {};
    this.pre_order_id = null;
    this.customer = null;
    this.cart_sites = null;

    if (config.products instanceof Array) {
        initializeWithProductArray.call(this,config.products);
    }
}

// internal method for ensuring all Varinode API requests are pipelined; 
// each request blocks until the next request completes. however, since 
// they're implemented as promises in the underlying API, we can chain
// arbitrarily and not worry about it.
Cart.prototype.api = function(method, params) {
    var self = this;
    if (self._lastRequest && self._lastRequest.then) {
        self._lastRequest.then(function() {
            self._lastRequest = Varinode.api(method, params);
            self._requests.push(self._lastRequest);
            return self_lastRequest;
        });
    }
    return (self._lastRequest = Varinode.api(method, params));
};

/**
 * @returns {boolean} False if there are no pending requests on this cart (e.g., addToCart), 
 *                    True if some request is still waiting.
 * @memberof Cart
 */
Cart.prototype.isRequestPending = function() {
    if (!this._requests.length) return false;

    return Q.all(this._requests).isPending();
};


// maybe for exporting recursively to a db?
Cart.prototype.export = function () {
    var rv = {};
    for (var k in products) {
        rv[k] = products[k];
        if (rv[k] instanceof Array) {
            for (var i = 0; i < rv[k].length; i++) {
                if (typeof rv[k][i].export == 'function') rv[k][i] = rv[k][i].export();
            }
        }
    }
    return rv;
};

/**
 * @returns {string} ID of this cart -- only defined if Cart has been synched with Varinode DB.
 * @memberof Cart
 */
Cart.prototype.getId = function() {
    return this.id;
};

/**
 * Loads Cart from Varinode DB, given a cart ID as a parameter or already assigned 
 * as an instance variable.
 *
 * @param {string} [cart_id=this.id] 
 * @returns {Promise} Promise wrapping this cart
 * @memberof Cart
 */
Cart.prototype.load = function(cart_id) {
    cart_id = cart_id || self.id;
    if (!cart_id) return; // TODO error

    var self = this;

    return self.api("products.getCart", {cart_id : cart_id}).then(function(response) {
        if (response && response.status == 'complete') {
            products = {};
            var sites = response.processed_sites;
            sites.forEach(function(site, idx) {
                site.products.forEach(function(productEl, idx) {
                    var product = new Product(productEl);
                    product.select(product.product_details);
                    self.addProduct(product, site.site_info);
                });
            });
            self.details = response.cart_details;
        }

        return response;
    });
};

/** 
 * Gets the products already in this cart.
 *
 * Return format:
 * <pre>
 * {
 *    sites: {
 *          siteIdA: {
 *                 productID1: {@link Product},
 *                 productID2: {@link Product},
 *                 },
 *          ...
 *    }
 * }
 * </pre>
 *
 * @returns {Object} Products in this cart, iff. no requests are pending; otherwise, returns null
 * @memberof Cart
 */
Cart.prototype.getProducts = function() {
    if ((this._loaded&&this._loaded.promise.isPending()) || this.isRequestPending()) return;
    else {
        return {sites: this.products};
    }
};

/**
 * @returns {@link Sites} Sites object containing all the Site objects associated with the products in this cart.
 * @memberof Cart
 */
Cart.prototype.getSites = function() {
    if (this.cart_sites) this.cart_sites.update(this.getProducts() );
    return (this.cart_sites = new Sites(this.getProducts()||{}));
};

/**
 * @returns {@boolean} True iff there is there is no Varinode API request pending on this Cart.
 * @memberof Cart
 */
Cart.prototype.isReady = function () {
    return (!this.isRequestPending());
};

/**
 * Call a method after all open Cart operations complete. Primarily intended to use to queue up
 * Cart operations while waiting for a Cart to load.
 *
 * If no method is provided, will just return a Promise, so you can, for example, do things like:
 * <code>
 * Cart.whenReady().then(function() {....})
 * </code>
 *
 * @param {function} [action=null] Method to call after all open requests complete.
 * @returns {Promise} Resolved when all open requests complete.
 * @memberof Cart
 */
Cart.prototype.whenReady = function (action) {
    if (action) 
        return Q.all(this._requests).then(action);
    else 
        return Q.all(this._requests);
};

/**
 * Blocks until products load, and returns them.
 *
 * @returns {Promise} Promise wrapping Products in this cart.
 * @memberof Cart
 */
Cart.prototype.getPromisedProducts = function() {
    var self = this;
    if (!self._loaded) return Q({}); // no promised products

    return self._loaded.promise.then(function() { 
        console.log('getting promised getproducts');
        return self.products; 
    });
};

Cart.prototype.add = function (product) {
    return product.addToCart(self);
};
        
/**
 * Add a product to the cart.
 *
 * @param {Product} Product 
 * @memberof Cart
 */
Cart.prototype.addProduct = function(product, site_info) {
    if (!product) {
        log.debug('skipped null product');
        return;
    }

    var promise = product.fetch();
    var self = this;

    //log.debug('started fetch',promise.isPending());
    promise.then(function() {
        //log.debug('not waiting anymore for product',product.getUrl());
        // remove waiting
        //log.debug('cart promise done', product.getUrl());
        var wrappedProduct = product.getCartHash(); //.then(function (wrappedProduct) {
        if (!wrappedProduct) {
            log.debug("couldn't add product", product.getUrl());
            return;
        }
        log.debug("adding product",wrappedProduct);

        var site_id = wrappedProduct.site_id;
        var product_id = wrappedProduct.product_id;
        log.debug('updating id=',JSON.stringify(wrappedProduct));
        self.products[site_id] = self.products[site_id] || {products: {}};
        self.products[site_id].products[product_id] = product;

        /*
           var site_id = (site_info || product.site_info).site_id;
           products[site_id] = products[site_id] || [];
           products[site_id].push(product);
           */
        log.debug('products',self.products);
        return self.products;
    });

    self._unloadedProducts.push(promise);
};

Cart.prototype.removeBySiteId = function(site_id, idx) {
    this.products[site_id].splice(idx, 1);
};

/**
 * Removes a product from the cart by ID.
 *
 * @param {string} product_id Removes from cart (both locally and from the Varinode DB)
 * @memberof Cart
 */
Cart.prototype.removeById = function(product_id) {
    if (!product_id) return;

    var self = this;
    return Q.all([Q.all(self._requests), Q.all(self._unloadedProducts)]).then(function() {
        log.debug('removing from cart', product_id);
        var site_id;
        (function() {
            for (var site in self.products) {
                if (self.products[site].products[product_id]) {
                    site_id = site;
                    return;
                }
            }
        }());

        if (site_id) {
            log.debug('found product to remove', product_id);
            self.products[site_id].products[product_id].removeFromCart(cart_id);
        }
    });
};


/**
 * Loads a cart from the Varinode DB, and merges it into this object.
 *
 * @param {string} requestCartId Varinode cart ID 
 * @memberof Cart
 */
Cart.prototype.getCart = function(requestCartId) {
    var params = {};
    var self = this;
    if (requestCartId) params.cart_id = requestCartId;
    else if (self.id) params.cart_id = self.id;

    // get our remote cart - does not fill up this one
    return self.api("products.getCart", params)
    .then(function(result) {
        if (result.status == 'complete') {
            log.debug('getcart complete:', result);
        } else {
            log.error('getcart error:', result);
        }

        return result;
    }).then(function() {
        cart.whenReady().then(function() {
            log.debug('Cart ready');
        });
    });
};

/**
 * Saves this cart to the Varinode DB. Remote API call will bless this object with
 * a cart ID for future use.
 *
 * @memberof Cart
 * @returns {Promise} Promise wrapping underlying Varinode API response. (Should just be this cart TODO)
 */
Cart.prototype.save = function() {
    var self = this;

    return Q.all(self._unloadedProducts).then(function() {
        var conf = {sites: {}};
        var serializedProducs = {};

        for (var site in self.products) {
            for (var id in self.products[site].products) {
                conf.sites[site] = conf.sites[site] || {products: {}};
                conf.sites[site].products[id] = self.products[site].products[id].serialize();
            }
        }

        if (self.id) conf.cart_id = self.id;

        return self.api("products.addToCart", conf).then(function(result) {
            if (result.status == 'complete') {
                log.debug("products.addToCart: complete", result);
                self.id = result.cart_id;
            } else {
                log.error('products.addToCart: failure', result);
            }
            return result;
        });
    });
};

/**
 * Overloaded for now. Selects the specific product attributes to use with products in this cart
 * (e.g. color, size, ...).
 * Can take the Varinode object hash form:
 * <pre>
 * {
 *  sites:
 *          {
 *             site-key: [{
 *                  product_id: 
 *                  ...
 *             },...{}]
 *          }
 *  }
 *
 * Or the more logical array form:
 * [
 *   {
 *      site_id: 
 *      product_id:
 *      ....
 *   }
 * ]
 * </pre>
 *
 * @memberof Cart
 *
 * @TODO
 * don't store selected_products as a separate thing, except initial config
 * internal products coll should be the selected thing, by calling a method
 */
Cart.prototype.select = function(selections) {
    if (!(selections instanceof Array)) self.selected_products = selections;
    else {
        self.selected_products = {sites:{}};
        for (var i = 0; i < selections.length; i++) {
            var id = selections[i].site_id;
            delete selections[i].site_id;
            self.selected_products.sites[id] = self.products.sites[id] || [];
            self.selected_products.sites[id].push(selections[i]);
        }
    }
};

function initializeWithProductArray(config) {
    for (var i = 0; i < config.length; i++) {
        this.addProduct(config[i]);
    }
}

/** 
 * @TODO: go through product list and eliminate dead/unavailable products
 * (for abandoned carts etc)
 * @memberof Cart
 */
Cart.prototype.validate = function() {

};

module.exports = Cart;
