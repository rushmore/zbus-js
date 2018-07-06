
const jsSHA = require('jssha');
const stringify = require('json-stable-stringify'); 

function uuid() {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}

Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
} 

class Logger {
    constructor(level) {
        this.level = level;
        if (!level) {
            this.level = Logger.DEBUG;
        }

        this.DEBUG = 0;
        this.INFO = 1;
        this.WARN = 2;
        this.ERROR = 3;
    }

    debug() { this._log(this.DEBUG, ...arguments); }
    info() { this._log(this.INFO, ...arguments); }
    warn() { this._log(this.WARN, ...arguments); }
    error() { this._log(this.ERROR, ...arguments); }

    log(level) { this._log(level, ...Array.prototype.slice.call(arguments, 1)); }

    _log(level) {
        if (level < this.level) return;
        var args = Array.prototype.slice.call(arguments, 1);
        var levelString = "UNKNOWN";
        if (level == this.DEBUG) {
            levelString = "DEBUG";
        }
        if (level == this.INFO) {
            levelString = "INFO";
        }
        if (level == this.WARN) {
            levelString = "WARN";
        }
        if (level == this.ERROR) {
            levelString = "ERROR";
        }
        args.splice(0, 0, "[" + levelString + "]");
        console.log(new Date().format("yyyy/MM/dd hh:mm:ss.S"), ...this._format(args));
    }

    _format(args) {
        args = Array.prototype.slice.call(args)
        var stackInfo = this._getStackInfo(2) //info => _log => _format  back 2

        if (stackInfo) {
            var calleeStr = stackInfo.relativePath + ':' + stackInfo.line;
            if (typeof (args[0]) === 'string') {
                args[0] = calleeStr + ' ' + args[0]
            } else {
                args.unshift(calleeStr)
            }
        }
        return args
    }

    _getStackInfo(stackIndex) {
        // get all file, method, and line numbers
        var stacklist = (new Error()).stack.split('\n').slice(3)

        // stack trace format: http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
        // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
        var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
        var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

        var s = stacklist[stackIndex] || stacklist[0]
        var sp = stackReg.exec(s) || stackReg2.exec(s)

        if (sp && sp.length === 5) {
            return {
                method: sp[1],
                relativePath: sp[2].replace(/^.*[\\\/]/, ''),
                line: sp[3],
                pos: sp[4],
                file: sp[2],
                stack: stacklist.join('\n')
            }
        }
    }
}

var logger = new Logger(Logger.INFO);  //should export 
//////////////////////////////////////////////////////////// 
var __NODEJS__ = (typeof window == 'undefined');
var WebSocket;
if (__NODEJS__) {
    WebSocket = require("ws");  //Cool stuff, compatible to standard WebSocket
} else {
    WebSocket = window.WebSocket;
    if (!WebSocket) {
        WebSocket = window.MozWebSocket;
    }
}

class Ticket { //message matching ticket
    constructor(msg, resolve) {
        this.id = uuid();
        if(!msg.headers) msg.headers = {};
        msg.headers.id = this.id;
        this.request = msg;
        this.response = null;

        this.resolve = resolve;
    }
}

class WebsocketClient {
    constructor(address) {
        if (!address.startsWith("ws://") && !address.startsWith("wss://")) {
            address = "ws://" + address;
        }
        this.address = address;
        this.socket = null;
        this.heartbeatInterval = 30000;
        this.ticketTable = {};
        this.connectPromise = null;
        this.autoReconnect = true;
        this.reconnectInterval = 3000;

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";

        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;

        this.beforeSend = null; 

        this.heartbeator = null;
        this.heartbeatMessage = null;
        this.heartbeatInterval = 30 * 1000; //30 seconds
    }

    enableAuth(apiKey, secretKey, authEnabled=true){
        this.authEnabled = authEnabled;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
    }
}

