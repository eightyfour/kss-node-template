canny.add('colorButton', (function () {
    "use strict";

    /**
     * JUST A TEST FILE TO TEST IF THE REQUIRE MODULE IS WORKING CORRECTLY
     */

    return {
        add : function (node, attr) {
            console.log('HALLO COLORBUTTON');
        },
        ready : function () {
            console.log('COLORBUTTON READY');
        }
    };
}()));