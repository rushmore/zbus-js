if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../../src/main/resources/zbus.js");
    var Broker = zbus.Broker;
    var RpcInvoker = zbus.RpcInvoker;
}

var broker = new Broker("localhost:15555");

var rpc = new RpcInvoker(broker, "MyRpc");


broker.ready(function () {   
	rpc.invoke({ method: 'plus', params: [1, 2] }, function (res) {
		console.log(res);
	})

	rpc.invoke('plus', 1, 2, function (res) {
		console.log(res);
	})

	rpc.plus(1, 2, function (res) {
		console.log(res);
	})

	rpc.testEncoding(function (res) {
		console.log(res);
	}) 
}) 
