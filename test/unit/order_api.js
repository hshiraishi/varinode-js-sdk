var should = require('chai').should(),
    expect = require('chai').expect,
    chai = require('chai'),
    Q = require('q'),
    bunyan = require('bunyan'),
    chaiAsPromised = require("chai-as-promised"),
    log = bunyan.createLogger({name: 'varinode-orm-test'}),
    apiConfig = require('../config.js'),

    fake = require('../fake-customer-data.js'),
    varinode = require('../../index');

if (apiConfig.appKey == 'your-app-key') {
    throw new Error("To run tests, you must provide valid Varinode API keys in test/config.js");
}

chai.use(chaiAsPromised);
varinode.configure(apiConfig);

var cart_id;

var fake_address = fake.address_example;
var fake_card = fake.payment_example;

describe('#order', function() {
    this.timeout(60000);

    it('can be placed', function (done) {
        varinode.api('products.addToCart',
            {
                "sites": {
                    "ffcc13bcf5c544059debfc43a9b7295a": {
                        "products": {
                            "c6df0ffb8b4143639848cd824a33cc2c": {
                                "color": "1021",
                                "size": "1528",
                                "quantity": 1
                            },
                            "0d46e1e31d1c44f58a56cafb6aeef6b9": {
                                "color": "1021",
                                "size": "1528",
                                "quantity": 1
                            }
                        }
                    }
                }
            }
        ).then(function (data) {
            // save cart_id for getting/removing products from cart
            cart_id = data["cart_id"];
            //console.log("cart id is " + cart_id);
            //console.log("address is" + JSON.stringify(fake_address,null,2));
            // place an order
            var conf = {
                "payment": fake_card,
                "billing_address": fake_address,
                "shipping_address": fake_address,
                "cart_id": cart_id,
                "sites": {
                    "ffcc13bcf5c544059debfc43a9b7295a": {
                        "guest_account": {
                            "email": "fake@example.com"
                        }
                    }
                }
            };
            console.log(JSON.stringify(conf,null,2));
            varinode.api('orders.setInfo', conf
            ).then(function (data) {
                //console.log(JSON.stringify(data, null, 2));
                expect(data["status"]).to.equal("complete");
                done();
            }).done();
        }).done();
    });

});
