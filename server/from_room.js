const express = require('express');
const router = express.Router();

const request = require('request');

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
 * if the user requests to do something which they should already be in
 * some room to do, the url will begin with /from_room
 *
 * this middle ware verifies that the user is indeed in a room,
 * and adds the current room to the req object
 */
router.use('/', function(req, res, next){
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
 * Handle a request for the current queue, respond immediatly
 * Expected req.body:
 * 	{
 *		access_token : the user's access_token
 *	}
 *
 * Respond with a json of the current queue
 */
router.get("/getqueue", function(req, res){
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
router.get('/pollqueue', function(req, res){

    //if this user already has a registered listener, remove it
    if(PollResponseStore.isRegistered(req.query.access_token, 'queue')){
        PollResponseStore.unregister(req.query.access_token, 'queue');
    }

    //register the new listener
    PollResponseStore.register(req.query.access_token, 'queue', res);

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
router.post('/addToQueue', function(req, res){
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

        if(current_room.queue.length === 1 && current_room.currentSong == null){
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
router.post('/play_for_me', function(req, res){
    console.log("play for me " + req.current_room.title);
    req.current_room.playCurrentSong(req.body.username);
    res.sendStatus(200);
});

router.post('/leaveRoom', function(req, res){
    //remove client from the room
    req.current_room.removeClient(req.body.username);

    delete roomList[req.body.access_token];

    //remove the long poll
    try {
        PollResponseStore.unregister(req.body.access_token, 'queue');
    }
    catch(error){
        debug_log("Was not registered when leaving room")
    }

    req.current_room.emitQueue();

    //prompt the user to redirect themselves to the lobby
    res.json({
        redirect : hashQS('/lobby.html', {
            username : req.body.username,
            access_token : req.body.access_token
        })
    });
});

/**
 * start playing the next song in the given room
 */
function playSong(room) {
    //if the queue is empty, don't play a song
    if(room.queue.length === 0) {
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
        };

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

module.exports= router;