WebsocketClient.prototype.connect = function () {
    if (this.socket != null && this.connectPromise != null) {
        return this.connectPromise;
    }

    logger.debug("Trying to connect to " + this.address);

    var connectSuccess;
    var connectFailure;
    this.connectPromise = new Promise((resolve, reject) => {
        connectSuccess = resolve;
        connectFailure = reject;
    });

    try {
        this.socket = new WebSocket(this.address);
    } catch (e) {
        connectFailure(e);
        return this.connectPromise;
    }

    var client = this;
    this.socket.onopen = function (event) {
        logger.debug("Connected to " + client.address);
        if (connectSuccess) {
            connectSuccess();
        }
        if (client.onopen) {
            client.onopen(client);
        }
        if (client.heartbeatMessage != null) {
            client.heartbeator = setInterval(function () {
                try { client.send(client.heartbeatMessage); } catch (e) { logger.warn(e); }
            }, client.heartbeatInterval);
        }
    };

    this.socket.onclose = function (event) {
        client.connectPromise = null;
        clearInterval(client.heartbeat);
        if (client.onclose) {
            client.onclose();
        }
        if (client.autoReconnect) {
            client.connectTrying = setTimeout(function () {
                try { client.connect(); } catch (e) { }//ignore
            }, client.reconnectInterval);
        }
    };

    this.socket.onmessage = function (event) {
        var msg = JSON.parse(event.data);
        var msgid = null;
        if(msg.headers) {
            msgid = msg.headers.id;
        } 
        var ticket = client.ticketTable[msgid];
        if (ticket) {
            ticket.response = msg;
            if (ticket.resolve) {
                ticket.resolve(msg);
                delete client.ticketTable[msgid];
            }
        } else if (client.onmessage) {
            client.onmessage(msg);
        }
    }

    this.socket.onerror = function (data) {
        logger.error("Error: " + data);
    }
    return this.connectPromise;
}

WebsocketClient.prototype.close = function () {
    this.connectPromise = null;
    clearInterval(this.heartbeat);
    if (this.connectTrying) {
        clearTimeout(this.connectTrying);
    }
    this.socket.onclose = function () { }
    this.autoReconnect = false;
    this.socket.close();
    this.socket = null;
}

WebsocketClient.prototype.active = function () {
    return this.socket && this.socket.readyState == WebSocket.OPEN;
}

WebsocketClient.prototype.send = function (msg, beforeSend) { 
    if(!beforeSend) {
        beforeSend = this.beforeSend;
    }
    if (beforeSend != null) {
        beforeSend(msg);
    }
    if(this.authEnabled){
        signMessage(this.apiKey, this.secretKey, msg);
    }
    var data = JSON.stringify(msg);
    this.socket.send(data);
}

WebsocketClient.prototype.invoke = function (msg, beforeSend) {
    var client = this;
    var ticket = new Ticket(msg);
    this.ticketTable[ticket.id] = ticket;

    var promise = new Promise((resolve, reject) => {
        if (!client.active()) {
            reject(new Error("socket is not open, invalid"));
            return;
        }
        ticket.resolve = resolve;
        if (ticket.response) {
            ticket.resolve(ticket.reponse);
            delete this.ticketTable[ticket.id];
        }
    });

    this.send(msg, beforeSend);
    return promise;
};

/**
 * Browser ajax client talk to zbus
 */
class AjaxClient { 
    constructor(){
        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";
    }

    invoke(msg, beforeSend){
        if(beforeSend){
            beforeSend(msg);
        }
        if(this.authEnabled){
            signMessage(this.apiKey, this.secretKey, msg);
        }

        var method = msg.method;
        if(!method) method = "POST";
        const client = new XMLHttpRequest();
        var success;
        var failure;
        const promise = new Promise((resolve, reject) => {
            success = resolve;
            failure = reject;
        });
    
        client.onload = (e)=>{
            var res = client.responseText;
            if(success) {
                var contentType = client.getResponseHeader("content-type");
                if(!contentType) contentType = client.getResponseHeader("Content-Type");
                if(contentType && contentType.startsWith("application/json")){
                    try{
                        res = JSON.parse(res);
                    } catch(e){
                        //ignore
                    }
                }
                success(res);
            }
        }; 
        client.onerror = (e)=>{
            if(failure){
                failure(e);
            }
        }; 
        client.open(method, msg.url);
        for(var key in msg.headers){
            client.setRequestHeader(key, msg.headers[key]);
        } 
        client.send(JSON.stringify(msg.body));
        return promise;
    }
}
 

