//a list of known rooms, updated everytime
//we fetch rooms from the server
let rooms = [];

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

	//register the button to create a new room
    document.getElementById("create_view_button").onclick = function(){
        displayCreateRoom();
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
	    rooms = body.responseJSON.available_rooms;
		layoutRooms();
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
            rooms = response.available_rooms;
            layoutRooms();
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
 * layout the rooms, from the list of known rooms
 */
function layoutRooms() {
	let html = "";
	for (i in rooms) {
	    html += createJoinRoomButton(i, rooms[i].title) + "<br>";
	}
	document.getElementById("room_list").innerHTML = html;
}

function createJoinRoomButton(index, title){
    let displayRoom = `displayRoom(${index},'${title}')`;
    return `
        <button onclick="${displayRoom}" class="room_button">
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
 * display the given room
 *
 * @param roomIndex the index of the room to display
 * @param roomTitle the title of the room to display
 */
function displayRoom(roomIndex, roomTitle){
    console.log("displaying room " + roomTitle);
    //hide the room creation screen
    document.getElementById("create_room").style.display= "none";

    //add relevant information to the view room div
    document.getElementById("view_room_name")
        .innerHTML= roomTitle;

    //register the form
    let joinForm = document.getElementById("join_room_form");
    joinForm.onsubmit = function(){
        joinRoom(roomIndex, roomTitle, joinForm.roomKey);

        //don't reload the page by returning false
        return false;
    };

    //displat the view room
    document.getElementById("view_room").style.display= "block";
}

function displayCreateRoom(){
    //hide the room view
    document.getElementById("view_room").style.display= "none";

    //show the creation page
    document.getElementById("create_room").style.display= "block";
}

/**
 * send a request to switch rooms
 */
function joinRoom(roomIndex, roomTitle, roomKey) {
	var dataObject = {
		username : username,
		access_token : access_token,
		// roomIndex is used because there was problems moving a room object from JS to HTML and back to JS
		moveTo_index : roomIndex,
        moveTo_title : roomTitle,
        moveTo_key : roomKey
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
