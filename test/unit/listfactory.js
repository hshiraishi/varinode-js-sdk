var should = require('chai').should(),
    expect = require('chai').expect,
    sinon = require('sinon'),
    chai = require('chai'),
    Q = require('q'),
    bunyan = require('bunyan'),
    chaiAsPromised = require("chai-as-promised"),
    log = bunyan.createLogger({name: 'varinode-orm-test'}),
    setup = require('mocha').setup,
    apiConfig = require('../config.js'),
    varinode = require('../../index'),

    Address = require('../../src/Address.js'),
    AddressList = require('../../src/AddressList.js'),
    AddressList = require('../../src/AddressList.js'),
    ListFactory = require('../../src/ListFactory.js'),
    Product = require('../../src/Product.js'),
    Cart = require('../../src/Cart.js');

if (apiConfig.appKey == 'your-app-key') {
    throw new Error("To run tests, you must provide valid Varinode API keys in test/config.js");
}

chai.use(chaiAsPromised);
varinode.configure(apiConfig);

var TEST_CUSTOMER_ID = "";

describe('#listfactory', function() {
    this.timeout(20000);

    var factory = new ListFactory(Address, "address", "addreses");

    it('exists', function() {
        expect(factory).to.be.an('object');
    });

    it('gets prototype', function() {
        expect(factory).to.respondTo('makeList');
    });

    it('makes a working list', function() {
        var addressList = new (factory.makeList())();

        expect(addressList).to.be.an('object');
        expect(addressList).to.respondTo('load');
        expect(addressList).to.respondTo('get');
        expect(addressList).to.respondTo('add');
    });
});
