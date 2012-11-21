/*global less, console*/
define([
    'css'
], function (css) {
    var lessLoader = {
            load: function (name, req, load, config) {
                var url = name + (name.indexOf('.less') === -1 ? '.less' : ''),
                    path = url.split('/');

                path.pop();
                if (path.length !== 0) {
                    path = '/' + path.join('/') + '/';
                }

                $.ajax({
                    url: url,
                    success: function (data) {
                        var parser = new less.Parser({
                                paths: [path]
                            });

                        parser.parse(data, function (e, tree) {
                            var style = null,
                                css = null,
                                lessLink;

                            if (e) {
                                console.error(e);
                            } else {
                                style = document.createElement('style');
                                style.type = "text/css";
                                style.id = 'less:' + url.replace(/\//g, '-').replace('.less', '');

                                css = tree.toCSS();

                                if (style.styleSheet) {
                                    style.styleSheet.cssText = css;
                                } else {
                                    style.innerHTML = css;
                                }
                                document.getElementsByTagName('head')[0].appendChild(style);

                                lessLink = document.createElement('link');
                                lessLink.rel = 'stylesheet/less';
                                lessLink.type = 'text/css';
                                lessLink.href = url;
                                document.getElementsByTagName('head')[0].appendChild(lessLink);
                                less.sheets.push(lessLink);

                                load(css);
                            }
                        });
                    }
                });
            }
        };

    if (window.liveStyle && window.liveStyle.compiless) {
        lessLoader = css;
    }

    return lessLoader;
});
