/**
 * @copyright 2014
 * @license Apache-2.0
 */

var Q = require('q'); 
var extend = require('extend'); 
var log = require('./log.js');
var Site = require('./Site.js');

/**
 * @classdesc
 * Collection of {@link Site}s, helpful for {@link Cart}s to aggregate all the 
 * sites of all the added products, and pull out their required parameters (etc)
 *
 * @class Sites
 */
function Sites(config) {
    this.update(config);
}

Sites.prototype.update = function(config) {
    for (var siteId in config.sites) {
        if (this[siteId]) {
            // we already have this site on file
            this[siteId].configure(config.sites[siteId]); // update configuration
        } else {
            var site = config.sites[siteId];
            if (!(site instanceof Site)) site = new Site(site);
            this[site.getId()] = site;
        }
    }
};

/**
 * Given a Varinode sites collection, extract all the required_parameters for accounts and,
 * if a guest account is offered, provide the customer's email address.
 *
 * Only handles guest accounts for now. Will need to collect password from users in order to support registrations.
 * @memberof Sites
 */
Sites.prototype.getRequiredParameters = function(customer) {
    var params = {},
        self = this;

    Object.keys(this).forEach(function(id) {
        var site = self[id];
        if (site.allowsGuestCheckout()) {
            params[id] = {guest_account: {email: customer.getEmail()}};
            // FIXME - find out why some varinode sites don't support this
            if (site.getShippingOption() !== site.getDefaultShippingOption())
                params[id].shipping_option = site.getShippingOption();
        } else {
            log.debug("Site (" + site.getId() + "; " + site.getUrl() + ") does not support guest checkout.");
        }
    });
    return params;
};

module.exports = Sites;
