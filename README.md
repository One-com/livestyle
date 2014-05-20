Livestyle
=========
[![NPM version](https://badge.fury.io/js/livestyle.png)](http://badge.fury.io/js/livestyle)
[![Build Status](https://travis-ci.org/One-com/livestyle.png?branch=master)](https://travis-ci.org/One-com/livestyle)
[![Dependency Status](https://david-dm.org/One-com/livestyle.png)](https://david-dm.org/One-com/livestyle)

Livestyle is a small web server that refreshes the stylesheets on your
web sites live as you edit them.

It does so by injecting a small JavaScript client on each html page,
which subscribes to changes on the served css files through a
WebSocket (via [socket.io](https://github.com/LearnBoost/socket.io)).

The server then notifies the client to reload specific stylesheets
when they are updated on the file system.

The livestyle client also falls back to active polling, which means
you can use the client as a standalone script on your normal web
server.

Use livestyle to get live feedback while staying in your favorite
editor. Effective use cases spotted so far:

* Styling parts of web applications that require several clicks to
  get to the state you are working on.
* Getting instant feedback from many browsers at the same time, including mobile browsers!
* Testing several media queries at the same time with different
  devices or browser window sizes.

Usage
=====
Livestyle installs an executable script on your system called `livestyle`.

To get started quickly just change the directory to where your
document root is and run the `livestyle` command. The server will now
listen on port 3000.

Here's the full set of command line options:

#### --root|-r &lt;dir&gt;

The directory to serve static files from. Unless `--proxy` is
specified, it defaults to the current working directory. If you want
to serve static files in `--proxy` mode, `--root` must be specified
explicitly.

#### --host|-h &lt;hostNameOrIp&gt;

The local hostname or IP-address to listen on. Defaults to `0.0.0.0`.

#### --port|-p &lt;portNumber&gt;

The local post number to listen on. Defaults to `3000`.

#### --proxy http://&lt;hostname&gt;[:port]/

Instructs livestyle to proxy requests for everything but CSS files to
a remote server, as determined by the `Accept` request header.

#### --map|-m &lt;sourcePathPrefix&gt;=&lt;targetPathPrefix&gt;

Translate the paths of incoming requests. Think of it as a very
primitive mod_rewrite that only works on request path prefixes.  For
example, to translate all requests for `/foo/*` to `/bar/*`, use this
switch: `--map /foo/=/bar/`

Multiple --map switches are allowed. When used in conjunction with
`--proxy`, the mappings are applied before proxying the request.

#### --compiless

Compile less assets on-the-fly using <a
href="https://github.com/papandreou/express-compiless">express-compiless</a>. Also
supports watching @import'ed less assets.

#### --autoprefixer

add missing css vendor prefixes on the fly using
[express-autoprefixer](https://github.com/gustavnikolaj/express-autoprefixer)

If you only provide the flag with no value (like this:
`--autoprefixer`) it will use the autoprefixer defaults.  '> 1%, last
2 versions, Firefox ESR, Opera 12.1'.

You can pass options as a string of supported browsers separated by comma. For syntax
and valid options see the autoprefixer [projectpage](https://github.com/ai/autoprefixer).

If you wish to support IE9 and the last 2 versions of every browser
you should provide the options like this: `--autoprefixer "ie > 8, last 2 versions"`.

#### --jsxtransform

If this value is set, JSX code (used in
[facebook/react](https://github.com/facebook/react) will be compiled
to javascript on the way out. Using
[express-jsxtransform](https://github.com/gustavnikolaj/express-jsxtransform).

#### --processimage

Process images on the server according to the query string using using <a
href="https://github.com/papandreou/express-processimage">express-processimage</a>.

#### --watchhtml

Also watch the HTML file itself and refresh if it changes on disc.

#### --watchcssimages

Also watch (background) images used by CSS and refresh them if they change on disc.

#### --debug|-d

Outputs a bunch of debugging information on both the server and the
client.

#### --watchfile=true

If set, will use fs.watchFile instead of fs.watch.
If you experience problems that the server stops watching a file
after the first time you save a file, this method will help.

#### --mtime

Only notify clients about a changed file if its `mtime` has
increased. Experimental, only supported when using `fs.watch`.

Installing livestyle
====================
Livestyle requires NodeJS and npm to be installed. See this page for
installation instructions:
https://github.com/joyent/node/wiki/Installation

When the prerequisites are in place, run the following command:

    npm install -g livestyle

And you are done.


Supported platforms
===================
Livestyle uses pure web technologies. It uses WebSockets if possible,
but falls back to polling via XHRs. This means that every non-ancient,
JavaScript-enabled browser should be supported, also on mobile.

Currently there are some troubles with updating stylesheets using
@import in IE, which you want to avoid anyway
http://www.stevesouders.com/blog/2009/04/09/dont-use-import/


Module loaders
==============
Livestyle supports asynchronous loading and injection of stylesheets.
If you are using requirejs you might want to take a look at css.js and
less.js, wich can be used as module loaders for both less and css
files using requirejs like so:

``` javascript
define([
    'less!bootstrap/theme.less',
    'css!styles/myLoginBox.css'
], function () {
    // My module depending on certain styles
})
```

These two loaders are both usable without livestyle.
The less.js loader will change behavior depending on wether you have
set the `--compiless` flag for livestyle to make live updates possible.


CSS preprocessors
=================
Since livestyle watches the css files that are actually served to the
browser, livestyle work with any CSS preprocessor that runs on the
server out of the box.

If you want live updates you will of course need to enable your
preprocessor's option to automatically build a new CSS files for each
file update. livestyle will then detect the update in the built file
and push it to the client.

There are two CSS preprocessors that run in the browser, which is a
bit of a special case:

Prefixfree
----------
[Prefixfree](http://leaverou.github.com/prefixfree/) inserts vendor
prefixes for the style properties that need them. It does this runtime
in the browser by fetching the stylesheet content through XHR and
replace the link tags with a style block with prefixed CSS. Livestyle
now supports prefixfree.

Less.js
-------
[Less.js](https://github.com/cloudhead/less.js) injects preprocessed
style into the page by loading .less files and reworking the content
to real CSS. Livestyle supports live updates using Less.js by
refreshing all less stylesheets on the page.

License
-------

LiveStyle is licensed under a standard 3-clause BSD license -- see the
`LICENSE`-file for details.
