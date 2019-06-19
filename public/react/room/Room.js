import React from 'react';

import {QRoomLayout} from '../components/QRoomLayout';
import {Polling} from '../components/Polling';

import {SongSearch} from './SongSearch';
import {Queue} from './Queue';

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
        return <RoomError />
    }

    return (
        <QRoomLayout
            header={
                <RoomHeader title={props.title} />
            }
            leftBar={
                <UserList usernames={tokensToNames(props.poll.clientTokens)} />
            }
            rightBar={
                <SongSearch songClicked={addSongToQueue} />
            }
            main={
                <Queue playing={props.poll.playing} queue={props.poll.queue} />
            }
        />
    );
}

function RoomHeader(props){
    return (
        <div>
            <h1>QRoom</h1>
            <h3>{props.title}</h3>
        </div>
    );
}

/**
 * render the list of users
 * props:
 *  usernames : array - list of username
 */
function UserList(props){
    return (
        <div>
            <h3>Users</h3>
            {props.usernames.map(username =>
                <div key={username}>{username}</div>
            )}
        </div>
    );
}

function RoomError(){
    return <div>Error loading the room</div>
}

function addSongToQueue(trackURI){
    const dataObject = {
        access_token : window.state.access_token,
        username : window.state.username,
        songCode : trackURI
    };

    $.ajax({
        type: 'POST',
        url : '/from_room/addToQueue',
        data : JSON.stringify(dataObject),
        contentType: 'application/json',
    });
}

/**
 * @param clientTokens map from username to token
 * @return array of usernames
 */
function tokensToNames(clientTokens){
    let usernames= [];
    try {
        usernames= Object.keys(clientTokens);
    }
    finally {
        return usernames;
    }
}

/**
 * component that polls for new queue data
 *
 * expected props:
 *  title: string - the title of the room
 */
export function Room(props){
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
