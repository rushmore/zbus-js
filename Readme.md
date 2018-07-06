                /\\\                                                                         
                \/\\\                                               /\\\                     
                 \/\\\                                              \///                     
     /\\\\\\\\\\\ \/\\\         /\\\    /\\\  /\\\\\\\\\\             /\\\  /\\\\\\\\\\      
     \///////\\\/  \/\\\\\\\\\  \/\\\   \/\\\ \/\\\//////             \/\\\ \/\\\//////      
           /\\\/    \/\\\////\\\ \/\\\   \/\\\ \/\\\\\\\\\\            \/\\\ \/\\\\\\\\\\    
          /\\\/      \/\\\  \/\\\ \/\\\   \/\\\ \////////\\\        /\\ \/\\\ \////////\\\   
         /\\\\\\\\\\\ \/\\\\\\\\\  \//\\\\\\\\\   /\\\\\\\\\\  /\\\ \//\\\\\\   /\\\\\\\\\\  
         \///////////  \/////////    \/////////   \//////////  \///   \//////   \//////////  


zbus strives to make Message Queue and Remote Procedure Call fast, light-weighted and easy to build your own service-oriented architecture for many different platforms. Simply put, zbus = mq + rpc.

zbus carefully designed on its protocol and components to embrace KISS(Keep It Simple and Stupid) principle, but in all it delivers power and elasticity. 


# zbus-js

- zbus's javascript works for both Browser and NodeJS environments.
- zbus.js is the only source file required in browser

## Getting started

Start zbus, see [https://github.com/rushmore/zbus](https://github.com/rushmore/zbus) 

**1. NodeJS**

    npm install zbus

you are ready to go 

**2. Web Browser**

    just include zbus.min.js


## API Demo

Only demos the gist of API, more configurable usage calls for your further interest.

### Produce message

    const client = new MqClient("localhost:15555");     

    client.connect().then(()=>{
        var msg = {
            cmd: 'pub',
            mq: 'MyMQ',
            body: 'hello from js'
        };
        client.invoke(msg).then(res=>{
            console.log(res);
        });
    });  
    



### Consume message

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


### RPC client

    const rpc = new RpcClient("localhost:15555");     

	var res = await rpc.example.plus(1,2);
	console.log(res); 


### RPC service

    class MyService{
        plus(a, b) {
            return parseInt(a) + parseInt(b);
        } 
        echo(value) {
            return value;
        }  
        testEncoding() {
            return "中文";
        } 
        stringArray() {
            return ["hong", "leiming"];
        } 
        getBin() {
            return new Uint8Array(10);
        }  

        getOrder(){
            return {name: 'orderName', age: 18};
        } 

        html(){
            var res = new Message();
            res.status= 200;
            res.headers['content-type'] = 'text/html; charset=utf8';
            res.body = "<h1>hello html body</h1>"
            return res;
        } 
    }       

    var p = new RpcProcessor();
    p.urlPrefix = "";
    p.mount("/example", new MyService());
    p.mount("/", home);

    //RPC via MQ
    var server = new RpcServer(p);
    server.mq = "MyRpc";
    server.address = "localhost:15555"; 
    //server.enableAuth("2ba912a8-4a8d-49d2-1a22-198fd285cb06", "461277322-943d-4b2f-b9b6-3f860d746ffd"); //apiKey + secretKey 
    server.start();