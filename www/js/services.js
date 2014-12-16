var chatApp = angular.module('chatApp');

chatApp.factory('chatService', function($rootScope, $q) {
  // Initialize the AllJoyn chat session if the AllJoyn API
  // is available.
  if (window.AllJoyn) {
    // This initialization call is required once before doing
    // other AllJoyn operations. Since this Angular service is
    // a singleton, we should end up calling this only once.
    AllJoynWinRTComponent.AllJoyn.aj_Initialize();

    var AJ_CHAT_SERVICE_NAME = "org.alljoyn.bus.samples.chat.";
    var AJ_CHAT_SERVICE_PATH = "/chatService";
    var AJ_CHAT_SERVICE_PORT = 27;
    var AJ_CHAT_INTERFACE = [
      "org.alljoyn.bus.samples.chat",
      "!Chat str>s",
      ""
    ];
    var AJ_CHAT_INTERFACES = [AJ_CHAT_INTERFACE, null];
    var AJ_CONNECT_TIMEOUT = (1000 * 5);
    var AJ_UNMARSHAL_TIMEOUT = (1000 * 0.5);
    var AJ_METHOD_TIMEOUT = (100 * 10);

    var aj_busAttachment = new AllJoynWinRTComponent.AJ_BusAttachment();
    var aj_sessionId = 0;

    // Create and registed app objects based on the service
    // and interface definitions above.
    var aj_appObject = new AllJoynWinRTComponent.AJ_Object();
    aj_appObject.path = AJ_CHAT_SERVICE_PATH;
    aj_appObject.interfaces = AJ_CHAT_INTERFACES;
    AllJoynWinRTComponent.AllJoyn.aj_RegisterObjects(null, [aj_appObject, null]);

    var aj_daemonName = "";
    var startClientReturnObject = AllJoynWinRTComponent.AllJoyn.aj_StartClient(aj_busAttachment, aj_daemonName, AJ_CONNECT_TIMEOUT, false, AJ_CHAT_SERVICE_NAME, AJ_CHAT_SERVICE_PORT, null, null);
    if (startClientReturnObject.__returnValue == AllJoynWinRTComponent.AJ_Status.aj_OK) {
      console.log("Start client succeeded.");
      aj_sessionId = startClientReturnObject.sessionId;
    } else {
      console.log("Start client failed.");
    }
  }

  var chatService = {};

  var channelsModel = {
    channels: [],
    currentChannel: null,
    getChannel: function(name) {
      for (var i = 0; i < this.channels.length; i++) {
        if (this.channels[i].name = name) return this.channels[i];
      }
    }
  };

  var currentChannelMessages = function() {
    return channelsModel.currentChannel && channelsModel.currentChannel.messages || [];
  };
  chatService.currentChannelMessages = currentChannelMessages;

  chatService.currentChannel = function() {
    return channelsModel.currentChannel;
  };
  chatService.setCurrentChannel = function(channel) {
    channelsModel.currentChannel = channel;
    $rootScope.$broadcast('currentChannelChanged', channel);
  };

  chatService.postCurrentChannel = function(message) {
    if (window.AllJoyn) {
      var aj_messageId = AllJoynWinRTComponent.AllJoyn.aj_Prx_Message_ID(0, 0, 0);
      var aj_message = new AllJoynWinRTComponent.AJ_Message();
      // An empty string is used as a destination, because that ends up being converted to null platform string
      // in the Windows Runtime Component. A null value as destination in ajtcl means that the destination is not set and
      // chat message ends up being sent to everybody in the session. If using the channel's well-known name as
      // the destination, only the channel owner would receive the message.
      var aj_destination = "";
      var aj_status = AllJoynWinRTComponent.AllJoyn.aj_MarshalSignal(aj_busAttachment, aj_message, aj_messageId, aj_destination, aj_sessionId, 0, 0);
      console.log("aj_MarshalSignal resulted in a status of " + aj_status);

      if (aj_status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
        aj_status = AllJoynWinRTComponent.AllJoyn.aj_MarshalArgs(aj_message, "s", [message.text]);
        console.log("aj_MarshalArgs resulted in a status of " + aj_status);
      }

      if (aj_status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
        aj_status = AllJoynWinRTComponent.AllJoyn.aj_DeliverMsg(aj_message);
        console.log("aj_DeliverMsg resulted in a status of " + aj_status);
      }

      // Messages must be closed to free resources.
      AllJoynWinRTComponent.AllJoyn.aj_CloseMsg(aj_message);
    }

    channelsModel.currentChannel.messages.push(message);
    $rootScope.$broadcast('newMessage', message);
  };

  chatService.getChannels = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      if (true) {
        if (window.AllJoyn) {
          // TODO: Fetch channels from AllJoyn
          channelsModel.channels = [new Channel('Random Channel')];
        } else {
          channelsModel.channels = [new Channel('My Channel'), new Channel('Another Channel')];
        }
        deferred.resolve(channelsModel.channels);
      } else {
        // This would be when unable to fetch channels
        deferred.reject([]);
      }
    }, 500);
    return deferred.promise;
  };

  // Loop to check for new chat messages
  setInterval(function() {
    // Return if we are not in a channel
    if (channelsModel.currentChannel == null) return;

    if (window.AllJoyn) {
      var aj_message = new AllJoynWinRTComponent.AJ_Message();
      var status = AllJoynWinRTComponent.AllJoyn.aj_UnmarshalMsg(aj_busAttachment, aj_message, AJ_UNMARSHAL_TIMEOUT);

      if (status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
        var aj_messageId = AllJoynWinRTComponent.AllJoyn.aj_Prx_Message_ID(0, 0, 0);
        var aj_receivedMessageId = AllJoynWinRTComponent.AllJoyn.get_AJ_Message_msgId(aj_message);
        if (aj_receivedMessageId == aj_messageId) {
          var aj_arg = new AllJoynWinRTComponent.AJ_Arg();
          status = AllJoynWinRTComponent.AllJoyn.aj_UnmarshalArg(aj_message, aj_arg);
          var messageText = AllJoynWinRTComponent.AllJoyn.get_AJ_Arg_v_string(aj_arg);

          var message = new Message(messageText);

          AllJoynWinRTComponent.AllJoyn.aj_CloseArg(aj_arg);
        }
      }
      AllJoynWinRTComponent.AllJoyn.aj_CloseMsg(aj_message);
    } else {
      var message = new Message('Dummy message');
    }

    if (typeof message == 'object') {
      // The $rootScope needs to be accessed in a non-standard way
      // inside of the function run within setInterval or otherwise things
      // don't work correctly.
      // Approach taken from http://stackoverflow.com/questions/24595460/how-to-access-update-rootscope-from-outside-angular .
      var $rootScope = angular.element(document.body).scope().$root;
      $rootScope.$apply(function() {
        channelsModel.currentChannel.messages.push(message);
        console.log(channelsModel.currentChannel.messages.length);
        $rootScope.$broadcast('newMessage', message);
      });
    }
  }, 1000);

  return chatService;
});
