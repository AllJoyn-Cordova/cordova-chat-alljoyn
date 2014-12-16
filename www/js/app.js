var chatApp = angular.module('chatApp', ['ionic']);

chatApp.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

// Define the common data types globally, because they
// are used across the app

function Channel (name) {
  this.name = name; // Currently assumed to be unique
  this.messages = [];
};

function Message (text, nickname) {
  this.text = text || '';
  this.nickname = nickname || 'Anonymous';
  this.timestamp = new Date();
};

// When running in a Cordova environment, bootstrap
// only after the device is ready. This makes it possible
// to call Cordova plugins in the Angular components without
// checking there whether device is ready or not.
(function() {
  if (window.cordova) {
    document.addEventListener("deviceready", function() {
      angular.bootstrap(document, ['chatApp']);
    }, false);
  } else {
    angular.element(document).ready(function() {
      angular.bootstrap(document, ['chatApp']);
    });
  }
})();
