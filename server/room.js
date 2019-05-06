/*
 * This file contians the room class, an object that holds
 * the current members and queue of a room
 * The room class is exported
 */

var EventEmitter = require("events").EventEmitter;
var request= require("request");

class room {
    constructor(roomName) {
        this.title = roomName;
        //key: username, value: token
        this.clientTokens = {};
        //song queue
        this.queue = [];
        //song currently playing
        this.currentSong = null;
        //when song started to play
		this.songStartTime = null;
		
		//queue emitter
		this.queueEventEmitter = new EventEmitter();
		this.queueEventEmitter.setMaxListeners(10);
    }
	
	/* add a user to this room with the given
	 * username and token
	 */
    addClient(username, token) {
        this.clientTokens[username] = token;
    }
	
	/* remove the given user from this room
	 */
    removeClient(username) {
        delete this.clientTokens[username];
    }
	
	emitQueue(){
		this.queueEventEmitter.emit('pollqueue', this.makeQueueInfoObject());
	}
	
	/* return a simple object with members reflecting
	 * the state of this room
	 */
	makeQueueInfoObject(){
    	if (this.currentSong == null) {
    		var duration = null;
		}
		else {
			var duration = this.currentSong.duration;
		}

		const info = {
			playing : this.currentSong,
			queue : this.queue,
			startTime : this.songStartTime,
			duration : duration,
            clientTokens : this.clientTokens
		};

		return info;
	}
	
	/* start playback of the current song in this room for the given user
	 */
	playCurrentSong(username){
    	if (this.songStartTime == null) {
            console.log("\tPausing for: " + username);
            const options= {
                url: 'https://api.spotify.com/v1/me/player/pause',
                method: 'PUT',
                headers: {
                    'Authorization' : 'Bearer ' + this.clientTokens[username]
                }
            };

            request(options, function(error, response, body){

            });
		}
    	else {
            var timeOffset = Date.now() - this.songStartTime;  //difference is in milliseconds
            console.log("\tPlaying for: " + username);
            const options= {
                url: 'https://api.spotify.com/v1/me/player/play',
                method: 'PUT',
                headers: {
                    'Authorization' : 'Bearer ' + this.clientTokens[username]
                },

                body: JSON.stringify({
                    uris: [this.currentSong.songID],
					position_ms: timeOffset
                }),

				error : function(error) {
                	console.log(error);
				}
            };

            request(options, function(error, response, body){

            });
		}
	}
}

module.exports= room;