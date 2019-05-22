window.onSpotifyWebPlaybackSDKReady = () => {
	const token = getHashParams().access_token;

	const player = new Spotify.Player({
		name: 'QRoom Player',
		getOAuthToken: cb => { cb(token); }
	});

	// Error handling
	player.addListener('initialization_error', ({ message }) => { console.error("Player message " + message); });
	player.addListener('authentication_error', ({ message }) => { console.error("Player message " + message); });
	player.addListener('account_error', ({ message }) => { console.error("Player message " + message); });
	player.addListener('playback_error', ({ message }) => { console.error("Player message " + message); });

	// Playback status updates
	player.addListener('player_state_changed', state => { /*console.log(state); */});

	// Ready
	player.addListener('ready', ({ device_id }) => {
		console.log('Ready with Device ID', device_id);
		activatePlayer(device_id);
	});

	// Not Ready
	player.addListener('not_ready', ({ device_id }) => {
		console.log('Device ID has gone offline', device_id);
	});

	// Connect to the player!
	player.connect();
};

/**
 * switch playback to the web player
 */
function activatePlayer(device_id){
	$.ajax({
		url: "https://api.spotify.com/v1/me/player",
		method: 'PUT',
		headers: {
			'Authorization' : 'Bearer ' + access_token,
			"Content-Type": "application/json"
		},
		
		data : JSON.stringify({
			device_ids: [device_id]
		}),
		
		error : function(message){
			console.log("failed to switch playback");
		},

		success : function(body){
			console.log("switched playback");
			
			//play the current song in this room
			//play the current song
			playCurrentSong();
		}
	});
}