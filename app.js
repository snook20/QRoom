/* Status Codes:
 * 200 - request completed
 * 420 - not in a room
 * 421 - already in a room
 * 432 - unexpected request method
 * 451 - missing username or access token
 */

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
var room = require('./server/Room.js');

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
 * returns the body from the given request object
 * in particular, return req.body for POST
 *				  return req.query for GET
 *				  return null otherwise
 */
function getBody(req){
	//for gets, the body is query, for posts it is in body
	switch(req.method){
		case 'POST':
			return req.body;
		case 'GET':
			return req.query;
		default:
			return null;
	}
}

/**
 * if the user requests to do something which they should already be in
 * some room to do, the url will begin with /from_room
 *
 * this middle ware verifies that the user is indeed in a room,
 * and adds the current room to the req object
 */
app.use('/from_room', function(req, res, next){
	//the body is the part of the request that should contain the access_token
	let body= getBody(req);

	//if the client did not pass the access token, send error
	if(!body.access_token || !body.username){
		res.sendStatus(451);
		return;
	}
	
	let current_room= roomList[body.access_token];
	
	//if the client is not currently in a room, send error
	if(!current_room){
		res.sendStatus(420);
		return;
	}
	
	//otherwise, proceed to correct handler
	req.current_room= current_room;
	next();
});

/**
 * if the user requests to do something which they should be in the lobby
 * to do, the url will begin with /from_lobby
 *
 * this middle ware verifies that the user is not in a room
 */
app.use('/from_lobby', function(req, res, next){
	//the body is the part of the request that should contain the access_token
	let body= getBody(req);
	
	//if the client did not pass the access token, send error
	if(!body.access_token){
		res.sendStatus(451);
		return;
	}
	
	let current_room= roomList[body.access_token];
	
	//if the client is currently in a room, send error
	if(current_room){
		res.sendStatus(421);
		return;
	}
	
	//otherwise, proceed to correct handler
	next();
});

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
		redirect_uri: redirect_uri
	});
	
	res.set('Access-Control-Allow-Origin','*');
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
app.get("/from_room/getqueue", function(req, res){	
	res.json(req.current_room.makeQueueInfoObject());
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
app.get('/from_room/pollqueue', function(req, res){
	//function to execute when a queue update occurs,
	//send the given queueInfo object to the polling user
	var listener = function(queueInfo){
		debug_log("Sending queue to " + req.query.username);
		res.json(queueInfo);
	};
	
	//if this user already has a registered listener, remove it
	if(listenerMap[req.query.access_token]){
		req.current_room.queueEventEmitter.
			removeListener('pollqueue', listenerMap[req.query.access_token]);
	}
	
	//register the new listener
	listenerMap[req.query.access_token]= listener;
	req.current_room.queueEventEmitter.once('pollqueue', listener);
	debug_log("Polling for " + req.query.username);
});

/**
 * Handle a request for a user to add a song to the queue
 * Expected req.body:
 * 	{
 *		songCode : the spotify code for the requested song,
 *		access_token : the user's access token
 *	}
 *
 * Remove the user from the website
 */
app.post('/from_room/addToQueue', function(req, res){
	let current_room= req.current_room;
	
	const options= {
		url: 'https://api.spotify.com/v1/tracks/'+req.body.songCode.substring(14), //removes spotify:track: from song
		method: 'GET',
		headers: {
			'Authorization' : 'Bearer ' + req.body.access_token
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
 * handle a request for the client to start playing the current song for
 * the user
 */
app.post('/from_room/play_for_me', function(req, res){
	console.log("play for me " + req.current_room.title);
	req.current_room.playCurrentSong(req.body.username);
	res.sendStatus(200);
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
 *		access_token : the user's access_token,
 *		moveTo : the index of the room the user wishes to move to
 *	}
 *
 * Move the user to the given room
 */
app.post('/from_lobby/moveToRoom', function(req, res) {
	var username= req.body.username;
	var token= req.body.access_token;
	
	//a request to join a room must include the username and token
	if(!username || !token){
		res.sendStatus(451);
		return;
	}
	
    move_to = rooms[req.body.moveTo];

	//add client to the new room
	move_to.addClient(username, access_token);

	//register the move with in the roomList
	roomList[access_token] = move_to;
	debug_log("Moved " + username + " to room " + move_to.title);
	
	//play the current song for the user
	move_to.playCurrentSong(username);

	const dataObject = {
		room_name : move_to.title,
		queueInfo : move_to.makeQueueInfoObject()
	};
	
	//respond with the redirect location
	res.json({
		redirect : hashQS("/room.html", {
			username : username,
			token : token,
			room : move_to.title
		})
	});
	
	//emit queue for the room so all can see the new user
	move_to.emitQueue();

	//move the listener
	var listener= listenerMap[access_token];
	if(listener){
		
		move_to.queueEventEmitter.once('pollqueue', listener);
	}
	else {
		debug_log("Listener error");
	}
});

app.post('/from_room/leaveRoom', function(req, res){
	//remove client from old room, and add them to the new room
	current_room.removeClient(req.body.username);
	
	//remove there listener from the map and room
	current_room.queueEventEmitter.removeListener('pollqueue', listener);
	delete listenerMap[req.body.access_token];
	
	//TODO res something here
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
	console.log("exit site");
	var username= req.body.username;
	var token= req.body.access_token;
	
	if(username && token){
		current_room = req.current_room;

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
 * redirect the given responce object (presumably a user)
 * to the url with their access token and username as a querystring
 */
function sendAccessToken(res, token){
	//get the user's username
	const options= {
		url: "https://api.spotify.com/v1/me",
		method: 'GET',
		headers: {
			'Authorization' : 'Bearer ' + token
		}
	}

	request(options, function(error, response, body){
		body= JSON.parse(body);

		res.redirect(hashQS("/lobby.html", {
			username : body.display_name,
			token : token
		}));
	});
}

/**
 * retrun a querystringified version of the path and object
 */
function hashQS(path, obj){
	return path + "#" + querystring.stringify(obj);
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