if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js");
    Broker = zbus.Broker;
    Producer = zbus.Producer;
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js

function asleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function f(){ 
	
var token = "mytopic"; //authentication
var broker = new Broker(); 
broker.addTracker({address: 'localhost:15555', token: token});
broker.addTracker({address: 'localhost:15556', token: token});

var p = new Producer(broker, token);

var count = 0, topic = "MyTopic";
await p.declare(topic); 

for(var i=0; ;i++) {
	var req = { 
		topic: topic,  
		body: 'published from javascript '+ i 
	};
	if (i%2 == 0){//mock for tagging
		req.tag = 'stock.600256'; //add tag for filer test
	};
	try {
		var msg = await p.publish(req);
		console.log(msg);
	} catch(e){
		//ignore, may retry here
	} 
	await asleep(2000);
}
 
}
f();