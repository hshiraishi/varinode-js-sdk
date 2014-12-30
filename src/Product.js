/**
 * @copyright 2014
 * @license Apache-2.0
 */

var extend = require('extend'); 
var log = require('./Log.js');
var Varinode = require('./api.js');
var Q = require('q');
var Cart = require('./Cart.js');
var Site = require('./Site.js');
var api = Varinode.api;

var collector = {};
var urlCollector = {};

/**
 * @classdesc
 * Varinode Product object.
 *
 * @class
 */
function Product(config) {
    this.selections = {};
    this.data = {};
    this._loaded = Q.defer();

    if (config) this.config(config);
    if (this.data.__fetch && this.data.url) {
        this.fetch();
    }
}

/**
 * @memberof Product
 */
Product.prototype.getData = function() {
    var rv = {};
    for (var k in this.data) {
        if (this.data.hasOwnProperty(k)) rv[k] = this.data[k];
    }
    rv.selections = this.selections;
    return rv;
};

/**
 * @memberof Product
 */
Product.prototype.getSelections = function() {
    return this.selections;
};

/**
 * @memberof Product
 */
Product.prototype.getCartWrapper = function() {
    var products = {};
    var site_id = this.data.site_info.site_id;
    products[site_id] = products[site_id] || {products: {}};
    products[site_id].products[this.data.product_id] = this.serialize();
    return products;
};

/**
 * @memberof Product
 */
Product.prototype.serialize = function() {
    return this.selections || {};
};

/**
 * @memberof Product
 */
Product.prototype.getCartHash = function() {
    return (this.data||{}).site_info ? {site_id: this.data.site_info.site_id, product_id: this.data.product_id, product: this.serialize()} : null;
};

/**
 * @memberof Product
 */
Product.prototype.getUrl = function() {
    return this.data.url;
};

/**
 * @memberof Product
 */
Product.prototype.isLoaded = function() {
    return this._loaded.promise;
};

/**
 * @memberof Product
 */
Product.prototype.whenLoaded = function(onresolved, onrejected) {
    return this._loaded.promise.then(onresolved, onrejected);
};

/**
 * @memberof Product
 */
function rejectAndLog(promise, error) {
    promise.reject(error);
    log.error(error);
}

/**
 * @memberof Product
 */
Product.prototype.fetch = Product.prototype.getFromURL = function (url) {
    var self = this;

    if (this._fetched) return this._fetched;
    this.data.url = url = url || this.data.url;

    this._fetched = api("products.getFromURLs", {
        product_urls: [url]
    }).then(function (result) {
        if (result.status == 'errors' || result.status == 'complete_with_errors') {
            rejectAndLog(self._loaded, "Product information not loaded successfully. u="+url);
            return result;
        } else if (result.unsupported_urls.indexOf(url) > -1) {
            rejectAndLog(self._loaded, "Product URL not supported. u="+url);
            return result;
        } else {
            result = self.handleProductFetch(result);
            self._loaded.resolve(result);
            return (((result.processed_sites||[])[0] || {}).products||[])[0];
        }
        //self._loaded = Q.defer(); 
        return result;
    });
    //.fail(api.errorHandler);

    return this._fetched;
};

/**
 * @memberof Product
 */
Product.prototype.getAttributes = function () {
    if (!this._loaded.promise.isPending()) return this.data.required_attributes;

    var self = this;
    return (self.fetch()).then(function() {
        return self.data.required_attributes;
    });
};

/**
 * @memberof Product
 */
