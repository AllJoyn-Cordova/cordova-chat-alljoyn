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

chatApp.controller('HeaderController', function($scope, $ionicPopover, $ionicModal) {
  $scope.subheader = '(No Channel)';

  $ionicPopover.fromTemplateUrl('channel-selector.html', { scope: $scope }).then(function(popover) {
    $scope.popover = popover;
  });
  $scope.openChannelSelector = function($event) {
    $scope.channels = [ { name: 'My Channel' }, { name: 'Another' } ];
    $scope.popover.show($event);
  }

  $scope.channelSelected = function($event, channel) {
    $scope.subheader = channel.name;
    $scope.popover.hide();
  }
});

chatApp.controller('ContentController', function($scope) {
  $scope.messages = [];
});

chatApp.controller('FooterController', function($scope) {
});