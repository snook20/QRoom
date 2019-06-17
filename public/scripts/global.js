//once everything has loaded
$(function(){
	let hashParams= getHashParams();
	window.state.access_token= hashParams.access_token;
	window.state.username= hashParams.username;

	console.log("global loaded");
	beginApp();
	//afterGlobalLoad(hashParams);
});

/**
	parses url hash data into object
	
	copied from spotify web authorization example
*/
function getHashParams() {
	var hashParams = {};
	var e, r = /([^&;=]+)=?([^&;]*)/g,
		q = window.location.hash.substring(1);
	while ( e = r.exec(q)) {
		hashParams[e[1]] = decodeURIComponent(e[2]);
	}
	return hashParams;
}

/**
 * send request to be removed from the site
 */
function quit() {
	console.log("Test quit function");
	if(access_token == null){
		return '';
	}
	var dataObject = {
		username : username,
		access_token : access_token
	};
	$.ajax({
		type: 'POST',
		url : '/from_room/exit_site',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
	});
	return '';
}

/**
 * layout the user's info
 */
function layoutUserInfo(){
	document.getElementById("name").innerHTML= username;
}