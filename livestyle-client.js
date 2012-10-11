/*global document, location, io, XMLHttpRequest, setTimeout, setInterval, clearInterval, StyleFix, less, ActiveXObject*/
(function () {
    'use strict';

    var liveStyleOptions = {}; // The options will be injected by the server

    function log(msg) {
        if (liveStyleOptions.debug && window.console) {
            console.log(msg);
        }
    }

    // From lib/url.js in node.js (sorry)!
    var protocolPattern = /^([a-z0-9.+-]+:)/i,
        portPattern = /:[0-9]*$/,

        // RFC 2396: characters reserved for delimiting URLs.
        // We actually just auto-escape these.
        delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

        // RFC 2396: characters not allowed for various reasons.
        unwise = ['{', '}', '|', '\\', '^', '~', '`'].concat(delims),

        // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
        autoEscape = ['\''].concat(delims),
        // Characters that are never ever allowed in a hostname.
        // Note that any invalid chars are also handled, but these
        // are the ones that are *expected* to be seen, so we fast-path
        // them.
        nonHostChars = ['%', '/', '?', ';', '#']
          .concat(unwise).concat(autoEscape),
        nonAuthChars = ['/', '@', '?', '#'].concat(delims),
        hostnameMaxLen = 255,
        hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
        hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
        // protocols that can allow "unsafe" and "unwise" chars.
        unsafeProtocol = {
          'javascript': true,
          'javascript:': true
        },
        // protocols that never have a hostname.
        hostlessProtocol = {
          'javascript': true,
          'javascript:': true
        },
        // protocols that always have a path component.
        pathedProtocol = {
          'http': true,
          'https': true,
          'ftp': true,
          'gopher': true,
          'file': true,
          'http:': true,
          'ftp:': true,
          'gopher:': true,
          'file:': true
        },
        // protocols that always contain a // bit.
        slashedProtocol = {
          'http': true,
          'https': true,
          'ftp': true,
          'gopher': true,
          'file': true,
          'http:': true,
          'https:': true,
          'ftp:': true,
          'gopher:': true,
          'file:': true
        }/*,
        querystring = require('querystring')*/;

    function urlParse(url, parseQueryString, slashesDenoteHost) {
      if (url && typeof(url) === 'object' && url.href) return url;

      if (typeof url !== 'string') {
        throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
      }

      var out = {},
          rest = url;

      // trim before proceeding.
      // This is to support parse stuff like "  http://foo.com  \n"
      rest = rest.trim();

      var proto = protocolPattern.exec(rest);
      if (proto) {
        proto = proto[0];
        var lowerProto = proto.toLowerCase();
        out.protocol = lowerProto;
        rest = rest.substr(proto.length);
      }

      // figure out if it's got a host
      // user@server is *always* interpreted as a hostname, and url
      // resolution will treat //foo/bar as host=foo,path=bar because that's
      // how the browser resolves relative URLs.
      if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
        var slashes = rest.substr(0, 2) === '//';
        if (slashes && !(proto && hostlessProtocol[proto])) {
          rest = rest.substr(2);
          out.slashes = true;
        }
      }

      if (!hostlessProtocol[proto] &&
          (slashes || (proto && !slashedProtocol[proto]))) {
        // there's a hostname.
        // the first instance of /, ?, ;, or # ends the host.
        // don't enforce full RFC correctness, just be unstupid about it.

        // If there is an @ in the hostname, then non-host chars *are* allowed
        // to the left of the first @ sign, unless some non-auth character
        // comes *before* the @-sign.
        // URLs are obnoxious.
        var atSign = rest.indexOf('@');
        if (atSign !== -1) {
          var auth = rest.slice(0, atSign);

          // there *may be* an auth
          var hasAuth = true;
          for (var i = 0, l = nonAuthChars.length; i < l; i++) {
            if (auth.indexOf(nonAuthChars[i]) !== -1) {
              // not a valid auth.  Something like http://foo.com/bar@baz/
              hasAuth = false;
              break;
            }
          }

          if (hasAuth) {
            // pluck off the auth portion.
            out.auth = decodeURIComponent(auth);
            rest = rest.substr(atSign + 1);
          }
        }

        var firstNonHost = -1;
        for (var i = 0, l = nonHostChars.length; i < l; i++) {
          var index = rest.indexOf(nonHostChars[i]);
          if (index !== -1 &&
              (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
        }

        if (firstNonHost !== -1) {
          out.host = rest.substr(0, firstNonHost);
          rest = rest.substr(firstNonHost);
        } else {
          out.host = rest;
          rest = '';
        }

        // pull out port.
        var p = parseHost(out.host);
        var keys = Object.keys(p);
        for (var i = 0, l = keys.length; i < l; i++) {
          var key = keys[i];
          out[key] = p[key];
        }

        // we've indicated that there is a hostname,
        // so even if it's empty, it has to be present.
        out.hostname = out.hostname || '';

        // if hostname begins with [ and ends with ]
        // assume that it's an IPv6 address.
        var ipv6Hostname = out.hostname[0] === '[' &&
            out.hostname[out.hostname.length - 1] === ']';

        // validate a little.
        if (out.hostname.length > hostnameMaxLen) {
          out.hostname = '';
        } else if (!ipv6Hostname) {
          var hostparts = out.hostname.split(/\./);
          for (var i = 0, l = hostparts.length; i < l; i++) {
            var part = hostparts[i];
            if (!part) continue;
            if (!part.match(hostnamePartPattern)) {
              var newpart = '';
              for (var j = 0, k = part.length; j < k; j++) {
                if (part.charCodeAt(j) > 127) {
                  // we replace non-ASCII char with a temporary placeholder
                  // we need this to make sure size of hostname is not
                  // broken by replacing non-ASCII by nothing
                  newpart += 'x';
                } else {
                  newpart += part[j];
                }
              }
              // we test again with ASCII char only
              if (!newpart.match(hostnamePartPattern)) {
                var validParts = hostparts.slice(0, i);
                var notHost = hostparts.slice(i + 1);
                var bit = part.match(hostnamePartStart);
                if (bit) {
                  validParts.push(bit[1]);
                  notHost.unshift(bit[2]);
                }
                if (notHost.length) {
                  rest = '/' + notHost.join('.') + rest;
                }
                out.hostname = validParts.join('.');
                break;
              }
            }
          }
        }

        // hostnames are always lower case.
        out.hostname = out.hostname.toLowerCase();

        if (!ipv6Hostname) {
          // IDNA Support: Returns a puny coded representation of "domain".
          // It only converts the part of the domain name that
          // has non ASCII characters. I.e. it dosent matter if
          // you call it with a domain that already is in ASCII.
          var domainArray = out.hostname.split('.');
          var newOut = [];
          for (var i = 0; i < domainArray.length; ++i) {
            var s = domainArray[i];
            newOut.push(/*s.match(/[^A-Za-z0-9_-]/) ?
                'xn--' + punycode.encode(s) :*/ s);
          }
          out.hostname = newOut.join('.');
        }

        out.host = (out.hostname || '') +
            ((out.port) ? ':' + out.port : '');
        out.href += out.host;

        // strip [ and ] from the hostname
        if (ipv6Hostname) {
          out.hostname = out.hostname.substr(1, out.hostname.length - 2);
          if (rest[0] !== '/') {
            rest = '/' + rest;
          }
        }
      }

      // now rest is set to the post-host stuff.
      // chop off any delim chars.
      if (!unsafeProtocol[lowerProto]) {

        // First, make 100% sure that any "autoEscape" chars get
        // escaped, even if encodeURIComponent doesn't think they
        // need to be.
        for (var i = 0, l = autoEscape.length; i < l; i++) {
          var ae = autoEscape[i];
          var esc = encodeURIComponent(ae);
          if (esc === ae) {
            esc = escape(ae);
          }
          rest = rest.split(ae).join(esc);
        }
      }


      // chop off from the tail first.
      var hash = rest.indexOf('#');
      if (hash !== -1) {
        // got a fragment string.
        out.hash = rest.substr(hash);
        rest = rest.slice(0, hash);
      }
      var qm = rest.indexOf('?');
      if (qm !== -1) {
        out.search = rest.substr(qm);
        out.query = rest.substr(qm + 1);
        if (parseQueryString) {
          //out.query = querystring.parse(out.query);
        }
        rest = rest.slice(0, qm);
      } else if (parseQueryString) {
        // no query string, but parseQueryString still requested
        out.search = '';
        out.query = {};
      }
      if (rest) out.pathname = rest;
      if (slashedProtocol[proto] &&
          out.hostname && !out.pathname) {
        out.pathname = '/';
      }

      //to support http.request
      if (out.pathname || out.search) {
        out.path = (out.pathname ? out.pathname : '') +
                   (out.search ? out.search : '');
      }

      // finally, reconstruct the href based on what has been validated.
      out.href = urlFormat(out);
      return out;
    }

    // format a parsed object into a url string
    function urlFormat(obj) {
      // ensure it's an object, and not a string url.
      // If it's an obj, this is a no-op.
      // this way, you can call url_format() on strings
      // to clean up potentially wonky urls.
      if (typeof(obj) === 'string') obj = urlParse(obj);

      var auth = obj.auth || '';
      if (auth) {
        auth = encodeURIComponent(auth);
        auth = auth.replace(/%3A/i, ':');
        auth += '@';
      }

      var protocol = obj.protocol || '',
          pathname = obj.pathname || '',
          hash = obj.hash || '',
          host = false,
          query = '';

      if (obj.host !== undefined) {
        host = auth + obj.host;
      } else if (obj.hostname !== undefined) {
        host = auth + (obj.hostname.indexOf(':') === -1 ?
            obj.hostname :
            '[' + obj.hostname + ']');
        if (obj.port) {
          host += ':' + obj.port;
        }
      }

      if (obj.query && typeof obj.query === 'object' &&
          Object.keys(obj.query).length) {
        //query = querystring.stringify(obj.query);
      }

      var search = obj.search || (query && ('?' + query)) || '';

      if (protocol && protocol.substr(-1) !== ':') protocol += ':';

      // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
      // unless they had them to begin with.
      if (obj.slashes ||
          (!protocol || slashedProtocol[protocol]) && host !== false) {
        host = '//' + (host || '');
        if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
      } else if (!host) {
        host = '';
      }

      if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
      if (search && search.charAt(0) !== '?') search = '?' + search;

      return protocol + host + pathname + search + hash;
    }

    function urlResolve(source, relative) {
      return urlFormat(urlResolveObject(source, relative));
    }

    function urlResolveObject(source, relative) {
      if (!source) return relative;

      source = urlParse(urlFormat(source), false, true);
      relative = urlParse(urlFormat(relative), false, true);

      // hash is always overridden, no matter what.
      source.hash = relative.hash;

      if (relative.href === '') {
        source.href = urlFormat(source);
        return source;
      }

      // hrefs like //foo/bar always cut to the protocol.
      if (relative.slashes && !relative.protocol) {
        relative.protocol = source.protocol;
        //urlParse appends trailing / to urls like http://www.example.com
        if (slashedProtocol[relative.protocol] &&
            relative.hostname && !relative.pathname) {
          relative.path = relative.pathname = '/';
        }
        relative.href = urlFormat(relative);
        return relative;
      }

      if (relative.protocol && relative.protocol !== source.protocol) {
        // if it's a known url protocol, then changing
        // the protocol does weird things
        // first, if it's not file:, then we MUST have a host,
        // and if there was a path
        // to begin with, then we MUST have a path.
        // if it is file:, then the host is dropped,
        // because that's known to be hostless.
        // anything else is assumed to be absolute.
        if (!slashedProtocol[relative.protocol]) {
          relative.href = urlFormat(relative);
          return relative;
        }
        source.protocol = relative.protocol;
        if (!relative.host && !hostlessProtocol[relative.protocol]) {
          var relPath = (relative.pathname || '').split('/');
          while (relPath.length && !(relative.host = relPath.shift()));
          if (!relative.host) relative.host = '';
          if (!relative.hostname) relative.hostname = '';
          if (relPath[0] !== '') relPath.unshift('');
          if (relPath.length < 2) relPath.unshift('');
          relative.pathname = relPath.join('/');
        }
        source.pathname = relative.pathname;
        source.search = relative.search;
        source.query = relative.query;
        source.host = relative.host || '';
        source.auth = relative.auth;
        source.hostname = relative.hostname || relative.host;
        source.port = relative.port;
        //to support http.request
        if (source.pathname !== undefined || source.search !== undefined) {
          source.path = (source.pathname ? source.pathname : '') +
                        (source.search ? source.search : '');
        }
        source.slashes = source.slashes || relative.slashes;
        source.href = urlFormat(source);
        return source;
      }

      var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
          isRelAbs = (
              relative.host !== undefined ||
              relative.pathname && relative.pathname.charAt(0) === '/'
          ),
          mustEndAbs = (isRelAbs || isSourceAbs ||
                        (source.host && relative.pathname)),
          removeAllDots = mustEndAbs,
          srcPath = source.pathname && source.pathname.split('/') || [],
          relPath = relative.pathname && relative.pathname.split('/') || [],
          psychotic = source.protocol &&
              !slashedProtocol[source.protocol];

      // if the url is a non-slashed url, then relative
      // links like ../.. should be able
      // to crawl up to the hostname, as well.  This is strange.
      // source.protocol has already been set by now.
      // Later on, put the first path part into the host field.
      if (psychotic) {

        delete source.hostname;
        delete source.port;
        if (source.host) {
          if (srcPath[0] === '') srcPath[0] = source.host;
          else srcPath.unshift(source.host);
        }
        delete source.host;
        if (relative.protocol) {
          delete relative.hostname;
          delete relative.port;
          if (relative.host) {
            if (relPath[0] === '') relPath[0] = relative.host;
            else relPath.unshift(relative.host);
          }
          delete relative.host;
        }
        mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
      }

      if (isRelAbs) {
        // it's absolute.
        source.host = (relative.host || relative.host === '') ?
                          relative.host : source.host;
        source.hostname = (relative.hostname || relative.hostname === '') ?
                          relative.hostname : source.hostname;
        source.search = relative.search;
        source.query = relative.query;
        srcPath = relPath;
        // fall through to the dot-handling below.
      } else if (relPath.length) {
        // it's relative
        // throw away the existing file, and take the new path instead.
        if (!srcPath) srcPath = [];
        srcPath.pop();
        srcPath = srcPath.concat(relPath);
        source.search = relative.search;
        source.query = relative.query;
      } else if ('search' in relative) {
        // just pull out the search.
        // like href='?foo'.
        // Put this after the other two cases because it simplifies the booleans
        if (psychotic) {
          source.hostname = source.host = srcPath.shift();
          //occationaly the auth can get stuck only in host
          //this especialy happens in cases like
          //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
          var authInHost = source.host && source.host.indexOf('@') > 0 ?
                           source.host.split('@') : false;
          if (authInHost) {
            source.auth = authInHost.shift();
            source.host = source.hostname = authInHost.shift();
          }
        }
        source.search = relative.search;
        source.query = relative.query;
        //to support http.request
        if (source.pathname !== undefined || source.search !== undefined) {
          source.path = (source.pathname ? source.pathname : '') +
                        (source.search ? source.search : '');
        }
        source.href = urlFormat(source);
        return source;
      }
      if (!srcPath.length) {
        // no path at all.  easy.
        // we've already handled the other stuff above.
        delete source.pathname;
        //to support http.request
        if (!source.search) {
          source.path = '/' + source.search;
        } else {
          delete source.path;
        }
        source.href = urlFormat(source);
        return source;
      }
      // if a url ENDs in . or .., then it must get a trailing slash.
      // however, if it ends in anything else non-slashy,
      // then it must NOT get a trailing slash.
      var last = srcPath.slice(-1)[0];
      var hasTrailingSlash = (
          (source.host || relative.host) && (last === '.' || last === '..') ||
          last === '');

      // strip single dots, resolve double dots to parent dir
      // if the path tries to go above the root, `up` ends up > 0
      var up = 0;
      for (var i = srcPath.length; i >= 0; i--) {
        last = srcPath[i];
        if (last == '.') {
          srcPath.splice(i, 1);
        } else if (last === '..') {
          srcPath.splice(i, 1);
          up++;
        } else if (up) {
          srcPath.splice(i, 1);
          up--;
        }
      }

      // if the path is allowed to go above the root, restore leading ..s
      if (!mustEndAbs && !removeAllDots) {
        for (; up--; up) {
          srcPath.unshift('..');
        }
      }

      if (mustEndAbs && srcPath[0] !== '' &&
          (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
        srcPath.unshift('');
      }

      if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
        srcPath.push('');
      }

      var isAbsolute = srcPath[0] === '' ||
          (srcPath[0] && srcPath[0].charAt(0) === '/');

      // put the host back
      if (psychotic) {
        source.hostname = source.host = isAbsolute ? '' :
                                        srcPath.length ? srcPath.shift() : '';
        //occationaly the auth can get stuck only in host
        //this especialy happens in cases like
        //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
        var authInHost = source.host && source.host.indexOf('@') > 0 ?
                         source.host.split('@') : false;
        if (authInHost) {
          source.auth = authInHost.shift();
          source.host = source.hostname = authInHost.shift();
        }
      }

      mustEndAbs = mustEndAbs || (source.host && srcPath.length);

      if (mustEndAbs && !isAbsolute) {
        srcPath.unshift('');
      }

      source.pathname = srcPath.join('/');
      //to support request.http
      if (source.pathname !== undefined || source.search !== undefined) {
        source.path = (source.pathname ? source.pathname : '') +
                      (source.search ? source.search : '');
      }
      source.auth = relative.auth || source.auth;
      source.slashes = source.slashes || relative.slashes;
      source.href = urlFormat(source);
      return source;
    }

    function parseHost(host) {
      var out = {};
      var port = portPattern.exec(host);
      if (port) {
        port = port[0];
        if (port !== ':') {
          out.port = port.substr(1);
        }
        host = host.substr(0, host.length - port.length);
      }
      if (host) out.hostname = host;
      return out;
    }


    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (o, from) {
            var i;
            for (i = from || 0; i < this.length; i += 1) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    var pollTimeout = 2000,
        changedHrefsQueue = [], // Queue of incoming change events
        isBusyByHref = {},
        escapeRegExp = function (str) {
            return str.replace(/[\.\+\*\{\}\[\]\(\)\?\^\$]/g, '\\$&');
        },
        cleanHref = function (href) {
            if (!href) {
                return false;
            }
            var local = new RegExp(
                '^' + escapeRegExp(document.location.protocol + '//' + document.location.hostname + (document.location.port ? ':' + document.location.port : '')) + '/',
                'i'),
                proxy,
                remote = /:\/\/|^\/\//;

            // Skip things like chrome-extension://hmdcmlfkchdmnmnmheododdhjedfccka/inject/anchor-cursor-default.css?0.2.6
            if (/^[\w\-]+:/.test(href) && !/^https?:/.test(href)) {
                return false;
            }

            if (liveStyleOptions.proxy) {
                proxy = new RegExp('^' + escapeRegExp(liveStyleOptions.proxy), 'i');
                if (proxy.test(href)) {
                    return '/' + href.replace(proxy, '');
                }
            }

            if (!local.test(href) && (/^\/\//.test(href) || /^[a-z0-9\+]+:\/\//i.test(href))) {
                return false;
            }

            if (/^data:/.test(href)) {
                // AdBlock for Chrome injects these
                return false;
            }

            // Normalize to be root relative:
            href = href.replace(local, '').replace(/\?.*$/, '');
            if (!/^\//.test(href)) {
                href = location.pathname.replace(/[^\/]+$/, '') + href;
            }

            // Normalize: /foo/../bar => /bar
            while (/\/[^\/\.][^\/]*\/\.\.\//.test(href)) {
                href = href.replace(/\/[^\/\.][^\/]*\/\.\.\//, '/');
            }

            return href;
        },
        findCssIncludes = function () {
            var cssIncludes = [],
                links = document.getElementsByTagName('link'),
                styles = document.getElementsByTagName('style'),
                style,
                cssRule,
                i,
                href;

            // Link tags with rel="stylesheet"
            for (i = 0; i < links.length; i += 1) {
                if (/\bstylesheet\b/i.test(links[i].getAttribute('rel'))) {
                    href = cleanHref(links[i].getAttribute('href'));
                    if (href) {
                        cssIncludes.push({type: 'link', href: href, node: links[i]});
                    }
                }
            }

            // Look for .compilessinclude {src: url(...);} in non-inline stylesheets:
            for (i = 0 ; i < document.styleSheets.length ; i += 1) {
                var styleSheet = document.styleSheets[i];
                if (styleSheet.href) {
                    for (var j = 0 ; j < styleSheet.cssRules.length ; j += 1) {
                        cssRule = styleSheet.cssRules[j];
                        if (/^\.compilessinclude$/.test(cssRule.selectorText)) {
                            var backgroundImage = cssRule.style.getPropertyValue('background-image'),
                                matchBackgroundImage = backgroundImage.match(/^url\((['"]|)(.*?)\1\)$/);
                            if (matchBackgroundImage) {
                                href = cleanHref(styleSheet.href);
                                var backgroundImageUrl = matchBackgroundImage[2];
                                if (!/^https?:/.test(backgroundImageUrl)) {
                                    // Firefox leaves the url as-is, Chrome absolutifies it
                                    backgroundImageUrl = urlResolve(urlResolve(location.href, styleSheet.ownerNode.getAttribute('href')), backgroundImageUrl);
                                }
                                var watchHref = cleanHref(backgroundImageUrl);
                                if (href && watchHref) {
                                    cssIncludes.push({type: 'link', href: href, watchHref: watchHref, node: styleSheet.ownerNode});
                                }
                            }
                        } else {
                            // These .compilessinclude rules always come first, so break on the first non-matching one:
                            break;
                        }
                    }
                }
            }

            // Style tags: @includes and inline prefixfree blocks
            for (i = 0 ; i < styles.length ; i += 1) {
                style = styles[i];

                if (typeof StyleFix !== 'undefined') {
                    // Prefixfree support
                    href = cleanHref(style.href || style.getAttribute('data-href'));
                    if (href) {
                        cssIncludes.push({type: 'prefixfree', href: href, node: style});
                    }
                }

                // @import
                style.innerHTML.replace(/@import\s+(?:'([^']+)'|"([^"]+)"|url\(([^\)]+)\))/g, function ($0, singleQuotedHref, doubleQuotedHref, urlParenthesesHref) {
                    if (urlParenthesesHref) {
                        urlParenthesesHref = urlParenthesesHref.replace(/^(['"])(.*)\1$/, '$2');
                    }
                    var href = cleanHref(singleQuotedHref || doubleQuotedHref || urlParenthesesHref);
                    if (href) {
                        cssIncludes.push({type: 'import', href: href, styleElement: style});
                    }
                });
            }

            return cssIncludes;
        },
        removeCacheBuster = function (href) {
            return href.replace(/[?&]livestyle=\d+/, '');
        },
        addCacheBuster = function (href) {
            return href + (href.indexOf('?') === -1 ? '?' : '&') + 'livestyle=' + new Date().getTime();
        },

        // Replaces a link tag with an updated version. Just replacing the href would cause FOUC.
        // We insert the new node before the old one and remove the old one after the new one has loaded.
        replaceLinkTag = function (node, href, watchHref) {
            isBusyByHref[href] = (isBusyByHref[href] || 0) + 1;
            if (watchHref) {
                isBusyByHref[watchHref] = (isBusyByHref[watchHref] || 0) + 1;
            }
            var parent = node.parentNode,
                newNode = node.cloneNode(true),
                monitor;

            newNode.removeAttribute('href');

            // The node must be added to the document before the href is set, otherwise IE9 won't
            // apply the styles.
            if (node.nextSibling) {
                parent.insertBefore(newNode, node.nextSibling);
            } else {
                parent.appendChild(newNode);
            }

            newNode.setAttribute('href', href);
            newNode.onload = function () {
                newNode.onload = null;
                isBusyByHref[href] -= 1;
                if (watchHref) {
                    isBusyByHref[watchHref] -= 1;
                }
                if (node.parentNode) {
                    parent.removeChild(node);
                }
                if (monitor) {
                    clearInterval(monitor);
                    monitor = null;
                }
                // There may be additional occurrences of this href in changedHrefsQueue that can be processed
                // now that the busy counter was decremented:
                processNextChangedHref();
            };
            monitor = setInterval(function () {
                var isReady;
                try {
                    isReady = newNode.sheet && newNode.sheet.cssRules.length > 0; // Throws an error if the stylesheet hasn't loaded
                } catch (err) {}
                if (isReady) {
                    newNode.onload();
                }
            }, 20);
        },
        replaceStyleTag = function (node, oldHref, href) {
            var parent = node.parentNode,
                newNode = node.cloneNode(),
                replacerRegexp = new RegExp("@import\\s+url\\([\"']?" + oldHref.replace(/[\?\[\]\(\)\{\}]/g, "\\$&") + "[\"']?\\)");

            newNode.textContent = node.textContent.replace(replacerRegexp, '@import url(\'' + addCacheBuster(href) + '\')');
            parent.insertBefore(newNode, node);
            parent.removeChild(node);
        },
        processNextChangedHref = function () {
            var i,
                href;
            // Find the first non-busy href in changedHrefsQueue:
            for (i = 0 ; i < changedHrefsQueue.length ; i += 1) {
                if (isBusyByHref[changedHrefsQueue[i]]) {
                    if (liveStyleOptions.debug) {
                        log("Postponing 'change' notification on stylesheet that's already being refreshed: " + changedHrefsQueue[i]);
                    }
                } else {
                    href = changedHrefsQueue.splice(i, 1)[0];
                    break;
                }
            }
            if (!href) {
                return;
            }

            var cssIncludes = findCssIncludes(),
                newHref,
                replacerRegExp;

            if (href === location.pathname) {
                location.reload(true);
            }

            for (i = 0; i < cssIncludes.length; i += 1) {
                var cssInclude = cssIncludes[i],
                    matchAgainstHref = removeCacheBuster(cssInclude.watchHref || cssInclude.href);

                if (matchAgainstHref === href) {
                    log('Refreshing ' + cssInclude.href);
                    if (cssInclude.type === 'link') {
                        // Less.js support (https://github.com/cloudhead/less.js)
                        if (/\bstylesheet\/less\b/i.test(cssInclude.node.getAttribute('rel')) && typeof less !== 'undefined') {
                            // Sadly this method isn't accessible
                            // less.loadStyleSheet(cssInclude.node, function () {}, false, 0);
                            // So instead we'll just have to brutally refresh ALL less includes
                            less.refresh();
                        } else {
                            replaceLinkTag(cssInclude.node, cssInclude.href, cssInclude.watchHref);
                        }
                    } else if (cssInclude.type === 'import') {
                        replaceStyleTag(cssInclude.styleElement, cssInclude.href, addCacheBuster(href));
                    } else if (cssInclude.type === 'prefixfree') {
                        // The next two lines are hacks to make Prefixfree think this is a link and not a style block
                        cssInclude.node.setAttribute('href', href); // No cache buster needed
                        cssInclude.node.rel = 'stylesheet';
                        StyleFix.link(cssInclude.node);
                    }

                    // Replacing the first occurrence should be good enough. Besides, the @import replacement code invalidates
                    // the rest of the cssIncludes in the same stylesheet.
                    break;
                }
            }
            processNextChangedHref(); // We consumed an item from changedHrefsQueue, keep going
        },
        startListening = function () {
            var socket = io.connect();

            socket.on('connect', function () {
                var hrefs = [],
                    watchNewStylesheets = function () {
                        var cssIncludes = findCssIncludes(),
                            toWatch = [],
                            href,
                            i;
                        //cssIncludes.unshift({ href: location.pathname }); // See https://github.com/One-com/livestyle/issues/11

                        for (i = 0; i < cssIncludes.length; i += 1) {
                            href = removeCacheBuster(cssIncludes[i].watchHref || cssIncludes[i].href);
                            if (hrefs.indexOf(href) === -1) {
                                hrefs.push(href);
                                toWatch.push(href);
                            }
                        }

                        if (toWatch.length !== 0) {
                            log('Subscribing to ' + toWatch.length + ' files:\n  ' + toWatch.join('\n  '));
                            socket.emit('watch', toWatch);
                        }
                    };

                watchNewStylesheets();
                setInterval(watchNewStylesheets, pollTimeout);
            }).on('change', function (href) {
                if (changedHrefsQueue.indexOf(href) === -1) {
                    changedHrefsQueue.push(href);
                    log('Received change notification for ' + href + ', queued');
                    processNextChangedHref();
                } else {
                    log('Received change notification for ' + href + ', skipped (already in queue)');
                }
            });
        },
        state = {},
        startPolling = function () {
            var getXHR = function () {
                    try {
                        return new XMLHttpRequest();
                    } catch (e1) {
                        try {
                            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
                        } catch (e2) {
                            try {
                                return new ActiveXObject("Msxml2.XMLHTTP.3.0");
                            } catch (e3) {
                                try {
                                    return new ActiveXObject("Msxml2.XMLHTTP");
                                } catch (e4) {
                                    try {
                                        return new ActiveXObject("Microsoft.XMLHTTP");
                                    } catch (e5) {}
                                }
                            }
                        }
                    }

                    return null; // no XHR support
                },
                cssIncludes = findCssIncludes(),
                proceed = function () {
                    var cssInclude,
                        url,
                        xhr;

                    if (cssIncludes.length > 0) {
                        cssInclude = cssIncludes.shift();
                        url = removeCacheBuster(cssInclude.href);
                        xhr = getXHR();

                        xhr.onreadystatechange = function () {
                            var lastModified,
                                etag;

                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    lastModified = Date.parse(xhr.getResponseHeader("Last-Modified"));
                                    etag = xhr.getResponseHeader("ETag");

                                    if (!state[url] || state[url].lastModified < lastModified || state[url].etag !== etag) {
                                        state[url] = {
                                            lastModified: lastModified,
                                            etag: etag
                                        };
                                        refresh(url);
                                    }
                                }

                                proceed();
                            }
                        };
                        xhr.open('HEAD', addCacheBuster(url), true);
                        xhr.send(null);
                    } else {
                        setTimeout(startPolling, pollTimeout);
                    }
                };
            //cssIncludes.unshift({ href: location.pathname }); // See https://github.com/One-com/livestyle/issues/11
            proceed();
        };

    if (typeof io !== 'undefined') {
        log('socket.io present, connecting');
        startListening();
    } else {
        log('socket.io not present, falling back to polling mode');
        startPolling();
    }
}());
