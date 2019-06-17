import React from 'react';

import {QRoomLayout} from '../components/QRoomLayout';
import {Polling} from '../components/Polling';

/**
 * returns the data that should be sent to retrieve queue
 */
function pollData(){
    return {
        access_token : window.state.access_token,
        username : window.state.username
    };
}

/**
 * component that represent the room, it is unwrapped because
 * it does not handle polling
 */
function UnWrappedRoom(props){
    if(!props.poll){
        return renderError();
    }

    console.log("unwrappedRoom props.poll", props.poll);

    return (
        <QRoomLayout
            header={renderHeader(props.title)}
            leftBar={renderUsers(Object.keys(props.poll.clientTokens))}
        />
    );
}

function renderHeader(title){
    return (
        <div>
            <h1>QRoom</h1>
            <h3>{title}</h3>
        </div>
    );
}

/**
 * render the list of users given an array of usernames
 */
function renderUsers(usernames){
    return (
        <div>
            <h3>Users</h3>
            {usernames.map(username =>
                <div key={username}>{username}</div>
            )}
        </div>
    );
}

function renderError(){
    return (
        <div>
            Error loading the room
        </div>
    )
}

/**
 * component that polls for new queue data
 *
 * expected props:
 *  title: string - the title of the room
 */
export function Room(props){
    console.log("Room props", props);
    return (
        <Polling
            init_url= '/from_room/getqueue'
            init_data= {pollData}
            poll_url= '/from_room/pollqueue'
            poll_data= {pollData}
            callback= {(data)=>console.log("Room poll", data)}
        >
            <UnWrappedRoom {...props}/>
        </Polling>
    );
}
