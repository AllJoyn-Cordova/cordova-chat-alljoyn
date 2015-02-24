// The $rootScope needs to be accessed in a "non-standard way"
// inside some callback functions or otherwise events are not getting broadcasted correctly.
// Approach taken from:
// http://stackoverflow.com/questions/24595460/how-to-access-update-rootscope-from-outside-angular
var broadcastOnRootScope = function() {
  var broadcastArguments = arguments;
  var $rootScope = angular.element(document.body).scope().$root;
  // Prevent error by checking what phase $apply is in before calling it.
  // Approach taken from:
  // https://coderwall.com/p/ngisma/safe-apply-in-angular-js
  var phase = $rootScope.$$phase;
  if (phase == '$apply' || phase == '$digest') {
    $rootScope.$broadcast.apply($rootScope, broadcastArguments);
  } else {
    $rootScope.$apply(function() {
      $rootScope.$broadcast.apply($rootScope, broadcastArguments);
    });
  }
}

var chatApp = angular.module('chatApp');

chatApp.factory('chatService', function($q) {
  // Initialize the AllJoyn chat session if the AllJoyn API
  // is available.
  if (window.AllJoyn) {
    var AJ_CHAT_SERVICE_NAME = "org.alljoyn.bus.samples.chat.";
    var AJ_CHAT_SERVICE_PORT = 27;

    var chatSession = null;
    var chatBus = null;

    var proxyObjects = [
      {
        path: "/chatService",
        interfaces: [
          [
            "org.alljoyn.bus.samples.chat",
            "!Chat str>s",
            null
          ],
          null
        ]
      },
      null
    ];
    var applicationObjects = proxyObjects;
    AllJoyn.registerObjects(function() { }, function() { }, applicationObjects, proxyObjects);
  }

  var chatService = {};

  chatService.connect = function() {
    var deferred = $q.defer();
    if (window.AllJoyn) {
      AllJoyn.connect(function(bus) {
        chatBus = bus;
        console.log('Found bus and connected.');

        var chatMessageHandler = function(response) {
          if (channelsModel.currentChannel == null) return;
          var message = new Message(response.arguments[0], response.sender);
          channelsModel.currentChannel.messages.push(message);
          broadcastOnRootScope('newMessage', message);
        }
        // Handler for new chat messages to sessions hosted by others
        chatBus.addListener([2, 0, 0, 0], 's', chatMessageHandler);
        // Handler for new chat messages to self-hosted sessions
        chatBus.addListener([1, 0, 0, 0], 's', chatMessageHandler);

        deferred.resolve();
      }, function(status) {
        console.log('Could not connect to the bus. Make sure your network has an AllJoyn router running and accessible to this application.');
        deferred.reject();
      });
    } else {
      setTimeout(function() {
        deferred.resolve();
        //deferred.reject();
      }, 500);
    }
    return deferred.promise;
  }

  var channelsModel = {
    channels: [],
    currentChannel: null,
    getChannel: function(name) {
      for (var i = 0; i < this.channels.length; i++) {
        if (this.channels[i].name == name) return this.channels[i];
      }
      return null;
    },
    removeChannel: function(name) {
      for (var i = 0; i < this.channels.length; i++) {
        if (this.channels[i].name == name) {
          this.channels.splice(i, 1);
          return true;
        }
      }
      return false;
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
    // No need to do anything if channel set to the current channel
    if (channelsModel.currentChannel != null && channel.name == channelsModel.currentChannel.name) {
      return;
    }
    var joinSession = function() {
      chatBus.joinSession(function(session) {
        console.log('Joined a session with id: ' + session.sessionId);
        chatSession = session;
        channelsModel.currentChannel = channel;
        broadcastOnRootScope('currentChannelChanged', channel);
        chatBus.addSignalRule(function() { }, function(status) {
          console.log('Failed to add signal rule with status: ' + status);
        }, 'Chat', 'org.alljoyn.bus.samples.chat');
      }, function(status) {
        console.log('Failed to join a session: ' + status);
      }, { name: AJ_CHAT_SERVICE_NAME + channel.name, port: AJ_CHAT_SERVICE_PORT });
    }
    if (window.AllJoyn) {
      if (chatSession !== null) {
        chatBus.removeSignalRule(function() {
          chatSession.leave(function() {
            console.log('Leaving a session with id: ' + chatSession.sessionId);
            chatSession = null;
            joinSession();
          }, function() {
            console.log('Failed to leave a session with id: ' + chatSession.sessionId);
          });
        }, function(status) {
          console.log('Failed to remove signal rule with status: ' + status);
        }, 'Chat', 'org.alljoyn.bus.samples.chat');
      } else {
        joinSession();
      }
    } else {
      channelsModel.currentChannel = channel;
      broadcastOnRootScope('currentChannelChanged', channel);
    }
  };

  chatService.postCurrentChannel = function(message) {
    if (window.AllJoyn) {
      var chatInterface = chatSession.sessionId === 0 ? [1, 0, 0, 0] : [2, 0, 0, 0];
      chatSession.sendSignal(function() {
        if (chatSession.sessionId === 0) {
          // No need to push the message to the model here,
          // because we are getting the new messages as signals
          // from the router.
        } else {
          channelsModel.currentChannel.messages.push(message);
          broadcastOnRootScope('newMessage', message);
        }
      }, function(status) {
        console.log('Failed to post to current channel: ' + status);
      }, null, null, chatInterface, "s", [message.text]);
    } else {
      channelsModel.currentChannel.messages.push(message);
      broadcastOnRootScope('newMessage', message);
    }
  };

  chatService.getChannels = function() {
    return channelsModel.channels;
  }

  chatService.startGettingChannels = function() {
    if (window.AllJoyn) {
      chatBus.addAdvertisedNameListener(AJ_CHAT_SERVICE_NAME,
        function(advertisedNameObject) {
          channelName = advertisedNameObject.name.split('.').pop();
          console.log('Found channel with name: ' + channelName);
          // Create the new channel only if it doesn't exist in the model
          // yet. A scenario where channel already exists is self-hosted
          // channels where we have already added the channel to the model
          // when we get it advertised from the network.
          if (channelsModel.getChannel(channelName) === null) {
            var channel = new Channel(channelName);
            channelsModel.channels.push(channel);
            broadcastOnRootScope('channelsChanged');
          }
        }
      );
      //AJ_Signal_Lost_Adv_Name
      chatBus.addListener([0, 1, 0, 2], 'sqs', function(response) {
        var channelName = response.arguments[0].split('.').pop();
        if (channelsModel.removeChannel(channelName)) {
          broadcastOnRootScope('channelsChanged');
          if (channelsModel.currentChannel !== null && channelsModel.currentChannel.name == channelName) {
            channelsModel.currentChannel = null;
            broadcastOnRootScope('currentChannelChanged', null);
          }
        }
      });
    }
    else {
      setTimeout(function() {
        var channel = new Channel('My Channel');
        channelsModel.channels.push(channel);
        broadcastOnRootScope('channelsChanged');
      }, 500);
    }
  };

  chatService.createChannel = function(channelName) {
    var deferred = $q.defer();
    var channelWellKnownName = AJ_CHAT_SERVICE_NAME + channelName;

    if (window.AllJoyn) {
      chatBus.startAdvertisingName(function() {
        var channel = new Channel(channelName, true);
        channelsModel.channels.push(channel);
        broadcastOnRootScope('channelsChanged');
        deferred.resolve();
      }, function(status) {
        console.log('Failed to start advertising name ' + channelWellKnownName + ' with status: ' + status);
        deferred.reject();
      }, channelWellKnownName, AJ_CHAT_SERVICE_PORT);
    } else {
      var channel = new Channel(channelName, true);
      channelsModel.channels.push(channel);
      broadcastOnRootScope('channelsChanged');
      deferred.resolve();
    }
    return deferred;
  }

  chatService.removeChannel = function(channelName) {
    var deferred = $q.defer();
    var channelWellKnownName = AJ_CHAT_SERVICE_NAME + channelName;

    if (window.AllJoyn) {
      chatBus.stopAdvertisingName(function() {
        channelsModel.removeChannel(channelName);
        deferred.resolve();
      }, function(status) {
        console.log('Failed to stop advertising name ' + channelWellKnownName + ' with status: ' + status);
        deferred.reject();
      }, channelWellKnownName, AJ_CHAT_SERVICE_PORT);
    } else {
      channelsModel.removeChannel(channelName);
      broadcastOnRootScope('channelsChanged');
      deferred.resolve();
    }
    return deferred;
  }

  return chatService;
});