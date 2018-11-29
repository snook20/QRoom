var express= require("express")
var request= require("request")
var querystring= require("querystring")
var EventEmitter = require("events").EventEmitter
var bodyParser = require("body-parser")

const clientInfo = require('./clientIds.js');
var client_id = clientInfo.client_id;
var client_secret = clientInfo.client_secret;

var redirect_uri = 'http://localhost:8888/callback/'
// var redirect_uri = "https://qroom.localtunnel.me/callback/"
// var redirect_uri = "https://qqroom.localtunnel.me/callback/"

var rootPath= __dirname + '/public';

var app= express()
app.use(express.static(rootPath));
app.use(bodyParser.json());

var queueEventEmitter= new EventEmitter();
queueEventEmitter.setMaxListeners(10);

class room {
    constructor(roomName) {
        this.title = roomName;
        //key: username, value: token
        this.clientTokens = {};
        //song queue
        this.queue = [];
        //song currently playing
        this.currentSong = null;
    }
    addClient(username, token) {
        this.clientTokens[username] = token;
    }
    removeClient(username) {
        if (Object.values(this.clientTokens).indexOf(username) != -1) {
            this.clientTokens.splice(Object.values(this.clientTokens).indexOf(username), 1)
        }
    }
}

var root = new room("root");
var room1 = new room("[1]");
var room2 = new room("[2]");
var room3 = new room("[3]");

//this is an array of all rooms
var rooms = [root, room1, room2, room3];

//key: token, value: room
//this is an object of which rooms people are listening in
var roomList = {};

app.get("/poop", function(req, res){
	res.send("Poop")
});

app.get('/login', function(req, res){
	var scope = 'user-read-playback-state user-read-private user-read-email streaming user-read-birthdate user-modify-playback-state';
	var options = querystring.stringify(
					{
						response_type: 'code',
						client_id: client_id,
						scope: scope,
						redirect_uri: redirect_uri,
					});
					
	res.redirect('https://accounts.spotify.com/authorize?' + options)
});

app.get('/callback', function(req, res){
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
		
	request.post(authOptions, function(error, responce, body){
		access_token= body.access_token;
		
		sendAccessToken(res, access_token);
	});
});

app.get("/getqueue", function(req, res){
	console.log(req.query.access_token);
	console.log(roomList);
	room = roomList[req.query.access_token];
	console.log(room.title);
	res.json(makeQueueInfoObject(room));
});

app.get('/pollqueue', function(req, res){
	
	queueEventEmitter.once('getqueue', function(queueInfo){
		res.json(queueInfo);
	});
	
});

function emitQueue(){
	console.log("Emitting queue");
	queueEventEmitter.emit('getqueue', makeQueueInfoObject());
}

app.post('/addToQueue', function(req, res){

    current_room = roomList[req.body.accessToken];


	const options= {
			url: 'https://api.spotify.com/v1/tracks/'+req.body.songCode.substring(14), //removes spotify:track: from song
			method: 'GET',
			headers: {
				'Authorization' : 'Bearer ' + req.query.accessToken
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
		console.log("Song Added to queue: "+songInfo.title);

		if(current_room.queue.length == 1 && current_room.currentSong == null){
			playSong(current_room);
		}
	
		emitQueue();
	});

});

app.get('/getRooms', function(req, res) {
	console.log(req.query);
    current_room = roomList[req.query.access_token];
    available_rooms = rooms;
    index = Object.keys(rooms).indexOf(req.query.access_token);
	
    res.json(available_rooms);

});

app.post('/moveToRoom', function(req, res) {
    current_room = roomList[req.body.accessToken];
    move_to = rooms[req.body.moveTo];

    console.log("room:" + JSON.stringify(move_to));
    if(current_room !== move_to) {
        if(current_room.clientTokens[req.body.username] == req.body.accessToken) {
            current_room.removeClient(req.body.username);
            move_to.addClient(req.body.username, req.body.accessToken);
			roomList[req.body.accessToken] = move_to;
        }
    }

    console.log("Moved " + req.body.username + " from room " + current_room.title + " to room " + move_to.title);
	res.json({name : move_to.title});
});

function makeQueueInfoObject(room){
	const info = {
		playing : room.currentSong,
		queue : room.queue
	}
	console.log("Sending queue");
	console.log(JSON.stringify(info));

	return info;
}

function playSong(room) {
	if(room.queue.length == 0) {
		room.currentSong = null;
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
	
	emitQueue();
	
	setSongTimeout(room, room.currentSong);
}

function setSongTimeout(room, songInfo){
	setTimeout(playSong, songInfo.duration, room)
}

app.post("/join_room", function(req, res){
	var username= req.body.username;
	var token= req.body.access_token;
	if(username && token){
		root.addClient(username, token);
		roomList[token] = root;
		console.log("Joined room: " + username);
	}
	else{
		console.log("Falied to join");
	}
});

function sendAccessToken(res, token){
	var string= querystring.stringify({
		token : token
	});
	return res.redirect("/#" + string)
}

console.log("Hit up 8888");
app.listen(8888);