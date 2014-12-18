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
      console.log(new Date());
      var aj_message = new AllJoynWinRTComponent.AJ_Message();
      AllJoynWinRTComponent.AllJoyn.aj_UnmarshalMsg(busAttachment, aj_message, AJ_UNMARSHAL_TIMEOUT).done(function(status) {
        if (status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
          var aj_receivedMessageId = AllJoynWinRTComponent.AllJoyn.get_AJ_Message_msgId(aj_message);
          // Check if we have listeners for this message id
          if (messageListeners[aj_receivedMessageId]) {
            // Unmarshal the message value
            var aj_arg = new AllJoynWinRTComponent.AJ_Arg();
            status = AllJoynWinRTComponent.AllJoyn.aj_UnmarshalArg(aj_message, aj_arg);
            var returnValue = AllJoynWinRTComponent.AllJoyn.get_AJ_Arg_v_string(aj_arg);
            AllJoynWinRTComponent.AllJoyn.aj_CloseArg(aj_arg);

            // Pass the value to listeners
            var callbacks = messageListeners[aj_receivedMessageId];
            for (var i = 0; i < callbacks.length; i++) {
              callbacks[i](returnValue);
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

  messageHandler.addHandler = function(messageId, callback) {
    // Create a list of handlers for this message id if it doesn't exist yet
    if (typeof messageListeners[messageId] != "object") {
      messageListeners[messageId] = [];
    }
    messageListeners[messageId].push(callback);
  }

  messageHandler.removeHandler = function(messageId, callback) {
    messageListeners[messageId] = messageListeners[messageId].filter(
      function(element) {
        // Filter out the given callback function
        return element !== callback
      }
    );
  }

  window.AllJoynMessageHandler = messageHandler;
})();
