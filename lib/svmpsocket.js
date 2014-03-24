'use strict';

var net = require('net'),
    tls = require('tls'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    protocol = require('./protocol'),
    PacketReader = require('./packetreader');

/**
 * SvmpSocket wraps a normal socket and hides the details of handling SVMP Protobuf messages.
 *
 * Based on the idea behind nssocket
 *
 * @param socket
 * @param options
 * @returns {SvmpSocket}
 * @constructor
 */
function SvmpSocket(socket, options) {

    if (!(this instanceof SvmpSocket)) {
        return new SvmpSocket(socket, options);
    }

    options = options || {};

    if (!socket) {
        socket = new net.Socket(options);
    }

    this.socket = socket;
    this.connected = options.connected || socket.writable && socket.readable || false;

    this._type = options.type || 'tcp4';

    this._packetReader = null;

    EventEmitter.call(this);

    this._setup();
}

util.inherits(SvmpSocket, EventEmitter);

/**
 * Connect to endpoint
 * @returns {*}
 */
SvmpSocket.prototype.connect = function (/*port, host, callback*/) {
    var args = Array.prototype.slice.call(arguments),
        self = this,
        callback,
        host,
        port;

    args.forEach(function handle(arg) {
        var type = typeof arg;
        switch (type) {
            case 'number':
                port = arg;
                break;
            case 'string':
                host = arg;
                break;
            case 'function':
                callback = arg;
                break;
            default:
                self.emit('error', new Error('bad argument to connect'));
                break;
        }
    });

    host = host || '127.0.0.1';
    this.port = port || this.port;
    this.host = host || this.host;
    args = this.port ? [this.port, this.host] : [this.host];

    if (callback) {
        args.push(callback);
    }

    if (['tcp4', 'tls'].indexOf(this._type) === -1) {
        return this.emit('error', new Error('Unknown Socket Type'));
    }

    var errHandlers = self.listeners('error');

    if (errHandlers.length > 0) {
        self.socket._events.error = errHandlers[errHandlers.length - 1];
    }

    this.connected = true;
    this.socket.connect.apply(this.socket, args);
};

/**
 * Send an SVMP Request. It will convert the message to Protobuf format
 * @param object is the message in object format
 * @returns {*}
 */
SvmpSocket.prototype.sendRequest = function (object) {
    if (!this.socket || !this.connected) {
        return this.emit('error', new Error('SvmpSocket: socket is broken'));
    }

    try {
        var msg = protocol.writeRequest(object);
        this.socket.write(msg);
    } catch (e) {
        // Log it
    }
};

/**
 * Send an SVMP Response. It will convert the message to Protobuf format
 * @param object is the message in object format
 * @returns {*}
 */
SvmpSocket.prototype.sendResponse = function (object) {
    if (!this.socket || !this.connected) {
        return this.emit('error', new Error('SvmpSocket: socket is broken'));
    }

    try {
        var msg = protocol.writeResponse(object);
        this.socket.write(msg);
    } catch (e) {
        // Log it?
    }
};

/**
 * Send a raw message.  Used to send a message already in Protobuf format
 * @param data is a message already in ProtoBuf format
 * @returns {*}
 */
SvmpSocket.prototype.sendRaw = function (data) {
    if (!this.socket || !this.connected) {
        return this.emit('error', new Error('SvmpSocket: socket is broken'));
    }

    this.socket.write(data);
};


SvmpSocket.prototype._setup = function () {
    var that = this;
    this._packetReader = new PacketReader(function (message) {
        that.emit('message', message);
    });

    this.socket.on('connect', this._onStart.bind(this));
    this.socket.on('data', this._onData.bind(this));
};

SvmpSocket.prototype._onStart = function () {
    this.emit('start');
};

SvmpSocket.prototype._onData = function (fullmessage) {
    this._packetReader.readBuffer(fullmessage);
};

module.exports = SvmpSocket;




