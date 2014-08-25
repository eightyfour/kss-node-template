var canny = require('canny');
canny.add('flowControl', require('canny/mod/flowControl'));
canny.add('async', require('canny/mod/async'));

// special template modules
canny.add('kssNav', require('./c-kssNav')(canny));

// public to window
window.canny = canny;