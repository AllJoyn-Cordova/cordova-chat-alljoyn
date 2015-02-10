cordova-chat-alljoyn
====================

A sample app using the Cordova plugin for AllJoyn.  

This application implements a simple chat service which allows peer to peer chat between to devices over AllJoyn.

Building and Running on Windows
-------------------------------
For Windows compilation, a pre-release copy of Cordova libraries is required until the next Cordova release.  One must use a custom version of cordova-lib and cordova-cli.

This is how you clone the correct Cordova libraries:

```
// Clone the right version of cordova-lib and cordova-cli
$ cd <local-folder-for-custom-cordova>
$ git clone https://github.com/MSOpenTech/cordova-lib.git && git -C cordova-lib checkout CB-8123-final
$ git clone https://github.com/apache/cordova-cli.git && git -C cordova-cli checkout 4.2.0
$ cd cordova-lib/cordova-lib
$ npm install && npm link
$ cd ../../cordova-cli && npm link cordova-lib && npm install
```

Next, one can build and run this app using the custom Cordova scripts.

For the app to work, you need to have an AllJoyn router and a chat
service running in the same network.

Perhaps easiest option is to download https://allseenalliance.org/releases/alljoyn/14.06.00/alljoyn-14.06.00a-win7x64vs2012-sdk.zip
and run the binary from alljoyn-14.06.00a-win7x64vs2012-sdk-dbg/cpp/bin/samples/chat.exe on
the same machine on which you run this Cordova chat app.

```
// Navigate to the folder to which you cloned this app
$ cd <local-folder-of-this-app>
// Pick one of the 2 options below
// Option 1: Add the Cordova plugin for AllJoyn directly from github
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova plugin add https://github.com/stefangordon/cordova-plugin-alljoyn.git
// Option 2: Add the Cordova plugin for AllJoyn from a local folder
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova plugin add <local-path-of-cordova-plugin-alljoyn>
// Add the Windows platform
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova platform add windows
// To run on Windows Phone 8.1 emulator
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova run windows --emulator --archs="x86" -- -phone
// Running on Windows Phone 8.1 device
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova run windows --device --archs="arm" -- -phone
// To run on desktop (current default is Windows 8.1 build)
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova run windows --device --archs="x64" -- -win
```