Product.prototype.select = function (keyValuePairs) {
    var self = this;
    var dependencies = null;
    var changes = null;
    Object.keys(keyValuePairs).forEach(function(name, i) {
        var value = keyValuePairs[name];
        if (self.data.required_attributes[name]) {
            // fixme
            if (!!self.data.required_attributes[name].values[value]) self.selections[name] = value;
            else throw new Error("Tried to select illegal attribute [" + name + ": " + value + "]");
        } else {
            self.selections[name] = value;
        }
        if (self.data.attribute_dependencies[name]) {
            dependencies = dependencies || {};
            dependencies[name] = self.data.attribute_dependencies[name];

            /* what an attribute dependency block looks like:
             *
                        "attribute_dependencies": {
                            "color": {
                                "1018": {
                                    "size": {
                                        "1545": {
                                            "price": "16.5",
             */

            // TODO -- consider Attributes object
            // TODO -- need to do a reverse lookup (this attribute may be depended on, but
            // the varinode API doesn't include bidirectional dependencies; thus, we need
            // to look through every attribute's dependencies to see if we find this one)
            //
            // if this attribute has dependencies, and if this attribute VALUE has dependencies...
            if (dependencies[name] && dependencies[name][value]) {
                // iterate over the dependent attributes for that attribute-value combination
                Object.keys(dependencies[name][value]).forEach(function(dependentAttribute) {
                    if (keyValuePairs[dependentAttribute] || self.selections[dependentAttribute]) {
                        var collection = keyValuePairs[dependentAttribute] ? keyValuePairs : self.selections;

                        // if we're trying to set one of the dependent attributes,
                        // or we've already set it,
                        // find out its value
                        var dependentAttributeValue = collection[dependentAttribute];

                        // if the dependent attribute's intendended value isn't valid, 
                        // we have to change it and report an error back
                        if (!(dependencies[name][value][dependentAttribute][dependentAttributeValue])) {
                            // arbitrarily take the first one
                            self.selections[dependentAttribute] = collection[dependentAttribute] = Object.keys(dependencies[name][value][dependentAttribute])[0]; 
                            changes[dependentAttribute] = self.selections[dependentAttribute];
                        }
                    } 
                });
            } 
        }
    });

    return {dependencies: dependencies,
            changes: changes};
};

/**
 * @memberof Product
 */
Product.prototype.fillDefaults = function() {
    var attr = this.data.required_attributes;
    for (var k in attr) {
        if (attr.hasOwnProperty(k)) {
            var attribute = attr[k];
            if (attribute.default_value) this.selections[k] = attribute.default_value;
        }
    }
};

/**
 * @memberof Product
 */
Product.prototype.removeFromCart = function(id) {
    id = id || this.cart_id;

    var request = {cart_id: id, sites: {}};
    var site_id = this.data.site_info.site_id;
    var product_id = this.data.product_id;
    request.sites[site_id] = {};
    request.sites[site_id][product_id] = 1;
    return api("products.removeFromCart", request).then(function(response) {
        log.debug('removed product ('+site_id+':'+product_id+') from cart', response);
    });
};

/**
 * @memberof Product
 */
Product.prototype.addToCart = function(cart) {
    var id = cart || this.cart_id;
    var self = this;
    var request;

    if (cart instanceof Cart) {
        id = cart.cart_id;
    }
    if (!id) return;

    request = { 
        sites: self.getCartWrapper(),
        cart_id: id
    };

    log.debug('product.addToCart',this.data.url);

    return api("products.addToCart", request)
    .then(function(result) {
        log.debug('added to cart', result);
        if (result.cart_id) {
            self.data.cart_id = self.cart_id = result.cart_id;
        }
        return result;
    }).fail(api.errorHandler);
};

/**
 * @memberof Product
 */
Product.prototype.disable = function(message) {
    this.data.__disabled = message || true;
};

/**
 * @memberof Product
 */
Product.prototype.isSupported = function() {
    return !(this.data.__disabled);
};

/**
 * @memberof Product
 */
Product.prototype.getSiteInfo = function() {
    return this.data.site_info;
};

/**
 * @memberof Product
 */
Product.prototype.setSiteInfo = function(site_info) {
    this.data.site_info = site_info;

    return this;
};

/**
 * @memberof Product
 */
Product.prototype.setProductInfo = function(product) {
    extend(true, this.data, product);
    this.data.title = this.data.product_title;
    this.data.description = this.data.product_description;
    this.data.price = this.data.product_price;
    if (!this.data.url) this.data.url = this.data.product_url;

    return this;
};

