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
    fake = require('../fake-customer-data.js'),
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

var TEST_ADDRESS_ID = "";
var TEST_ADDRESS = {address: fake.address};

var a;

describe('#address', function() {
    this.timeout(20000);

    setup(function(){
        a = new Address(TEST_ADDRESS);
    });
    it('exists', function() {
        expect(Address).to.be.a('function');
    });

    it('gets prototype', function() {
        expect(a).to.be.an('object');
        expect(a).to.respondTo('save');
        expect(a).to.respondTo('get');
        expect(a).to.respondTo('remove');
    });

    var id;
    it('is saveable', function(done) {
        a.save().then(function(address) {
            TEST_ADDRESS_ID = id = address.address_id;
        }).should.eventually.not.equal(null).notify(done);
    });
    it('is gettable', function(done) {
        a.get(TEST_ADDRESS_ID).then(function() {
            expect(a.getId()).to.equal(TEST_ADDRESS_ID);
            done();
        }).done();
    });
    it('is saveable and removable', function(done) {
        a.save()
        .then(a.remove)
        .then(function(response) {
            expect(response.address_id).to.be.a('string');
            expect(response.address_status).to.equal('deleted');
            done();
        }).done();
    });
});
