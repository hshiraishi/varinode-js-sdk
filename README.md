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


Release notes
-----
 - 0.0.0 - initial commit
