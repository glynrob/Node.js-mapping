var CONFIG = { id: null    // set in onConnect
             , last_message_time: 1
             };

$(document).ready(function() {
	$("#add").click(function (e) {
		var setlat = randomFromInterval(50.5,52);
		var setlong = randomFromInterval(-1.5,0.8);
		jQuery.get("/push", {id: CONFIG.id, lat: setlat, long: setlong}, function (data) { }, "json");
		$("#entry").attr("value", ""); // clear the entry field.
	});
	longPoll();
	
	/* MAP FUNCTIONS */
	var redicon = "/red.png";
			
	// set up Google map
	var myLatlng = new google.maps.LatLng(51.4529, -0.97062);
	var myOptions = {
		zoom: 7,
		center: myLatlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	var map = new google.maps.Map(document.getElementById("map"), myOptions);

	function longPoll (data) {
	  //process any updates we may have
	  if (data && data.messages) {
		for (var i = 0; i < data.messages.length; i++) {
		  var message = data.messages[i];
			//track oldest message so we only request newer messages from server
		  if (message.timestamp > CONFIG.last_message_time) CONFIG.last_message_time = message.timestamp;
		   
		  addMessage(message.lat, message.long, message.timestamp); // add new message
		}
	  }
	
	  //make another request
	  $.ajax({ cache: false
			 , type: "GET"
			 , url: "/pull"
			 , dataType: "json"
			 , data: { since: CONFIG.last_message_time, id: CONFIG.id }
			 , error: function () {
				 addMessage("long poll error. trying again...", new Date(), "error");
				 setTimeout(longPoll, 10*1000); // try again in 10 seconds
			   }
			 , success: function (data) {
				 longPoll(data);
			   }
			 });
	}
	
	//inserts pointer into the map
	function addMessage (lat, long, time) {
	  //time = new Date(time); // time not needed for this example
	  loc = { latlong: false, hits: 0 }
		loc.latlong = new google.maps.LatLng(lat, long);
		addMarker(loc, map, redicon);
	}
	
	// utility functions
	utility = {
	  zeroPad: function (digits, n) { // padding function to strings
		n = n.toString();
		while (n.length < digits) 
		  n = '0' + n;
		return n;
	  },
	  timeString: function (date) { // pleasent time display
		var minutes = date.getMinutes().toString();
		var hours = date.getHours().toString();
		return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
	  }
	};
	
	function addMarker(loc, map, icon){
		place = loc.latlong
		marker = new google.maps.Marker({
			map:map,
			draggable: false,
			animation: google.maps.Animation.DROP,
			position: place,
		});
		if (loc.hits == 0){
			marker.icon = icon;
			marker.shadow = "http://labs.google.com/ridefinder/images/mm_20_shadow.png";
		}
		index = loc.id;
	}
	
	function randomFromInterval(from,to)
	{
		var result = Math.random()*(to-from+1)+from;
		return result.toFixed(6);
	}
});