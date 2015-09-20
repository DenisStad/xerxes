var xerxes = require('./../../xerxes');
var App = xerxes();

App.load('test0/test');
App.load('test1/test');
App.load('test2/test');

var loadedTest3 = false;
try {
  App.load('test3/test');
  loadedTest3 = true;
} catch (e) {
  console.log("Test 3 OK");
}
App.load('test4/test');
App.load('test5/test');
