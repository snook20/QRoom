const debug_output= true;

var express= require("express");
var request= require("request");
var querystring= require("querystring");
var bodyParser = require("body-parser");

const clientInfo = require('./clientIds.js');
var client_id = clientInfo.client_id;
var client_secret = clientInfo.client_secret;

var redirect_uri = 'http://localhost:8888/callback/';
// var redirect_uri = "http://qroom.localtunnel.me/callback/";

var app= express();
app.use(express.static('./public'));
app.use(bodyParser.json());

//require the room class
var room = require('./server/room.js');

var root = new room("root");
var room1 = new room("[1]");
var room2 = new room("[2]");
var room3 = new room("[3]");

//this is an array of all rooms
var rooms = [root, room1, room2, room3];

//key: token, value: room
//this is an object of which rooms people are listening in
var roomList = {};

//key: token, value: queue listener
//this map makes sure we only have one listener per user
var listenerMap = {};

/**
 * handle a request for the user to poop
 */
app.get("/poop", function(req, res){
	res.send("Poop");
});

/** handle a client request to login with spotify
 */
app.get('/login', function(req, res){
	var scope = 'user-read-playback-state user-read-private user-read-email streaming user-read-birthdate user-modify-playback-state';
	var options = querystring.stringify({
		response_type: 'code',
		client_id: client_id,
		scope: scope,
		//spotify authorization will give a code to use to get a client token
		//redirect that code to our callback
		redirect_uri: redirect_uri,
	});
	
	//redirect to the spotify login
	res.redirect('https://accounts.spotify.com/authorize?' + options);
});

/**
 * Handle a callback from oauth with an authentication code
 * Expected req.query:
 *	{
 *		code : the authentication code
 *	}
 */
app.get('/callback', function(req, res){
	//get authorization code from the redirect
	//null if no code found
	var code = req.query.code || null;
	
	var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };
	
	//using the authorization code, get a client id
	//then send that id to the client
	request.post(authOptions, function(error, responce, body){
		access_token= body.access_token;
		
		sendAccessToken(res, access_token);
	});
});

/**
 * Handle a request for the current queue, respond immediatly
 * Expected req.body:
 * 	{
 *		access_token : the user's access_token
 *	}
 *
 * Respond with a json of the current queue
 */
app.get("/getqueue", function(req, res){
	room = roomList[req.query.access_token];
	
	if(!room){
		res.sendStatus(420);
		return;
	}
	
	res.json(room.makeQueueInfoObject());
});

/**
 * Handle a poll request for an updated queue
 * the request will be responded to only when there is
 * an update in the user's current queue
 *
 * Expected req.body:
 * 	{
 *		username : the user's username,
 *		access_token : the user's access_token
 *	}
 *
 * Once there is an update to the queue, send the json of the current queue
 */
app.get('/pollqueue', function(req, res){
	room = roomList[req.query.access_token];
	
	if(!room){
		res.sendStatus(420);
		return;
	}
	
	//function to execute when a queue update occurs,
	//send the given queueInfo object to the polling user
	var listener = function(queueInfo){
		debug_log("Sending queue to " + req.query.username);
		res.json(queueInfo);
	};
	
	//if this user already has a registered listener, remove it
	if(listenerMap[req.query.access_token]){
		room.queueEventEmitter.removeListener('pollqueue', listenerMap[req.query.access_token]);
	}
	
	listenerMap[req.query.access_token]= listener;
	room.queueEventEmitter.once('pollqueue', listener);
	debug_log("Polling for " + req.query.username);
});

/**
 * Handle a request for a user to add a song to the queue
 * Expected req.body:
 * 	{
 *		songCode : the spotify code for the requested song,
 *		accessToken : the user's access token
 *	}
 *
 * Remove the user from the website
 */
app.post('/addToQueue', function(req, res){

    current_room = roomList[req.body.accessToken];

	if(!current_room){
		res.sendStatus(420);
		return;
	}

	const options= {
		url: 'https://api.spotify.com/v1/tracks/'+req.body.songCode.substring(14), //removes spotify:track: from song
		method: 'GET',
		headers: {
			'Authorization' : 'Bearer ' + req.body.accessToken
		}			
	};

	request(options, function(error, response, body){
		body = JSON.parse(body);

		const songInfo= {
			songID: req.body.songCode,
			title: body.name,
			artist: body.artists[0].name,
			duration: body.duration_ms
		};

		current_room.queue.push(songInfo);
		debug_log("Song Added to queue: "+songInfo.title + " in room " + current_room.title);

		if(current_room.queue.length == 1 && current_room.currentSong == null){
			playSong(current_room);
		}
		else {
			current_room.emitQueue();
        }
	});

});

/**
 * Handle a request for the current available rooms
 * Expected req.body:
 * 	{
 *		username : the user's username,
 *		access_token : the user's access_token
 *	}
 *
 * Respond with a json containing:
 *	{
 *		available_rooms : an array of room objects,
 *		index : the index of the user's current room
 *	}
 */
