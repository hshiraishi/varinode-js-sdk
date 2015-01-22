var should = require('chai').should(),
    expect = require('chai').expect,
    chai = require('chai'),
    Q = require('q'),
    bunyan = require('bunyan'),
    chaiAsPromised = require("chai-as-promised"),
    log = bunyan.createLogger({name: 'varinode-orm-test'}),
    apiConfig = require('../config.js'),
    varinode = require('../../index');

if (apiConfig.appKey == 'your-app-key') {
    throw new Error("To run tests, you must provide valid Varinode API keys in test/config.js");
}

chai.use(chaiAsPromised);
varinode.configure(apiConfig);

var cart_id;
var remove_data;

describe('#cart', function() {
    this.timeout(60000);

    it('can be added with products', function (done) {
        varinode.api('products.addToCart',
            {
                sites: {
                    "ffcc13bcf5c544059debfc43a9b7295a": {
                        "products": {
                            "c6df0ffb8b4143639848cd824a33cc2c": {
                                color: "1021",
                                size: "1528",
                                quantity: 1
                            },
                            "0d46e1e31d1c44f58a56cafb6aeef6b9": {
                                color: "1021",
                                size: "1528",
                                quantity: 1
                            }
                        }
                    },
                    "c161e124e35941fdb27bf31f78df8c8b": {
                        "products": {
                            "b29ff76010d2491bb3fa061981b364d6": {
                                color: "1018",
                                size: "1528",
                                quantity: 1
                            }
                        }
                    }
                }
            }
        ).then(function (data) {
            //expect(data["processed_sites"]).to.be.a('array');
            //expect(data["processed_sites"].length).to.equal(2);
            console.log(JSON.stringify(data,null,2));
            data["processed_sites"].forEach(function (processed_site_data, idx) {
                if (processed_site_data["site_info"]["site_id"] == "ffcc13bcf5c544059debfc43a9b7295a") {
                    expect(processed_site_data["products_added"]).to.have.members(["c6df0ffb8b4143639848cd824a33cc2c", "0d46e1e31d1c44f58a56cafb6aeef6b9"])
                }
                if (processed_site_data["site_info"]["site_id"] == "c161e124e35941fdb27bf31f78df8c8b") {
                    expect(processed_site_data["products_added"]).to.have.members(["b29ff76010d2491bb3fa061981b364d6"])
                }
            });
            // save cart_id for getting/removing products from cart
            cart_id = data["cart_id"];
            done();
        }).done();
    });

    it('can have products retrieved from it', function (done) {
        varinode.api('products.getCart', { cart_id: cart_id }
        ).then(function (data) {
            expect(data["processed_sites"]).to.be.a('array');
            expect(data["processed_sites"].length).to.equal(2);
            remove_data = {cart_id: cart_id, sites:{}}
            data["processed_sites"].forEach(function (processed_site_data, idx) {
                if (processed_site_data["site_info"]["site_id"] == "ffcc13bcf5c544059debfc43a9b7295a") {
                    expect(processed_site_data["cart_details"]["total"]).to.equal("116.50")
                }
                if (processed_site_data["site_info"]["site_id"] == "c161e124e35941fdb27bf31f78df8c8b") {
                    expect(processed_site_data["cart_details"]["total"]).to.equal("23.95")
                }
                // collect data for removing
                var site_id = processed_site_data["site_info"]["site_id"];
                remove_data["sites"][site_id] = {};
                processed_site_data["products"].forEach(function (product_data, idx) {
                    //console.log(JSON.stringify(product_data,null,2));
                    remove_data["sites"][site_id][product_data["product_remove_id"]] = 1
                });

            });
            //console.log(JSON.stringify(data, null, 2));
            //console.log(JSON.stringify(remove_data, null, 2));
            done();
        }).done();
    });

    it('can have products removed', function (done) {
        varinode.api('products.removeFromCart', remove_data
        ).then(function (data) {
            expect(data["processed_sites"]).to.be.a('array');
            expect(data["processed_sites"].length).to.equal(2);
            //console.log(JSON.stringify(data, null, 2));
            data["processed_sites"].forEach(function (processed_site_data, idx) {
                var expected = Object.keys(remove_data["sites"][processed_site_data["site_info"]["site_id"]]);
                var compareto = []
                expected.forEach(function(val,idx) {
                  compareto.push(parseInt(val,10));
                });
                  expect(processed_site_data["products_removed"]).to.have.members(compareto);
            });
            done();
        }).done();
    });

    it('can confirm that the products have been removed', function (done) {
        varinode.api('products.getCart', { cart_id: cart_id }
        ).then(function (data) {
            expect(data["processed_sites"]).to.be.a('array');
            expect(data["processed_sites"].length).to.equal(2);
            data["processed_sites"].forEach(function (processed_site_data, idx) {
                expect(processed_site_data["cart_details"]["total"]).to.equal("0.00")
            });
            //console.log(JSON.stringify(data, null, 2));
            done();
        }).done();
    });

});
