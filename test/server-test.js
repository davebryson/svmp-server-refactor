
var svmpserver = require('../lib/svmpserver'),
    SvmpSocket = require('../lib/svmpsocket'),
    protocol  = require('../lib/protocol'),
    assert = require('assert');


describe("Test Server/Socket", function() {
    var instance;
    var settings = {tls_proxy: false};

    before(function(done) {
        instance = svmpserver.createServer(settings, function(sock) {

            sock.on('message', function(msg){

                var r = protocol.parseRequest(msg);

                assert.strictEqual(r.authRequest.username,'dave');

                sock.sendResponse({
                    type: 'VMREADY',
                    message: "test1"
                });
            });

        }).listen(8001);


        instance.on('listening', function(){
            done();
        });


    });

    after(function(done){
        instance.close();
        done();
    });


    it('should process svmpsockets', function(done){

        /** Setup up client to talk to server */
        var client = new SvmpSocket();

        client.on('message', function(msg){
            var r = protocol.parseResponse(msg);
            assert.strictEqual(r.message, 'test1');
            done();
        });

        client.on('start', function(){
            client.sendRequest({
                type: 'AUTH',
                authRequest: {
                    type: 'AUTHENTICATION',
                    username: 'dave'
                }
            });
        });

        client.connect(8001);
    });

});