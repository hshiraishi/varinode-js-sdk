/**
 * @copyright 2014
 * @license Apache-2.0
 */

var Q = require('q'); 
var extend = require('extend'); 
var log = require('./log.js');
var Varinode = require('./api.js');
var api = Varinode.api;
var Cart = require('./Cart.js');
var Site = require('./Site.js');
var Sites = require('./Sites.js');

/*
 * Helper method to determine the proper addresses and payment info for this order. Needed since customer 
 * may or may not have default addresses and payment information, and order may or may not explicitly provide it.
 *
 * given an order object of the form:
 * {
 *    customer: Customer,
 *
 *    shipping_address: Address, // override customer default address; required if customer has no addresses stored
 *
 *    plus one of 
 *
 *    card_id:  varinode-card-id    // override customer default card; one of these is required if no cards are on file
 *    OR
 *    payment: Card
 *    billing_address: Address
 * }
 */
function getPaymentInfo(order) {
    var rv = {};
    var customer = order.customer;

    if (!customer) return; // no customer info? no order.

    var defaultCard = customer.getDefaultCard();
    var defaultAddress = customer.getDefaultAddress();

    if (!order.card_id && !order.payment) {
       if (customer.getDefaultCardId()) rv.card_id = customer.getDefaultCardId();
       else if (defaultCard) {
           rv.billing_address = defaultCard.billing_address;
           rv.payment = defaultCard.payment;
       }
    } else {
        if (order.payment) rv.payment = order.payment;
        if (order.billing_address) rv.billing_address = order.billing_address;
        else rv.billing_address = defaultAddress;
    }

    if (order.shipping_address) {
        rv.shipping_address = order.shipping_address;
    } else if (customer.getDefaultAddressId()) {
        rv.shipping_address_id = customer.getDefaultAddressId();
    } else  
        rv.shipping_address = defaultAddress;

    return rv;
}

/**
 * @classdesc 
 * A Varinode Order requires a {@link Cart} and a {@link Customer}.
 * If there are products in the cart and payment information with the customer,
 * you can transact!
 *
 * @class
 */
function Order(config) {
    var self = this;

    if (config.cart instanceof Cart) {
        this.setCart(config.cart);
    }
}

/**
 * @memberof Order
 */
Order.prototype.setCart = function(orderCart) {
    this.cart = orderCart;
};

/**
 * @memberof Order
 */
Order.prototype.setCustomer = function(customer) {
    this.customer = customer;
};

/**
 * Sets customer information for this order. 
 * {
 *   customer: {@link Customer},
 *   shipping_address: {@link Address}, // optional
 *   billing_address: {@link Address}, // optional, if customer has address stored
 *   payment: {@link Card}, // optional, if customer has payment info stored
 * }
 *
 *
 * @param {object} order_info See above
 * @memberof Order
 * @returns {Promise} Promise wrapping this order. 
 */
Order.prototype.setCustomerInfo = function (order) {
    var self = this;
    var cart = self.cart;

    if (!cart) throw new Error("No shopping cart provided.");

    return cart.whenReady(function() {
        log.debug('cart ready', JSON.stringify(cart.getProducts(), null, 4), order);

        if (Object.keys(cart.getProducts()).length === 0) throw new Error("Shopping cart is empty.");
        if (!order) throw new Error("Order information missing.");

        if (order.customer) {
            this.customer = order.customer;
        }

        // start with payment information (shipping_address, billing_address, payment)
        var orderInfo = getPaymentInfo(order);
        orderInfo.cart_id = cart.getId();

        var sites = cart.getSites();
        
        // todo: where/when do we input site shipping, gift, promo, etc. selections?
        orderInfo.sites = sites.getRequiredParameters(customer);

        // clear the pre-order id before sending customer info again.
        self.pre_order_id = null;
        return api("orders.setInfo", orderInfo).then(function(result) {
              self.pre_order_id = result.pre_order_id;
              return self;
        });
    });
};

/**
 * Submit this order. It must either have a pre_order_id assigned, from a previous Order.setCustomerInfo call,
 * or have a Customer object attached (via Order.setCustomer).
 *
 * @TODO have this return itself, in a promise, with the results organized inside
 *
 * @returns {Promise} API response object:
 *   "pre_order_id": ...
 *   "processed_sites":[{
 *        "site_info":{
 *          "site_id":"b40016e84ed448d7b1b3f9508ee6a492",
 *          "site_name":"Banana Republic",
 *          "site_url":"bananarepublic.gap.com",
 *          "site_logo":"http://static.varinode.com/bananarepublic-png.png"
 *        },
 *        "order_id":"77d3e78d558142a9aa089f8b0861cf5f",
 *        "result":"complete",
 *        "result_message":"complete"
 *   }],
 *   "status":"complete",
 *   "unsupported_sites":[]
 *
 *
 * Calls Varinode API "orders.submit"
 *
 * @memberof Order
 */
Order.prototype.submit = function() {
    var self = this;

    // todo: nodify response
    function promisedSubmit() {
        return api("orders.submit", {
            pre_order_id: self.pre_order_id
        }).then(function(response) {
            log.info(JSON.stringify(response));
            //self.processed_sites = Site.convertArray(response.processed_sites);
            log.info('order (' + self.pre_order_id + ') status: '+response.status);

            if (response.status != 'complete') {
                var rv = {};
                for (var i = 0; i < response.processed_sites.length; i++) {
                    var site = response.processed_sites[i];
                    if (site.result != 'complete') {
                        log.error('error (' + site.site_info.site_id +'): ' + site.result_message);
                        rv[site.site_info.site_id] = {'result':site.result, 'result_message':site.result_message};
                    }
                }
                return Q.reject(rv);
            }
            
            self.pre_order_id = null;
            return response;
        });
    }

    if (self.pre_order_id) {
        return promisedSubmit();
    }

    if (this.customer) {
        // no pre_order_id, but have a customer assigned? we can re-call setInfo here.
        return self.setCustomerInfo({
            customer: self.customer
        }).then(promisedSubmit);
    }

    // no pre_order_id and no customer? error!
    throw new Error("Order needs a customer assigned before submission (Order.setCustomerInfo({customer: ...});)");
};

module.exports = Order;
