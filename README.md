cordova-chat-alljoyn
====================

A sample app using the Cordova plugin for AllJoyn.  

This application implements a simple chat service which allows peer to peer chat between to devices over AllJoyn.

Building and Running
--------------------

Easiest way to build and run the app is to use the Cordova command-line tools. More information about installing and using the tools can be found from http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html .

This app depends on the AllJoyn plugin, which needs to be added first before the app works properly. From plugin repository, it can be installed like this:

```
$ cordova plugin add org.allseen.alljoyn
```

or directly from the Git repository like this:

```
$ cordova plugin add https://github.com/AllJoyn-Cordova/cordova-plugin-alljoyn.git
```

After that, you can add the platform you are interested in and run the app. As an example, here is how to run iOS version of the app:

```
$ cordova platform add ios
$ cordova run ios
```

On Windows, you need to pass the correct target architecture for the build system to build a suitable binary. Here are some examples:

```
$ cordova platform add windows
// To run on Windows Phone 8.1 emulator
$ cordova run windows --emulator --archs="x86" -- -phone
// Running on Windows Phone 8.1 device
$ cordova run windows --device --archs="arm" -- -phone
// To run on desktop (current default is Windows 8.1 build)
$ cordova run windows --device --archs="x64" -- -win
```

For the app to work, you need to have an AllJoyn router running in the same network.  Windows 10 preview includes a windows service you can enable to act as an AllJoyn router.  Another option is to download https://allseenalliance.org/releases/alljoyn/14.06.00/alljoyn-14.06.00a-win7x64vs2012-sdk.zip
and run the binary from alljoyn-14.06.00a-win7x64vs2012-sdk-dbg/cpp/bin/samples/chat.exe on the network.

