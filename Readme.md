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


# zbus-javascript

- zbus's javascript works for both Browser and NodeJS environments.
- zbus.js is the only source file required

## Getting started

Start zbus, see [https://gitee.com/rushmore/zbus](https://gitee.com/rushmore/zbus) 

**1. NodeJS**

zbus has no dependency

    npm install zbus

you are ready to go 

**2. Web Browser**

The easiest way to test zbus.js in browser is to use chrome or firefox to access
[http://zbus.io](http://zbus.io) 

In the console, you can program to invoke RPC methods, such as plus/echo(support by the above example)

![RPC in browser](https://git.oschina.net/uploads/images/2017/0701/185654_332bde18_7458.png "Rpc in browser")



## API Demo

Only demos the gist of API, more configurable usage calls for your further interest.

### Produce message

    var broker = new Broker("localhost:15555;localhost:15556"); 

    var p = new Producer(broker);
    var res = await p.declare('MyTopic'); //If topic is new, you may have to declare it, otherwise ignore
    console.log(res);
    var res = await p.publish({topic: 'MyTopic', body: 'hello from JS(async/await)'}) 
    console.log(res);



### Consume message

    var broker = new Broker("localhost:15555");

    var c = new Consumer(broker, "MyTopic"); 
    c.onMessage = function (msg, client) {
        console.log(msg);
    }
    c.start();  


### RPC client

    var broker = new Broker("localhost:15555;localhost:15556"); 
    var rpc = new RpcInvoker(broker, "MyRpc");   

    //1) Raw invocation {method: xxx, params: []}
    var res = await rpc.invoke({ method: 'plus', params: [1, 2] });
    console.log(res);

    //2) Raw invocation, method, param1,....
    var res = await rpc.invoke('plus', 1, 2);
    console.log(res);

    //3) Dynamic proxy
    var res = await rpc.plus(1, 2);
    console.log(res);

    broker.close(); //Broker should be shared, close if no need anymore.

### RPC service

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

    //sparate the business logic, the following is only a routine configuration

    var rpc = new RpcProcessor();
    rpc.addModule(myplus); //method example
    rpc.addModule(new MyService()); //object example 

    //start Consumer with rpc.onMessage handling
    var broker = new Broker("localhost:15555");

    var c = new Consumer(broker, "MyRpc");
    c.connectionCount = 1;
    c.messageHandler = rpc.messageHandler;
    c.start(); 