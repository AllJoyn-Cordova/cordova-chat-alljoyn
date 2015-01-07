/*
 * An AllJoyn message handler that is made available to a global variable AllJoynMessageHandler.
 *
 * To use the handler, you must have first connected to an AllJoyn bus. The handler is then started
 * by passing a reference to your bus attachment.
 *
 * AllJoynMessageHandler.start(<your bus attachment>);
 *
 * To register handlers, you call the addHandler by passing the message ids you are interested,
 * the signature of your message and the callback function that gets called if such messages arrive.
 * The signature is an AllJoyn-specific value that is used to unmarshal the body of the message.
 *
 * AllJoynMessageHandler.addHandler(<interesting message id>,
 *                                  <return value signature>
 *                                  function(messageObject, messageBody) {
 *                                    // handle the received message
 *                                  });
 */
(function() {
  // Use 0 as unmarshal timeout so that we don't end up blocking
  // the UI while waiting for new messages
  var AJ_UNMARSHAL_TIMEOUT = 0;
  var AJ_METHOD_TIMEOUT = 1000 * 1;
  var AJ_MESSAGE_SLOW_LOOP_INTERVAL = 500;
  var AJ_MESSAGE_FAST_LOOP_INTERVAL = 50;

  var messageHandler = {};
  var messageListeners = {};
  var interval = null;

  messageHandler.start = function(busAttachment) {
    // Flag to store current interval pace
    var runningFast;
    // This function can be called to update the interval based on if
    // the bus attachment had new messages or now. The idea is that if there are
    // messages, we run the loop faster to "flush the bus" and slower if there is
    // nothing new.
    var updateInterval = function(unmarshalStatus) {
      if (unmarshalStatus == AllJoynWinRTComponent.AJ_Status.aj_OK) {
        if (!runningFast) {
          clearInterval(interval);
          runningFast = true;
          interval = setInterval(handlerFunction, AJ_MESSAGE_FAST_LOOP_INTERVAL);
        }
      }
      if (unmarshalStatus == AllJoynWinRTComponent.AJ_Status.aj_ERR_TIMEOUT) {
        if (runningFast) {
          clearInterval(interval);
          runningFast = false;
          interval = setInterval(handlerFunction, AJ_MESSAGE_SLOW_LOOP_INTERVAL);
        }
      }
    }
    var handlerFunction = function() {
      var aj_message = new AllJoynWinRTComponent.AJ_Message();
      AllJoynWinRTComponent.AllJoyn.aj_UnmarshalMsg(busAttachment, aj_message, AJ_UNMARSHAL_TIMEOUT).done(function(status) {
        if (status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
          var messageObject = aj_message.get();
          var receivedMessageId = messageObject.msgId;
          // Check if we have listeners for this message id
          if (messageListeners[receivedMessageId]) {
            // Pass the value to listeners
            var callbacks = messageListeners[receivedMessageId];
            for (var i = 0; i < callbacks.length; i++) {
              // Unmarshal the message body
              var messageBody = AllJoynWinRTComponent.AllJoyn.aj_UnmarshalArgs(aj_message, callbacks[i][0]);
              callbacks[i][1](messageObject, messageBody);
            }
          }
        }
        AllJoynWinRTComponent.AllJoyn.aj_CloseMsg(aj_message);
        updateInterval(status);
      });
    }
    // Initially start with slower interval
    runningFast = false;
    interval = setInterval(handlerFunction, AJ_MESSAGE_SLOW_LOOP_INTERVAL);
  }

  messageHandler.stop = function() {
    clearInterval(interval);
  }

  messageHandler.addHandler = function(messageId, signature, callback) {
    // Create a list of handlers for this message id if it doesn't exist yet
    if (typeof messageListeners[messageId] != "object") {
      messageListeners[messageId] = [];
    }
    messageListeners[messageId].push([signature, callback]);
  }

  messageHandler.removeHandler = function(messageId, callback) {
    messageListeners[messageId] = messageListeners[messageId].filter(
      function(element) {
        // Filter out the given callback function
        return (element[1] !== callback);
      }
    );
  }

  window.AllJoynMessageHandler = messageHandler;
})();
