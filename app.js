var express= require("express")
var request= require("request")
var querystring= require("querystring")

const clientInfo = require('./clientIds.js');
var client_id = clientInfo.client_id;
var client_secret = clientInfo.client_secret;

var redirect_uri = 'http://localhost:8888/callback/'
// var redirect_uri = "https://qroom.localtunnel.me/callback/"

var clientTokens = {}

var queue= [];
var currentSong= null;

var rootPath= __dirname + '/public';

var app= express()
app.use(express.static(rootPath))

var http = require('http').Server(app);
var io = require("socket.io")(http)

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

app.get('/addToQueue', function(req, res){
	
	const options= {
			url: 'https://api.spotify.com/v1/tracks/'+req.query.songCode.substring(14), //removes spotify:track: from song
			method: 'GET',
			headers: {
				'Authorization' : 'Bearer ' + clientTokens[Object.keys(clientTokens)[0]]
		}			
	}

	request(options, function(error, response, body){
		body = JSON.parse(body);
		const songInfo= {
			songID: req.query.songCode,
			title: body.name,
			artist: body.artists[0].name,
			duration: body.duration_ms
		}

		queue.push(songInfo);
		console.log("Song Added to queue: "+songInfo.title);
		sendQueue();
		if(queue.length == 1 && currentSong == null){
			playSong();
		}
	
	
	});

});

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
});

function sendQueue(){
	const info = {
		playing : currentSong,
		queue : queue
	}
	console.log("Sending queue");
	io.emit('queueUpdate', JSON.stringify(info));
}

function playSong(){
	if(queue.length == 0){
		currentSong = null;
		return;
	}
	
	//play song for each client
	currentSong = queue.shift();
	var song = currentSong.songID;
	
	console.log("Playing song: "+song)
	for( i in clientTokens){
		console.log("\tPlaying for: " + i);
		const options= {
			url: 'https://api.spotify.com/v1/me/player/play',
			method: 'PUT',
			headers: {
				'Authorization' : 'Bearer ' + clientTokens[i]
			},
				
			body: JSON.stringify({
				uris: [song]
			})
		}
		
		request(options, function(error, response, body){
			
		});
	}
	
	sendQueue();
	
	setSongTimeout(currentSong);
}

function setSongTimeout(songInfo){
	setTimeout(playSong,songInfo.duration) 
}

app.get("/join_room", function(req, res){
	var username= req.query.username;
	var token= req.query.access_token;
	if(username && token){
		clientTokens[username]= token;
		console.log("Joined room: " + username);
		sendQueue();
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
http.listen(8888);