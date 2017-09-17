if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js"); 
    Broker = zbus.Broker;
    Consumer = zbus.Consumer;
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js

var broker = new Broker(); 
broker.addTracker({address: 'localhost:15555', token: 'mytopic'});
//broker.addTracker({address: 'localhost:15556', token: 'mytopic'});
var c = new Consumer(broker, 
	{ topic: 'MyTopic', token: 'mytopic' }
); 


c.messageHandler = function (msg, client) {
	logger.info(msg);
}
c.start();  

