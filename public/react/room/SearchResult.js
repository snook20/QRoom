import React from 'react';

import {ScrollContainer} from '../components/ScrollContainer';

/**
 * the search result
 * expoected props:
 *  songs : array - list of spotify song objects to layout
 *  onSongClick : function - invoked with onSongClick(uri) when a song is clicked
 */
export function SearchResult(props){
    if(!props.songs){
        return (
            <div>Search for a song to add to the queue</div>
        )
    }
    return (
        <ScrollContainer>
            {
                props.songs.map(track =>
                    <button
                        key={track.uri}
                        onClick={() => props.onSongClick(track.uri)}
                        className="list_item_button"
                    >
                        {track.artists[0].name} : {track.name}
                    </button>
                )
            }
        </ScrollContainer>
    )
}