class MqClient extends (WebsocketClient) {
    constructor(address) {
        super(address);
        this.heartbeatMessage = {headers: { cmd: "ping" } };

        this.mqHandlerTable = {}; //mq=>{channle=>handler}
        this.onmessage = msg => {
            if(!msg.headers){
                logger.warn("missing headers in message: " + JSON.stringify(msg));
            }
            var mq = msg.headers.mq, channel = msg.headers.channel;
            if (mq == null || channel == null) {
                logger.warn("missing mq or channel in message headers: " + JSON.stringify(msg));
            }
            var mqHandlers = this.mqHandlerTable[mq];
            if (mqHandlers == null) {
                return;
            }
            var mqHandler = mqHandlers[channel];
            if (mqHandler == null) return;

            const window = msg.headers.window;
            mqHandler.handler(msg)
            if(window && window<=mqHandler.window/2){
                const sub = new Message();
                sub.headers.cmd = 'sub';
                sub.headers.mq = mq;
                sub.headers.channel = channel;
                sub.headers.window = mqHandler.window;
                sub.headers.ack = false;

                this.send(sub, mqHandler.beforesend);
            }
        };
    }

    /**
     * subscribe on channel of mq
     * 
     * @param {*} mq message queue id
     * @param {*} channel channel fo mq
     * @param {*} callback callback when message from channel of mq received
    *  @param {*} window window size if sub enabled
     * @param {*} beforsend message preprocessor before send, such as adding auth headers
     */
    addMqHandler(mq, channel, callback=null, window=1, beforsend=null) {
        var mqHandlers = this.mqHandlerTable[mq];
        if (mqHandlers == null) {
            mqHandlers = {};
            this.mqHandlerTable[mq] = mqHandlers;
        }
        mqHandlers[channel] = {
            handler: callback,
            window: window,
            beforesend: this.beforeSend
        };
    }
}

///////////////////////////////////////////////RPC/////////////////////////////////////////////////  
class Message { //type of HTTP message, indication
    constructor(){
        this.headers = {};
    }  

    replace(msg){
        for(var m in this) delete this[m];
        for(var m in msg) this[m] = msg[m]; 
    }
} 

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

var RpcInfoTemplate = `
<html><head>
<meta http-equiv="Content-type" content="text/html; charset=utf-8">
<title>{0} JS</title>
{1}

<script>  
var rpc; 
function init(){
	rpc = new RpcClient(null,"{0}"); 
} 
<\/script> 
<script async src="https://unpkg.com/zbus/zbus.min.js" onload="init()"><\/script>

</head>

<div> 
<table class="table">
<thead>
<tr class="table-info"> 
    <th class="urlPath">URL Path</th>
    <th class="returnType">Return Type</th>
    <th class="methodParams">Method and Params</th> 
</tr>
<thead>
<tbody>
{2}
</tbody>
</table> </div> </body></html>
`;


var RpcStyleTemplate = `
<style type="text/css">
body {
    font-family: -apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #292b2c;
    background-color: #fff;
    margin: 0px;
    padding: 0px;
}
table {  background-color: transparent;  display: table; border-collapse: separate;  border-color: grey; }
.table { width: 100%; max-width: 100%;  margin-bottom: 1rem; }
.table th {  height: 30px; }
.table td, .table th {    border-bottom: 1px solid #eceeef;   text-align: left; padding-left: 16px;} 
th.urlPath {  width: 10%; }
th.returnType {  width: 10%; }
th.methodParams {   width: 80%; } 
td.returnType { text-align: right; }
thead { display: table-header-group; vertical-align: middle; border-color: inherit;}
tbody { display: table-row-group; vertical-align: middle; border-color: inherit;}
tr { display: table-row;  vertical-align: inherit; border-color: inherit; }
.table-info, .table-info>td, .table-info>th { background-color: #dff0d8; }
.url { margin: 4px 0; padding-left: 16px;}
</style>
`;

