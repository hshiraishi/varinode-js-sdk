/**
 * @copyright 2014
 * @license Apache-2.0
 */

var Q = require('q');
var extend = require('extend'); 
var Varinode = require('./api.js'); 

/**
 * @classdesc
 * Card configuration:
 * <pre>
 * {
 *    payment: {
 *      "card_type":"value"
 *       "card_number":"value"
 *       "card_expiry_month":"value"
 *       "card_expiry_year":"value"
 *       "card_cvv":"value"
 *    }
 *    billing_address: {
 *      "first_name":"value"
 *       "last_name":"value"
 *       "address_line1":"value"
 *       "address_line2":"value"
 *       "city":"value"
 *       "state":"value"
 *       "country_code":"value"
 *       "zip_postal_code":"value"
 *       "phone":"value"
 *    }
 * </pre>
 *
 * Varinode card format:
 * <pre>
 * "card":{
 *   "card_id":"c46456a51aba4b1188faee194e413586",
 *   "card_customer_id":"e78b566900e3413d9434ea9382fd75a1",
 *   "card_funding":"credit",
 *   "card_type":"visa",
 *   "card_last4":"4264",
 *   "card_expiry_month":"02",
 *   "card_expiry_year":"2017",
 *   "card_fingerprint":"822f374285acad4e59d9e67f024e4f63",
 *   "card_timestamp":"2014-07-04T10:08:09+00:00",
 *   "card_status":"active"
 * }
 * </pre>
 *
 * @class
*/
function Card(config) {
    if (!config) return;

    this.configure(config);
}

function updateCardOnSuccess(response) {
    if (response && response.status == 'complete') {
        this.configure(response.card);
    }
    return response.card;
}

/**
 * Updates this object with the provided configuration.
 *
 * @param config Object POJO
 * @memberof Card#
 */
Card.prototype.configure  = function(config){
    extend(true, this, config);
};

/**
 * @returns card ID
 */
Card.prototype.getId  = function(){
    return this.card_id;
};

/**
 * Saves this instance to the Varinode DB. 
 * Customer ID not required; Cards can be floating in the DB. 
 * But why would you doom them to eternal suffering? Provide a customer ID.
 *
 * @param {boolean} [isDefault=true] Optionally make this card default for the provided customer.
 * @returns {Promise} Promise wrapping this instance.
 */
Card.prototype.save = function(isDefault) {
    var self = this;

    if (self.card_id) {
        // if we already have an ID, then this will be an update
        return self.update();
    }

    var params = {
        'card_is_default' : !!isDefault,
        'billing_address' : self.billing_address,
        'payment' : self.payment
    };
    if (self.customer_id) {
        params.card_customer_id = self.customer_id;
    }

    return Varinode.api("cards.add", params).then(function(response) {
        if (response && response.status == 'complete') {
            self.card_id = response.card_id;
            return response.card;
        }

        // TBD: error return state
        return null;
    });
};

/**
 * Get this Card (if it has a card_id, or if an ID is provided) from the Varinode DB, and merge
 * its properties into this object.
 *
 * @param {string} [id=this.id] ID of card to load into this object.
 * @returns {Promise} Promise wrapping this Card.
 * @memberof Card
 */
Card.prototype.get = function(id) {
    var self = this;

    id = id || self.id || self.card_id;
    if (id) {
        return Varinode.api("cards.get", {
            'card_id': id
        }).then(updateCardOnSuccess.bind(self));
    }

    return Q(null);
};

/**
 * Updates this Card's Varinode record with the provided fields, and, if that succeeds,
 * merges the updated fields with this instance.
 * In other words, ensures that only Varinode-validated updates affect this instance.
 *
 * @param {Object} [fields=null] POJO mapping keys to values. No keys? NOOP.
 * @memberof Card
 * @returns {Promise} Promise wrapping this Card. 
 */
Card.prototype.update = function(fields) {
    if (!fields || typeof fields != 'object' || Object.keys(fields).length === 0) return;

    var self = this;

    if (!self.card_id) return Q(null); // not possible
    return Varinode.api("cards.update", {
        card_id: self.card_id,
        billing_address: fields.billing_address || self.billing_address,
        payment: fields.payment || self.payment
    }).then(updateCardOnSuccess.bind(self));
};

/**
 * Removes this Card (or the Card given by the provided ID) from the Varinode DB.
 * @param {string} [id=this.id] ID to remove.
 * @memberof Card
 * @returns {Promise} Promise wrapping the removed card.
 */
Card.prototype.remove = function (id) {
    var self = this;
    id = id || self.card_id;
    if (id) {
        if (id.card_id) id = id.card_id;

        return Varinode.api("cards.remove", {
            'card_id': id
        }).then(function(response) {
            if (!response || response.status != 'complete') {
                throw new Error("Error removing card (" + id +"): " + ((response||{}).status_message || "no reason given"));
            }
            return response.card;
        });
    }

    // todo: appropriate return - throw error?
    return null; 
};

module.exports = Card;
