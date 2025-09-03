import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// Polyfill for crypto.subtle if needed
if (typeof global.crypto === 'undefined') {
  global.crypto = require('react-native-get-random-values').getRandomValues;
}