app.get('/getRooms', function(req, res) {
	console.log("getting called");
    current_room = roomList[req.query.access_token];
    
	if(!room){
		res.sendStatus(420);
		return;
	}

	const dataObject = {
		available_rooms : rooms,
		index : Object.keys(rooms).indexOf(req.query.access_token)
	};
	
    res.json(dataObject);

});

/**
 * Handle a request for a user to switch rooms
 * Expected req.body:
 * 	{
 *		username : the user's username,
 *		accessToken : the user's access_token,
 *		moveTo : the index of the room the user wishes to move to
 *	}
 *
 * Move the user to 
 */
app.post('/moveToRoom', function(req, res) {
    current_room = roomList[req.body.accessToken];

	if(!current_room){
		res.sendStatus(420);
		return;
	}

    move_to = rooms[req.body.moveTo];

    if(current_room !== move_to) {
		//if user name and token are correct
        if(current_room.clientTokens[req.body.username] == req.body.accessToken) {
			
			//remove client from old room, and add them to the new room
            current_room.removeClient(req.body.username);
            move_to.addClient(req.body.username, req.body.accessToken);

			roomList[req.body.accessToken] = move_to;
			debug_log("Moved " + req.body.username + " from room " + current_room.title + " to room " + move_to.title);
            move_to.playCurrentSong(req.body.username);

			const dataObject = {
				room_name : move_to.title,
				queueInfo : move_to.makeQueueInfoObject()
			};
			
			res.json(dataObject);
			
			//emit queue for the room so all can see the new user
			move_to.emitQueue();

			//move the listener
			var listener= listenerMap[req.body.accessToken];
			if(listener){
				current_room.queueEventEmitter.removeListener('pollqueue', listener);
				move_to.queueEventEmitter.once('pollqueue', listener);
			}
			else {
				debug_log("Listener error");
			}
        }
    }
	else{
		debug_log(req.body.username + " already in room " + current_room.title);
	}
});

/**
 * start playing the next song in the given room
 */
function playSong(room) {
	//if the queue is empty, don't play a song
	if(room.queue.length == 0) {
		room.currentSong = null;
		room.songStartTime = null;
		return;
	}
	
	//play song for each client
	room.currentSong = room.queue.shift();
	var song = room.currentSong.songID;

	debug_log("Playing song: "+room.currentSong.title);
	for( i in room.clientTokens){
		debug_log("\tPlaying for: " + i);
		const options= {
			url: 'https://api.spotify.com/v1/me/player/play',
			method: 'PUT',
			headers: {
				'Authorization' : 'Bearer ' + room.clientTokens[i]
			},

			body: JSON.stringify({
				uris: [song]
			})
		}

		request(options, function(error, response, body){

		});
	}

    room.songStartTime = Date.now();

	room.emitQueue();

	setSongTimeout(room, room.currentSong);
}

/**
 * start the timer for when the next song should be played
 * @param room the room to play start playing in
 * @param songInfo the song info for the song that just started playing in room
 */
function setSongTimeout(room, songInfo){
	setTimeout(playSong, songInfo.duration, room);
}

/**
 * Handle a request for a user to exit the website
 * Expected req.body:
 * 	{
 *		username : the user's username,
 *		access_token : the user's access_token
 *	}
 *
 * Remove the user from the website
 */
app.post("/exit_site", function(req, res){
	var username= req.body.username;
	var token= req.body.access_token;
	if(username && token){
		current_room = roomList[token];
		if(!current_room){
			res.sendStatus(420);
			return;
		}

		//removes user from room and the emitter for the room
		current_room.removeClient(username);
		current_room.queueEventEmitter.removeListener('pollqueue', listenerMap[token]);
		debug_log(username + " left the site");
	}
	else{
		debug_log("Falied to exit");
		res.sendStatus(451);
	}

});

/**
 * Handle a request for a user to join the root room
 * Expected req.body:
 * 	{
 *		username : the user's username,
 *		access_token : the user's access_token
 *	}
 *
 * Add the user to the root room and respond with the root queue
 */
app.post("/join_room", function(req, res){
	var username= req.body.username;
	var token= req.body.access_token;
	
	if(username && token){
		root.addClient(username, token);
		roomList[token] = root;
		debug_log("Joined room: " + username);
		root.playCurrentSong(username);
		
		//send the queue for the room they just joined -- root
		res.json(root.makeQueueInfoObject());
	}
	else{
		debug_log("Falied to join");
		res.sendStatus(451);
	}
});

/**
 * redirect the given responce object (presumably a user)
 * to the url with their access token as a querystring
 */
function sendAccessToken(res, token){
	var string= querystring.stringify({
		token : token
	});
	
	res.redirect("/#" + string);
}

/**
 * log the given string to the console if the debug
 * setting is true
 */
function debug_log(string){
	if(debug_output){
		console.log(string);
	}
}

console.log("Hit up 8888");
app.listen(8888);