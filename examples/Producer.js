if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../../src/main/resources/zbus.js");
    var Broker = zbus.Broker;
    var Producer = zbus.Producer;
}


var broker = new Broker("localhost:15555");

broker.ready(function () {
	var p = new Producer(broker);
	
	var count = 0, topic = "MyTopic";
	//produce message every 3 seconds
	function produce(p) {
		var req = { topic: topic, body: 'published from javascript '+count++ };
		p.publish(req, function (msg) {
			console.log(msg);
		})
		setTimeout(function () {
			produce(p);
		}, 3000)
	}  
	
	p.declare(topic, function (data) {
		produce(p);
	});   
}) 
