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


//---------------construct RpcProcessor----------------
if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../../src/main/resources/zbus.js");
    var RpcProcessor = zbus.RpcProcessor;
    var Broker = zbus.Broker;
    var Consumer = zbus.Consumer;
} 

var rpc = new RpcProcessor();
rpc.addModule(myplus); //method example
rpc.addModule(new MyService()); //object example


//start Consumer with rpc.onMessage handling
var broker = new Broker("localhost:15555");

var c = new Consumer(broker, "MyRpc");
c.connectionCount = 1;
c.messageHandler = rpc.messageHandler;
c.start(); 
