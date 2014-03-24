'use strict';


/**
 * Constant: Size of header in packet
 * @type {number}
 */
var HEADER_SIZE_BYTES = 1;

/**
 * Used on sockets to assemble complete messages before attempting to parse with Protobuf. Assumes messages
 * are prefixed with a varint header containing the size of the message.  Used internally by SvmpSocket
 *
 * @param callback in the form function(packet).  Packet will be just header and message
 * @constructor
 */
function PacketReader(callback) {
    this.callback = callback;
    this.buffer = null;
    this.partial = null;
    this.read = 0;
    this.partialLength = 0;
}

/**
 * Read and process the incoming data. It buffers packets until we have a complete message.  Once
 * a complete message is received, readBuffer will run the callback with the message as an argument. Parsing the
 * actual Protobuf message is left to the using application.
 *
 * @param inbuffer from the socket on.data
 */
PacketReader.prototype.readBuffer = function (inbuffer) {
    if (!this.buffer) {
        if (this.init(inbuffer)) {
            this.partial = null;
            this.partialLength = 0;
        } else {
            return;
        }
    }

    var toRead = this.buffer.length - this.read;
    if (toRead > inbuffer.length) {
        toRead = inbuffer.length;
    }

    inbuffer.copy(this.buffer, this.read, 0, toRead);
    this.read += toRead;

    if (this.read == this.buffer.length) {
        //var message = this.buffer.slice(HEADER_SIZE_BYTES);
        //var message =
        //this.callback(message);
        this.callback(new Buffer(this.buffer));
        this.buffer = null;
        if (toRead < inbuffer.length) {
            this.readBuffer(inbuffer.slice(toRead))
        }
    }
};

/**
 * Helper to read Protobuf varint header
 * @param data
 * @returns {number}
 */
PacketReader.prototype.readVarint32 = function (data) {
    var result = 0;
    var offset = 0;
    var pos = 0;
    for (; offset < 32; offset += 7) {
        var b = data[pos];
        if (b == -1) {
            throw new Error("Malformed varint");
        }
        result |= (b & 0x7f) << offset;
        if ((b & 0x80) == 0) {
            return result;
        }
        pos++;
    }
    // Keep reading up to 64 bits.
    for (; offset < 64; offset += 7) {
        b = data[pos];
        if (b == -1) {
            throw new Error("Truncated message");
        }
        if ((b & 0x80) == 0) {
            return result;
        }
        pos++;
    }
};

/**
 * Called internally to start the processing of packets
 * @param inbuffer
 * @returns {boolean}
 */
PacketReader.prototype.init = function (inbuffer) {
    /**
     * Deal with partial buffers packets
     */
    if (this.partial) {
        if (this.partialLength + inbuffer.length >= HEADER_SIZE_BYTES) {
            inbuffer.copy(this.partial, this.partialLength, 0, HEADER_SIZE_BYTES - this.partialLength);
            this.buffer = new Buffer(this.readVarint32(this.partial) + HEADER_SIZE_BYTES);
            this.partial.copy(this.buffer);
            this.read = this.partialLength;
            return true;
        }
        inbuffer.copy(this.partial, this.partialLength, 0, inbuffer.length);
        this.partialLength += inbuffer.length;
        return false
    }

    /**
     * Setup the buffer for reading
     */
    this.buffer = new Buffer(this.readVarint32(inbuffer) + HEADER_SIZE_BYTES);
    this.read = 0;
    return true;
};

module.exports = PacketReader;





