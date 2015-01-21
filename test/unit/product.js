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

    Product = require('../../src/Product.js');

if (apiConfig.appKey == 'your-app-key') {
    throw new Error("To run tests, you must provide valid Varinode API keys in test/config.js");
}

chai.use(chaiAsPromised);
varinode.configure(apiConfig);

var p;

describe('#product', function() {
    this.timeout(20000);

    setup(function(){
        p = new Product({
            url: 'http://bananarepublic.gap.com/browse/product.do?pid=131182012'
        });
    });
    it('exists', function() {
        expect(Product).to.be.a('function');
    });

    it('gets prototype', function() {
        expect(p).to.be.an('object');
        expect(p).to.respondTo('fetch');
    });

    var id;
    it('is fetchable', function(done) {
        p.fetch().then(function() {
            var product_data = p.getData();
            expect(product_data.product_id).to.equal('7bf667f3b08c4830ab71ba8ec9845491');
            done();
        }).done();
    });
});
