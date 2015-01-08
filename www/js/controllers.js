// This is a workaround for ng-click handlers getting called twice.
// Issue reported at https://github.com/driftyco/ionic/issues/2885
window.addEventListener('click', function(event) {
  if (Object.prototype.toString.call(event) == '[object PointerEvent]') {
    event.stopPropagation();
  }
}
, true);

var chatApp = angular.module('chatApp');

chatApp.controller('HeaderController', function($rootScope, $scope, $ionicPopover, $ionicPopup, chatService) {

  $ionicPopover.fromTemplateUrl('channel-selector.html', { scope: $scope }).then(function(popover) {
    $scope.popover = popover;
  });
  $scope.channelsClicked = function($event) {
    $scope.loading = true;
    $scope.popover.show($event);
    chatService.getChannels().then(function(channels) {
      $scope.loading = false;
      $scope.channels = channels;
    });
  };

  var connectedSubHeaderTitle = '(no channel)';
  var notConnectedSubHeaderTitle = '(not connected)';
  $scope.connected = false;
  $scope.subheader = notConnectedSubHeaderTitle;
  $scope.connectClicked = function($event) {
    chatService.connect().then(function() {
      $scope.connected = true;
      $scope.subheader = connectedSubHeaderTitle;
      console.log('Connected.');
    }, function() {
      $ionicPopup.alert({
        title: 'Could not connect'
      });
      $scope.connected = false;
      $scope.subheader = notConnectedSubHeaderTitle;
      console.log('Could not connect.');
    });
  }

  $scope.channelSelected = function($event, channel) {
    chatService.setCurrentChannel(channel);
    $scope.popover.hide();
  };
  $rootScope.$on('currentChannelChanged', function(event, channel) {
    $scope.subheader = channel.name;
  });
});

chatApp.controller('ContentController', function($rootScope, $scope, chatService) {
  $scope.messages = chatService.currentChannelMessages();
  $rootScope.$on('newMessage', function(event, data) {
    $scope.messages = chatService.currentChannelMessages();
  });
  $rootScope.$on('currentChannelChanged', function(event, channel) {
    $scope.messages = chatService.currentChannelMessages();
  });
});

chatApp.controller('FooterController', function($rootScope, $scope, $ionicPopup, chatService) {
  $scope.postMessage = function($event) {
    if (chatService.currentChannel() == null) {
      // Can't post if not on channel
      $ionicPopup.alert({
        title: 'Select a channel first'
      }).then(function(result) {
        // If something is needed after popup closed
      });
    } else {
      if ($scope.message) {
        chatService.postCurrentChannel(new Message($scope.message));
        $scope.message = '';
      }
    }
  };
});