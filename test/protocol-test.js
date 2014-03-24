var protocol = require('../lib/protocol'),
    assert = require('assert');


describe('Protocol Test', function () {

    it('should read/write request', function () {
        var obj1 = {
            type: 'AUTH',
            authRequest: {
                type: 'AUTHENTICATION',
                username: 'dave'
            }
        };

        var result = protocol.parseRequest(protocol.writeRequest(obj1));
        assert.strictEqual(result.authRequest.username,'dave');
        assert.equal(result.type,0);
    });

    it('should read/write response', function(){

        var obj1 = {
            type: 'VMREADY',
            message: "test1"
        };

        var result = protocol.parseResponse(protocol.writeResponse(obj1));
        assert.strictEqual(result.message,'test1');
        assert.equal(result.type,2);
    });

});
