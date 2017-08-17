//------------------business logic--------------------
function MyService() {
	this.plus = function (a, b) {
		return parseInt(a) + parseInt(b);
	} 
	this.echo = function (value) {
		return value;
	} 
	this.getString = function (value, c) {
		if (!c) return value + ", frome javascript";
		return value + ", " + c;
	} 
	this.testEncoding = function () {
		return "中文";
	} 
	this.stringArray = function () {
		return ["hong", "leiming"];
	} 
	this.getBin = function () {
		return new Uint8Array(10);
	}
}  

function myplus(a, b) {
	return a + b;
}   

 
if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js");
    RpcProcessor = zbus.RpcProcessor;
    Broker = zbus.Broker;
	Consumer = zbus.Consumer;  
	var logger = zbus.logger;
} 

logger.level = logger.DEBUG; //from zbus.js

var rpc = new RpcProcessor();
rpc.addModule(myplus); //method example
rpc.addModule(new MyService()); //object example


//You need Broker and Consumer, RpcProcessor is just another type of message handler
var broker = new Broker("localhost:15555;localhost:15556");

var c = new Consumer(broker, "MyRpc");
c.connectionCount = 1;
c.messageHandler = rpc.messageHandler;
c.start(); 
