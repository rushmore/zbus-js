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

var broker = new Broker("localhost:15555;localhost:15556"); 
var p = new Producer(broker);

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