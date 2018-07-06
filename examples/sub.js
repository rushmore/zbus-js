const zbus = require("../zbus.js");
const MqClient = zbus.MqClient;
 

const client = new MqClient("localhost:15555");  

var mq = "MyMQ", channel = "MyChannel"; 
function create(mq, channel){ 
    var msg = {};
    msg.headers = {
        cmd: 'create',
        mq: mq,
        channel: channel, 
    }; 

    client.invoke(msg).then(res=>{
        console.log(res);
    }); 
}

function sub(mq, channel){
    var msg = {};
    msg.headers = {
        cmd: 'sub',
        mq: mq,
        channel: channel, 
        window: 1,
    }; 
    client.invoke(msg).then(res=>{ 
        console.log(res); 
    }); 
}  
 
client.addMqHandler(mq, channel, msg=>{ 
    console.log(msg); 
});

client.onopen = ()=>{
    create(mq, channel);
    sub(mq, channel);
};

client.connect();