const zbus = require("../zbus.js");

const RpcClient = zbus.RpcClient;  

async function test(){
	const rpc = new RpcClient("localhost:15555");  
	//const rpc = new RpcClient("localhost:8080");  
	//rpc.enableAuth("2ba912a8-4a8d-49d2-1a22-198fd285cb06", "461277322-943d-4b2f-b9b6-3f860d746ffd"); //apiKey + secretKey 

	//module+method invoke 
	var res = await rpc.example.plus(1,2);
	console.log(res);

	//No module, direct invoke method
	//var res = await rpc.plus(1,2);
	//console.log(res);

	//based on URL invoke
	var res = await rpc.invoke("/example/plus", 1, 2);
	console.log(res);
}

test();