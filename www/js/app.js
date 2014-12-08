var chatApp = angular.module('chatApp', ['ionic']);

chatApp.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

chatApp.controller('HeaderController', function($rootScope, $scope, $ionicPopover, chatService) {
  $scope.subheader = chatService.currentChannel();

  $ionicPopover.fromTemplateUrl('channel-selector.html', { scope: $scope }).then(function(popover) {
    $scope.popover = popover;
  });
  $scope.openChannelSelector = function($event) {
    $scope.loading = true;
    $scope.popover.show($event);
    chatService.getChannels().then(function(channels) {
      $scope.loading = false;
      $scope.channels = channels;
    });
  };

  $scope.channelSelected = function($event, channel) {
    chatService.setCurrentChannel(channel);
    $scope.popover.hide();
  };
  $rootScope.$on('currentChannelChanged', function (event, channel) {
    $scope.subheader = channel.name;
  });
});

chatApp.controller('ContentController', function($rootScope, $scope, chatService) {
  $scope.messages = chatService.currentChannelMessages();
  $rootScope.$on('newMessage', function (event, data) {
      $scope.messages = chatService.currentChannelMessages();
  });
});

chatApp.controller('FooterController', function($rootScope, $scope, chatService) {
  $scope.postMessage = function($event) {
    chatService.postCurrentChannel( { text: $scope.message } ); 
    $scope.message = '';
  };
});

chatApp.factory('chatService', function($rootScope, $q) {
  var chatService = {};

  var messages = [ { text: 'Some text' } ];
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