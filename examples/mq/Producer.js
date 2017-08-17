if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js");
    Broker = zbus.Broker;
    Producer = zbus.Producer;
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js

async function f(){
 
var broker = new Broker("localhost:15555;localhost:15556"); 

var p = new Producer(broker);
var res = await p.declare('MyTopic'); //If topic is new, you may have to declare it, otherwise ignore
console.log(res);
var res = await p.publish({topic: 'MyTopic', body: 'hello from JS(async/await)'}) 
console.log(res);

broker.close();
}
f();