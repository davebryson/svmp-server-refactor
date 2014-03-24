var ProtoBuf = require("protobufjs"),
    ByteBuffer = require('bytebuffer'),
    path = require('path');

var builder = ProtoBuf.loadProtoFile(path.join(__dirname,"/../protocol/svmp.proto")),
    Svmp = builder.build("svmp");


function writeDelimited(protoMessage) {
    var msgSize = protoMessage.length;
    var buffer = new ByteBuffer(1 + msgSize);
    buffer.writeVarint(msgSize);
    buffer.append(protoMessage);
    buffer.flip();
    return buffer.toBuffer();
}

/**
 * Decode an SVMP Request
 * @param msg
 * @returns {!ProtoBuf.Builder.Message|*|ProtoBuf.Builder.Message}
 */
exports.parseRequest = function (msg) {
    var buf = ByteBuffer.wrap(msg);
    buf.readVarint();
    return Svmp.Request.decode(buf);
};

/**
 * Write a delimited message to Protobuf Request format
 * @param req in object format
 * @returns {*}
 */
exports.writeRequest = function (req) {
    var protoMsg = new Svmp.Request(req).encode();
    return writeDelimited(protoMsg);
};

/**
 * Decode a Protobuf response
 * @param msg
 * @returns {!ProtoBuf.Builder.Message|*|ProtoBuf.Builder.Message}
 */
exports.parseResponse = function (msg) {
    var buf = ByteBuffer.wrap(msg);
    buf.readVarint();
    return Svmp.Response.decode(buf);
};

/**
 * Write a delimited message to Protobuf Response format
 * @param resp
 * @returns {*}
 */
exports.writeResponse = function (resp) {
    var protoMsg = new Svmp.Response(resp).encode();
    return writeDelimited(protoMsg);
};




