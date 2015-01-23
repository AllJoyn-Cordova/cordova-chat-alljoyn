var chatApp = angular.module('chatApp');

chatApp.factory('chatService', function($rootScope, $q) {
  // Initialize the AllJoyn chat session if the AllJoyn API
  // is available.
  if (window.AllJoyn) {
    var AJ_CHAT_SERVICE_NAME = "org.alljoyn.bus.samples.chat.";
    var AJ_CHAT_SERVICE_PORT = 27;

    var chatSession = null;

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
    AllJoyn.registerObjects(function() {}, function() {}, null, proxyObjects);
  }

  var chatService = {};

  chatService.connect = function() {
    var deferred = $q.defer();
    if (window.AllJoyn) {
      AllJoyn.connect(function(bus) {
        console.log('Found bus and connected.');

        // Handler for new chat messages
        bus.addListener([2, 0, 0, 0], 's', function(response) {
          if (channelsModel.currentChannel == null) return;
          var message = new Message(response);
          // The $rootScope needs to be accessed in a "non-standard way"
          // inside of this callback function or otherwise things don't work correctly.
          // Approach taken from http://stackoverflow.com/questions/24595460/how-to-access-update-rootscope-from-outside-angular .
          var $rootScope = angular.element(document.body).scope().$root;
          $rootScope.$apply(function() {
            channelsModel.currentChannel.messages.push(message);
            $rootScope.$broadcast('newMessage', message);
          });
        });

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
    // No need to do anything if channel set to the current channel
    if (channelsModel.currentChannel != null && channel.name == channelsModel.currentChannel.name) {
      return;
    }
    if (window.AllJoyn) {
      if (chatSession !== null) {
        var aj_status = AllJoynWinRTComponent.AllJoyn.aj_BusLeaveSession(aj_busAttachment, aj_sessionId);
        if (aj_status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
          console.log('Leaving a session with id: ' + aj_sessionId);
          aj_sessionId = 0;
        } else {
          console.log('Failed to leave a session with id: ' + aj_sessionId);
        }
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
      chatSession.sendSignal(function() {
        channelsModel.currentChannel.messages.push(message);
        $rootScope.$broadcast('newMessage', message);
      }, function(status) {
        console.log('Failed to post to current channel: ' + status);
      }, null, null, [2, 0, 0, 0], "s", [message.text]);
    } else {
      channelsModel.currentChannel.messages.push(message);
      $rootScope.$broadcast('newMessage', message);
    }
  };

  chatService.getChannels = function() {
    var deferred = $q.defer();
    if (window.AllJoyn) {
      AllJoyn.startFindingAdvertisedName(function(advertisedName) {
        channelName = advertisedName.name.split('.').pop();
        console.log('Found channel with name: ' + channelName);
        channelsModel.channels = [new Channel(channelName)];
        //AllJoynWinRTComponent.AllJoyn.aj_BusFindAdvertisedName(aj_busAttachment, AJ_CHAT_SERVICE_NAME, AJ_BUS_STOP_FINDING);
        deferred.resolve(channelsModel.channels);
      }, function(status) {
        deferred.reject();
      }, AJ_CHAT_SERVICE_NAME);
    } else {
      setTimeout(function() {
        channelsModel.channels = [new Channel('My Channel'), new Channel('Another Channel')];
        deferred.resolve(channelsModel.channels);
      }, 100);
    }
    return deferred.promise;
  };

  return chatService;
});