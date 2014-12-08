var chatApp = angular.module('chatApp');

chatApp.factory('chatService', function($rootScope, $q) {
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
  
  channelsModel.channels.push(new Channel('My Channel'));
  channelsModel.channels.push(new Channel('Another Channel'));

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
    channelsModel.currentChannel.messages.push(message);
    $rootScope.$broadcast('newMessage', message);
  };

  chatService.getChannels = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      if (true) {
        deferred.resolve(channelsModel.channels);
      } else {
        // This would be when unable to fetch channels
        deferred.reject([]);
      }
    }, 1000);
    return deferred.promise;
  };

  return chatService;
});

