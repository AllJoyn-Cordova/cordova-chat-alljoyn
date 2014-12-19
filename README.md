cordova-chat-alljoyn
====================

A sample app using the Cordova plugin for AllJoyn.

Building and running on Windows
-------------------------------
This app uses an unreleased Cordova feature so to build and run with Cordova
scripts, one must use a custom version of cordova-lib and cordova-cli. Below
is how to get the required versions. The commands are such that they work in
a command prompt like Git Bash.

```
// Clone the right version of cordova-lib and cordova-cli
$ cd <local-folder-for-custom-cordova>
$ git clone https://github.com/MSOpenTech/cordova-lib.git && git -C cordova-lib checkout a12af4d5306aaf6a41b515536bead2bab9059840
$ git clone https://github.com/apache/cordova-cli.git && git -C cordova-cli checkout 4.1.2
$ cd cordova-lib/cordova-lib
$ npm install && npm link
$ cd ../../cordova-cli && npm link cordova-lib && npm install
```

Next, one can build and run this app using the custom Cordova scripts.
Note that for the app to work, you need to have an AllJoyn router and a chat
service running in the same network in which your app's target device is.
Perhaps easiest option is to download https://allseenalliance.org/releases/alljoyn/14.06.00/alljoyn-14.06.00a-win7x64vs2012-sdk.zip
and run the binary from alljoyn-14.06.00a-win7x64vs2012-sdk-dbg/cpp/bin/samples/chat.exe on
the same machine on which you run this Cordova chat app.

```
// Navigate to the folder to which you cloned this app
$ cd <local-folder-of-this-app>
// Pick one of the 2 options below
// Option 1: Add the Cordova plugin for AllJoyn directly from github
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova plugin add https://github.com/vjrantal/cordova-plugin-alljoyn.git
// Option 2: Add the Cordova plugin for AllJoyn from a local folder
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova plugin add <local-path-of-cordova-plugin-alljoyn>
// Add the Windows platform
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova platform add windows
// To run on Windows Phone 8.1 emulator
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova run windows --emulator --archs="x86" -- -phone
// Running on Windows Phone 8.1 device
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova run windows --device --archs="arm" -- -phone
// To run on desktop (current default is Windows 8.0 build)
$ <local-folder-for-custom-cordova>/cordova-cli/bin/cordova run windows --device --archs="x64" -- -win
```
