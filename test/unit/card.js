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

    Card = require('../../src/Card.js'),
    Address = require('../../src/Address.js'),
    AddressList = require('../../src/AddressList.js'),
    CardList = require('../../src/CardList.js'),
    ListFactory = require('../../src/ListFactory.js'),
    Product = require('../../src/Product.js'),
    Cart = require('../../src/Cart.js');

if (apiConfig.appKey == 'your-app-key') {
    throw new Error("To run tests, you must provide valid Varinode API keys in test/config.js");
}

chai.use(chaiAsPromised);

var TEST_CARD_ID = "";
var TEST_BILLING_ADDRESS = fake.address;
var TEST_PAYMENT = fake.stripePayment;

var c;

describe('#card', function() {
    this.timeout(20000);

    setup(function(){
        c = new Card({
            billing_address : TEST_BILLING_ADDRESS,
            payment : TEST_PAYMENT
        });
    });
    it('exists', function() {
        expect(Card).to.be.an('function');
    });

    it('gets prototype', function() {
        expect(c).to.be.an('object');
        expect(c).to.respondTo('save');
        expect(c).to.respondTo('get');
        expect(c).to.respondTo('update');
        expect(c).to.respondTo('remove');
    });
    it('is saveable', function(done) {
        var id;
        c.save().then(function(card) {
            TEST_CARD_ID = id = card.card_id;
        }).should.eventually.not.equal(null).notify(done);
    });
    it('is gettable', function(done) {
        c.get(TEST_CARD_ID).then(function() {
            expect(c.getId()).to.equal(TEST_CARD_ID);
            done();
        }).done();
    });
    it('is removable', function(done) {
        c.save()
        .then(c.remove)
        .then(function(response) {
            expect(response.card_id).to.be.a('string');
            expect(response.card_status).to.equal('deleted');
            done();
        }).done();
    });
});
