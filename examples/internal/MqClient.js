if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js");
	MqClient = zbus.MqClient; 
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js

async function example(){
 
var client = new MqClient("localhost:15555");   
await client.connect();

var res = await client.invoke({cmd: 'server'});
console.log(res);   
res = await client.query('MyTopic');
console.log(res);

await client.declare('hongx2');
await client.remove('hongx2');

await client.produce({topic: 'MyTopic', body: 'hello from js async/await'});
var msg = await client.consume({topic: 'MyTopic'});
console.log(msg.body);

client.close();
} 
example();