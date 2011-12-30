Livestyle
=========
Livestyle is a NodeJS middleware and executable webserver that updates the stylesheets on your web sites live as you edit them.
It does this by injecting a javascript on each html page, which subscribes to changes on the served css files through socket.io.
The server then notifies the client to reload specific stylesheets when they are updated on the file system.
The livestyle client also falls back to active polling, which means you can use the client as a standalone script on your normal web server.

Use livestyle to get live feedback while keeping all your interaction in your favorite editor.
Effective usage parrterns spotted so far:
* Styling parts of webapplications that require several clicks to set the state that you are styling
* Getting instant feedback from many browsers at the same time
* Testing several media queries at the same time with different devices or browser sizes

Usage
=====
Livestyle installs an executable script on your system called `livestyle`.
For quick and dirty usage just change directory to your desired document root and type `livestyle`
The server will now listen on port 3000.

    SYNOPSIS
        livestyle [OPTIONS] [DIRECTORY]
    
    OPTIONS
        -p
            Port the web server should liten on.
            Defaults to 3000

    DIRECTORY
        Document root of the web server.
        Defaults to your current working directory


Installing livestyle
====================
Livestyle depends on NodeJS. Installation files can be found here: http://nodejs.org/dist/latest/
See this page for installation instructions: https://github.com/joyent/node/wiki/Installation
I recommend installing node without needing superuser access by configuring your installation with `./configure --prefix=~/.local` before you make.
Also remember to put node in your `$PATH`

When you have NodeJS run the following command:
    npm install -g livestyle

And you are done.


Supported platforms
===================
Livestyle uses pure web technologies, which have been available for years.
This means that every browser with javascript on any platform is supported, including mobile.
Currently there are some troubles with updating stylesheets using @import in IE, which you want to avoid anyway http://www.stevesouders.com/blog/2009/04/09/dont-use-import/


CSS preprocessors
==================
Since livestyle watches the css files that are actually served to the browser, livestyle work with any CSS preprocessor that runs on the server out of the box.
If you want live updates you will of course need to enable your preprocessors option to automatically build a new CSS files for each file update. livestyle will then detect the update in the built file and push it to the client.

There are two CSS preprocessors that run in the browser, which currently aren't supported:
* Less.js
* Prefixfree
