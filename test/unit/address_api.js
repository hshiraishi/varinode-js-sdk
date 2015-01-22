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

describe('#address', function() {
    this.timeout(60000);

    it('can be verified', function (done) {
        varinode.api('addresses.verify', {address:fake.address_verify}
        ).then(function (data) {
            //console.log(JSON.stringify(data,null,2));
            expect(data["status"]).to.equal("complete");
            done();
        }).done();
    });

});
