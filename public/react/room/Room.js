import React from 'react';
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
    return (
        <div>
            In room {props.title}
        </div>
    );
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
        >
            <UnWrappedRoom {...props}/>
        </Polling>
    );
}
