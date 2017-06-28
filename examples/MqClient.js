if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../../src/main/resources/zbus.js");
    var MqClient = zbus.MqClient;
}

var client = new MqClient("localhost:15555");
client.connect(function () {
    client.declare("hong", function(data){
		console.log(data);
	});
	
    client.consume("hong", function (data) {
        console.log(data);
    })

    client.produce({ topic: "hong", body: "hello from javascript" }, function (data) {
        console.log(data);
    });
})

client.close();