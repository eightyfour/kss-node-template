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