var RpcMethodTemplate = `
<tr> 
    <td class="urlPath"><a href="{0}">{0}</a></td>
    <td class="returnType"></td>
    <td class="methodParams">
        <code><strong><a href="{0}">{1}</a></strong>({2})</code>
    </td> 
</tr>
`;

function joinPath() {
    var path = "";
    for(var p of arguments){
        path += "/"+p;
    } 
    path = path.replace(/[//]+/g, "/");
    if(path.length > 1 && path.endsWith("/")){
        path = path.substr(0, path.length-1);
    }
    return path;
} 
 
class RpcInfo {
    constructor(processor) {
        this.processor = processor;
    }

    index() {
        var p = this.processor;
        var res = new Message();
        res.status = 200;
        res.headers['content-type'] = 'text/html; charset=utf8';

        var info = '';
        for (var urlPath in p.urlPath2Methods) {
            var m = p.urlPath2Methods[urlPath];
            if(!m.docEnabled) continue;
            var args = m.paramsString; 
            var link = joinPath(p.urlPrefix, m.urlPath); 
            info += RpcMethodTemplate.format(link, m.method, args); 
        }
        res.body = RpcInfoTemplate.format(p.urlPrefix, RpcStyleTemplate, info); 
        return res;
    }
}

function _reply(res, status, message){
    res.status = status;
    res.headers['content-type'] = "text/plain; charset=utf8";
    res.body = message;
}

class RpcProcessor {
    constructor() {   
        this.urlPath2Methods = {};  
        this.urlPrefix = "";
        this.docModule = "doc";
        this.docEnabled = true;
    } 
 
    _matchMethod(module, method){
        if(!module) module = '';   
        var methods = this.module2methods[module];
        if(methods == null){
            return null;
        }  
        return methods[method]; 
    } 

    _parseParams(s){
        var bb = s.split('?');
        var params = bb[0].split('/').filter(s=>s.length>0);
        var kvs = bb.slice(1).join('?');
        var last = {};
        var kvpairs = kvs.split('&').filter(s=>s.length>0);
        if(kvpairs.length>0){
            params.push(last);
        }
        for(var kv of kvpairs){
            var a = kv.split('=');
            if(a.length>1){
                last[a[0]] = a[1];
            }
        } 
        return params;
    }

    process(req, res) {  
        var url = req.url;
        if(!url){
            _reply(res, 400, `Missing url in request`); 
            return;
        } 
        var m = null, urlPath = null, length = 0;
        for(var path in this.urlPath2Methods){
            if(url.startsWith(path)){
                if(path.length > length){
                    length = path.length;
                    urlPath = path;
                    m = this.urlPath2Methods[path];
                }
            }
        } 
        if(m == null){
            _reply(res, 404, `Url=${url} Not Found`); 
            return;
        }   

        var params = [];
        if(req.body){
            if(!(req.body instanceof Array)){
                req.body = JSON.parse(req.body);
            } 
            params = req.body;
        }  else {
            var subUrl = url.substr(urlPath.length);
            params = this._parseParams(subUrl);
        }  
        
        var result = m.instance.apply(m.target, params);

        if(result instanceof Message){ 
            res.replace(result); 
        } else {
            res.status = 200;
            res.headers['content-type'] = 'application/json; charset=utf8;'
            res.body = result;
        }
    }

    _addMethod(urlPath, methodObject, target, docEnabled){    
        var urlPath = joinPath(urlPath);
        var methodName = methodObject.name;
        if(docEnabled === undefined) docEnabled = true;
        var m = { 
            urlPath: urlPath,
            method: methodName,
            paramsString: '',
            instance: methodObject,
            target: target,
            docEnabled: docEnabled
        };  

        if(urlPath in this.urlPath2Methods){
            logger.warn(`Url=${urlPath}, Method=${methodName} exists`);
        } 
        this.urlPath2Methods[urlPath] = m;  
        return m;
    } 

    mount(module, objectOrFunc, target, docEnabled) {   
        if (typeof (objectOrFunc) == 'function') {    //module as method name
            this._addMethod(module, objectOrFunc, target, docEnabled);
            return;
        } 

        var methods = this._getAllMethods(objectOrFunc);
        for (var methdName of methods) {
            var methodObject = objectOrFunc[methdName];   
            var urlPath = joinPath(module, methodObject.name);
            var info = this._addMethod(urlPath, methodObject, objectOrFunc, docEnabled);
            info.paramsString = this._getFnParamNames(methodObject.toString());  
        }
    }

    mountDoc() {
        if(!this.docEnabled) return;
        var info = new RpcInfo(this);
        this.mount(this.docModule, info.index, info, false);  
    }

    urlEntryList(mq){
        var entryList = [];
        for (var urlPath in this.urlPath2Methods) {
            var m = this.urlPath2Methods[urlPath];  
            var entry = {
                url: joinPath(this.urlPrefix, m.urlPath),
                mq: mq
            };
            entryList.push(entry);
        }
        return entryList;
    }

    _getFnParamNames(fn) {
        var fstr = fn.toString();
        return fstr.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');
    } 

    _getAllMethods(obj) {
        let methods = new Set();
        for (var name in obj) {
            var func = obj[name];
            if (typeof func == 'function') {
                methods.add(name);
            }
        }
        while (obj = Reflect.getPrototypeOf(obj)) {
            if (obj.constructor == Object) break;
            let keys = Reflect.ownKeys(obj)
            keys.forEach((k) => {
                if (k == 'constructor') return false;
                methods.add(k);
            });
        }
        return methods;
    }
}


class RpcServer {
    constructor(processor) {
        this.mqServerAddress = null;
        this.mq = null;
        this.mqType = "memory";
        this.channel = null;
        this.clientCount = 1;  

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";

        this.clients = [];
        this.processor = processor;
    }

    enableAuth(apiKey, secretKey, authEnabled=true){
        this.authEnabled = authEnabled;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
    }

    start() {
        if (this.mqServerAddress == null) {
            throw new Error("missing mqServerAddress");
        }
        if (this.mq == null) {
            throw new Error("missing mq");
        }
        if (this.channel == null) {
            this.channel = this.mq;
        }
        this.processor.mountDoc();
        var processor = this.processor;   

        for (var i = 0; i < this.clientCount; i++) {
            var client = new MqClient(this.mqServerAddress);
            if(this.authEnabled){
                client.authEnabled = this.authEnabled;
                client.apiKey = this.apiKey;
                client.secretKey = this.secretKey;
            }

            client.onopen = () => {
                var msg = {};
                msg.headers = {
                    cmd: 'create',
                    mq: this.mq,
                    mqType: this.mqType,
                    channel: this.channel
                };
                client.invoke(msg).then(res => {
                    logger.info(res);
                });
                msg = {};
                msg.headers = { cmd: 'sub', mq: this.mq, channel: this.channel };
                client.invoke(msg).then(res => {
                    logger.info(res);
                });

                msg = {};
                msg.headers = { cmd: 'bind', mq: this.mq };
                msg.body = this.processor.urlEntryList(this.mq);
                client.invoke(msg).then(res => {
                    logger.info(res);
                });
            };

            client.addMqHandler(this.mq, this.channel, (req) => {
                var id = req.headers.id;
                var target = req.headers.source;  
                var url = req.url;
                var urlPrefix = processor.urlPrefix;
                if(url && url.startsWith(urlPrefix)){
                    url = url.substr(urlPrefix.length);
                    url = joinPath("/", url);
                    req.url = url;
                }

                var res = new Message();
                try {
                    processor.process(req, res);
                } catch(e) {
                    logger.error(e);
                    res.headers['content-type'] = 'text/plain; charset=utf8;'
                    _reply(res, 500, e); 
                }  

                res.headers.cmd = 'route'; //route back message
                res.headers.target = target;
                res.headers.id = id;
                if (res.status == null) res.status = 200;

                client.send(res);
            });

            client.connect();
            this.clients.push(client);
        }
    }

    close() {
        for (var client of this.clients) {
            client.close();
        }
        this.clients = [];
    } 
}


class RpcInvoker extends Function {
    constructor(client, urlPrefix) {
        super();
        this.client = client; 
        this.urlPrefix = urlPrefix;

        const invoker = this;
        this.proxy = new Proxy(this, {
            get: function (target, name) {
                return name in target ? target[name] : invoker.proxyMethod(name);
            }, 
            apply: function(target, thisArg, argumentList) {
                return invoker.proxyMethod("")(...argumentList); 
            }
        });
        return this.proxy;
    } 

    invoke() {
        if (arguments.length < 1) {
            throw "Missing request parameter";
        } 
        var msg;
        var req = arguments[0]; 
        if (typeof (req) == 'string') {
            var params = [];
            var len = arguments.length;
            for (var i = 1; i < len; i++) {
                params.push(arguments[i]);
            }
            msg = new Message();
            msg.url = joinPath(this.urlPrefix, req);
            msg.body = params;  
        } else if (req.constructor == Message) {
            //just what we need
            msg = req;
        } else {
            msg = new Message();
            msg.replace(req); 
        } 
        return this.client._invoke(msg);
    } 

    proxyMethod(method) {
        const invoker = this;
        return function () {
            const len = arguments.length;
            const params = [];
            for (var i = 0; i < len; i++) {
                params.push(arguments[i]);
            }

            const msg = new Message();
            msg.url = joinPath(invoker.urlPrefix, method); 
            msg.body = params;
            return invoker.invoke(msg);
        }
    }
} 

class RpcClient {
    constructor(address, urlPrefix) {
        if(address) {
            this.wsClient = new WebsocketClient(address);
            this.wsClient.heartbeatMessage = { headers: { cmd: 'ping' } }; 
        } else {
            this.ajaxClient = new AjaxClient();
        }
        this.urlPrefix = urlPrefix; 
        if(!this.urlPrefix) this.urlPrefix = "";

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = ""; 

        this.defaultInvoker = this.module("");
        const client = this;
        this.proxy = new Proxy(this, {
            get: function (target, name) {
                return name in target ? target[name] : client.module(name);
            }
        }); 
        return this.proxy;
    }  

    enableAuth(apiKey, secretKey, authEnabled=true){
        this.authEnabled = authEnabled;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
    }

    module(moduleName){

        if(this.authEnabled){
            var client = this.wsClient;
            if(this.ajaxClient){
                client = this.ajaxClient;
            }
            client.authEnabled = this.authEnabled;
            client.apiKey = this.apiKey;
            client.secretKey = this.secretKey;
        }

        var urlPrefix = joinPath(this.urlPrefix, moduleName);
        return new RpcInvoker(this, urlPrefix);  
    }  

    invoke(){
        return this.defaultInvoker.invoke(...arguments);
    }

    _invoke(req) {
        if(this.wsClient){
            return this._wsInvoke(req);
        } else {
            return this.ajaxClient.invoke(req);
        }
    } 

    _wsInvoke(req) {
        var p;
        if (!this.wsClient.active()) {
            p = this.wsClient.connect().then(() => {
                return this.wsClient.invoke(req);
            });
        } else {
            p = this.wsClient.invoke(req);
        }

        return p.then(res => {
            if (res.status != 200) {
                throw res.body;
            }
            return res.body;
        });
    } 

    close(){
        if(this.wsClient){
            this.wsClient.close();
            this.wsClient = null;
        }
    }
}

if (__NODEJS__) {
    module.exports.Logger = Logger;
    module.exports.logger = logger;
    module.exports.WebsocketClient = WebsocketClient;
    module.exports.MqClient = MqClient;
    module.exports.RpcProcessor = RpcProcessor;
    module.exports.RpcClient = RpcClient; 
    module.exports.RpcServer = RpcServer;
    module.exports.Message = Message;
} else {
    window.Logger = Logger;
    window.logger = logger;
    window.WebsocketClient = WebsocketClient;
    window.MqClient = MqClient;
    window.RpcProcessor = RpcProcessor;
    window.RpcClient = RpcClient;
    window.RpcServer = RpcServer;
    window.Message = Message;
}
