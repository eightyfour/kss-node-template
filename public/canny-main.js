var canny = require('canny');
canny.add('flowControl', require('canny/mod/flowControlInstance')('flowControl'));
canny.add('async', require('canny/mod/async'));
canny.add('require', require('canny/mod/require'));

// special template modules
canny.add('kssNav', require('./c-kssNav')(canny));

// public to window
window.canny = canny;