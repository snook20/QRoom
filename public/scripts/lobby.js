/**
 * function that will be called after the global
 * script runs. At this point access_token and username
 * will be defined
 */
function afterGlobalLoad(hashParams){
	layoutUserInfo();

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
		console.log(body.responseJSON);

		layoutRooms(body.responseJSON.available_rooms, body.responseJSON.index);
	});
}

/**
 * layout the rooms, given the list of rooms
 * and the index of the room we are currently in
 */
function layoutRooms(rooms, currentIndex) {
	let html = "";
	for (i in rooms) {
	    html += createJoinRoomButton(i, rooms[i].title) + "<br>";
	}
	document.getElementById("room_list").innerHTML = html;
}

function createJoinRoomButton(index, title){
    console.log(title);
    let joinRoom = `joinRoom(${index},'${title}')`;
    console.log(joinRoom);
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
