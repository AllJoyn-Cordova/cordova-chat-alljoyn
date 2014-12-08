var chatApp = angular.module('chatApp');

chatApp.factory('chatService', function($rootScope, $q) {
  var chatService = {};

  var messages = [ { text: 'Mockup chat message' } ];
  var currentChannelMessages = function() {
    return messages;
  };
  chatService.currentChannelMessages = currentChannelMessages;
  
  var currentChannel = '(No Channel)';
  chatService.currentChannel = function() {
    return currentChannel;
  };
  chatService.setCurrentChannel = function(channel) {
    currentChannel = channel;
    $rootScope.$broadcast('currentChannelChanged', channel);
  };
  
  chatService.postCurrentChannel = function(message) {
    messages.push(message);
    $rootScope.$broadcast('newMessage', message);
  };

  chatService.getChannels = function() {
    var deferred = $q.defer();
    setTimeout(function() {
      if (true) {
        deferred.resolve([ { name: 'My Channel' }, { name: 'Another' } ]);
      } else {
        // This would be when unable to fetch channels
        deferred.reject([]);
      }
    }, 1000);
    return deferred.promise;
  };

  return chatService;
});

