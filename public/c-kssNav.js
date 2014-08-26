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