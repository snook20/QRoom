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

app.get("/poop", function(req, res){
	res.send("Poop");
});

/* handle a client request to login with spotify
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

app.get("/getqueue", function(req, res){
	room = roomList[req.query.access_token];
	
	if(!room){
		res.sendStatus(420);
		return;
	}
	
	res.json(room.makeQueueInfoObject());
});

/* handle a poll request for the queue from a user
 */
app.get('/pollqueue', function(req, res){
	room = roomList[req.query.access_token];
	
	if(!room){
		res.sendStatus(420);
		return;
	}
	
	var listener = function(queueInfo){
		console.log("Sending queue to " + req.query.username);
		res.json(queueInfo);
	};
	
	if(listenerMap[req.query.access_token]){
		room.queueEventEmitter.removeListener('pollqueue', listenerMap[req.query.access_token]);
	}

	listenerMap[req.query.access_token]= listener;
	room.queueEventEmitter.once('pollqueue', listener);
	console.log("Polling for " + req.query.username);
});

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
		console.log("Song Added to queue: "+songInfo.title + " in room " + current_room.title);

		if(current_room.queue.length == 1 && current_room.currentSong == null){
			playSong(current_room);
		}
		else {
			current_room.emitQueue();
        }
	});

});

app.get('/getRooms', function(req, res) {
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
            current_room.removeClient(req.body.username);
            move_to.addClient(req.body.username, req.body.accessToken);

			roomList[req.body.accessToken] = move_to;
			console.log("Moved " + req.body.username + " from room " + current_room.title + " to room " + move_to.title);
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
				console.log("Listener error");
			}
        }
    }
	else{
		console.log(req.body.username + " already in room " + current_room.title);
	}
});

function playSong(room) {
	if(room.queue.length == 0) {
		room.currentSong = null;
		room.songStartTime = null;
		return;
	}
	
	//play song for each client
	room.currentSong = room.queue.shift();
	var song = room.currentSong.songID;

	console.log("Playing song: "+room.currentSong.title);
	for( i in room.clientTokens){
		console.log("\tPlaying for: " + i);
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

function setSongTimeout(room, songInfo){
	setTimeout(playSong, songInfo.duration, room);
}

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
		console.log(username + " left the site");
	}
	else{
		console.log("Falied to exit");
		res.sendStatus(451);
	}

});

app.post("/join_room", function(req, res){
	var username= req.body.username;
	var token= req.body.access_token;
	if(username && token){
		root.addClient(username, token);
		roomList[token] = root;
		console.log("Joined room: " + username);
		root.playCurrentSong(username);
		res.json(root.makeQueueInfoObject());
	}
	else{
		console.log("Falied to join");
		res.sendStatus(451);
	}
});

function sendAccessToken(res, token){
	var string= querystring.stringify({
		token : token
	});
	
	res.redirect("/#" + string);
}

console.log("Hit up 8888");
app.listen(8888);