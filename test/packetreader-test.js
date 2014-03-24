var PacketReader = require('../lib/packetreader'),
    assert = require('assert'),
    protocol = require('../lib/protocol');


describe('Packet Reader Test', function () {

    it('should handle 2 message in 1 buffer packet', function () {

        // Create 2 messages
        var obj1 = {
            type: 'AUTH',
            authRequest: {
                type: 'AUTHENTICATION',
                username: 'dave'
            }
        };

        var obj2 = {
            type: 'AUTH',
            authRequest: {
                type: 'AUTHENTICATION',
                username: 'bob'
            }
        };

        var one = protocol.writeRequest(obj1);
        var two = protocol.writeRequest(obj2);

        var messages = Buffer.concat([one,two]);

        var all = [];
        var packetReader = new PacketReader(function(p) {
            var msg = protocol.parseRequest(p);
            all.push(msg);
        });

        packetReader.readBuffer(messages);

        assert.equal(all.length,2);
        assert.strictEqual(all[0].authRequest.username,'dave');
        assert.strictEqual(all[1].authRequest.username,'bob');
    });

    it('should assemble a fragmented message', function(){
        // Setup the test
        var packetReader = new PacketReader(function(p) {
            var msg = protocol.parseRequest(p);
            assert.strictEqual(msg.authRequest.username,'dave');
        });


        // Create a test message
        var obj1 = {
            type: 'AUTH',
            authRequest: {
                type: 'AUTHENTICATION',
                username: 'dave'
            }
        };

        var one = protocol.writeRequest(obj1);

        // Break it up into 4 fragments
        var a = one.slice(0,3);
        var b = one.slice(3,6);
        var c = one.slice(6,10);
        var d = one.slice(10);

        // Send the frags one at a time
        packetReader.readBuffer(a);
        packetReader.readBuffer(b);
        packetReader.readBuffer(c);
        packetReader.readBuffer(d);
    });


});