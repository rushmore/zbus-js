if (typeof module !== 'undefined' && module.exports) {
    var zbus = require("../../../src/main/resources/zbus.js"); 
    var Broker = zbus.Broker; 
}

var broker = new Broker();
broker.addTracker("localhost:15555");
broker.onServerJoin = function (data) {
    console.log("ServerJoined:");
    console.log(data);
};

broker.onServerLeave = function (data) {
    console.log("ServerLeft:");
    console.log(data);
}
 