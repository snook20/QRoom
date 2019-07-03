import React from 'react';

/**
 * The queue
 * expected props:
 *  playing : spotify song object - the current song
 *  queue : array - list of spotify song objects in the order
 *                  they should be played
 */
function Queue(props){
    if(props.playing === null){
        return <EmptyQueue />
    }

    return (
        <div>
            <Playing song={props.playing} />
            <NextUp queue={props.queue} />
        </div>
    )
}

/**
 * expected props:
 *  queue : array of spotify song object
 */
function NextUp(props){
    return (
        <div>
            {
                props.queue.map( (song, index) =>
                    <div key={song.uri}>
                        {index+1}) {song.artist} : {song.title}
                    </div>
                )
            }
        </div>
    );
}

/**
 * Expected props:
 *  song : spotify song object
 */
function Playing(props){
    return (
        <div>
            Playing: {props.song.artist} : {props.song.title}
        </div>
    );
}

function EmptyQueue(){
    return (
        <div>
            Empty queue - add a song with the search button
        </div>
    )
}

export {Queue};