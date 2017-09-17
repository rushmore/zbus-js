if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../zbus.js"); 
    Broker = zbus.Broker; 
    ServerAddress = zbus.ServerAddress;
	var logger = zbus.logger;
}  
logger.level = logger.DEBUG; //from zbus.js


var broker = new Broker({
    address: 'localhost:15555',
    token: 'mytopic',
});

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