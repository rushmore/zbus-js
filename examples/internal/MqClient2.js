if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js");
	MqClient = zbus.MqClient; 
	ServerAddress = zbus.ServerAddress;
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js 

var serverAddress = new ServerAddress("localhost:15555");
//serverAddress.setCertFile("examples/ssl/zbus.crt");

var client = new MqClient(serverAddress);
client.connect(()=>{
	console.log("connected");
});