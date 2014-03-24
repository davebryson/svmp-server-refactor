
var SvmpSocket = require('./svmpsocket'),
    protocol = require('./protocol');


/**
 * States used by proxy
 */
var UNAUTHENTICATED = 1;
var VMREADY_WAIT = 2;
var VMREADY_SENT = 3;
var PROXYREADY = 4;


/**
 * Handles the proxy state flow.  This is not complete yet...
 * @param svmpSocket
 * @param authenticator
 */
exports.handleConnection = function(svmpSocket, authenticator) {
    var state = UNAUTHENTICATED;
    var vmSocket = new SvmpSocket(undefined);



    svmpSocket.on('message', function(msg) {
        if(state === PROXYREADY) {
            vmSocket.sendRaw(msg);
            return;
        }

        switch (state) {
            case UNAUTHENTICATED:



                break;
            case VMREADY_SENT:
                try {
                    var request = protocol.parseRequest(msg);
                    if( request.type === 'VIDEO_PARAMS') {
                        // the proxy is now ready for normal activity, create an interval to monitor this session
                        startInterval();
                        // send json VIDEO_INFO
                        svmpSocket.writeResponse({"type": "VIDSTREAMINFO", "videoInfo": videoResponseObj});
                        state = PROXYREADY;
                        //winston.verbose("State changed to PROXYREADY");
                    }
                } catch (e) {
                    svmpSocket.writeResponse({"type": "ERROR", "message": "Parser: Bad formed message"});
                }
                break;
        }
    });


    vmSocket.on('message', function(msg){
        var response = protocol.parseResponse(msg);
        if( state === VMREADY_WAIT) {
            if (response.type === 'VMREADY') {
                state = VMREADY_SENT;
                //winston.verbose("State changed to VMREADY_SENT");
            }
        }
        svmpSocket.sendResponse(response);
    });


};