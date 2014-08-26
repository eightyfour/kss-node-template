canny.add('gdxIcon', (function (canny) {
    "use strict";

    /**
     * JUST A TEST FILE TO TEST IF THE REQUIRE MODULE IS WORKING CORRECTLY
     */

    return {
        add : function (node, attr) {
            console.log('HALLO GDX ICON');
        },
        ready : function () {
            console.log('GDX ICON READY');
        }
    };
}()));