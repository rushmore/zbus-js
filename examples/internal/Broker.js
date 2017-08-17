if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js"); 
    Broker = zbus.Broker; 
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js

var broker = new Broker("localhost:15555;localhost:15556");

broker.onServerJoin = data => { 
    console.log(data);
};

broker.onServerLeave = data => { 
    console.log(data);
}

async function f() {
    await broker.ready();
    console.log(broker.routeTable);
}
f();