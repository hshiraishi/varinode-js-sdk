/**
 * @copyright 2014
 * @license Apache-2.0
 */

var extend = require('extend'); 
var Varinode = require('./api.js'); 

/**
 * @classdesc Simple wrapper of Varinode addresses. 
 *
 * <pre><code>Input format:
 * {
 *      'customer_id' : 'varinode-customer-id', // optional, to link existing customer
 *      'first_name' : 'Michelle',
 *      'last_name' : 'Phan',
 *      'address_line1' : '98 Fake Street',
 *      'address_line2' : 'Unit 77',
 *      'city' : 'San Francisco',
 *      'state' : 'CA',
 *      'country_code' : 'US',
 *      'zip_postal_code' : '94014',
 *      'phone' : '4158889999'
 * }
 * </code></pre>
 *
 * @class
 * @see http://varinode.com/api_doc?account=loverly#addresses_add
 */
function Address(config) {
    if (!config) return;

    this.configure(config);
}

Address.prototype.configure = function (config) {
    extend(true, this, config.address ? config.address : config);
};

function updateAddressOnSuccess (response) {
    if (response.status && response.status == "complete") {
        this.configure(response.address);
    }
    // todo: consider throwing error instead
    return response.address;
}

/**
 * Persists Address to Varinode database.
 *
 * @param {bool} [isDefault=false] True iff. this should be the new default address for the associated Customer.
 * @memberof Address
 */
Address.prototype.save = function(isDefault) {
    var params = {
        'address_is_default' : !!isDefault || this.address_is_default,
        'address' : this
    };
    if (this.customer_id) {
        params.address_customer_id = this.customer_id;
    }

    return Varinode.api("addresses.add", params);
};

/**
 * Returns Varinode ID for this Address, if it has one (i.e., if it was loaded from or saved to the DB).
 *
 * @memberof Address
 * @returns {string}
 */
Address.prototype.getId = function() {
    return this.address_id;
};

/**
 * Loads given Address ID into this object. ID will be loaded from this.address_id if not provided directly.
 *
 * @param {string} [id=address_id] ID of Varinode address to merge into this object.
 * @memberof Address
 * @throws error if no ID provided
 */
Address.prototype.load = function(id) {
    var self = this;
    id = id || self.address_id;
    if (id) {
        return Varinode.api("addresses.get", {
            'address_id': id
        }).then(updateAddressOnSuccess.bind(self));

    }

    this.throwIdError();
};
Address.prototype.get = Address.prototype.load; // rename for compatibility until we kill, 

/**
 * Given a ZIP code (or with a ZIP code stored on this Address instance), calls the Varinode API
 * and updates this Address with the City and State provided. (Thus, if you have a ZIP code, there's 
 * no need to have city and state added.)
 *
 * @returns Promise containing the updated Address instance
 * @param {string} [zip=zip_postal_code] ZIP code to look up; defaults to object's stored ZIP code
 * @memberof Address
 */
Address.prototype.cityStateLookup = function(zip) {
    var self = this;
    return Varinode.api("addresses.cityStateLookup", {
        address: { zip_postal_code: (zip || self.zip_postal_code) }
    }).then(updateAddressOnSuccess.bind(self));
};

/**
 * Verifies this address object, by conforming it to the USPS standard.
 *
 * @memberof Address
 * @returns Address
 */
Address.prototype.verify = function(doNotReformat) {
    var self = this;
    return Varinode.api("addresses.verify", {address: this}).then(function(response) {
        // reformat address to USPS style by default
        if (!doNotReformat && response.status && response.status == "complete") {
            configure(response.address);
            return self;
        }
        return response.address;
    });
};

Address.prototype.throwIdError = function (id) {
    throw new Error("No id provided or stored (p="+id+",s="+this.address_id+")");
};

/**
 * Removes this instance (or the given address ID) from the Varinode DB.
 *
 * @param {string} [id=this.address_id] ID of the address to delete.
 * @memberof Address
 */
Address.prototype.remove = function(id) {
    if (typeof id == 'object') {
        // chaining together calls--this is probably an Address, or a wrapped Address from a return
        id = (id.address||{}).address_id || id.address_id || id;
    }

    id = id || this.address_id;
    if (id) {
        return Varinode.api("addresses.remove", {
            'address_id': id
        }).then(function(response) {
            if (!response || response.status != 'complete') {
                throw new Error("Error removing address (" + id +"): " + ((response||{}).status_message || "no reason given"));
            }
            return response.address;
        });
    }
    throwIdError();
};

module.exports = Address;
