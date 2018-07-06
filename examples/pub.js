const zbus = require("../zbus.js");
const MqClient = zbus.MqClient;

var mq = "MyMQ"
const client = new MqClient("localhost:15555");  

function create(mq){
	var msg = { 
		headers:{
			cmd: 'create',
			mq: mq, 
		}
	};
	
    client.invoke(msg).then(res=>{
        console.log(res);
    }); 
}  

function pub(mq) {
    var msg = { 
		headers:{
			cmd: 'pub',
			mq: mq, 
		},
		body: 'hello from js'
	}
    client.invoke(msg).then(res=>{
        console.log(res);
    });
}

client.connect().then(()=>{
    create(mq); //optional, if created no need to create again
    pub(mq);
});  
 