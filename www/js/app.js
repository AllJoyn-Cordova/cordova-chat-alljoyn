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
