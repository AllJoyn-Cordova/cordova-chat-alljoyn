var chatApp = angular.module('chatApp');

chatApp.factory('chatService', function($rootScope, $q) {
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
          var message = new Message(response[0]);
          // The $rootScope needs to be accessed in a "non-standard way"
          // inside of this callback function or otherwise things don't work correctly.
          // Approach taken from http://stackoverflow.com/questions/24595460/how-to-access-update-rootscope-from-outside-angular .
          var $rootScope = angular.element(document.body).scope().$root;
          $rootScope.$apply(function() {
            channelsModel.currentChannel.messages.push(message);
            $rootScope.$broadcast('newMessage', message);
          });
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
    if (window.AllJoyn) {
      if (chatSession !== null) {
        chatSession.leave(function() {
          console.log('Leaving a session with id: ' + chatSession.sessionId);
          chatSession = null;
        }, function() {
          console.log('Failed to leave a session with id: ' + chatSession.sessionId);
        });
      }

      AllJoyn.joinSession(function(session) {
        console.log('Joined a session with id: ' + session.sessionId);
        chatSession = session;
      }, function(status) {
        console.log('Failed to join a session: ' + status);
      }, { name: AJ_CHAT_SERVICE_NAME + channel.name, port: AJ_CHAT_SERVICE_PORT });
    }
    channelsModel.currentChannel = channel;
    $rootScope.$broadcast('currentChannelChanged', channel);
  };

  chatService.postCurrentChannel = function(message) {
    if (window.AllJoyn) {
      var chatInterface = chatSession.sessionId === 0 ? [1, 0, 0, 0] : [2, 0, 0, 0];
      chatSession.sendSignal(function() {
        channelsModel.currentChannel.messages.push(message);
        $rootScope.$broadcast('newMessage', message);
        // TODO: Below commented out code makes messages appear
        // right away on iOS, but results into an error on Windows Phone
        //var $rootScope = angular.element(document.body).scope().$root;
        //$rootScope.$apply(function() {
        //  $rootScope.$broadcast('newMessage', message);
        //});
      }, function(status) {
        console.log('Failed to post to current channel: ' + status);
      }, null, null, [2, 0, 0, 0], "s", [message.text]);
    } else {
      channelsModel.currentChannel.messages.push(message);
      $rootScope.$broadcast('newMessage', message);
    }
  };

  chatService.getChannels = function() {
    return channelsModel.channels;
  }

  chatService.startGettingChannels = function() {
    if (window.AllJoyn) {
      AllJoyn.addAdvertisedNameListener(AJ_CHAT_SERVICE_NAME,
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
            var $rootScope = angular.element(document.body).scope().$root;
            $rootScope.$apply(function() {
              $rootScope.$broadcast('channelsChanged');
            });
          }
        }
      );
      //AJ_Signal_Lost_Adv_Name
      chatBus.addListener([0, 1, 0, 2], 'sqs', function(response) {
        var channelName = response[0].split('.').pop();
        if (channelsModel.removeChannel(channelName)) {
          var $rootScope = angular.element(document.body).scope().$root;
          $rootScope.$apply(function() {
            $rootScope.$broadcast('channelsChanged');
            if (channelsModel.currentChannel !== null && channelsModel.currentChannel.name == channelName) {
              channelsModel.currentChannel = null;
              $rootScope.$broadcast('currentChannelChanged', null);
            }
          });
        }
      });
    }
    else {
      setTimeout(function() {
        var channel = new Channel('My Channel');
        channelsModel.channels.push(channel);
        $rootScope.$broadcast('channelsChanged');
      }, 500);
    }
  };

  chatService.createChannel = function(channelName) {
    var deferred = $q.defer();
    var channelWellKnownName = AJ_CHAT_SERVICE_NAME + channelName;

    if (window.AllJoyn) {
      AllJoyn.startAdvertisingName(function() {
        var channel = new Channel(channelName, true);
        channelsModel.channels.push(channel);
        var $rootScope = angular.element(document.body).scope().$root;
        $rootScope.$apply(function() {
          $rootScope.$broadcast('channelsChanged');
        });
        deferred.resolve();
      }, function(status) {
        console.log('Failed to start advertising name ' + channelWellKnownName + ' with status: ' + status);
        deferred.reject();
      }, channelWellKnownName, AJ_CHAT_SERVICE_PORT);
    } else {
      var channel = new Channel(channelName, true);
      channelsModel.channels.push(channel);
      $rootScope.$broadcast('channelsChanged');
      deferred.resolve();
    }
    return deferred;
  }

  chatService.removeChannel = function(channelName) {
    var deferred = $q.defer();
    var channelWellKnownName = AJ_CHAT_SERVICE_NAME + channelName;

    if (window.AllJoyn) {
      AllJoyn.stopAdvertisingName(function() {
        channelsModel.removeChannel(channelName);
        deferred.resolve();
      }, function(status) {
        console.log('Failed to stop advertising name ' + channelWellKnownName + ' with status: ' + status);
        deferred.reject();
      }, channelWellKnownName, AJ_CHAT_SERVICE_PORT);
    } else {
      channelsModel.removeChannel(channelName);
      $rootScope.$broadcast('channelsChanged');
      deferred.resolve();
    }
    return deferred;
  }

  return chatService;
});