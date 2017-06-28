if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../../src/main/resources/zbus.js");
    var Broker = zbus.Broker; 
}

var broker = new Broker();
broker.addTracker("localhost:15555");

broker.ready(function () { 
	var admin = new MqAdmin(broker);
	admin.remove("hong5", function (data) {
		for(var d of data) {
			console.log(d);
		}
	});
})   
