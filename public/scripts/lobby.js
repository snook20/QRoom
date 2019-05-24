/**
 * function that will be called after the global
 * script runs. At this point access_token and username
 * will be defined
 */
function afterGlobalLoad(hashParams){
	layoutUserInfo();

	//get the current rooms and start a poll for new rooms
	showRooms();
	pollRooms();
	//register the show rooms button
	document.getElementById("showRooms").onclick = function(){
	    showRooms()
	};

    let roomCreationForm = document.getElementById("room_creation_form");
    roomCreationForm.onsubmit = function(){
        createRoom(roomCreationForm.elements);

        //prevent the form from sending
        return false;
    }
}

/**
 * layout the user's info
 */
function layoutUserInfo(){
	document.getElementById("name").innerHTML= username;
}

/**
 * get the currently registered rooms and lay them out
 */
function showRooms() {
	const dataObject = {
		access_token : access_token,
		username: username
	};

	const options= {
		url: '/from_lobby/getRooms',
		method: 'GET',
		data: dataObject
	};

	$.get(options, function(error, response, body){
		layoutRooms(body.responseJSON.available_rooms);
	});
}

/**
 * send a long poll get request for the rooms
 * this should only be called once, since it will repeatedly
 * poll when a response comes in
 *
 * when the poll is responded to, this will layout the current rooms
 */
function pollRooms(){
    console.log("polling rooms");
    const dataObject = {
        access_token : access_token,
        username : username
    };

    $.ajax({
        method: 'GET',
        url: '/from_lobby/pollrooms',
        data: dataObject,
        success: function(response){
            console.log("Recieved rooms");
            layoutRooms(response.available_rooms);
        },
        error : function(){
            console.log("Timeout or other failure waiting for rooms");
            //on a failure, send a get for the queue, to be send immideatly
            showRooms();
        },
        complete : function(){
            pollRooms()
        },
        timeout: 600000
    });
}

/**
 * layout the rooms, given the list of rooms
 * and the index of the room we are currently in
 */
function layoutRooms(rooms) {
	let html = "";
	for (i in rooms) {
	    html += createJoinRoomButton(i, rooms[i].title) + "<br>";
	}
	document.getElementById("room_list").innerHTML = html;
}

function createJoinRoomButton(index, title){
    let joinRoom = `joinRoom(${index},'${title}')`;
    return `
        <button onclick="${joinRoom}" class="room_button">
            ${title}
        </button>
    `;
}

/**
 * create a new room. take the room title and
 * entry key from the room creation form
 *
 * @param formElements a list of elements in the form
 */
function createRoom(formElements){
    let title= formElements.room_name.value;
    const key = formElements.room_key.value;

    //remove ' " and ` from room name as these may create problems
    title = title.
        replace("'", '').
        replace('"', '').
        replace('`', '');

    const dataObject = {
        username : username,
        access_token : access_token,
        title : title,
        room_key : key
    };

    $.ajax({
       url : '/from_lobby/create_room',
       type : 'POST',
       data : JSON.stringify(dataObject),
       contentType: 'application/json',
       success : function(data){
           window.location.href = data.redirect;
       }
    });
}

/**
 * send a request to switch rooms
 */
function joinRoom(roomIndex, roomTitle) {
	var dataObject = {
		username : username,
		access_token : access_token,
		// roomIndex is used because there was problems moving a room object from JS to HTML and back to JS
		moveTo_index : roomIndex,
        moveTo_title : roomTitle
	};

	$.ajax({
		url : '/from_lobby/moveToRoom',
		type : 'POST',
		data : JSON.stringify(dataObject),
		contentType: 'application/json',
		success : function(data){
			window.location.href= data.redirect;
		}
	});
}
