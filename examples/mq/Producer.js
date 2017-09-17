if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js");
    Broker = zbus.Broker;
    Producer = zbus.Producer;
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js

async function f(){

var token = "mytopic"; //authentication
var broker = new Broker(); 
broker.addTracker({address: 'localhost:15555', token: token});
broker.addTracker({address: 'localhost:15556', token: token});

var p = new Producer(broker, token);
var res = await p.declare('MyTopic'); //If topic is new, you may have to declare it, otherwise ignore
console.log(res);
var res = await p.publish({topic: 'MyTopic', body: 'hello from JS(async/await)'}) 
console.log(res);

broker.close();
}
f();