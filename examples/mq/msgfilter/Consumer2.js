if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../../zbus.js"); 
    Broker = zbus.Broker;
    Consumer = zbus.Consumer;
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js

var broker = new Broker("localhost:15555;localhost:15556");
var c = new Consumer(broker, {
    topic: "MyTopic",
    consumeGroup: "JS-FilterGroup2", //Start multiple consume groups
	groupFilter: 'Stock.HK.*',   //message filter
});

c.messageHandler = function (msg, client) {
	console.log(msg);
}
c.start();  

