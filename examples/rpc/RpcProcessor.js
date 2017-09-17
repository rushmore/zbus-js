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
    ServiceBootstrap = zbus.ServiceBootstrap;  
}  

var b = new ServiceBootstrap();
b.addModule(myplus);			 //method example
b.addModule(new MyService());    //object example


b.serviceAddress("localhost:15555;localhost:15556") 
 //.serviceAddress({address: 'localhost:15555', token: 'myrpc_service'})
 .serviceName("MyRpc") 
 //.serviceToken("myrpc_service") 
 .start();
   