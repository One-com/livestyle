/*global document, location, io, XMLHttpRequest, setTimeout, setInterval, clearInterval, StyleFix, less, ActiveXObject*/
(function () {
    'use strict';

    var liveStyleOptions = {}; // The options will be injected by the server
    window.liveStyle = liveStyleOptions; // Make it detectable on the client that livestyle is in use

    function log(msg) {
        if (liveStyleOptions.debug && window.console) {
            console.log(msg);
        }
    }

    var URI;

    /*! URI.js v1.7.3 http://medialize.github.com/URI.js/ */
    /* build contains: URI.js */
    (function(g){function j(a){return a.replace(/([.*+?^=!:${}()|[\]\/\\])/g,"\\$1")}function l(a){return"[object Array]"===String(Object.prototype.toString.call(a))}function q(a){return encodeURIComponent(a).replace(/[!'()*]/g,escape).replace(/\*/g,"%2A")}var f="undefined"!==typeof module&&module.exports,p=f?require("./punycode"):window.punycode,r=f?require("./IPv6"):window.IPv6,n=f?require("./SecondLevelDomains"):window.SecondLevelDomains,d=function(a,b){if(!(this instanceof d))return new d(a,b);a===g&&(a="undefined"!==typeof location?location.href+"":"");this.href(a);return b!==g?this.absoluteTo(b):this},f=d.prototype;d.idn_expression=/[^a-z0-9\.-]/i;d.punycode_expression=/(xn--)/i;d.ip4_expression=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;d.ip6_expression=/^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;d.find_uri_expression=/\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?\u00ab\u00bb\u201c\u201d\u2018\u2019]))/ig;d.defaultPorts={http:"80",https:"443",ftp:"21"};d.invalid_hostname_characters=/[^a-zA-Z0-9\.-]/;d.encode=q;d.decode=decodeURIComponent;d.iso8859=function(){d.encode=escape;d.decode=unescape};d.unicode=function(){d.encode=q;d.decode=decodeURIComponent};d.characters={pathname:{encode:{expression:/%(24|26|2B|2C|3B|3D|3A|40)/ig,map:{"%24":"$","%26":"&","%2B":"+","%2C":",","%3B":";","%3D":"=","%3A":":","%40":"@"}},decode:{expression:/[\/\?#]/g,map:{"/":"%2F","?":"%3F","#":"%23"}}},reserved:{encode:{expression:/%(21|23|24|26|27|28|29|2A|2B|2C|2F|3A|3B|3D|3F|40|5B|5D)/ig,map:{"%3A":":","%2F":"/","%3F":"?","%23":"#","%5B":"[","%5D":"]","%40":"@","%21":"!","%24":"$","%26":"&","%27":"'","%28":"(","%29":")","%2A":"*","%2B":"+","%2C":",","%3B":";","%3D":"="}}}};d.encodeQuery=function(a){return d.encode(a+"").replace(/%20/g,"+")};d.decodeQuery=function(a){return d.decode((a+"").replace(/\+/g,"%20"))};d.recodePath=function(a){for(var a=(a+"").split("/"),b=0,c=a.length;b<c;b++)a[b]=d.encodePathSegment(d.decode(a[b]));return a.join("/")};d.decodePath=function(a){for(var a=(a+"").split("/"),b=0,c=a.length;b<c;b++)a[b]=d.decodePathSegment(a[b]);return a.join("/")};var i={encode:"encode",decode:"decode"},h,m=function(a,b){return function(c){return d[b](c+"").replace(d.characters[a][b].expression,function(c){return d.characters[a][b].map[c]})}};for(h in i)d[h+"PathSegment"]=m("pathname",i[h]);d.encodeReserved=m("reserved","encode");d.parse=function(a){var b,c={};b=a.indexOf("#");-1<b&&(c.fragment=a.substring(b+1)||null,a=a.substring(0,b));b=a.indexOf("?");-1<b&&(c.query=a.substring(b+1)||null,a=a.substring(0,b));"//"===a.substring(0,2)?(c.protocol="",a=a.substring(2),a=d.parseAuthority(a,c)):(b=a.indexOf(":"),-1<b&&(c.protocol=a.substring(0,b),"//"===a.substring(b+1,b+3)?(a=a.substring(b+3),a=d.parseAuthority(a,c)):(a=a.substring(b+1),c.urn=!0)));c.path=a;return c};d.parseHost=function(a,b){var c=a.indexOf("/"),e;-1===c&&(c=a.length);"["===a[0]?(e=a.indexOf("]"),b.hostname=a.substring(1,e)||null,b.port=a.substring(e+2,c)||null):a.indexOf(":")!==a.lastIndexOf(":")?(b.hostname=a.substring(0,c)||null,b.port=null):(e=a.substring(0,c).split(":"),b.hostname=e[0]||null,b.port=e[1]||null);b.hostname&&"/"!==a.substring(c)[0]&&(c++,a="/"+a);return a.substring(c)||"/"};d.parseAuthority=function(a,b){a=d.parseUserinfo(a,b);return d.parseHost(a,b)};d.parseUserinfo=function(a,b){var c=a.indexOf("@"),e=a.indexOf("/");-1<c&&(-1===e||c<e)?(e=a.substring(0,c).split(":"),b.username=e[0]?d.decode(e[0]):null,b.password=e[1]?d.decode(e[1]):null,a=a.substring(c+1)):(b.username=null,b.password=null);return a};d.parseQuery=function(a){if(!a)return{};a=a.replace(/&+/g,"&").replace(/^\?*&*|&+$/g,"");if(!a)return{};for(var b={},a=a.split("&"),c=a.length,e=0;e<c;e++){var k=a[e].split("="),f=d.decodeQuery(k.shift()),k=k.length?d.decodeQuery(k.join("=")):null;b[f]?("string"===typeof b[f]&&(b[f]=[b[f]]),b[f].push(k)):b[f]=k}return b};d.build=function(a){var b="";a.protocol&&(b+=a.protocol+":");if(!a.urn&&(b||a.hostname))b+="//";b+=d.buildAuthority(a)||"";"string"===typeof a.path&&("/"!==a.path[0]&&"string"===typeof a.hostname&&(b+="/"),b+=a.path);"string"===typeof a.query&&(b+="?"+a.query);"string"===typeof a.fragment&&(b+="#"+a.fragment);return b};d.buildHost=function(a){var b="";if(a.hostname)d.ip6_expression.test(a.hostname)?b=a.port?b+("["+a.hostname+"]:"+a.port):b+a.hostname:(b+=a.hostname,a.port&&(b+=":"+a.port));else return"";return b};d.buildAuthority=function(a){return d.buildUserinfo(a)+d.buildHost(a)};d.buildUserinfo=function(a){var b="";a.username&&(b+=d.encode(a.username),a.password&&(b+=":"+d.encode(a.password)),b+="@");return b};d.buildQuery=function(a,b){var c="",e;for(e in a)if(Object.hasOwnProperty.call(a,e)&&e)if(l(a[e]))for(var k={},f=0,h=a[e].length;f<h;f++)a[e][f]!==g&&k[a[e][f]+""]===g&&(c+="&"+d.buildQueryParameter(e,a[e][f]),!0!==b&&(k[a[e][f]+""]=!0));else a[e]!==g&&(c+="&"+d.buildQueryParameter(e,a[e]));return c.substring(1)};d.buildQueryParameter=function(a,b){return d.encodeQuery(a)+(null!==b?"="+d.encodeQuery(b):"")};d.addQuery=function(a,b,c){if("object"===typeof b)for(var e in b)Object.prototype.hasOwnProperty.call(b,e)&&d.addQuery(a,e,b[e]);else if("string"===typeof b)a[b]===g?a[b]=c:("string"===typeof a[b]&&(a[b]=[a[b]]),l(c)||(c=[c]),a[b]=a[b].concat(c));else throw new TypeError("URI.addQuery() accepts an object, string as the name parameter");};d.removeQuery=function(a,b,c){if(l(b))for(var c=0,e=b.length;c<e;c++)a[b[c]]=g;else if("object"===typeof b)for(e in b)Object.prototype.hasOwnProperty.call(b,e)&&d.removeQuery(a,e,b[e]);else if("string"===typeof b)if(c!==g)if(a[b]===c)a[b]=g;else{if(l(a[b])){var e=a[b],k={},f,h;if(l(c)){f=0;for(h=c.length;f<h;f++)k[c[f]]=!0}else k[c]=!0;f=0;for(h=e.length;f<h;f++)k[e[f]]!==g&&(e.splice(f,1),h--,f--);a[b]=e}}else a[b]=g;else throw new TypeError("URI.addQuery() accepts an object, string as the first parameter");};d.commonPath=function(a,b){var c=Math.min(a.length,b.length),e;for(e=0;e<c;e++)if(a[e]!==b[e]){e--;break}if(1>e)return a[0]===b[0]&&"/"===a[0]?"/":"";"/"!==a[e]&&(e=a.substring(0,e).lastIndexOf("/"));return a.substring(0,e+1)};d.withinString=function(a,b){return a.replace(d.find_uri_expression,b)};d.ensureValidHostname=function(a){if(a.match(d.invalid_hostname_characters)){if(!p)throw new TypeError("Hostname '"+a+"' contains characters other than [A-Z0-9.-] and Punycode.js is not available");if(p.toASCII(a).match(d.invalid_hostname_characters))throw new TypeError("Hostname '"+a+"' contains characters other than [A-Z0-9.-]");}};f.build=function(a){if(!0===a)this._deferred_build=!0;else if(a===g||this._deferred_build)this._string=d.build(this._parts),this._deferred_build=!1;return this};f.clone=function(){return new d(this)};f.toString=function(){return this.build(!1)._string};f.valueOf=function(){return this.toString()};i={protocol:"protocol",username:"username",password:"password",hostname:"hostname",port:"port"};m=function(a){return function(b,c){if(b===g)return this._parts[a]||"";this._parts[a]=b;this.build(!c);return this}};for(h in i)f[h]=m(i[h]);i={query:"?",fragment:"#"};m=function(a,b){return function(c,e){if(c===g)return this._parts[a]||"";null!==c&&(c+="",c[0]===b&&(c=c.substring(1)));this._parts[a]=c;this.build(!e);return this}};for(h in i)f[h]=m(h,i[h]);i={search:["?","query"],hash:["#","fragment"]};m=function(a,b){return function(c,e){var d=this[a](c,e);return"string"===typeof d&&d.length?b+d:d}};for(h in i)f[h]=m(i[h][1],i[h][0]);f.pathname=function(a,b){if(a===g||!0===a){var c=this._parts.path||(this._parts.urn?"":"/");return a?d.decodePath(c):c}this._parts.path=a?d.recodePath(a):"/";this.build(!b);return this};f.path=f.pathname;f.href=function(a,b){if(a===g)return this.toString();this._string="";this._parts={protocol:null,username:null,password:null,hostname:null,urn:null,port:null,path:null,query:null,fragment:null};var c=a instanceof d,e="object"===typeof a&&(a.hostname||a.path),f;if("string"===typeof a)this._parts=d.parse(a);else if(c||e)for(f in c=c?a._parts:a,c)Object.hasOwnProperty.call(this._parts,f)&&(this._parts[f]=c[f]);else throw new TypeError("invalid input");this.build(!b);return this};f.is=function(a){var b=!1,c=!1,e=!1,f=!1,g=!1,h=!1,i=!1,j=!this._parts.urn;this._parts.hostname&&(j=!1,c=d.ip4_expression.test(this._parts.hostname),e=d.ip6_expression.test(this._parts.hostname),b=c||e,g=(f=!b)&&n&&n.has(this._parts.hostname),h=f&&d.idn_expression.test(this._parts.hostname),i=f&&d.punycode_expression.test(this._parts.hostname));switch(a.toLowerCase()){case "relative":return j;case "absolute":return!j;case "domain":case "name":return f;case "sld":return g;case "ip":return b;case "ip4":case "ipv4":case "inet4":return c;case "ip6":case "ipv6":case "inet6":return e;case "idn":return h;case "url":return!this._parts.urn;case "urn":return!!this._parts.urn;case "punycode":return i}return null};var s=f.protocol,t=f.port,u=f.hostname;f.protocol=function(a,b){if(a!==g&&a&&(a=a.replace(/:(\/\/)?$/,""),a.match(/[^a-zA-z0-9\.+-]/)))throw new TypeError("Protocol '"+a+"' contains characters other than [A-Z0-9.+-]");return s.call(this,a,b)};f.scheme=f.protocol;f.port=function(a,b){if(this._parts.urn)return a===g?"":this;if(a!==g&&(0===a&&(a=null),a&&(a+="",":"===a[0]&&(a=a.substring(1)),a.match(/[^0-9]/))))throw new TypeError("Port '"+a+"' contains characters other than [0-9]");return t.call(this,a,b)};f.hostname=function(a,b){if(this._parts.urn)return a===g?"":this;if(a!==g){var c={};d.parseHost(a,c);a=c.hostname}return u.call(this,a,b)};f.host=function(a,b){if(this._parts.urn)return a===g?"":this;if(a===g)return this._parts.hostname?d.buildHost(this._parts):"";d.parseHost(a,this._parts);this.build(!b);return this};f.authority=function(a,b){if(this._parts.urn)return a===g?"":this;if(a===g)return this._parts.hostname?d.buildAuthority(this._parts):"";d.parseAuthority(a,this._parts);this.build(!b);return this};f.userinfo=function(a,b){if(this._parts.urn)return a===g?"":this;if(a===g){if(!this._parts.username)return"";var c=d.buildUserinfo(this._parts);return c.substring(0,c.length-1)}"@"!==a[a.length-1]&&(a+="@");d.parseUserinfo(a,this._parts);this.build(!b);return this};f.subdomain=function(a,b){if(this._parts.urn)return a===g?"":this;if(a===g){if(!this._parts.hostname||this.is("IP"))return"";var c=this._parts.hostname.length-this.domain().length-1;return this._parts.hostname.substring(0,c)||""}c=this._parts.hostname.length-this.domain().length;c=this._parts.hostname.substring(0,c);c=RegExp("^"+j(c));a&&"."!==a[a.length-1]&&(a+=".");a&&d.ensureValidHostname(a);this._parts.hostname=this._parts.hostname.replace(c,a);this.build(!b);return this};f.domain=function(a,b){if(this._parts.urn)return a===g?"":this;"boolean"===typeof a&&(b=a,a=g);if(a===g){if(!this._parts.hostname||this.is("IP"))return"";var c=this._parts.hostname.match(/\./g);if(c&&2>c.length)return this._parts.hostname;c=this._parts.hostname.length-this.tld(b).length-1;c=this._parts.hostname.lastIndexOf(".",c-1)+1;return this._parts.hostname.substring(c)||""}if(!a)throw new TypeError("cannot set domain empty");d.ensureValidHostname(a);!this._parts.hostname||this.is("IP")?this._parts.hostname=a:(c=RegExp(j(this.domain())+"$"),this._parts.hostname=this._parts.hostname.replace(c,a));this.build(!b);return this};f.tld=function(a,b){if(this._parts.urn)return a===g?"":this;"boolean"===typeof a&&(b=a,a=g);if(a===g){if(!this._parts.hostname||this.is("IP"))return"";var c=this._parts.hostname.lastIndexOf("."),c=this._parts.hostname.substring(c+1);return!0!==b&&n&&n.list[c.toLowerCase()]?n.get(this._parts.hostname)||c:c}if(a)if(a.match(/[^a-zA-Z0-9-]/))if(n&&n.is(a))c=RegExp(j(this.tld())+"$"),this._parts.hostname=this._parts.hostname.replace(c,a);else throw new TypeError("TLD '"+a+"' contains characters other than [A-Z0-9]");else{if(!this._parts.hostname||this.is("IP"))throw new ReferenceError("cannot set TLD on non-domain host");c=RegExp(j(this.tld())+"$");this._parts.hostname=this._parts.hostname.replace(c,a)}else throw new TypeError("cannot set TLD empty");this.build(!b);return this};f.directory=function(a,b){if(this._parts.urn)return a===g?"":this;if(a===g||!0===a){if(!this._parts.path&&!this._parts.hostname)return"";if("/"===this._parts.path)return"/";var c=this._parts.path.length-this.filename().length-1,c=this._parts.path.substring(0,c)||(this._parts.hostname?"/":"");return a?d.decodePath(c):c}c=this._parts.path.length-this.filename().length;c=this._parts.path.substring(0,c);c=RegExp("^"+j(c));this.is("relative")||(a||(a="/"),"/"!==a[0]&&(a="/"+a));a&&"/"!==a[a.length-1]&&(a+="/");a=d.recodePath(a);this._parts.path=this._parts.path.replace(c,a);this.build(!b);return this};f.filename=function(a,b){if(this._parts.urn)return a===g?"":this;if(a===g||!0===a){if(!this._parts.path||"/"===this._parts.path)return"";var c=this._parts.path.lastIndexOf("/"),c=this._parts.path.substring(c+1);return a?d.decodePathSegment(c):c}c=!1;"/"===a[0]&&(a=a.substring(1));a.match(/\.?\//)&&(c=!0);var e=RegExp(j(this.filename())+"$"),a=d.recodePath(a);this._parts.path=this._parts.path.replace(e,a);c?this.normalizePath(b):this.build(!b);return this};f.suffix=function(a,b){if(this._parts.urn)return a===g?"":this;if(a===g||!0===a){if(!this._parts.path||"/"===this._parts.path)return"";var c=this.filename(),e=c.lastIndexOf(".");if(-1===e)return"";c=c.substring(e+1);c=/^[a-z0-9%]+$/i.test(c)?c:"";return a?d.decodePathSegment(c):c}"."===a[0]&&(a=a.substring(1));if(c=this.suffix())e=a?RegExp(j(c)+"$"):RegExp(j("."+c)+"$");else{if(!a)return this;this._parts.path+="."+d.recodePath(a)}e&&(a=d.recodePath(a),this._parts.path=this._parts.path.replace(e,a));this.build(!b);return this};f.segment=function(a,b,c){var e=this._parts.urn?":":"/",d=this.path(),f="/"===d.substring(0,1),d=d.split(e);"number"!==typeof a&&(c=b,b=a,a=g);if(a!==g&&"number"!==typeof a)throw Error("Bad segment '"+a+"', must be 0-based integer");f&&d.shift();0>a&&(a=Math.max(d.length+a,0));if(b===g)return a===g?d:d[a];if(null===a||d[a]===g)if(l(b))d=b;else{if(b||"string"===typeof b&&b.length)""===d[d.length-1]?d[d.length-1]=b:d.push(b)}else b||"string"===typeof b&&b.length?d[a]=b:d.splice(a,1);f&&d.unshift("");return this.path(d.join(e),c)};var v=f.query;f.query=function(a,b){return!0===a?d.parseQuery(this._parts.query):a!==g&&"string"!==typeof a?(this._parts.query=d.buildQuery(a),this.build(!b),this):v.call(this,a,b)};f.addQuery=function(a,b,c){var e=d.parseQuery(this._parts.query);d.addQuery(e,a,b);this._parts.query=d.buildQuery(e);"string"!==typeof a&&(c=b);this.build(!c);return this};f.removeQuery=function(a,b,c){var e=d.parseQuery(this._parts.query);d.removeQuery(e,a,b);this._parts.query=d.buildQuery(e);"string"!==typeof a&&(c=b);this.build(!c);return this};f.addSearch=f.addQuery;f.removeSearch=f.removeQuery;f.normalize=function(){return this._parts.urn?this.normalizeProtocol(!1).normalizeQuery(!1).normalizeFragment(!1).build():this.normalizeProtocol(!1).normalizeHostname(!1).normalizePort(!1).normalizePath(!1).normalizeQuery(!1).normalizeFragment(!1).build()};f.normalizeProtocol=function(a){"string"===typeof this._parts.protocol&&(this._parts.protocol=this._parts.protocol.toLowerCase(),this.build(!a));return this};f.normalizeHostname=function(a){this._parts.hostname&&(this.is("IDN")&&p?this._parts.hostname=p.toASCII(this._parts.hostname):this.is("IPv6")&&r&&(this._parts.hostname=r.best(this._parts.hostname)),this._parts.hostname=this._parts.hostname.toLowerCase(),this.build(!a));return this};f.normalizePort=function(a){"string"===typeof this._parts.protocol&&this._parts.port===d.defaultPorts[this._parts.protocol]&&(this._parts.port=null,this.build(!a));return this};f.normalizePath=function(a){if(this._parts.urn||!this._parts.path||"/"===this._parts.path)return this;var b,c,e=this._parts.path,f,g;"/"!==e[0]&&("."===e[0]&&(c=e.substring(0,e.indexOf("/"))),b=!0,e="/"+e);for(e=e.replace(/(\/(\.\/)+)|\/{2,}/g,"/");;){f=e.indexOf("/../");if(-1===f)break;else if(0===f){e=e.substring(3);break}g=e.substring(0,f).lastIndexOf("/");-1===g&&(g=f);e=e.substring(0,g)+e.substring(f+3)}b&&this.is("relative")&&(e=c?c+e:e.substring(1));e=d.recodePath(e);this._parts.path=e;this.build(!a);return this};f.normalizePathname=f.normalizePath;f.normalizeQuery=function(a){"string"===typeof this._parts.query&&(this._parts.query.length?this.query(d.parseQuery(this._parts.query)):this._parts.query=null,this.build(!a));return this};f.normalizeFragment=function(a){this._parts.fragment||(this._parts.fragment=null,this.build(!a));return this};f.normalizeSearch=f.normalizeQuery;f.normalizeHash=f.normalizeFragment;f.iso8859=function(){var a=d.encode,b=d.decode;d.encode=escape;d.decode=decodeURIComponent;this.normalize();d.encode=a;d.decode=b;return this};f.unicode=function(){var a=d.encode,b=d.decode;d.encode=q;d.decode=unescape;this.normalize();d.encode=a;d.decode=b;return this};f.readable=function(){var a=this.clone();a.username("").password("").normalize();var b="";a._parts.protocol&&(b+=a._parts.protocol+"://");a._parts.hostname&&(a.is("punycode")&&p?(b+=p.toUnicode(a._parts.hostname),a._parts.port&&(b+=":"+a._parts.port)):b+=a.host());a._parts.hostname&&(a._parts.path&&"/"!==a._parts.path[0])&&(b+="/");b+=a.path(!0);if(a._parts.query){for(var c="",e=0,f=a._parts.query.split("&"),h=f.length;e<h;e++){var i=(f[e]||"").split("="),c=c+("&"+d.decodeQuery(i[0]).replace(/&/g,"%26"));i[1]!==g&&(c+="="+d.decodeQuery(i[1]).replace(/&/g,"%26"))}b+="?"+c.substring(1)}return b+=a.hash()};f.absoluteTo=function(a){var b=this.clone(),c=["protocol","username","password","hostname","port"],e,f;if(this._parts.urn)throw Error("URNs do not have any generally defined hierachical components");if(this._parts.hostname)return b;a instanceof d||(a=new d(a));e=0;for(f;f=c[e];e++)b._parts[f]=a._parts[f];c=["query","path"];e=0;for(f;f=c[e];e++)!b._parts[f]&&a._parts[f]&&(b._parts[f]=a._parts[f]);"/"!==b.path()[0]&&(a=a.directory(),b._parts.path=(a?a+"/":"")+b._parts.path,b.normalizePath());b.build();return b};f.relativeTo=function(a){var b=this.clone(),c=["protocol","username","password","hostname","port"],e;if(this._parts.urn)throw Error("URNs do not have any generally defined hierachical components");a instanceof d||(a=new d(a));if("/"!==this.path()[0]||"/"!==a.path()[0])throw Error("Cannot calculate common path from non-relative URLs");e=d.commonPath(b.path(),a.path());for(var a=a.directory(),f=0,g;g=c[f];f++)b._parts[g]=null;if(!e||"/"===e)return b;if(a+"/"===e)b._parts.path="./"+b.filename();else{c="../";e=RegExp("^"+j(e));for(a=a.replace(e,"/").match(/\//g).length-1;a--;)c+="../";b._parts.path=b._parts.path.replace(e,c)}b.build();return b};f.equals=function(a){var b=this.clone(),c=new d(a),e={},f={},a={},g;b.normalize();c.normalize();if(b.toString()===c.toString())return!0;e=b.query();f=c.query();b.query("");c.query("");if(b.toString()!==c.toString()||e.length!==f.length)return!1;e=d.parseQuery(e);f=d.parseQuery(f);for(g in e)if(Object.prototype.hasOwnProperty.call(e,g)){if(l(e[g])){if(!l(f[g])||e[g].length!==f[g].length)return!1;e[g].sort();f[g].sort();b=0;for(c=e[g].length;b<c;b++)if(e[g][b]!==f[g][b])return!1}else if(e[g]!==f[g])return!1;a[g]=!0}for(g in f)if(Object.prototype.hasOwnProperty.call(f,g)&&!a[g])return!1;return!0};"undefined"!==typeof module&&module.exports?module.exports=d:URI=d})();

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
            href = href.replace(local, '/').replace(/\?.*$/, '');
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

            function eachCssRule(stylesheet, callback) {
                var cssRules = styleSheet.rules || styleSheet.cssRules; // IE8 and below use .rules

                if (cssRules) {
                    for (var j = 0 ; j < cssRules.length ; j += 1) {
                        callback(cssRules[j]);
                    }
                }
            }

            function eachStyleDeclaration(cssRule, callback) {
                // Style rule
                if (cssRule.type === 1) {
                    callback(cssRule.style);
                }

                // Media blocks
                if (cssRule.type === 4) {
                    eachCssRule(cssRule, function (cssRule) {
                        eachStyleDeclaration(cssRule, callback);
                    });
                }
            }

            // Link tags with rel="stylesheet"
            for (i = 0; i < links.length; i += 1) {
                if (/\bstylesheet\b/i.test(links[i].getAttribute('rel'))) {
                    href = cleanHref(links[i].getAttribute('href'));
                    if (href) {
                        cssIncludes.push({type: 'link', href: href, node: links[i]});
                    }
                }
            }

            for (i = 0 ; i < document.styleSheets.length ; i += 1) {
                var styleSheet = document.styleSheets[i],
                    ownerNode = styleSheet.owningElement || styleSheet.ownerNode;

                if (styleSheet.href) {
                    eachCssRule(styleSheet, function (cssRule) {
                        // Look for .compilessinclude {src: url(...);} in non-inline stylesheets:
                        if (/^\.compilessinclude$/.test(cssRule.selectorText)) {
                            var backgroundImage = cssRule.style.backgroundImage || (cssRule.style.getPropertyValue && cssRule.style.getPropertyValue('background-image')) || cssRule.style.cssText,
                                matchBackgroundImage = backgroundImage && backgroundImage.match(/url\((['"]|)(.*?)\1\)/);
                            if (matchBackgroundImage) {
                                href = cleanHref(styleSheet.href);
                                var backgroundImageUrl = URI(matchBackgroundImage[2]).absoluteTo(ownerNode.getAttribute('href')).absoluteTo(location.href).toString(),
                                    watchHref = cleanHref(backgroundImageUrl);
                                if (href && watchHref) {
                                    cssIncludes.push({type: 'link', href: href, watchHref: watchHref, node: ownerNode});
                                }
                            }
                        }
                    });
                }

                if (liveStyleOptions.watchCssImages) {
                    var baseUrl = styleSheet.href || location.href;

                    eachCssRule(styleSheet, function (cssRule) {
                        eachStyleDeclaration(cssRule, function (style) {
                            for (var k = 0 ; k < style.length ; k += 1) {
                                var propertyName = style[k],
                                    value = style[propertyName],
                                    matchUrl = value.match(/url\((['"]|)(.*?)\1\)/),
                                    url = matchUrl && matchUrl[2];
                               if (url && !/^data:/.test(url)) {
                                    var cssImageUrl = URI(url).absoluteTo(baseUrl).absoluteTo(location.href).toString(),
                                        watchHref = cleanHref(cssImageUrl);
                                    if (href && watchHref) {
                                        cssIncludes.push({type: 'cssImage', href: href, watchHref: watchHref, cssRule: cssRule, propertyName: propertyName});
                                    }
                                }
                            }
                        });
                    });
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
                    var verbatimHref = singleQuotedHref || doubleQuotedHref || urlParenthesesHref,
                        href = cleanHref(singleQuotedHref || doubleQuotedHref || urlParenthesesHref);
                    if (href) {
                        cssIncludes.push({type: 'import', href: href, verbatimHref: verbatimHref, styleElement: style});
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
        replaceStyleTag = function (node, verbatimOldHref, href) {
            var parent = node.parentNode,
                newNode = node.cloneNode(),
                replacerRegExp = new RegExp("@import\\s+url\\([\"']?" + verbatimOldHref.replace(/[\.\?\[\]\(\)\{\}]/g, "\\$&") + "[\"']?\\);?");
            newNode.textContent = node.textContent.replace(replacerRegExp, '@import url(\'' + addCacheBuster(removeCacheBuster(href)) + '\');').replace(/^\s*|\s*$/g, '');
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
                        replaceStyleTag(cssInclude.styleElement, cssInclude.verbatimHref, href);
                    } else if (cssInclude.type === 'cssImage') {
                        var value = cssInclude.cssRule.style[cssInclude.propertyName];
                        value = value.replace(/url\((['"]|)(.*?)\1\)/g, function ($0, quoteChar, url) {
                            return "url(" + quoteChar + addCacheBuster(url) + quoteChar + ")";
                        });
                        cssInclude.cssRule.style.setProperty(cssInclude.propertyName, value, cssInclude.cssRule.style.getPropertyPriority(cssInclude.propertyName));

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

                        if (liveStyleOptions.watchHtml) {
                            cssIncludes.unshift({type: 'html', href: location.pathname}); // See https://github.com/One-com/livestyle/issues/11
                        }
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
            if (liveStyleOptions.watchHtml) {
                cssIncludes.unshift({type: 'html', href: location.pathname}); // See https://github.com/One-com/livestyle/issues/11
            }
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
