if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js");
    Broker = zbus.Broker;
    RpcInvoker = zbus.RpcInvoker;
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js

var broker = new Broker("localhost:15555;localhost:15556"); 
var rpc = new RpcInvoker(broker, "MyRpc");   

async function f(){ 

//1) Raw invocation {method: xxx, params: []}
var res = await rpc.invoke({ method: 'plus', params: [1, 2] });
console.log(res);

//2) Raw invocation, method, param1,....
var res = await rpc.invoke('plus', 1, 2);
console.log(res);

//3) Dynamic proxy
var res = await rpc.plus(1, 2);
console.log(res);

//broker.close(); //close the connections

}
f();