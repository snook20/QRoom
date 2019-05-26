function afterGlobalLoad(hashParams){
	layoutUserInfo();

	//send get for the current queue
	getQueue();
	
	//start the long poll for queue updates
	pollQueue();
	
	//register the form for getting songs
	$('#songInputForm').submit(function() {
		var title = document.getElementById("songInputForm").elements[0].value;
		searchSong(title);

		//returning false should prevent page reloading
		return false;
	});

	//register the button for returning to the lobby
	document.getElementById('lobby_button').onclick = function(){leaveRoom()};
}

/**
 * search for a song from the given string
 * call layout search with the results
 */
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

/**
 * create a button from the given track code
 * this button will call playSongCode with the given track id
 */
function resultButton(track){
	return `
		<button onclick= "playSongCode('${track.uri}')" class = "list_item_button">
			${track.artists[0].name} : ${track.name}
		</button>
	`;
}

/**
 * request to add the song with the given songCode to the
 * current room's queue
 */
function playSongCode(songCode){
	const dataObject = {
		access_token : access_token,
		username : username,
		songCode : songCode
	};

	$.ajax({
		type: 'POST',
		url : '/from_room/addToQueue',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
	});
}



/**
 * toggle mute
 */
function changeVolume(){
	const volume = document.getElementById("volumeSwitch").checked ? 100 : 0;
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

/**
 * send a long poll get request for the queue
 * this should only be called once, since it will repeatedly
 * poll when a responce comes in
 *
 * when the poll is responded to, this will layout the current queue
 */
function pollQueue(){
	const dataObject = {
		access_token : access_token,
		username : username
	};
	
	$.ajax({
		method: 'GET',
		url: '/from_room/pollqueue', 
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
	});
}

function playCurrentSong(){
	const dataObject = {
		access_token : access_token,
		username : username
	};
	
	$.ajax({
		method : 'POST',
		url : '/from_room/play_for_me',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
	});
}

/**
 * get the current queue and lay it out
 */
function getQueue(){
	const dataObject = {
		access_token : access_token,
		username : username
	};
	const options = {
		url : '/from_room/getqueue',
		type : 'GET',
		data : dataObject
	};
	$.get(options, function(queueInfo){
		layoutQueue(queueInfo);
	});
}

/**
 * layout the given queue info object
 */
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
		var html= `<div>Playing: ${info.playing.artist} : ${info.playing.title}<div><br>`;
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

/**
 * layout the given array of members
 */
function layoutMembers(memberObject){
	var html= "";
	for(memeber in memberObject){
		html+= memeber + "<br>";
	}

	document.getElementById("users").innerHTML= html;
}

/**
 * create a div representing the song at queue[i]
 */
function getSongDiv(queue, i){
	song= queue[i];
	var info= song.artist + " : " + song.title;
	var index= parseInt(i)+1;
	return "<div>" + index + ") " + info + "</div>";
}

/**
 * send request to leave the room
 * redirect the user accordingly
 */
function leaveRoom(){
	const dataObject = {
		access_token : access_token,
		username : username
	};

	$.ajax({
		method : 'POST',
		url : '/from_room/leaveRoom',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
		success : function(body){
			window.location.href= body.redirect;
		}
	});
}