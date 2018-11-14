var express= require("express")
var request= require("request")
var querystring= require("querystring")

const clientInfo = require('./clientIds.js');
var client_id = clientInfo.client_id;
var client_secret = clientInfo.client_secret;

// var redirect_uri = 'http://localhost:8888/callback/'
// var redirect_uri = "https://qroom.localtunnel.me/callback/"
var redirect_uri = "https://queueroom.localtunnel.me/callback/"

var clientTokens = {}

var songPlaying = false;

var queue= [];

var app= express()
app.use(express.static(__dirname + '/public'))

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
		console.log(body);
		body = JSON.parse(body);
		console.log(body.id);
		const songInfo= {
			songID: req.query.songCode,
			title: body.name,
			artist: body.artists[0].name,
			duration: body.duration_ms
		}

		queue.push(songInfo);
		console.log("Song Added to queue"+songInfo);
		sendQueue();
		if(queue.length == 1 && !songPlaying){
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
	io.emit('queueUpdate', JSON.stringify(queue));
}

function playSong(){
	if(queue.length == 0){
		songPlaying = false;
		return;
	}
	songPlaying = true;
	console.log(clientTokens);
	//play song for each client
	const songInfo = queue.shift();
	var song = songInfo.songID;
	//send updated queue
	sendQueue();
	console.log("song taken off queue"+song)
	for( i in clientTokens){
		console.log("Playing for: " + i);
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
			console.log(body);
		});
	}
	
	setSongTimeout(songInfo);
}

function setSongTimeout(songInfo){
	setTimeout(playSong,songInfo.duration) 
}

app.get("/join_room", function(req, res){
	var username= req.query.username;
	var token= req.query.access_token;
	if(username && token){
		clientTokens[username]= token;
		sendQueue();
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
http.listen(8888);