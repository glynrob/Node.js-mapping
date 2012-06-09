HOST = null; // localhost
PORT = 8080;
var PREVIOUS_NUM = 10; // the number of previous points to show
var starttime = (new Date()).getTime();// start time

var fu = require("./fu"),
    util = require("util"),
    url = require("url"),
    qs = require("querystring");

fu.listen(Number(process.env.PORT || PORT), HOST);

fu.get("/", fu.staticHandler("index.html"));
fu.get("/style.css", fu.staticHandler("style.css"));
fu.get("/red.png", fu.staticHandler("red.png"));
fu.get("/custom.js", fu.staticHandler("custom.js"));

var channel = new function () {
  var messages = [],callbacks = [];

  this.appendMessage = function (lat,long) {
    var m = { lat: lat
            , long: long
            , timestamp: (new Date()).getTime()
            };
    util.puts('New Point:'+lat+' '+long);

    messages.push( m );

    while (callbacks.length > 0) {
      callbacks.shift().callback([m]);
    }

    while (messages.length > PREVIOUS_NUM)
      messages.shift();
  };

  this.query = function (since, callback) {
    var matching = [];
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];
      if (message.timestamp > since)
        matching.push(message)
    }

    if (matching.length != 0) {
      callback(matching);
    } else {
      callbacks.push({ timestamp: new Date(), callback: callback });
    }
  };

  // clear old callbacks for at most 30 seconds.
  setInterval(function () {
    var now = new Date();
    while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000) {
      callbacks.shift().callback([]);
    }
  }, 3000);
};

fu.get("/pull", function (req, res) {
  if (!qs.parse(url.parse(req.url).query).since) {
    res.simpleJSON(400, { error: "Must supply since parameter" });
    return;
  }

  var since = parseInt(qs.parse(url.parse(req.url).query).since, 10);

  channel.query(since, function (messages) {
    res.simpleJSON(200, { messages: messages});
  });
});

fu.get("/push", function (req, res) {
  var lat = qs.parse(url.parse(req.url).query).lat;
  var long = qs.parse(url.parse(req.url).query).long;
  channel.appendMessage(lat,long);
  res.simpleJSON(200, { rss: '' });
});