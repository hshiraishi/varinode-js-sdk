/**
 * @copyright 2014
 * @license Apache-2.0
 */

// @ignore
var extend = require('extend'); 
// @ignore
var Q = require('q'); 
// @ignore
var log = require('./log.js'); 
// @ignore
var Varinode = require('./api.js'); 

/**
 * @classdesc Factory for creating Lists of Varinode objects that take list form (for now, just {@link Address}es and {@link Card}s).
 *
 * Usage: ListFactory(Class, "varinode-api-name", "plural-varinode-api-name" / optional, for irregular plurals /); 
 *
 * @Example: 
 * var AddressFactory = ListFactory(Address, "address", "addresses");
 * var AddressList = AddressFactory.makeList();
 *
 * @class
 */
function ListFactory(object, name, plural) {
    plural = plural || name +"s";

    /**
     * @memberof ListFactory
     * @returns {@link List}
     */
    this.makeList = function () {
        /**
         * @classdesc
         * List of Varinode objects. Currently only for {@link Address}es and {@link Card}s.
         *
         * @class List
         */
        function List(config) {
            var loaded = Q.defer();
            var self = this;
            var dirty;
            var waiting;
            var list = [];
            var defaultItem;
            var id = (config||{}).customer_id;

            /**
             * Load a list of Object types for the given customer.
             *
             * customer can be either a straight Varinode customer ID, or a wrapped Customer object
             * @memberof! List#
             */
            self.load = function (customer) {
                if (loaded.promise.isFulfilled()) {
                    // if our promise is fulfilled and the data isn't dirty, send back the list; 
                    // don't load again meaninglessly
                    if (!dirty) return Q(list);
                }

                var customer_id = ((customer && typeof customer.getId == 'function') ? customer.getId() : customer) || id;

                if (customer_id) {
                    list = [];
                    waiting = 1;
                    return Varinode.api(plural+".getList", {
                        customer_id: customer_id
                    }).then(function(response) {
                        log.debug('response for '+plural,response.status);
                        if (response.status && response.status=='complete') {
                            // data is now clean!
                            dirty = 0;
                            waiting = 0;
                            var items = response[plural];
                            for (var i = 0; i < items.length; i++) {
                                list.push(new object(items[i]));
                                if (i===0 || items[i][name+'_is_default']) defaultItem = list[list.length-1];
                            }

                            self.length = list.length;
                        
                            loaded.resolve(list);
                            return list;
                        }
                        return null;
                    }).fail(function(response) {
                        // no items returned
                        dirty = 0;
                        waiting = 0;
                        loaded.resolve(list);
                        return list;
                    });
                }

                // no customer id; todo: throw error here?
                return Q(undefined);
            };

            self.length = 0;

            /**
             * Gets the contents of the list, if we have a customer ID assigned.
             * Calls {@link List#load} under the hood.
             *
             * @memberof! List#
             */
            self.get = function() {
                // if we aren't already loading, call load()
                return waiting ? loaded.promise.then(function(list) { /*log.debug('dequeuing get', list);*/return list; })
                               : self.load();
            };

            /**
             * Gets default item for this list -- if no default officially stored in Varinode,
             * will return first item.
             *
             * @memberof! List#
             */
            self.getDefault = function() {
                // if we aren't already loading, call load()
                //log.debug('getDefault ' + name, JSON.stringify(defaultItem));
                return defaultItem; 
            };

            /**
             * Adds item to list (asynchronously saves to Varinode backend).
             *
             * @param element Object Will be coerced to type of list.  
             * @memberof! List#
             */
            self.add = function(element) {
                dirty = 1;
                if (!(element instanceof object)) {
                    element = new object(element);
                }

                if (list.length === 0) defaultItem = element;

                list.push(element);
                self.length++;
                return element.save();
            };

            /**
             * Remove item from List by ID.
             *
             * TODO support removing by object.
             * @memberof! List#
             */
            self.remove = function(id) {
                var found;
                // iterate through items, remove local copy and call delete
                for(var i = 0; i < list.length; i++){
                    if(list[i][name+"_id"] == id){
                        found = list.splice(i, 1);  
                        break;
                    }
                }

                if (found) {
                    dirty = 1;
                    self.length--;
                    return found.remove();
                } else return Q(null);
            };
        };

        return List;
    };

    return this;
}

module.exports = ListFactory;
