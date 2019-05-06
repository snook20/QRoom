var username = null;
var access_token = null;
var room_list = null;
$("#loggedin").hide();
/**
	parses url hash data into object
	
	copied from spotify web authorization example
*/
function getHashParams() {
	var hashParams = {};
	var e, r = /([^&;=]+)=?([^&;]*)/g,
		q = window.location.hash.substring(1);
	while ( e = r.exec(q)) {
		hashParams[e[1]] = decodeURIComponent(e[2]);
	}
	return hashParams;
}

function quit() {
	console.log("Test quit function")
	if(access_token == null){
		return '';
	}
	var dataObject = {
		username : username,
		access_token : access_token
	}
	$.ajax({
		type: 'POST',
		url : '/exit_site',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
	});
	return '';
}

function layoutStuff(userObject){
	var source= document.getElementById("name_template").innerHTML;
	var template= Handlebars.compile(source);
	
	document.getElementById("name").innerHTML= template(userObject);
}

document.getElementById("showRooms").onclick = function(){showRooms()};

// getting songs
$('#songInputForm').submit(function() {
	var title = document.getElementById("songInputForm").elements[0].value;
	searchSong(title);
	//this should prevent page reloading
	return false;
});

function searchSong(title){
	title.replace(/ /g, "+");
	const options = {
		url: 'https://api.spotify.com/v1/search?q='+title+'&type=track',
		method: 'GET',
		headers: {
			'Authorization' : 'Bearer ' + access_token
		},
	};
	
	$.get(options, function(error, response, body){
		layoutSearch(body.responseJSON.tracks, 5);
	});
}

//lays out up to n tracks from the tracks object
function layoutSearch(tracks, n){
	var html = "";
	
	n= Math.min(n, tracks.items.length);
	
	for(i= 0; i < n; i++){
		html+= resultButton(tracks.items[i]) + "<br>";
	}
	
	document.getElementById("search_list").innerHTML= html;
}

function resultButton(track){
	return '<button onclick= "playSongCode(\''+track.uri+'\')">'+track.artists[0].name+' : '+track.name+'</button>'
}

function playSongCode(songCode){
	var dataObject = {
		accessToken : access_token,
		songCode : songCode
	}

	$.ajax({
		type: 'POST',
		url : '/addToQueue',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
	});
}

function showRooms() {
	const dataObject = {
		access_token : access_token,
		username: username
	}
	const options= {
		url: '/getRooms',
		method: 'GET',
		data: dataObject
	}

	$.get(options, function(error, response, body){
		layoutRooms(body.responseJSON.available_rooms, body.responseJSON.index);
		//since body.responseJSON is an array of rooms, save list to the client
		room_list = body.responseJSON.available_rooms;
		
	});
}

function activatePlayer(device_id){
	$.ajax({
		url: "https://api.spotify.com/v1/me/player",
		method: 'PUT',
		headers: {
			'Authorization' : 'Bearer ' + access_token,
			"Content-Type": "application/json"
		},
		
		data : JSON.stringify({
			device_ids: [device_id]
		}),
		
		error : function(message){
			console.log("failed to switch playback");
		},

		success : function(body){
			console.log("switched playback");
		}
	});
}

function changeVolume(){
	var volume = document.getElementById("volumeSwitch").checked ? 100 : 0;
	$.ajax({
		url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + volume,
		method: 'PUT',
		headers: {
			'Authorization' : 'Bearer ' + access_token,
			"Content-Type": "application/json"
		},

		data : JSON.stringify({
			volume_percent : volume
		}),

		error : function(message){
			console.log("failed to change volume");
			console.log(message);
		},
		
		success : function(body){
			console.log("changed volume");
		}
	});
}

if(!access_token){
	var paramObject= getHashParams();
	access_token= paramObject.token;
}

//if we have an access token, get our info and display it
if(access_token){
	const options= {
		url : "https://api.spotify.com/v1/me",
		method : "GET",
		headers : {
			"Authorization" : "Bearer " + access_token
		}
	};
	
	$.get(options, function(error, response, body){
		username = body.responseJSON.display_name;
		joinRoom(username, access_token);
		layoutStuff(body.responseJSON);
	});

	window.focus();
	$("#login").hide();
	$("#loggedin").show();
}

function joinRoom(username, access_token){
	var dataObject = {
		username : username,
		access_token : access_token
	};
	
	$.ajax({
		type: 'POST',
		url : '/join_room',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
		success : function(queueInfo){
			//start polling for the queue
			console.log("joined room");
			pollQueue();
			
			layoutQueue(queueInfo);
		}
	});
}

function pollQueue(){
	const dataObject = {
		access_token : access_token,
		username : username
	}
	
	$.ajax({
		method: 'GET',
		url: '/pollqueue', 
		data: dataObject,
		success: function(queueInfo){
			console.log("Recieved queue");
			layoutQueue(queueInfo);
		},
		error : function(){
			console.log("Timeout or other failure");
			//on a failure, send a get for the queue, to be send immideatly
			getQueue();
		},
		complete : function(){
			pollQueue()
		},
		timeout: 600000
  })
}

function getQueue(){
	const dataObject = {
		access_token : access_token,
	}
	const options = {
		url : '/getqueue',
		type : 'GET',
		data : dataObject
	}
	$.get(options, function(queueInfo){
		layoutQueue(queueInfo);
	});
}

function layoutQueue(info){
	// initial songTimer update
	var el = document.getElementById("songBar");
	el.style.animation = "none";
	el.offsetHeight; /* trigger reflow */

	// case: user moves into empty room
	if(info.playing == null){
		document.getElementById("queue").innerHTML= "Empty queue - add a song with the search button";
	}
	else{
		// if songs are playing, display queue
		var html= "<div>Playing: " + info.playing.artist + ' : ' + info.playing.title + "<div><br>";
		for(i in info.queue){
			html+= getSongDiv(info.queue, i) + "<br>";
		}
		document.getElementById("queue").innerHTML= html;

		// update songTimer
		var duration = info.duration/1000;
		var delayOffset = (Date.now() - info.startTime)/1000;
		el.style.animation = "playBarAnimation " +
			duration + "s linear -" + delayOffset + "s";
	}

	//layout members
	console.log("calling layoutMembers");
	layoutMembers(info.clientTokens);
}

function layoutMembers(memberObject){
	console.log("member obj: " +memberObject);
	var html= "";
	for(memeber in memberObject){
		html+= memeber + "<br>";
	}

	document.getElementById("users").innerHTML= html;
}

function getSongDiv(queue, i){
	song= queue[i];
	var info= song.artist + " : " + song.title;
	var index= parseInt(i)+1;
	return "<div>" + index + ") " + info + "</div>";
}

function layoutRooms(rooms, currentIndex) {
	var html = "";
	for (i in rooms) {
		if (i == currentIndex) {
			html += '<button onclick="switchRoom('+i+')" disabled>'+rooms[i].title+'</button><br>';
		}
		else {
			html += '<button onclick="switchRoom('+i+')">'+rooms[i].title+'</button><br>';
		}
	}
	document.getElementById("room_list").innerHTML = html;
}

function switchRoom(roomIndex) {
	console.log(room_list[roomIndex]);
	var room = room_list[roomIndex];
	var dataObject = {
		username : username,
		accessToken : access_token,
		// roomIndex is used because there was problems moving a room object from JS to HTML and back to JS
		moveTo : roomIndex
	};
	$.ajax({
		url : '/moveToRoom',
		type : 'POST',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
		success : function(data){
			console.log("new room");
			document.getElementById("roomLabel").innerHTML= data.room_name;
			layoutQueue(data.queueInfo);
		}
	});
}