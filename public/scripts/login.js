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
		layoutUserInfo(body.responseJSON);
	});

	switchView('room');
}

/**
 * layout the user's info
 */
function layoutUserInfo(userObject){
	document.getElementById("name").innerHTML= userObject.display_name;
}

/**
 * join the root room
 */
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

