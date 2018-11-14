var express= require("express")
var request= require("request")
var querystring= require("querystring")

const clientInfo = require('./clientIds.js');
var client_id = clientInfo.client_id;
var client_secret = clientInfo.client_secret;

var redirect_uri = 'http://localhost:8888/callback/'
//var redirect_uri = "https://qroom.localtunnel.me/callback/"

var clientTokens = {}

var app= express()

var rootURL= __dirname + '/public';

var songPlaying = false;

var queue= [];

app.use(express.static(rootURL))

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
	queue.push(req.query.songCode);
	console.log("Song Added to queue"+req.query.songCode);
	if(queue.length == 1 && !songPlaying){
		playSong();
	}
	
});

function playSong(){
	if(queue.length == 0){
		songPlaying = false;
		return;
	}
	songPlaying = true;
	console.log(clientTokens);
	//play song for each client
	var song = queue.shift();
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
		});
	}
	//removes spotify:track: from song
	setSongTimeout(song.substring(14));
}

function setSongTimeout(song){
	console.log("Song\n"+song)
	const options= {
		url: 'https://api.spotify.com/v1/tracks/'+song,
		method: 'GET',
		headers: {
			'Authorization' : 'Bearer ' + clientTokens[Object.keys(clientTokens)[0]]
		}			
	}

	request(options, function(error, response, body){
		body = JSON.parse(body);
		console.log("duration\n"+body.duration_ms);
		setTimeout(playSong, body.duration_ms)
		console.log("timeout Set"+body);
	});
}

app.get("/join_room", function(req, res){
	var username= req.query.username;
	var token= req.query.access_token;
	console.log(username);
	console.log(token);
	if(username && token){
		clientTokens[username]= token;
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