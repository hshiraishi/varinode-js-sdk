varinode-js-sdk
===============

JavaScript port of the Varinode PHP SDK. Following the standard SDK, the API library is a singleton object, statically configured with your application keys.

The original PHP SDK is synchronous. To keep the same call structure in this Node module, we return promises (using Q) for every call.

Usage
-----

Load and configure the library 



	var Varinode = require("varinode-js-sdk");
	
	Varinode.configure({
    	appKey: varinode-app-key,
        appSecret: varinode-app-secret,
    	appPrivateSecret: varinode-app-private-secret
    };
    
Now you're free to make API calls. Calls take the form `Varinode.api("section.method", {parameter1: ..., ..., parameterN: ...});` (See [http://www.varinode.com/api_doc](http://www.varinode.com/api_doc) for reference.)
     
Example:

	Varinode.api('products.getFromURLs', {
    	product_urls: [
     		'http://bananarepublic.gap.com/browse/product.do?cid=66299&vid=1&pid=423451022',
            'http://shop.nordstrom.com/s/halogen-stretch-woven-a-line-skirt-regular-petite/3627603'
        ]
    });
     
Each API call returns a promise instead of requiring a callback.

Example:

      Varinode.api('products.getFromURLs', {
         product_urls: ['http://example.com']
      })
      .then(function(data) {
         // do something with returned product data
      })
      .fail(function(error) {
         // handle a failed request
      });
     

Logging
-------
For debugging, we integrate the excellent Bunyan logger, which outputs to a file (/tmp/varinode.out). Turned off by default. To activate, add `debug: true` to your configuration object.


Object model
============

The API described above is great for batch processing, but if you want to work with customer orders in real time, we've packaged up a bunch of helpful abstraction objects.

N.B.
----
As above, we use [Q's Promise/A+ implementation](https://github.com/kriskowal/q) under the hood; if you hail from node callback land, you can use [Q.nodeify()](https://github.com/kriskowal/q/wiki/API-Reference#promisenodeifycallback) to convert any promise to a node-style `function(error,success)` callback.

Usage
-----

### 1. Load and configure the library

    var Varinode = require("varinode-js-sdk");

    Varinode.configure({
        appKey: varinode-app-key,
        appSecret: varinode-app-secret,
        appPrivateSecret: varinode-app-private-secret
    };


### 2. Instantiate helper objects

	var VarinodeProduct = varinode.Product,
    	VarinodeCustomer = varinode.Customer,
    	VarinodeOrder = varinode.Order,
    	VarinodeCart = varinode.Cart;

### 3. Load a product

	var product1 = new VarinodeProduct({
    	url: 'http://bananarepublic.gap.com/browse/product.do?pid=131182012'
	});

At this point, it's just an object -- Product doesn't load from the Varinode DB by default, since ideally you already have the product information loaded and persisted.

We can manually force it to start loading like so:
`product1.fetch()`;

If we want to do anything with the fetched data, we can use the returned Promise:

	// Sequential fetch() calls don't cause multiple loads; product will 
	// only load once under normal operation 
	product1.fetch().then(function(productData) {
    	log.info('Loaded product #1 information');
    	log.info(product1.toString());
	});
	
We can also ask a product to immediately start loading in the background
	
	var product2 = new VarinodeProduct({
    	url: 'http://shop.nordstrom.com/s/thorlo-experia-running-socks-men/3649547',
    	fetch: true /* immediately kicks off Varinode load */
	});

Syntactic sugar helps queue up methods to call after product load.

	product2.whenLoaded(function() {
    	log.info('Loaded product #2 information');
    	log.info(product2.toString());
	});

Since Promises undergird us, we can use Q's static helpers to do things like queue up a call to take place only after all the product loading promises are fulfilled.

	Q.all([product1.isLoaded(), product2.isLoaded()]).done(function() {
	    log.info('Product #1 and #2 are loaded');
	    var product1Attributes = product1.getAttributes();
    	var product2Attributes = product2.getAttributes();
	    log.info('Product #1 attributes', JSON.stringify(product1Attributes));
	    log.info('Product #2 attributes', JSON.stringify(product2Attributes));
	});
	
### 4. Select product attributes (e.g., size, color...)

To select attributes of a product, just pass in the indicated key and value from the `product.getAttributes()` call:

    	product1.select({color: 1018});
   		product2.select({color: 163172});
   		
If you want to order an identical product multiple times, just pass `quantity`:

		// I love socks
    	product1.select({quantity: 100});

We can also use Q's magic nodeify method to convert any promises to the lovely `function(error, success)` signature.

	Q.all([product1.isLoaded(), product2.isLoaded()]).nodeify(function(err, succ) {
    	if (err) log.info('XXXXX FATALITY XXXXX');
    	else log.info('***** PERFECT *****');
	});
	
Sometimes products won't be supported by Varinode:
	
    var sadProduct = new VarinodeProduct({
        url: 'http://www.zara.com/us/en/man/accessories/underwear-and-socks-c284004.html#product=2516066&viewMode=two',
        fetch: true
    });

	function onSuccess() { 
    	log.info('This will never happen.');
    }
    
    function onFailure(reason) {
    	log.info('My favorite underwear are unavailable!', reason);
    }
    
    sadProduct.whenLoaded(onSuccess,onFailure);
    // logs: "My favorite underwear are unavailable!"
    
### 5. Make and save a cart
    
    var myCart = new VarinodeCart({
        products: [product1, product2]
    });

To persist to Varinode's database:

	myCart.save(); 

### 6. Start a new order 

Carts aren't directly submitted; they can be saved to the database, updated and modified, but they're associated with Orders for actual processing. An order contains the cart's customer ID, billing and shipping information, etc.

	var order = new VarinodeOrder({cart: myCart});

    order.setCustomerInfo({
    	// you can also just pass a VarinodeCustomer object
        billing_address: {
      	  'first_name': 'Karen',
     	   'last_name': 'Holmes',
     	   'address_line1': '297 Woodland Lane',
     	   'address_line2': '',
     	   'city': 'Portland',
     	   'state': 'OR',
     	   'country_code': 'US',
       	   'zip_postal_code': '51294',
       	   'phone': '3475558585'
    	},
        payment: {
        	'card_type' : 'visa',
	        'card_number' : '4242424242424242',
    	    'card_expiry_month' : '06',
	        'card_expiry_year' : '2122',
    	    'card_cvv' : '321'
    	 }
    });
    
### 7. Submit it for processing


     order.submit(); 
     
Congratulations! You just bought a sock.

Release notes
-----
 - 0.1.1 - initial merge of object model
 - 0.1.0 - SDK port complete
 - 0.0.0 - initial commit
