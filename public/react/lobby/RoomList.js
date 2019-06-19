import React from 'react';

import {Polling} from '../components/Polling';

/**
 * the room list that can be wrapped in a Polling component
 * expected props:
 *  roomClicked : function - will be invoked with roomClicked(index, title) when a
 *                           room is clicked
 */
function UnWrappedRoomList(props){
    //if there are no available rooms
    if(!props.poll || !props.poll.available_rooms){
        return (
            <div>
                Error fetching rooms
            </div>
        );
    }

    return props.poll.available_rooms.map((room, index) => (
        <button
            className="list_item_button"
            key={room.title}
            onClick={() => props.roomClicked(index, room.title)}
        >
            {room.title}
        </button>
    ));
}

/**
 * returns the data that should be sent to retrieve rooms
 */
function pollData(){
    return {
        access_token : window.state.access_token,
        username : window.state.username
    };
}

export function RoomList(props){
    return (
        <Polling
            init_url={'/from_lobby/getRooms'}
            init_data={pollData}
            poll_url={'/from_lobby/pollrooms'}
            poll_data={pollData}

            onError={error => console.log("RoomList poll error", error.status, error)}
        >
            <UnWrappedRoomList {...props}/>
        </Polling>
    );
}