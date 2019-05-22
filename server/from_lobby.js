const express = require('express');
const router = express.Router();

const statusCode = require("./status.js");

const PollResponseStore = require('./PollResponseStore.js');

const main = require('../app.js');
const rooms= main.rooms;
const roomList = main.roomList;

const helpers = require('./helpers');
const getBody = helpers.getBody;
const hashQS = helpers.hashQS;
const debug_log = helpers.debug_log;

/**
 * if the user requests to do something which they should be in the lobby
 * to do, the url will begin with /from_lobby
 *
 * this middle ware verifies that the user is not in a room
 */
router.use('/', function(req, res, next){
    //the body is the part of the request that should contain the access_token
    let body= getBody(req);

    //if the client did not pass the access token, send error
    if(!body.access_token){
        res.sendStatus(statusCode.MISSING_INFO);
        return;
    }

    let current_room= roomList[body.access_token];

    //if the client is currently in a room, send error
    if(current_room){
        res.sendStatus(statusCode.ALREADY_IN_ROOM);
        return;
    }

    //otherwise, proceed to correct handler
    next();
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
router.post('/moveToRoom', function(req, res) {
    var username= req.body.username;
    var access_token= req.body.access_token;

    //a request to join a room must include the username and token
    if(!username || !access_token) {
        res.sendStatus(statusCode.MISSING_INFO);
        return;
    }

    let move_to = rooms[req.body.moveTo];

    //add client to the new room
    move_to.addClient(username, access_token);

    //register the move with in the roomList
    roomList[access_token] = move_to;
    debug_log("Moved " + username + " to room " + move_to.title);

    //play the current song for the user
    move_to.playCurrentSong(username);

    //respond with the redirect location
    res.json({
        redirect : hashQS("/room.html", {
            username : username,
            access_token : access_token,
            room : move_to.title
        })
    });

    //emit queue for the room so all can see the new user
    move_to.emitQueue();
});


module.exports= router;