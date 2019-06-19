import React from 'react';

import {Lobby} from './lobby/Lobby';
import {Room} from './room/Room';

class App extends React.Component {
    constructor(props){
        super(props);

        this.state= this.initState();

        //bind the functions
        this.joinRoom= this.joinRoom.bind(this);
        this.createRoom= this.createRoom.bind(this);
    }

    initState(){
        return {
            //the current room or null for lobby
            current_room : null
        }
    }

    render(){
        //null value means we are in the lobby
        if(this.state.current_room === null){
            return (
                <Lobby
                    joinRoom={this.joinRoom}
                    createRoom={this.createRoom}
                />
            )
        }

        //if the current room is non-null, we are in a room
        return (
            <Room
                title={this.state.current_room.title}
            />
        );
    }

    /**
     * send a request to switch rooms
     *
     * @param roomIndex the index in the room array
     * @param roomTitle the room title
     * @param roomKey the key/password to join the room
     */
    joinRoom(roomIndex, roomTitle, roomKey) {
        var dataObject = {
            username : window.state.username,
            access_token : window.state.access_token,
            // roomIndex is used because there was problems moving a room object from JS to HTML and back to JS
            moveTo_index : roomIndex,
            moveTo_title : roomTitle,
            moveTo_key : roomKey
        };

        let onSuccess= this.joinRoomSuccess.bind(this);

        $.ajax({
            url : '/from_lobby/moveToRoom',
            type : 'POST',
            data : JSON.stringify(dataObject),
            contentType: 'application/json',
            success : onSuccess
        });
    }

    joinRoomSuccess(data){
        this.setState({current_room : data.room});
    }

    /**
     * create a new room. with the given title and key
     */
    createRoom(title, key){
        //remove ' " and ` from room name as these may create problems
        title = title.
        replace("'", '').
        replace('"', '').
        replace('`', '');

        const dataObject = {
            username : window.state.username,
            access_token : window.state.access_token,
            title : title,
            room_key : key
        };

        let onSuccess= this.createRoomSuccess.bind(this);

        $.ajax({
            url : '/from_lobby/create_room',
            type : 'POST',
            data : JSON.stringify(dataObject),
            contentType: 'application/json',
            success : onSuccess
        });
    }

    createRoomSuccess(data){
        this.setState({
            current_room : data.room
        })
    }
}

export {App};