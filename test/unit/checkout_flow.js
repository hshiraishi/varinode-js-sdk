var should = require('chai').should(),
    expect = require('chai').expect,
    chai = require('chai'),
    Q = require('q'),
    bunyan = require('bunyan'),
    chaiAsPromised = require("chai-as-promised"),
    log = bunyan.createLogger({name: 'varinode-orm-test'}),
    setup = require('mocha').setup,
    apiConfig = require('../config.js'),
    varinode = require('../../index'),

    Product = require('../../src/Product.js'),
    Cart = require('../../src/Cart.js'),
    Customer = require('../../src/Customer.js'),
    Order = require('../../src/Order.js');

if (apiConfig.appKey == 'your-app-key') {
    throw new Error("To run tests, you must provide valid Varinode API keys in test/config.js");
}

chai.use(chaiAsPromised);
varinode.configure(apiConfig);

var p1, p2, myCart;

describe('#checkout_flow', function() {
    this.timeout(20000);

    setup(function(){
        p1 = new Product({
            url: 'http://bananarepublic.gap.com/browse/product.do?cid=66299&vid=1&pid=423451022'
        });
        p2 = new Product({
            url: 'http://bananarepublic.gap.com/browse/product.do?cid=1026198&vid=1&pid=288022002'
        });
    });

    it('can add to cart', function(done) {
            //p1.select({
            //    color: "1021",
            //    size: "1528"
            //});
            //p2.select({
            //    color: "1021",
            //    size: "1528"
            //});
            myCart = new Cart({products:[p1,p2]});
            //myCart = new Cart({products: [p1]});
            myCart.save().then(function(){
                console.log("my cart is ready?");
                var me = new Customer();
                me.config({customer_email: "fake@examle.com"}, true);
                var myOrder = new Order({cart: myCart});
                myOrder.setCustomerInfo(
                    {
                        customer: me,
                        shipping_address: {
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
                            'card_type': 'visa',
                            'card_number': '4242424242424242',
                            'card_expiry_month': '06',
                            'card_expiry_year': '2122',
                            'card_cvv': '321'
                        }
                    }
                ).then(function (data) {
                    //console.log("myOrder setCustomerInfo result: " + JSON.stringify(data, null, 2));
                    console.log("pre_order_id: "+data.pre_order_id);
                    done();
                });
            });
    });

});