Product.prototype.handleProductFetch = function(response) {
    // TODO: fill required attributes
    var processed_sites = response.processed_sites,
        unsupported_urls = response.unsupported_urls;

    // disable all products with unsupported urls
    this.disableIfFoundByUrl(unsupported_urls);
    this.handleProcessedSites(processed_sites);

    log.debug('product fetched', this.data.url);
    return response;
};

Product.prototype.disableIfFoundByUrl = function(search, /* optional, for objects; todo: make this method take one definition object */ searchKey, searchMessage) {
    if (!search) return;

    for (var i = 0; i < search.length; i++) {
        if ((searchKey && this.data.url == search[i][searchKey]) || this.data.url == search[i]) {
            this.disable(searchMessage ? search[i][searchMessage] : null);
            return true;
        }
    }
};

Product.prototype.handleProcessedSites = function(metadata) {
    var found, site_products, self = this;
                
    found = metadata.some(function(site, i) {
        site_products = site.products;
        if (!site_products) {
            //log.error('no site_products: ', self.data.url);
            return;
        }
        //log.info('found site_products: ', self.data.url);

        // disable all products whose lookup failed
        // todo: add retry indicator
        self.disableIfFoundByUrl(site.urls_failed, 'id', 'msg');

        return site_products.some(function(product, i) {
            if (product.product_url == self.data.url) {
                self.setProductInfo(product);
                self.setSiteInfo(site.site_info);

                // accumulate product info
                collector.site_id = collector.site_id || {};
                urlCollector[self.data.url] = collector.site_id[product.product_id] = product;

                // accumulate site info
                Site.recordSite(site.site_info);

                //log.debug('found product', JSON.stringify(self.getCartHash()));
                return true;
            }
        });
    });

    //log.debug('product search=', found);
    if (!found) return;

    var color;
    if (this.data.required_attributes) {
        color = this.data.required_attributes.color;

        // default all attributes
        for (var name in this.data.required_attributes) {
            this.selections[name] = this.data.required_attributes[name].default_value;
        }

        this.data.colors = color;
    }

    this.data.images = {};
    this.data.swatches = {};

    if (color) {
        for (var k in color.values) {
            this.data.images[k] = color.values[k].images;
            this.data.swatches[k] = color.values[k].swatch_image;

            if (!this.data.image) {
                this.data.image = this.data.images[k][0];
            }
        }
    }

    return metadata;
};

/**
 * @memberof Product
 */
Product.prototype.getColors = function () {
    return this.data.colors;
};

/**
 * @memberof Product
 */
Product.prototype.getImages = function () {
    return this.data.images;
};

/**
 * @memberof Product
 */
Product.prototype.getSwatches = function() {
    return this.data.swatches;
};

/**
 * @memberof Product
 */
Product.prototype.getURL = function() {
    return this.data.url;
};

function hostname(url) {
    return url.split('//').pop().split('/').shift();

}

function prettyName(product) {
    var rv = product.data.product_title + " (" + hostname(product.data.url) + " )\n";
    rv += Array(rv.length).join("-") + "\n";
    return rv;
}

function justProductInfo(product) {
    var rv = {};
    for (var k in product) {
        if (1 || k.indexOf('product_') > -1) rv[k] = product[k];
    }
    return rv;
}

/**
 * @returns {string} A pretty representation of this object for logging.
 * @memberof Product
 */
Product.prototype.toString = function() {
    return prettyName(this) + JSON.stringify(justProductInfo(this.data), null, 1);
};

/**
 * @memberof Product
 */
Product.prototype.config = function(c) {
    if (c) {
        this.setProductInfo(c);
        this.fillDefaults();
        if (c.url) {
            // FIXME - disabled cause it is slow; only do retailer-specific affiliates,
            // to be implemented later
            //this.selections.affiliate_link = this.data.affiliate_link = c.url;
        }
        if (c.fetch !== undefined) {
            if (c.fetch) this.data.__fetch = true;
            delete c.fetch;
        }
    }
};

module.exports = Product;
