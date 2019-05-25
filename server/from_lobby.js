const express = require('express');
const router = express.Router();

const statusCode = require("./status.js");

const PollResponseStore = require('./PollResponseStore.js');

const Room = require('./Room.js');

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
    let username= req.body.username;
    let access_token= req.body.access_token;

    //a request to join a room must include the username and token
    if(!username || !access_token) {
        res.sendStatus(statusCode.MISSING_INFO);
        return;
    }

    //it must also include an index and title
    if( !req.body.hasOwnProperty("moveTo_index") ||
        !req.body.hasOwnProperty("moveTo_title"))
    {
        res.sendStatus(statusCode.MISSING_INFO);
        return;
    }

    let move_to = rooms[req.body.moveTo_index];

    //make sure that the index matches the room name
    if(rooms[req.body.moveTo_index].title !== req.body.moveTo_title){
        console.log(req.body.moveTo_index + " " + req.body.moveTo_title);
        res.sendStatus(statusCode.BAD_REQUEST);
        return;
    }

    //make user that the user provided the correct key
    if(move_to.key !== null && req.body.moveTo_key !== move_to.key){
        console.log(move_to.key + " versus " + req.body.moveTo_key);
        res.sendStatus(statusCode.NO_PERMISSION);
        return;
    }

    moveUserToRoom(username, access_token, move_to);

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

/**
 * create a new room
 *
 * req.body should have
 *  {
 *     username : creator's username,
 *     access_token : creator's access_token
 *     title : new room's title,
 *     room_key : an entrance key for the new room, null if no key is needed
 *  }
 *
 *  after the room is created, this will respond with a redirect location for the
 *  new room
 */
router.post('/create_room', function(req, res){
    let username= req.body.username;
    let access_token= req.body.access_token;
    let title = req.body.title;
    let room_key = req.body.room_key || null;

    //a request to join a room must include the username and token\
    //as well as a room title
    if(!username || !access_token || !title) {
        res.sendStatus(statusCode.MISSING_INFO);
        return;
    }

    //ensure that the title has no ' " or `
    title = title.
        replace("'", '').
        replace('"', '').
        replace('`', '');

    //no duplicate room names allowed
    if(helpers.roomTitleTaken(title)){
        res.sendStatus(statusCode.BAD_REQUEST);
        return;
    }

    //create and register the new room
    let new_room = new Room(title, room_key);
    rooms.push(new_room);

    debug_log("added room " + title);

    //move the user to the room
    moveUserToRoom(username, access_token, new_room);

    //prompt the user to redirect to the new room
    //respond with the redirect location
    res.json({
        redirect : hashQS("/room.html", {
            username : username,
            access_token : access_token,
            room : title
        })
    });

    //emit the list of rooms for pollers
    emitRooms();
});

/**
 * move the given user to the given room
 * this function assumes that the given parameters are valid
 *
 * @param username the username to move
 * @param access_token the user's access token
 * @param new_room a Room object, the room to move the user into
 */
function moveUserToRoom(username, access_token, new_room){
    //add client to the new room
    new_room.addClient(username, access_token);

    //register the move with in the roomList
    roomList[access_token] = new_room;
    debug_log("Moved " + username + " to room " + new_room.title);

    //play the current song for the user
    //new_room.playCurrentSong(username);
}

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
router.get('/getRooms', function(req, res) {
    const dataObject = {
        available_rooms : helpers.getRooms()
    };

    res.json(dataObject);
});

/**
 * handle a long poll request for the current rooms
 * this should be responded to when a room is created
 * or removed
 */
router.get('/pollrooms', function(req, res){
    let access_token= req.query.access_token;

    //if this user already has a poll out, remove it
    if(PollResponseStore.isRegistered(access_token, 'rooms')){
        PollResponseStore.unregister(access_token, 'rooms');
    }

    //register the poll response object
    PollResponseStore.register(access_token, 'rooms', res);
});

/**
 * send the current rooms to everyone polling them
 */
function emitRooms(){
    const roomInfo = {
        available_rooms : helpers.getRooms()
    };

    for(let token in roomList){
        if(PollResponseStore.isRegistered(token, 'rooms')){
            debug_log("responding to room pool");
            PollResponseStore.res_json(token, 'rooms', roomInfo);
        }
    }
}

module.exports= router;