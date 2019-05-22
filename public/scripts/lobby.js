/**
 * function that will be called after the global
 * script runs. At this point access_token and username
 * will be defined
 */
function afterGlobalLoad(hashParams){
	layoutUserInfo();

	//register the show rooms button
	document.getElementById("showRooms").onclick = function(){showRooms()};
}

/**
 * layout the user's info
 */
function layoutUserInfo(){
	document.getElementById("name").innerHTML= username;
}

/**
 * get the currently registered rooms and lay them out
 */
function showRooms() {
	const dataObject = {
		access_token : access_token,
		username: username
	};

	const options= {
		url: '/getRooms',
		method: 'GET',
		data: dataObject
	};

	$.get(options, function(error, response, body){
		console.log(body.responseJSON);
		layoutRooms(body.responseJSON.available_rooms, body.responseJSON.index);
		//since body.responseJSON is an array of rooms, save list to the client
		room_list = body.responseJSON.available_rooms;
		
	});
}

/**
 * layout the rooms, given the list of rooms
 * and the index of the room we are currently in
 */
function layoutRooms(rooms, currentIndex) {
	var html = "";
	for (i in rooms) {
		html += '<button onclick="joinRoom('+i+')">'+rooms[i].title+'</button><br>';
	}
	document.getElementById("room_list").innerHTML = html;
}

/**
 * send a request to switch rooms
 */
function joinRoom(roomIndex) {
	console.log(room_list[roomIndex]);
	var room = room_list[roomIndex];
	var dataObject = {
		username : username,
		access_token : access_token,
		// roomIndex is used because there was problems moving a room object from JS to HTML and back to JS
		moveTo : roomIndex
	};
	$.ajax({
		url : '/from_lobby/moveToRoom',
		type : 'POST',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
		success : function(data){
			window.location.href= data.redirect;
			/*
			console.log("new room");
			document.getElementById("roomLabel").innerHTML= data.room_name;
			layoutQueue(data.queueInfo);
			*/
		}
	});
}
