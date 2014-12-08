var chatApp = angular.module('chatApp');

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
    // Internet Explorer fires both touch events and pointer events
    // which results into landing into this handler twice per tap.
    // The isIonicTap property is not true for the duplicate event
    // so using it to filter duplicates even though that might not be
    // extremely future proof way of handling this.
    if ($event.isIonicTap) {
      chatService.postCurrentChannel( { text: $scope.message } ); 
      $scope.message = '';
    }
  };
});