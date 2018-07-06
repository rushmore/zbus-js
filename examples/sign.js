//require("./rpc_server.js")
const zbus = require("../zbus.js"); 
const Message = zbus.Message;

const jsSHA = require("jssha");
const stringify = require('json-stable-stringify'); 


function signMessage(apiKey, secretKey, msg){
    delete msg.headers.signature;
    msg.headers.apiKey = apiKey; 
    const data = stringify(msg);
    var shaObj = new jsSHA("SHA-256", "TEXT");
    shaObj.setHMACKey(secretKey, "TEXT");
    shaObj.update(data);
    var hash = shaObj.getHMAC("HEX");
    msg.headers.signature = hash;
}

 
const msg = new Message();
msg.headers.cmd = 'pub';
msg.headers.mq = 'MyRpc';
msg.headers.ack = "false";
msg.body = [1,2];
 
const apiKey = '2ba912a8-4a8d-49d2-1a22-198fd285cb06'
const secretKey = '461277322-943d-4b2f-b9b6-3f860d746ffd'   
signMessage(apiKey, secretKey, msg);

console.log(JSON.stringify(msg));
