/**
 * @copyright 2014
 * @license Apache-2.0
 */

var extend = require('extend'); 
var Varinode = require('./api.js'); 
var log = require('./log.js'); 

var collector = {};

/**
 * Varinode Site information object, with details about shipping, 
 * gifting, URLs, affiliate URLs, etc.
 *
 * @TODO
 * add ShippingOption and GiftingOption objects
 *
 * @class
 */
function Site(config) {
    if (!config) return;

    this.configure(config);
    if (collector[config.site_id]) {
        (collector[config.site_id].configure||function(){})(config);
    }
}

/**
 * @memberof Site
 */
Site.getById = function (id) {
    return collector[id];
};

/**
 * @memberof Site
 */
Site.recordSite = function(site) {
    try {
    collector[site.site_id] = site instanceof Site ? site : new Site(site);
    } catch (e) {
        log.debug(e);
    }
    collector[site.site_id] = site instanceof Site ? site : new Site(site);
};

function getSiteInfoFromProductArray(products) {
    return products[Object.keys(products)[0]].getSiteInfo();
}

/**
 * @memberof Site
 */
Site.prototype.fromProductArray = function(products) {
    return new Site(getSiteInfoFromProductArray(products));
};

Site.convertArray = function (arrayOfSites) {
    for (var i = 0; i < arrayOfSites.length; i++) {
        if (!(arrayOfSites[i] instanceof Site)) arrayOfSites[i] = new Site(arrayOfSites[i]);
    }
};

/**
 * @memberof Site
 */
Site.prototype.getRequiredParameters = function() {
    return this.required_parameters;
};

/**
 * @memberof Site
 */
Site.prototype.allowsGuestCheckout = function() {
    return !!(this.required_parameters.guest_account);
};

/**
 * @memberof Site
 */
Site.prototype.getAcceptedCardTypes = function() {
    return this.site_accepted_card_types;
};

/**
 * @memberof Site
 */
Site.prototype.getId = function() {
    return this.site_id;
};

/**
 * @memberof Site
 */
Site.prototype.getName = function() {
    return this.site_name;
};

/**
 * @memberof Site
 */
Site.prototype.getUrl = function() {
    return this.site_url;
};

/**
 * @memberof Site
 */
Site.prototype.getLogo = function() {
    return this.site_logo;
};

/**
 * Shipping option format:
 * <pre>
 *  id:{
 *      "text": description,
 *      "price": price,
 *      "value": id
 *  },
 * </pre>
 * @memberof Site
 */
Site.prototype.getDefaultShippingOption = function () {
    //for full defn:
    //return this.site_shipping_options.values[this.site_shipping_options.default_value];
    return (((this.site_shipping_options||{}).values||{})[((this.site_shipping_options||{}).default_value)]||{}).value;
};

/**
 * @memberof Site
 */
Site.prototype.setShippingOption = function (shippingOption) {
    console.log('setting shipping option',shippingOption);
    if (this.site_shipping_options.values[shippingOption]) {
        this.site_shipping_option = shippingOption;
    } else {
    }
};

/**
 * @memberof Site
 */
Site.prototype.getShippingOption = function () {
    return this.site_shipping_option || this.getDefaultShippingOption();
};

/**
 * @memberof Site
 */
Site.prototype.getShippingOptions = function () {
    return this.site_shipping_options;
};

/**
 * @memberof Site
 */
Site.prototype.getPromoCodes = function () {
    return this.promo_codes;
};

/**
 * @memberof Site
 */
Site.prototype.addPromoCode = function(code) {
    this.promo_codes = this.promo_codes || [];
    this.promo_codes.push(code);
};

/**
 * @memberof Site
 */
Site.prototype.getGiftCards = function () {
    return this.gift_cards;
};

/**
 * @memberof Site
 */
Site.prototype.addGiftCard = function(card) {
    this.gift_cards = this.gift_cards || [];
    this.gift_cards.push(card);
};

/**
 * @memberof Site
 * @todo add gifting support
 */
Site.prototype.configure = function(config){
    if (!config) return;

    if (config.site_id) {
        extend(true, this, config);
    } else if (config.site_info) {
        extend(true, this, config.site_info);
    } else if (config.products) {
        extend(true, this, getSiteInfoFromProductArray(config.products));
    }

    /* todo: add support
    "site_gifting_options": {
        "default_value": "0",
        "gift_msg_max_chars": "70",
        "applies_to_entire_order": "true",
        "values": {
            "0": {
                "text": "No Gift Wrap",
                "price": "0",
                "value": "0"
            },
            "0000110120000": {
                "text": "Complimentary Gift Box",
                "price": "0",
                "value": "0000110120000"
            },
            "0000080320000": {
                "text": "Premium Gift Box (Dark Ribbon)",
                "price": "5",
                "value": "0000080320000"
            },
            "0000080120000": {
                "text": "Premium Gift Box (Blue Ribbon)",
                "price": "5",
                "value": "0000080120000"
            }
        }
    },
   */

    if (typeof this.site_shipping_options == 'object' && Object.keys(this.site_shipping_options).length) {
        this.site_shipping_options.values[this.site_shipping_options.default_value].default = 1;
    }

    if (typeof this.site_gifting_options == 'object' && Object.keys(this.site_gifting_options).length) {
        this.site_gifting_options.values[this.site_gifting_options.default_value].default = 1;
    }
};

module.exports = Site;
