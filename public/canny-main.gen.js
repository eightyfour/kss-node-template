(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*global */
/*jslint browser: true*/
/**
 * TODO
 * If canny knows his own URL than canny could load none registered modules afterwords from his own
 * modules folder (can also build as configurable extension adapted to the body).
 * E.g.: canny-mod="moduleLoader" canny-var={'cannyPath':URL_FROM_CANNY, 'unknownMods':LOAD_FROM_OTHER_URL}
 *
 *
 * canny-var is deprecated: please use just the module name instead like:
 * E.g.: canny-mod="mod1 mod2" canny-mod1={'foo':'123456', 'bar':'654321'} canny-mod2="mod2Property"
 *
 * ---------------------------------------------------------------------------- eightyfour
 */
(function (global) {
    "use strict";
    var canny = (function () {
        var readyQueue = [],
            readyQueueInit = false,
            moduleQueue = [], // save modules to call the ready method once
            callMethQueue = function (queue) {
                (function reduce() {
                    var fc = queue.pop();
                    if (fc) {
                        fc();
                        reduce();
                    } else {
                        queue = [];
                    }
                }());
            },
            parseNode = function (node, name, cb) {
                var that = this, gdModuleChildren = [].slice.call(node.querySelectorAll('[' + name + '-mod]')), prepareReadyQueue = {};

                gdModuleChildren.forEach(function (node) {
                    var attribute = node.getAttribute(name + '-mod'), attr, viewPart, attributes, cannyVar;

                    attributes = attribute.split(' ');

                    attributes.forEach(function (eachAttr) {
                        if (that[eachAttr]) {
                            if (node.getAttribute(name + '-mod')) {
                                if (node.getAttribute(name + '-' + eachAttr)) {
                                    cannyVar = node.getAttribute(name + '-' + eachAttr);
                                } else {
                                    cannyVar = node.getAttribute(name + '-var');
                                }
                                if (cannyVar) {
                                    attr = cannyVar.split("\'").join('\"');
                                    if (/:/.test(attr)) {
                                        // could be a JSON
                                        try {
                                            viewPart = JSON.parse(attr);
                                        } catch (ex) {
                                            console.error("canny can't parse passed JSON for module: " + eachAttr, node);
                                        }
                                    } else {
                                        viewPart = attr;
                                    }
                                }
                            }
                            // has module a ready function than save it for calling
                            if (that[eachAttr].hasOwnProperty('ready')) {
                                // TODO or call it immediately?
                                prepareReadyQueue[eachAttr] = that[eachAttr].ready;
                            }
                            if (that.hasOwnProperty(eachAttr)) {
                                that[eachAttr].add(node, viewPart);
                            }
                        } else {
                            console.warn('canny parse: module with name ´' + eachAttr + '´ is not registered');
                        }
                    });
                });
                // add ready callback to moduleQueue
                Object.keys(prepareReadyQueue).forEach(function (name) {
                    moduleQueue.push(prepareReadyQueue[name]);
                });
                cb && cb();
            };

        document.addEventListener('DOMContentLoaded', function cannyDomLoad() {
            document.removeEventListener('DOMContentLoaded', cannyDomLoad);

            parseNode.apply(canny, [document, 'canny']);

            callMethQueue(moduleQueue);
            // call registered ready functions
            readyQueueInit = true;
            callMethQueue(readyQueue);
        }, false);

        return {
            add : function (name, module) {
                if (!this.hasOwnProperty(name)) {
                    this[name] = module;
                } else {
                    console.error('canny: Try to register module with name ' + name + ' twice');
                }
            },
            ready : function (fc) {
                if (!readyQueueInit) {
                    readyQueue.push(fc);
                } else {
                    fc();
                }
            },
            cannyParse : function (node, name, cb) {
                // TODO needs a callback
                if (typeof name === 'function') {
                    cb = name;
                    name = "canny";
                }
                parseNode.apply(this || canny, [node, name || 'canny', function () {
                    callMethQueue(moduleQueue);
                    cb && cb();
                }]);
            }
        };
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) { module.exports = canny; } else {global.canny = canny; }
}(this));

},{}],2:[function(require,module,exports){
/*global canny */
/*jslint browser: true*/

/**
 * Required: 'canny' in global scope
 *
 * E.g.:
 * canny.async.load(URL, function (src) {
 *     node.innerHTML = src;
 *     // trigger canny parse to register canny on our new modules
 *     canny.cannyParse(node, function () {
 *         console.log('CANNY PARSE DONE');
 *     });
 * });
 *
 * Alternative you can just use loadHTML (scripts will automatically added and parsed by canny):
 * canny.async.loadHTML(node, {url : URL}, function () {
 *     console.log('kodos_load READY');
 * });
 *
 * Or directly as canny module:
 * <div canny-mod="async" canny-var="{'url':'/you/HTML/file.html'}"></div>
 *
 * TODO solve dependency problem to canny.
 *
 */
(function () {
    "use strict";
    var async = (function () {
        var filesToLoad = [],
            ready = false,
            fc = {
                appendScript : function (script, cb) {
                    var node = document.createElement('script');
                    node.type = "text/javascript";
                    node.async = true;
                    node.setAttribute('src', script.getAttribute('src'));
                    node.addEventListener('load', cb, false);
                    document.head.appendChild(node);
                },
                appendScriptsToHead : function (scripts, cb) {
                    var script, i, includesScripts = false,
                        scriptCounter = (function () {
                            var count = 0;
                            return {
                                up : function () {count++; },
                                ready : function () {
                                    count--;
                                    if (count <= 0) {
                                        cb();
                                    }
                                }
                            };
                        }());

                    for (i = 0; i < scripts.length; i++) {
                        script = scripts[i];
                        if (script.getAttribute('src')) {
                            includesScripts = true;
                            scriptCounter.up();
                            fc.appendScript(script, scriptCounter.ready);
                        } else {
                            console.warn('async: found inline script tag!!!');
                        }
                    }

                    if (scripts.length === 0 || includesScripts === false) {
                        cb();
                    }

                },
                doAjax : function (params) {
                    var call = new XMLHttpRequest();
                    var url = params.path;
                    if (params.method === 'GET' && typeof params.data === 'object') {
                        for (var attr in params.data) {
                            url = url + ((/\?/).test(url) ? "&" : "?") + attr + "=" + params.data[attr];
                        }
                    }
                    if (params.noCache) {
                        url = url + ((/\?/).test(url) ? "&" : "?") + "ts=" + (new Date()).getTime();
                    }
                    params.method = params.method || 'POST';
                    call.open(params.method, url, true);
                    call.onreadystatechange = function () {
                        if (call.readyState != 4 || call.status != 200) {
                            if (params.onFailure) {
                                params.onFailure(call);
                            }
                        } else {
                            if (params.onSuccess) {
                                params.onSuccess(call)
                            }
                        }
                    };
                    call.setRequestHeader(params.contentType || "Content-Type", params.mimeType || "text/plain");
                    if (params.method === 'POST') {
                        call.send(params.data);
                    } else {
                        call.send();
                    }
                },
                loadHTML: function (node, attr, cb) {
                    var div = document.createElement('div'),
                        scripts,
                        // only parse if html and scripts are loaded (scripts has callbacks because there are needs to loaded asynchronous)
                        handleCannyParse = (function (cb) {
                            var waitForScripts = true,
                                waitForHTML = true,
                                triggger = function () {
                                    if (!waitForScripts && !waitForHTML) {
                                        canny.cannyParse(node, cb); // init also canny own modules
                                    }
                                };
                            return {
                                scriptReady : function () {
                                    waitForScripts = false;
                                    triggger();
                                },
                                htmlReady : function () {
                                    waitForHTML = false;
                                    triggger();
                                }
                            };
                        }(cb));
                    modViews.load(attr.url, function (src) {
                        var childs;
                        if (src) {
                            div.innerHTML = src;
                            scripts = div.getElementsByTagName('script');
                            childs = [].slice.call(div.childNodes);
                            fc.appendScriptsToHead(scripts, handleCannyParse.scriptReady);
                            childs.forEach(function (child) {
                                if (!(child.tagName === 'SCRIPT' && child.getAttribute('src'))) {
                                    node.appendChild(child);
                                }
                            });
                            handleCannyParse.htmlReady();
                        } else {
                            console.warn('async: Loading async HTML failed');
                        }
                    });
                }
            },
            pushLoadCBs = [],
            modViews = {
                ready: function () {
                    var obj, cbCount = filesToLoad.length;
                    while (filesToLoad.length > 0) {
                        obj = filesToLoad.splice(0, 1)[0];
                        fc.loadHTML(obj.node, obj.attr, function () {
                            cbCount--;
                            if (cbCount <= 0) {
                                while (pushLoadCBs.length > 0) {
                                    pushLoadCBs.splice(0, 1)[0]();
                                }
                            }
                        });
                    }

                },
                pushLoadCB : function (fc) {
                    pushLoadCBs.push(fc);
                },
                add: function (node, attr) {    // part of api
                    // TODO implement logic for loading it directly from html
                    if (attr.hasOwnProperty('url')) {
                        if (!ready) {
                            filesToLoad.push({
                                node: node,
                                attr: attr
                            });
                        } else {
                            fc.loadHTML(node, attr);
                        }
                    }
                },
                doAjax: fc.doAjax,
                loadHTML : fc.loadHTML,
                /**
                 * Deprecated: use loadHTML instead
                 * @param path
                 * @param cb
                 */
                load: function (path, cb) {
                    fc.doAjax({
                        method: 'GET',
                        path: path,
                        onSuccess: function (response) {
                            cb(response.responseText);
                        }
                    });
                }
            };

        return modViews;
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) {
        module.exports = async;
    } else {
        canny.add('async', async);
    }

}());


},{}],3:[function(require,module,exports){
/*global canny */
/*jslint browser: true*/

/**
 * E.g.: canny-mod="flowControl" canny-var="{'view' : 'viewName'}"
 *
 * you can activate a initial view with a anchor in the URL e.g.: yourdomain.html#viewToShow
 * Or pass a comma separated module list for activate more module #viewToShow,otherView
 *
 * TODO made it possible to summarize views with one identifier.
 * Instead of call: gdom.flowControl.show('view1', 'view2', 'view3') call gdom.flowControl.show('view').
 */
(function () {
    "use strict";

    var flowControl = (function () {

        var modViews = {}, // saves module views
            getViewAnchor = function () {
                var hash = location.hash || null, hashSub;
                if (hash) {
                    hashSub = hash.substr(1);
                    return hashSub.split(',');
                }
                return hash;
            },
            showInitialView = getViewAnchor(),
            fc = {
                // get the parent module from the given viewName
                getParentNode : function (viewName) {
                    var queue = Object.keys(modViews), l, i;
                    l = queue.length;
                    for (i = 0; i < l; i++) {
                        if (modViews[queue[i]].hasChildrenWithName(viewName)) {
                            return modViews[queue[i]];
                        }
                    }
                    return null;
                },
                // passes a view list and complete the list with all parent node names
                addParents : function (views) {
                    var extViews = views, i, l, pNode,
                            pushExtViews = function (name) {
                                if (extViews.indexOf(name) === -1) {
                                    extViews.push(name);
                                }
                            },
                            addParentView = function (viewName) {
                                var pViewName = fc.getParentNode(viewName);
                                if (pViewName) {
                                    // TOOD while has parent add it to the extViews
                                    pushExtViews(pViewName.getViewName());
                                    addParentView(pViewName.getViewName());
                                }
                            };
                    l = views.length;
                    for (i = 0; i < l; i++) {
                        pNode = fc.getParentNode(views[i]);
                        if (pNode) {
                            pushExtViews(pNode.getViewName());
                            // so far we have parents do it recursive
                            addParentView(pNode.getViewName());
                        }
                    }
                    return extViews;
                },
                fadeOut : function (node, cb) {
                    var opacity = node.style.opacity || 1,
                            fade = function (op) {
                                if (op > 0) {
                                    node.style.opacity = op;

                                    setTimeout(function () {
                                        fade(op - 0.1);
                                    }, 30);
                                } else {
                                    node.style.display = 'none';
                                    cb();
                                }
                            };
                    fade(opacity);
                    console.log('fadeOut', node);
                },
                fadeIn : function (node, cb) {
                    var opacity = node.opacity || 0,
                            fade = function (op) {
                                if (op <= 1) {
                                    node.style.opacity = op;
                                    setTimeout(function () {
                                        fade(op + 0.1);
                                    }, 30);
                                } else {
                                    cb();
                                }
                            };
                    if (node.style.display === 'none') {
                        node.style.opacity = opacity;
                        node.style.display = '';
                        fade(opacity);
                    } else {
                        node.style.opacity = 1;
                        console.log('fadeIn', node);
                    }
                }
            },
            ext = {
                /**
                 *
                 * @param node
                 * @param innerNode
                 * @returns {{remove: remove}}
                 */
                progress : function (node, innerNode) {
                    var newNode = document.createElement('div'), centerNode = document.createElement('div'), txtNode;
                    node.style.position = 'relative';
                    newNode.style.opacity = '0.6';
                    newNode.style.backgroundColor = '#666';
                    newNode.style.position = 'absolute';
                    newNode.style.top = 0;
                    newNode.style.left = 0;
                    newNode.style.width = node.offsetWidth + 'px';
                    newNode.style.height = node.offsetHeight + 'px';
                    newNode.style.borderRadius = window.getComputedStyle(node, null).borderRadius;

                    centerNode.style.position = 'absolute';
                    centerNode.style.top = (node.offsetHeight / 2) - 30 + 'px';
                    centerNode.style.width = node.offsetWidth + 'px';
                    centerNode.style.textAlign = 'center';

                    if (innerNode) {
                        centerNode.appendChild(innerNode);
                    }
                    node.appendChild(newNode);
                    node.appendChild(centerNode);
                    return {
                        remove : function (delay, cb) {
                            setTimeout(function () {
                                node.removeChild(newNode);
                                node.removeChild(centerNode);
                                cb && cb();
                            }, delay || 0);
                        },
                        fadeOut : function (delay, cb) {
                            setTimeout(function () {
                                fc.fadeOut(newNode, function () {
                                    node.removeChild(newNode);
                                    node.removeChild(centerNode);
                                    cb && cb();
                                });
                            }, delay || 0);
                        }
                    };
                }
            };

        return {
            mod : modViews, // part of api
            ready : function () {
                var modNames, i, l;
                if (showInitialView) {
                    modNames = Object.keys(this.mod);
                    l = modNames.length;
                    // check if showInitialView contains a registered module
                    for (i = 0; i < l; i++) {
                        if (showInitialView.indexOf(modNames[i]) !== -1) {
                            this.showImmediately.apply(null, showInitialView);
                            break;
                        }
                    }
                }
            },
            add : function (node, attr) {    // part of api

                modViews[attr.view] = (function (node, parentView) {
                    var flowControlChildNodes = {},
                    // TODO do it with a querySelectorAll
                        findChildren = function (cNode) {
                            if (cNode.hasChildNodes()) {
                                [].slice.call(cNode.children).forEach(findChildren);
                            }
                            var modAttr = cNode.getAttribute('gd-module'), attrValue, view;
                            if (/flowControl/.test(modAttr)) {
                                console.log(cNode);
                                // TODO read attributes should be part gdom functionality
                                attrValue = cNode.getAttribute('gd-attr').split("\'").join('\"');
                                if (/:/.test(attrValue)) {
                                    // could be a JSON
                                    view = JSON.parse(attrValue).view;
                                } else {
                                    view = attrValue;
                                }
                                flowControlChildNodes[view] = cNode;
                            }
                        };
                    // saves all children in a object
                    [].slice.call(node.children).forEach(findChildren);

                    return {
                        hasChildrenWithName : function (viewName) {
                            return flowControlChildNodes.hasOwnProperty(viewName);
                        },
                        getViewName : function () {
                            return attr.view;
                        },
                        show : function () {
                            parentView && parentView.show();
                            node.style.display = '';
                        },
                        hide : function () {
                            node.style.display = 'none';
                        },
                        fadeOut : function (cb) {
                            fc.fadeOut(node, cb || function () {});
                        },
                        getNode : function () {
                            return node;
                        },
                        fadeIn : function (cb) {
                            parentView && parentView.show();  // do show fadeIn has flickering
                            fc.fadeIn(node,  cb || function () {});
                        }
                    };

                }(node, fc.getParentNode(attr.view)));
            },
            // TODO rename it to fadeIn
            show : function (name) {    // module specific
                var showMods = [].slice.call(arguments),
                    queue = Object.keys(modViews),
                    queueCount = queue.length,
                    fadeIn = function () {
                        showMods.forEach(function (module) {
                            if (modViews.hasOwnProperty(module)) {
                                modViews[module].fadeIn(function () {
                                    // TODO remove
                                    console.log('FADE IN DONE');
                                });
                            }
                        });
                    };
                showMods = fc.addParents(showMods);
                // hide all (except incoming)

                queue.forEach(function (obj) {
                    if (showMods.indexOf(obj) === -1) {
                        modViews[obj].fadeOut(function () {
                            queueCount--;
                            if (queueCount <= 0) {
                                // FADE IN
                                fadeIn();
                            }
                        });
                    } else {
                        queueCount--;
                        if (queueCount <= 0) {
                            fadeIn();
                        }
                    }
                });
            },
            // rename it to show
            showImmediately : function (name) {    // module specific
                var showMods = [].slice.call(arguments),
                    queue = Object.keys(modViews),
                    queueCount = queue.length,
                    show = function () {
                        showMods.forEach(function (module) {
                            if (modViews.hasOwnProperty(module)) {
                                modViews[module].show();
                            }
                        });
                    };
                showMods = fc.addParents(showMods);
                // hide all (except incoming)
                queue.forEach(function (obj) {
                    queueCount--;
                    if (showMods.indexOf(obj) === -1) {
                        modViews[obj].hide();
                    }
                    if (queueCount <= 0) {
                        show();
                    }
                });
            },
            overlay : function (name) {
                var node;
                // it's own module?
                if (modViews.hasOwnProperty(name)) {
                    node = modViews[name].getNode();
                } else {
                    node = document.getElementById(name);
                }

                return {
                    by : function (name, text) {
                        return ext[name](node, text);
                    }
                };
            }
        };
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined') { module.exports = flowControl; } else {canny.add('flowControl', flowControl); }

}());

},{}],4:[function(require,module,exports){
var kssNav = function (canny) {
    "use strict";

    return {
        add : function (node, attr) {
            node.addEventListener('click', function () {
                canny.flowControl.show(attr);
            });
        }
    };
};

module.exports = kssNav;
},{}],5:[function(require,module,exports){
var canny = require('canny');
canny.add('flowControl', require('canny/mod/flowControl'));
canny.add('async', require('canny/mod/async'));

// special template modules
canny.add('kssNav', require('./c-kssNav')(canny));

// public to window
window.canny = canny;
},{"./c-kssNav":4,"canny":1,"canny/mod/async":2,"canny/mod/flowControl":3}]},{},[5])