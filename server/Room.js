/*
 * This file contians the room class, an object that holds
 * the current members and queue of a room
 * The room class is exported
 */

const PollResponseStore = require('./PollResponseStore.js');

var request= require("request");

class room {
    constructor(roomName, key) {
        this.title = roomName;
        this.key = key;

        //key: username, value: token
        this.clientTokens = {};
        //song queue
        this.queue = [];
        //song currently playing
        this.currentSong = null;
        //when song started to play
		this.songStartTime = null;
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
        for(let username in this.clientTokens){
            let clientToken = this.clientTokens[username];

            if(PollResponseStore.isRegistered(clientToken, 'queue')){
                PollResponseStore.res_json(this.clientTokens[username], 'queue', this.makeQueueInfoObject());
            }
        }
	}

	emitUsers(){
        for(let username in this.clientTokens){
            let clientToken = this.clientTokens[username];

            if(PollResponseStore.isRegistered(clientToken, 'users')){
                PollResponseStore.res_json(this.clientTokens[username], 'users', this.getUsernames());
            }
        }
    }
	
	/* return a simple object with members reflecting
	 * the state of this room
	 */
	makeQueueInfoObject(){
	    var duration;
    	if (this.currentSong == null) {
    		duration = null;
		}
		else {
			duration = this.currentSong.duration;
		}

		return {
			playing : this.currentSong,
			queue : this.queue,
			startTime : this.songStartTime,
			duration : duration,
            clientTokens : this.clientTokens
            // TODO dont pass each user everyone's tokens
		};

		// return info;
	}

	getUsernames(){
	    return Object.keys(this.clientTokens);
    }

    getQueueInfo(){
	    return {
	        playing : this.currentSong,
            queue : this.queue,
            startTime : this.songStartTime,
            duration : this.currentSong ? this.currentSong.duration : null
        }
    }

    getRoomInfo(){
	    return {
	        title : this.title
        };
    }
	
	/* start playback of the current song in this room for the given user
	 */
	playCurrentSong(username){
		//if there is no current song
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
				//do nothing with responce
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
				//do nothing with responce
				console.log(body);
            });
		}
	}
}

module.exports= room;