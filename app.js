var express= require("express");
var request= require("request");
var querystring= require("querystring");
var bodyParser = require("body-parser");

const clientInfo = require('./clientIds.js');
var client_id = clientInfo.client_id;
var client_secret = clientInfo.client_secret;

const helpers = require('./server/helpers.js');
const debug_log = helpers.debug_log;
const hashQS = helpers.hashQS;

var redirect_uri = 'http://localhost:8888/callback/';
// var redirect_uri = "http://qroom.localtunnel.me/callback/";

var app= express();
app.use(express.static('./public'));
app.use(bodyParser.json());

//require the Poll Response Store
const PollResponseStore = require('./server/PollResponseStore');

//require the room class
const Room = require('./server/Room.js');

var root = new Room("root", null);

//this is an array of all rooms
module.exports.rooms = rooms = [root];

//key: token, value: room
//this is an object of which rooms people are listening in
module.exports.roomList = roomList = {};

app.use('/from_lobby', require('./server/from_lobby.js'));
app.use('/from_room', require('./server/from_room.js'));
app.use('/moderation', require('./server/moderation'));

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

		//add this access_token to the room list
		roomList[access_token]= null;
	});
});

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

		try{
			PollResponseStore.unregister(token, 'queue');
		}
		catch(error){
			debug_log("Was not registered when exiting site");
		}

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
function sendAccessToken(res, token) {
	//get the user's username
	const options = {
		url: "https://api.spotify.com/v1/me",
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + token
		}
	};

	request(options, function (error, response, body) {
		body = JSON.parse(body);

		res.redirect(hashQS("/lobby.html", {
			username: body.display_name,
			access_token: token
		}));
	});
}

console.log("Hit up 8888");
app.listen(8888);