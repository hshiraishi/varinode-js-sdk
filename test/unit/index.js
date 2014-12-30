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

    fake = require('../fake-customer-data.js'),
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

describe('#api', function() {
    it('initializes', function() {
        expect(varinode).to.be.an('object');
    });

    it('configures', function () {
        expect(varinode.configure).to.be.a('function');
        varinode.configure(apiConfig);
    });
});


// DATA FOR STUBS

var mockCustomer = {
    "customer": {
        "customer_id": "42f9ffa485fa48a4a1a0438904848ca3",
        "customer_email": "jokes4jokes@gmail.com",
        "customer_phone": "4158889999",
        "customer_description": "Anything goes here",
        "customer_default_card_id": "0",
        "customer_status": "active"
    },
    "status": "complete",
    "status_message": "complete"
};

var mockCustomerUpdate = {
    "customer": {
        "customer_id": "42f9ffa485fa48a4a1a0438904848ca3",
        "customer_email": "updated@emailaddress.com",
        "customer_phone": "4159999999",
        "customer_description": "Updated description",
        "customer_default_card_id": "0",
        "customer_status": "active"
    },
    "status": "complete",
    "status_message": "complete"
};

var getFromURLsResponse = {"processed_sites":[{"site_info":{"site_id":"ffcc13bcf5c544059debfc43a9b7295a","site_name":"Banana Republic","site_url":"bananarepublic.gap.com","site_logo":"http://static.varinode.com/bananarepublic-png.png","site_accepted_card_types":{"visa":"on","amex":"on","discover":"on","mastercard":"on"},"required_parameters":{"guest_account":{"email":""}},"optional_parameters":{"promo_codes":[]}},
    "products":[{"required_attributes":{"color":{"default_value":"1021","values":{"1017":{"text":"Black","swatch_image":"http://bananarepublic.gap.com/Asset_Archive/BRWeb/Assets/Product/423/423451/swatch/br423451-00sv01.gif","images":["http://bananarepublic.gap.com/Asset_Archive/BRWeb/Assets/Product/423/423451/big/br423451-00vliv01.jpg"],"videos":[],"value":"1017"},"1021":{"text":"Navy star","swatch_image":"http://bananarepublic.gap.com/webcontent/0004/667/450/cn4667450.jpg","images":["http://bananarepublic.gap.com/webcontent/0004/667/460/cn4667460.jpg"],"videos":[],"value":"1021"},"1029":{"text":"White","swatch_image":"http://bananarepublic.gap.com/webcontent/0004/353/796/cn4353796.jpg","images":["http://bananarepublic.gap.com/webcontent/0004/353/802/cn4353802.jpg"],"videos":[],"value":"1029"},"2--1021":{"text":"Navy star - Tall","swatch_image":"http://bananarepublic.gap.com/webcontent/0004/667/450/cn4667450.jpg","images":["http://bananarepublic.gap.com/webcontent/0004/667/460/cn4667460.jpg"],"videos":[],"value":"2--1021"},"2--1017":{"text":"Black - Tall","swatch_image":"http://bananarepublic.gap.com/Asset_Archive/BRWeb/Assets/Product/423/423451/swatch/br423451-00sv01.gif","images":["http://bananarepublic.gap.com/Asset_Archive/BRWeb/Assets/Product/423/423451/big/br423451-00vliv01.jpg"],"videos":[],"value":"2--1017"},"2--1029":{"text":"White - Tall","swatch_image":"http://bananarepublic.gap.com/webcontent/0004/353/796/cn4353796.jpg","images":["http://bananarepublic.gap.com/webcontent/0004/353/802/cn4353802.jpg"],"videos":[],"value":"2--1029"}}},"size":{"default_value":"1528","values":{"1528":{"text":"XS","value":"1528"},"1529":{"text":"S","value":"1529"},"1530":{"text":"M","value":"1530"},"1531":{"text":"L","value":"1531"},"1532":{"text":"XL","value":"1532"},"1546":{"text":"XXL","value":"1546"}}},"quantity":{"default_value":1}},"attribute_dependencies":{"color":{"1017":{"size":{"1528":{"price":"39.5","orig_price":"39.5"},"1529":{"price":"39.5","orig_price":"39.5"},"1530":{"price":"39.5","orig_price":"39.5"},"1531":{"price":"39.5","orig_price":"39.5"},"1532":{"price":"39.5","orig_price":"39.5"},"1546":{"price":"39.5","orig_price":"39.5"}}},"1021":{"size":{"1528":{"price":"29.5","orig_price":"39.5"},"1529":{"price":"29.5","orig_price":"39.5"},"1530":{"price":"29.5","orig_price":"39.5"},"1531":{"price":"29.5","orig_price":"39.5"},"1532":{"price":"29.5","orig_price":"39.5"},"1546":{"price":"29.5","orig_price":"39.5"}}},"1029":{"size":{"1528":{"price":"39.5","orig_price":"39.5"},"1529":{"price":"39.5","orig_price":"39.5"},"1530":{"price":"39.5","orig_price":"39.5"},"1531":{"price":"39.5","orig_price":"39.5"},"1532":{"price":"39.5","orig_price":"39.5"},"1546":{"price":"39.5","orig_price":"39.5"}}},"2--1021":{"size":{"1530":{"price":"29.5","orig_price":"39.5"},"1531":{"price":"29.5","orig_price":"39.5"},"1532":{"price":"29.5","orig_price":"39.5"},"1546":{"price":"29.5","orig_price":"39.5"}}},"2--1017":{"size":{"1530":{"price":"39.5","orig_price":"39.5"},"1531":{"price":"39.5","orig_price":"39.5"},"1532":{"price":"39.5","orig_price":"39.5"},"1546":{"price":"39.5","orig_price":"39.5"}}},"2--1029":{"size":{"1530":{"price":"39.5","orig_price":"39.5"},"1531":{"price":"39.5","orig_price":"39.5"},"1532":{"price":"39.5","orig_price":"39.5"},"1546":{"price":"39.5","orig_price":"39.5"}}}}},"product_id":"15f73e6e0cd244a5a6de69392881e9ed","product_title":"Signature piqué polo","product_description":["Our piqué polos have a special performance finish that helps them maintain color and shape, reducing shrinkage and pilling.","Relaxed polo collar. Three-button placket.","Embroidered elephant at chest.","New updated fit: now longer through the body and sleeves."],"product_price":"29.5","product_image":"http://bananarepublic.gap.com/webcontent/0004/667/460/cn4667460.jpg","product_url":"http://bananarepublic.gap.com/browse/product.do?cid=66299&vid=1&pid=423451022"}]
},{"site_info":{"site_id":"6d51d4e0d3ae4b49ae7f94b3ac59f99a","site_name":"Nordstrom","site_url":"shop.nordstrom.com","site_logo":"http://static.varinode.com/nordstrom-png.png","site_accepted_card_types":{"visa":"on","amex":"on","discover":"on","mastercard":"on"},"required_parameters":{"guest_account":{"email":""}},"optional_parameters":{"promo_codes":[],"gift_cards":[{"number":"","pin_access_code":""}]}},"urls_failed":[{"msg":"Nordstrom: Product not available 1_2","id":"http://shop.nordstrom.com/s/halogen-stretch-woven-a-line-skirt-regular-petite/3627603"}]}],"status":"complete","unsupported_urls":[]};

    /* mocks */
    var mock_addToCart = {
            "cart_id": "ffe6c18c15244a2498c9d4adfc8870e0",
            "processed_sites": [
                {
                "site_info": {
                    "site_id": "6d51d4e0d3ae4b49ae7f94b3ac59f99a",
                    "site_name": "Nordstrom",
                    "site_url": "shop.nordstrom.com",
                    "site_logo": "http://static.varinode.com/nordstrom-png.png",
                    "site_accepted_card_types": {
                        "visa": "on",
                        "amex": "on",
                        "discover": "on",
                        "mastercard": "on"
                    },
                    "required_parameters": {
                        "guest_account": {
                            "email": ""
                        }
                    },
                    "optional_parameters": {
                        "promo_codes": [],
                        "gift_cards": [
                            {
                            "number": "",
                            "pin_access_code": ""
                        }
                        ]
                    }
                },
                "products_failed": [],
                "products_added": [
                    "4b0e20eb621e4fbf9d9e4cfca9b84fd8"
                ]
            }
            ],
            "status": "complete",
            "unsupported_sites": []
        };

    var mock_removeFromCart =  {
            "cart_id": "ffe6c18c15244a2498c9d4adfc8870e0",
            "processed_sites": [
                {
                "site_info": {
                    "site_id": "6d51d4e0d3ae4b49ae7f94b3ac59f99a",
                    "site_name": "Nordstrom",
                    "site_url": "shop.nordstrom.com",
                    "site_logo": "http://static.varinode.com/nordstrom-png.png",
                    "site_accepted_card_types": {
                        "visa": "on",
                        "amex": "on",
                        "discover": "on",
                        "mastercard": "on"
                    },
                    "required_parameters": {
                        "guest_account": {
                            "email": ""
                        }
                    },
                    "optional_parameters": {
                        "promo_codes": [],
                        "gift_cards": [
                            {
                            "number": "",
                            "pin_access_code": ""
                        }
                        ]
                    }
                },
                "products_failed": [
                    {
                    "msg": "Nordstrom: Cart parameters expired. Product removal failed.",
                    "id": "ctl00$mainContentPlaceHolder$shoppingBagList$orderItemRepeater$ctl00$removeItemImageButton_693056179"
                }
                ]
            }
            ],
            "status": "complete",
            "unsupported_sites": [],
            "invalid_sites": []
        };

    var mock_getCart = {
            "cart_id": "ffe6c18c15244a2498c9d4adfc8870e0",
            "processed_sites": [
                {
                "site_info": {
                    "site_id": "6d51d4e0d3ae4b49ae7f94b3ac59f99a",
                    "site_name": "Nordstrom",
                    "site_url": "shop.nordstrom.com",
                    "site_logo": "http://static.varinode.com/nordstrom-png.png",
                    "site_accepted_card_types": {
                        "visa": "on",
                        "amex": "on",
                        "discover": "on",
                        "mastercard": "on"
                    },
                    "required_parameters": {
                        "guest_account": {
                            "email": ""
                        }
                    },
                    "optional_parameters": {
                        "promo_codes": [],
                        "gift_cards": [
                            {
                            "number": "",
                            "pin_access_code": ""
                        }
                        ]
                    }
                },
                "cart_failed": [
                    {
                    "msg": "Nordstrom: Cart is empty",
                    "id": "6d51d4e0d3ae4b49ae7f94b3ac59f99a"
                }
                ],
                "cart_details": []
            }
            ],
            "unsupported_sites": [],
            "status": "errors"
        };

    var mock_getFromURLs = {
            "processed_sites": [
                {
                "site_info": {
                    "site_id": "6d51d4e0d3ae4b49ae7f94b3ac59f99a",
                    "site_name": "Nordstrom",
                    "site_url": "shop.nordstrom.com",
                    "site_logo": "http://static.varinode.com/nordstrom-png.png",
                    "site_accepted_card_types": {
                        "visa": "on",
                        "amex": "on",
                        "discover": "on",
                        "mastercard": "on"
                    },
                    "required_parameters": {
                        "guest_account": {
                            "email": ""
                        }
                    },
                    "optional_parameters": {
                        "promo_codes": [],
                        "gift_cards": [
                            {
                            "number": "",
                            "pin_access_code": ""
                        }
                        ]
                    }
                },
                "products": [
                    {
                    "required_attributes": {
                        "color": {
                            "default_value": "163798",
                            "values": {
                                "124523": {
                                    "text": "French Navy",
                                    "swatch_image": "http://g.nordstromimage.com/imagegallery/store/product/SwatchSmall/12/_8288972.jpg",
                                    "images": [
                                        "http://g.nordstromimage.com/imagegallery/store/product/Gigantic/10/_9124310.jpg"
                                    ],
                                    "videos": [],
                                    "value": "124523"
                                },
                                "163577": {
                                    "text": "White",
                                    "swatch_image": "http://g.nordstromimage.com/imagegallery/store/product/SwatchSmall/1/_8091621.jpg",
                                    "images": [
                                        "http://g.nordstromimage.com/imagegallery/store/product/Gigantic/0/_8091620.jpg"
                                    ],
                                    "videos": [],
                                    "value": "163577"
                                },
                                "163798": {
                                    "text": "Black",
                                    "swatch_image": "http://g.nordstromimage.com/imagegallery/store/product/SwatchSmall/1/_8088261.jpg",
                                    "images": [
                                        "http://g.nordstromimage.com/imagegallery/store/product/Gigantic/14/_8302474.jpg",
                                        "http://g.nordstromimage.com/imagegallery/store/product/Zoom/10/_8088230.jpg",
                                        "http://g.nordstromimage.com/imagegallery/store/product/Zoom/11/_8088211.jpg"
                                    ],
                                    "videos": [],
                                    "value": "163798"
                                }
                            }
                        },
                        "size": {
                            "default_value": "XXLarge",
                            "values": {
                                "XXLarge": {
                                    "text": "XX-Large",
                                    "value": "XXLarge"
                                },
                                "Large": {
                                    "text": "Large",
                                    "value": "Large"
                                },
                                "Medium": {
                                    "text": "Medium",
                                    "value": "Medium"
                                },
                                "Small": {
                                    "text": "Small",
                                    "value": "Small"
                                },
                                "XLarge": {
                                    "text": "X-Large",
                                    "value": "XLarge"
                                }
                            }
                        },
                        "quantity": {
                            "default_value": 1
                        }
                    },
                    "attribute_dependencies": {
                        "color": {
                            "124523": {
                                "size": {
                                    "XXLarge": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Large": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Medium": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Small": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "XLarge": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    }
                                }
                            },
                            "163577": {
                                "size": {
                                    "XXLarge": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Large": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Medium": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Small": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "XLarge": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    }
                                }
                            },
                            "163798": {
                                "size": {
                                    "XXLarge": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Large": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Medium": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "Small": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    },
                                    "XLarge": {
                                        "price": "98.00",
                                        "orig_price": "98.00"
                                    }
                                }
                            }
                        }
                    },
                    "product_id": "4b0e20eb621e4fbf9d9e4cfca9b84fd8",
                    "product_title": "Custom Fit Mesh Polo",
                    "product_description": [
                        "Ralph Lauren's signature embroidered pony accents a trim-fitting short-sleeved polo crafted from breathable cotton mesh.",
                        "26\" length (size Medium).",
                        "Classic polo hem.",
                        "97% Pima cotton, 3% elastane.",
                        "Machine wash cold, tumble dry low.",
                        "By Polo Ralph Lauren; imported.",
                        "Men's Sportswear."
                    ],
                    "product_price": "98.00",
                    "product_image": "http://g.nordstromimage.com/imagegallery/store/product/Gigantic/14/_8302474.jpg",
                    "product_url": "http://shop.nordstrom.com/s/polo-ralph-lauren-custom-fit-mesh-polo/3369610?origin=category-personalizedsort"
                }
                ]
            }
            ],
            "status": "complete",
            "unsupported_urls": []
        };

