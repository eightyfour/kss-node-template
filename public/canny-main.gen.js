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
 * Instead of call: canny.flowControl.show('view1', 'view2', 'view3') call canny.flowControl.show('view').
 *
 * TODO add a hide method that just hide the specific element.
 *
 * TODO handle the fade in and out via CSS classes - and use transitions for it
 */
(function () {
    "use strict";

    /**
     * wraps transitionend event vendor implementation
     */
    function onTransitionEndOnce(node, cb) {
        var event = (function () {
                if (node.style.webkitTransition !== undefined) {
                    return 'webkitTransitionEnd';
                } else if (node.style.transition !== undefined) {
                    return 'transitionend';
                }
            }()),
            listener = function(e) {
                e.target.removeEventListener(e.type, listener);
                cb(e);
            };
        if (event) {
            node.addEventListener(event, listener, false);
        } else {
            cb();
        }
    }

    var flowControlInstance = function (fcInstanceName) {
        var instanceName = fcInstanceName,
            modViews = {}, // saves module views
            getViewAnchor = function () {
                var hash = location.hash || null, hashSub;
                if (hash) {
                    hashSub = hash.substr(1);
                    return hashSub.split(',');
                }
                return hash;
            },
            getAllModuleChildrens = function (cNode) {
                // TODO test selector if we have more than one module in canny-mod
                var children = cNode.querySelectorAll('[canny-mod*=' + instanceName + ']'),
                    fc_childNodes = {};
//                            if (cNode.hasChildNodes()) {
//                                [].slice.call(cNode.children).forEach(findChildren);
//                            }
                [].slice.call(children).forEach(function (mod) {
                    var attrValue, view;
                    // TODO read attributes should be a part of canny functionality
                    attrValue = mod.getAttribute('canny-var').split("\'").join('\"');
                    if (/:/.test(attrValue)) {
                        // could be a JSON
                        view = JSON.parse(attrValue).view;
                    } else {
                        view = attrValue;
                    }
                    fc_childNodes[view] = mod;
                });
                return fc_childNodes;
            },
            /**
             * Each flowControl node will end up in a flowControlModule.
             *
             * @param node
             * @param attr
             * @returns {{hasChildrenWithName: hasChildrenWithName, getViewName: getViewName, show: show, hide: hide, fadeOut: fadeOut, getNode: getNode, fadeIn: fadeIn}}
             */
            flowControlModule = function (node, attr) {
                var flowControlChildNodes = {},
                    async = false,
                    parentViews = fc.getParentNode(attr.view);
                // saves all children in a object
                flowControlChildNodes = getAllModuleChildrens(node);
//                    console.log('flowControlChildNodes:', flowControlChildNodes);
                return {
                    hasChildrenWithName : function (viewName) {
                        return flowControlChildNodes.hasOwnProperty(viewName);
                    },
                    getViewName : function () {
                        return attr.view;
                    },
                    display : function () {
                        // don't call parents
                        // don't fade in
                        node.style.display = '';
                    },
                    show : function (cb) {
                        if (parentViews) {
                            parentViews.forEach(function (fc_module) {
//                                console.log('parentViews', fc_module.getViewName());
                                fc_module.display();
                            });
                        }
                        if (!async && attr.hasOwnProperty('async')) {
                            canny.async.loadHTML(node, {url : attr.async}, function () {
                                node.style.display = '';
                                cb();
                            });
                            async = true;
                        } else {
                            node.style.display = '';
                            cb && cb();
                        }
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
                        if (parentViews) {
                            parentViews.forEach(function (fc_module) {
//                                console.log('parentViews', fc_module.getViewName());
                                fc_module.display();
                            });
                        }
                        if (!async && attr.hasOwnProperty('async')) {
                            canny.async.loadHTML(node, {url : attr.async}, function () {
                                fc.fadeIn(node,  cb || function () {});
                            });
                            async = true;
                        } else {
                            fc.fadeIn(node,  cb || function () {});
                        }
                    }
                };

            },
            showInitialView = getViewAnchor(),
            fc = {
                // get all parent modules from the given viewName
                getParentNode : function (viewName) {
                    var queue = Object.keys(modViews), l, i, parents = [];
                    l = queue.length;
                    for (i = 0; i < l; i++) {
                        // TODO
                        if (viewName !== queue[i] && modViews[queue[i]][0].hasChildrenWithName(viewName)) {
                            parents.push(modViews[queue[i]][0]);
                        }
                    }
                    return parents.length === 0 ? null : parents;
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
                            // TODO call ends always with null - viewName is top parent
                            var pViewName = fc.getParentNode(viewName);
//                            console.log('viewName: ' + viewName, 'pViewName ' + pViewName );
                            if (pViewName) {
                                pViewName.forEach(function (fc_module) {
                                    // TODO while has parent add it to the extViews
                                    pushExtViews(fc_module.getViewName());
                                    addParentView(fc_module.getViewName());
                                });
                            }
                        };
                    l = views.length;
                    for (i = 0; i < l; i++) {
                        pNode = fc.getParentNode(views[i]);
                        if (pNode) {
                            pNode.forEach(function (fc_module) {
                                pushExtViews(fc_module.getViewName());
                                // so far we have parents do it recursive
                                // TODO not needed each parent will do it by own -
                                addParentView(fc_module.getViewName());
                            });
                        }
                    }
                    return extViews;
                },
                fadeOut : function (node, cb) {

                    if(node.style.display === 'none') {
                        cb();
                    } else {
                        node.classList.add('c-flowControl');
                        node.classList.add('fade-out');

                        setTimeout(function () {
                            node.style.display = 'none';
                            node.classList.remove('c-flowControl');
                            node.classList.remove('fade-out');
                            cb();
                        }, 300);
                    }

                },
                fadeIn : function (node, cb) {
                    // TODO: fade in does not work properly
                    node.style.display = '';
                    node.classList.add('c-flowControl');
                    node.classList.add('fade-in');

                    setTimeout(function() {
                        node.classList.remove('c-flowControl');
                        node.classList.remove('fade-in');
                        cb();

                        // trigger reflow to fix the black boxes issue FTTWO-1249
                        // TODO: check if this can be avoided or
                        var box = document.querySelector('.t-centerBox-content');
                        if (box) {
                            box.style.opacity = 0.99;
                            setTimeout(function() {
                                box.style.opacity = 1;
                            }, 50);
                        }
                    }, 300);
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
            },
            /**
             *
             * @type {{mod: {}, createNewInstance: createNewInstance, ready: ready, add: add, show: show, fadeIn: fadeIn, showImmediately: showImmediately, overlay: overlay}}
             */
                api = {
                mod : modViews, // part of api
                /**
                 * this method could be used to create new instances of flowControl (only needed if you
                 * load this script directly without require)
                 * @param name (unique module name)
                 **/
                createNewInstance : function (name) {
                    return flowControl(name);
                },
                ready : function () {
                    var modNames, i, l;
                    if (showInitialView) {
                        modNames = Object.keys(modViews);
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
                /**
                 *
                 * @param node
                 * @param attr {{view:(identifier),}}
                 */
                add : function (node, attr) {    // part of api
                    if (!modViews[attr.view]) {
                        modViews[attr.view] = [];
                    }
                    modViews[attr.view].push(flowControlModule(node, attr));
                },
                /**
                 * @deprecated will handle showImmediately in near future
                 */
                show : function () {
                    api.fadeIn.apply(this, arguments);
                },
                /**
                 * @param name (arguments list of views to show)
                 */
                fadeIn : function (name) {
                    var showMods = [].slice.call(arguments),
                        queue = Object.keys(modViews),
                        queueCount = 0,// = queue.length,
                        fadeIn = function () {
                            showMods.forEach(function (module) {
                                if (modViews.hasOwnProperty(module)) {
                                    modViews[module].forEach(function (obj) {
                                        obj.fadeIn(function () {
                                            // TODO remove
//                                                console.log('FADE IN DONE');
                                            // TODO count callbacks and handle it ?
                                        });
                                    });
                                }
                            });
                            // if last param is function than handle it as callback
                            if (typeof showMods[showMods.length - 1] === 'function') {
                                showMods[showMods.length - 1]();
                            }
                        };
                    showMods = fc.addParents(showMods);
                    queue.forEach(function (view) {
                        queueCount += modViews[view].length;
                    });
                    // iterate over all registered modules
                    queue.forEach(function (view) {
                        // iterate over all instances of the same view
                        modViews[view].forEach(function (obj) {
                            // hide all (except incoming and parents) TODO but only the parents of the module
                            if (showMods.indexOf(view) === -1) {
                                obj.fadeOut(function () {
                                    queueCount--;
                                    if (queueCount <= 0) {
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
                    });
                },
                /**
                 * @deprecated use show instead
                 * @param name
                 */
                showImmediately : function (name) {    // module specific
                    var showMods = [].slice.call(arguments),
                        queue = Object.keys(modViews),
                        queueCount = 0,
                        countCb = (function () {
                            var cb, length = 0;
                            // if last param is function than handle it as callback
                            if (typeof showMods[showMods.length - 1] === 'function') {
                                cb = showMods[showMods.length - 1];
                            }
                            return {
                                countUp : function (num) {
                                    length += num;
                                },
                                reduce : function () {
                                    length--;
                                    if (cb && length <= 0) {
                                        cb();
                                    }
                                }
                            };
                        }()),
                        show = function () {
                            showMods.forEach(function (module) {
                                if (modViews.hasOwnProperty(module)) {
                                    countCb.countUp(modViews[module].length);
                                    modViews[module].forEach(function (obj) {
                                        obj.show(countCb.reduce);
                                    });
                                }
                            });
                        };
                    showMods = fc.addParents(showMods);
                    // hide all (except incoming)
                    queue.forEach(function (view) {
                        queueCount += modViews[view].length;
                        modViews[view].forEach(function (obj) {
                            queueCount--;
                            if (showMods.indexOf(obj) === -1) {
                                obj.hide();
                            }
                            if (queueCount <= 0) {
                                show();
                            }
                        });
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
        return api;
    },
    flowControl = (function () {
        var instances = {};
        return function (name) {
            var instance,
                def = name || 'flowControl';
            if (instances.hasOwnProperty(def)) {
                instance = instances[def];
            } else {
                instances[def] = flowControlInstance(def);
                instance = instances[def];
            }
            return instance;
        };
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) { module.exports = flowControl; } else {canny.add('flowControl', flowControl('flowControl')); }

}());

},{}],4:[function(require,module,exports){
/*global canny */
/*jslint browser: true*/

/**
 * Work in progress - don't use this yet:
 *  Will try to reload modules there are not registered on canny.
 *
 *  Only modules which name is the same name as the file name can be loaded.
 *
 *  TODO: require should not parse node which already parsed from canny. Otherwise the
 *  add method is called twice. Means also that click listeners there added in the add
 *  phase a registered more than one.
 *  Maybe call only the add methods from modules there are loaded afterwords.
 */
(function () {
    "use strict";
    var require = (function () {
        var fc = {
                appendScript : function (path, cb) {
                    var node = document.createElement('script');
                    node.type = "text/javascript";
                    node.async = true;
                    node.setAttribute('src', path);
                    node.addEventListener('load', cb, false);
                    document.head.appendChild(node);
                },
                appendScriptsToHead : function (urls, cb) {
                    var path, i, includesScripts = false,
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

                    for (i = 0; i < urls.length; i++) {
                        path = urls[i];
                        includesScripts = true;
                        scriptCounter.up();
                        fc.appendScript(path, scriptCounter.ready);
                    }

                    if (urls.length === 0 || includesScripts === false) {
                        cb();
                    }

                },
                searchForNoneRegisteredModules : function (node) {
                    var name = 'canny',
                        query = [].slice.call(node.querySelectorAll('[' + name + '-mod]')),
                        returns = {};
                    query.forEach(function (elem) {
                        var attribute = elem.getAttribute(name + '-mod'), attributes;
                        attributes = attribute.split(' ');
                        attributes.forEach(function (attr) {
                            if (!canny.hasOwnProperty(attr)) {
                                returns[attr] = null;
                            }
                        });
                    });
                    return returns;
                },
                getPathNames : function (scriptsObj, path) {
                    var names = Object.keys(scriptsObj),
                        urls = [];
                    names.forEach(function (name) {
                        urls.push(path + '/' + name + '.js');
                    });
                    return urls;
                }
            },
            modViews = {
                add: function (node, attr) {    // part of api
                    // TODO is there no extension load it from canny/mod folder
                    if (attr && attr.hasOwnProperty('ext')) {
                        fc.appendScriptsToHead(
                            fc.getPathNames(
                                fc.searchForNoneRegisteredModules(node),
                                attr.ext
                            ),
                            function () {
                                console.log('REQUIRE START CANNY PARSE AGAIN', node);
                                // trigger canny parse because canny can't initialize none registered modules
                                canny.cannyParse(node, function () {
                                    console.log('CANNY FROM REQUIRE IS DONE');
                                }); // init also canny own modules
                            }
                        );

                    }
                    console.log('REQUIRE ADD');
                }
//                loadModule : function (name) {
//                    console.log('LOAD MODULE WITH NAME');
//                }
            };

        return modViews;
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined') {
        module.exports = require;
    } else {
        canny.add('require', require);
    }

}());

},{}],5:[function(require,module,exports){
var kssNav = function (canny) {
    "use strict";
    var menuMap = {};

    function handleActiveState(activeNode) {
        Object.keys(menuMap).forEach(function (key) {
            menuMap[key].parentNode.classList.remove('kss-active');
        });
        activeNode.parentNode.classList.add('kss-active');
    }

    function handleView(node, view) {
        menuMap[view] = node;
        node.addEventListener('click', function () {
            // TODO scroll body to top
            canny.flowControl.show(view, function () {
                handleActiveState(menuMap[view]);
            });
        });
    }

    /**
     * Adds the first child of the node and append it to the parent of the menu view node.
     *
     * @param node
     * @param view
     */
    function handleSubMenu(node, view) {
        console.log('handleSubMenu');
        if (menuMap.hasOwnProperty(view) && node.children.length > 0) {
            menuMap[view].parentNode.appendChild(node.children[0]);
        }
    }
    return {
        add : function (node, attr) {
            if (attr.hasOwnProperty('view')) {
                handleView(node, attr.view);
            } else if (attr.hasOwnProperty('subMenu')) {
                handleSubMenu(node, attr.subMenu);
            }
        }
    };
};

module.exports = kssNav;
},{}],6:[function(require,module,exports){
var canny = require('canny');
canny.add('flowControl', require('canny/mod/flowControlInstance')('flowControl'));
canny.add('async', require('canny/mod/async'));
canny.add('require', require('canny/mod/require'));

// special template modules
canny.add('kssNav', require('./c-kssNav')(canny));

// public to window
window.canny = canny;
},{"./c-kssNav":5,"canny":1,"canny/mod/async":2,"canny/mod/flowControlInstance":3,"canny/mod/require":4}]},{},[6])