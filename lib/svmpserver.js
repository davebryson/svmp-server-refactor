var net = require('net'),
    tls = require('tls'),
    SvmpSocket = require('./svmpsocket'),
    proxy = require('./proxy');

/**
 * Create an SVMP Server. It automatically wraps a normal socket in an SvmpSocket
 * @param settings
 * @returns {*}
 */
exports.createServer = function (settings,connectionListener) {

    function onConnection(socket) {

        // Setup Authenticator

        // Call proxy with wrapped socket
        connectionListener(new SvmpSocket(socket /*, authenticator */));
    }
    options = {};
    return settings.tls_proxy
        ? tls.createServer(options, onConnection)
        : net.createServer(options, onConnection);
};
