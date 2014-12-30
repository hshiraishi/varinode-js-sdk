/**
 * @copyright 2014
 * @license Apache-2.0
 */

var extend = require('extend'); 
var Q = require('q');
var CardList = require('./CardList.js'); 
var AddressList = require('./AddressList.js'); 
var Varinode = require('./api.js');
var VarinodeApiCache = Varinode.ApiCache;


/**
 * @classdesc
 * Varinode keys:
 * <pre>
 * customer_email
 * customer_phone
 * customer_description
 * customer_default_card_id
 * customer_status
 * </pre>
 * @class Customer
 */
function Customer(config) {
    var self = this;
    this.data = new VarinodeApiCache();
    this.cards = null;
    this.addresses = null;

    this.data.addHandler('customer', function (customer) {
        // any time we receive varinode data with a 'customer' hash, 
        // we will take the provided customer_id if we don't have one already
        if (!self.data.customer_id) self.data.customer_id = customer.customer_id;
    });

    if (config) this.config(config);
}

/**
 * @returns {string} Customer's email address.
 * @memberof Customer
 */
Customer.prototype.getEmail = function() {
    return this.data.customer_email;
};

/**
 * @returns {object} Customer's data in Varinode object format.
 * @memberof Customer
 */
Customer.prototype.getData = function() {
    return this.data;
};

/**
 * Adds an {@link Address} to the Varinode DB, associated with this customer.
 *
 * @returns {Promise} Promise resolved when address is added to Varinode DB.
 * @memberof Customer
 */
Customer.prototype.addAddress = function(address, isDefault) {
    address.address_customer_id = address.customer_id = this._id();
    if (isDefault || address.address_is_default || this.addresses.length === 0) {
        address.address_is_default = true;
        this.data.default_address_id = address.address_id;
    }

    return this.addresses.add(address);
};

/**
 * Adds a {@link Cart} to the Varinode DB, associated with this customer.
 *
 * @returns {Promise} Promise resolved when card is added to Varinode DB.
 * @memberof Customer
 */
Customer.prototype.addCard = function(card, isDefault) {
    card.customer_id = card.card_customer_id || this._id();
    if (card.card_is_default || isDefault || this.cards.length === 0) {
        card.card_is_default = true;
        this.data.default_card_id = card.card_id;
    }

    return this.cards.add(card);
};

Customer.prototype.getAddresses = function () {
    return this.addresses.get();
};

Customer.prototype.getId = function() {
    return this._id();
};

Customer.prototype.getDefaultCard = function() {
    return this.data.default_card || (this.data.default_card = (this.cards.length) ? this.cards.getDefault() : null);
};

Customer.prototype.getDefaultAddress = function() {
    return this.data.default_address || (this.data.default_address = (this.addresses.length) ? this.addresses.getDefault() : null);
};

Customer.prototype.getDefaultCardId = function () {
    if (this.data.default_card_id) return this.data.default_card_id;
    else return (this.getDefaultCard()||{}).card_id;
};

Customer.prototype.getDefaultAddressId = function () {
    if (this.data.default_address_id) return this.data.default_address_id;
    else return (this.getDefaultAddress()||{}).address_id;
};

Customer.prototype.getCards = function () {
    return this.cards.get();
};

Customer.prototype.add = Customer.prototype.save = function() {
    return this.data.api("customers.add", this.data);
};

Customer.prototype._id = function() {
    return this.data.customer_id || (this.data.customer||{}).customer_id || this.data.varinode_customer_id;
};

/**
 * Loads the given Customer ID from the Varinode DB and merges it with this object. 
 *
 * @param {string} [customer_id=this.id] Varinode Customer ID 
 * @returns {Promise} Promise resolved when card is added to Varinode DB.
 * @memberof Customer
 */
Customer.prototype.get = function(customer_id) {
    var self = this;
    if (this.data.hasLoaded('customers.get')) {
        return this.data.asPromise();
    }

    if (this.cards) this.cards.load();
    if (this.addresses) this.addresses.load();

    var callData = {
        customer_id : customer_id || this._id() 
    };

    return (this.data.api("customers.get", callData)).then(
        function(customerData) {
            for (var k in customerData) {
                if (customerData.hasOwnProperty(k)) {
                    self.data[k] = customerData[k];
                }
            }
            if (self.data.customer_id) {

            }
            return self.data;
        }
    );
};

Customer.prototype.update = function(callData) {
    if (!callData) callData = this;
    else if (!callData.customer_id) callData.customer_id = this._id();

    return this.data.api("customers.update", callData);
};

Customer.prototype.whenReady = function() {

};

Customer.prototype.config = function(c, doNotLoad) {
    if (c) {
        extend(true, this.data, c);

        if (this.data.varinode_customer_id) {
            this.data.customer_id = this.data.varinode_customer_id;
        }

        this.cards = new CardList({customer_id: this._id()});
        this.addresses = new AddressList({customer_id: this._id()});

        if (!doNotLoad) {
            this.cards.load();
            this.addresses.load();
        }
    }
};

module.exports = Customer;
