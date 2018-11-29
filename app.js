var express= require("express")
var request= require("request")
var querystring= require("querystring")
var EventEmitter = require("events").EventEmitter
var bodyParser = require("body-parser")

const clientInfo = require('./clientIds.js');
var client_id = clientInfo.client_id;
var client_secret = clientInfo.client_secret;

<<<<<<< HEAD
var redirect_uri = 'http://localhost:8888/callback/'
// var redirect_uri = "https://qroom.localtunnel.me/callback/"
// var redirect_uri = "https://qqroom.localtunnel.me/callback/"

var clientTokens = {}

var queue= [];
var currentSong= null;

var rootPath= __dirname + '/public';

var app= express()
app.use(express.static(rootPath));
app.use(bodyParser.json());
=======
var redirect_uri = 'http://localhost:8888/callback/';
var hub_uri = 'http://localhost:8888/lobby';
// var redirect_uri = "https://qroom.localtunnel.me/callback/"
// var redirect_uri = "https://queueroom.localtunnel.me/callback/"

var rootPath= __dirname + '/public';

var app= express();
app.use(express.static(rootPath));
>>>>>>> bac2ab008d7269927d152082a2ea60557d1fbbe4

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
	res.json(makeQueueInfoObject());
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

    current_room = roomList[req.query.access_token];
    available_rooms = JSON.parse(JSON.stringify(rooms));
    available_rooms.splice(current_room, 1);
    res.json(available_rooms);

});

app.get('/moveToRoom', function(req, res) {

    current_room = roomList[req.query.accessToken];
    move_to = rooms[req.query.moveTo];

    console.log("room:" + JSON.stringify(move_to));
    if(current_room !== move_to) {
        if(current_room.clientTokens[req.query.username] == req.query.accessToken) {
            current_room.removeClient(req.query.username);
            move_to.addClient(req.query.username, req.query.accessToken);
        }
    }

    console.log("Moved " + req.query.username + " from room " + current_room.title + " to room " + move_to.title);

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