var should = require('chai').should(),
    expect = require('chai').expect,
    chai = require('chai'),
    Q = require('q'),
    bunyan = require('bunyan'),
    chaiAsPromised = require("chai-as-promised"),
    log = bunyan.createLogger({name: 'varinode-orm-test'}),
    setup = require('mocha').setup,
    apiConfig = require('../config.js'),
    varinode = require('../../index');

if (apiConfig.appKey == 'your-app-key') {
    throw new Error("To run tests, you must provide valid Varinode API keys in test/config.js");
}

chai.use(chaiAsPromised);
varinode.configure(apiConfig);

describe('#product', function() {
    this.timeout(20000);

    it('can be obtained from URLs', function(done) {
        varinode.api('products.getFromURLs',
          {
              product_urls: [
                  'http://bananarepublic.gap.com/browse/product.do?cid=66299&vid=1&pid=423451022',
                  'http://bananarepublic.gap.com/browse/product.do?cid=1026198&vid=1&pid=288022002',
                  'http://www.gap.com/browse/product.do?cid=5231&vid=1&pid=767861362'
              ]
          }
        ).then(function(data) {
              expect(data["processed_sites"]).to.be.a('array');
              expect(data["processed_sites"].length).to.equal(2);
              //console.log(JSON.stringify(data,null,2));
            done();
        }).done();
    });
});
