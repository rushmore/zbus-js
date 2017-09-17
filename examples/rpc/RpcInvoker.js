if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js"); 
    ClientBootstrap = zbus.ClientBootstrap; 
}   
 
var b = new ClientBootstrap(); 
b.serviceName("MyRpc")
.serviceAddress("localhost:15555");
 //.serviceToken("myrpc_service")
 //.serviceAddress("localhost:15555;locahost:15556"); //HA
 //.serviceAddress({address: 'localhost:15555', token: 'myrpc_service'});

var rpc = b.invoker();

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

b.close();  
}
f();