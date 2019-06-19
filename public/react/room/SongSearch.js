import React from 'react';

import {SearchResult} from "./SearchResult";
import {SearchBar} from "./SearchBar";

/**
 * Component to layout songs for which the user searches
 *
 * expected props:
 *  songClicked : function - will be called back with the song that was clicked
 *
 */
class SongSearch extends React.Component {
    constructor(props){
        super(props);

        this.state= this.initState();

        this.searchSong= this.searchSong.bind(this);
    }

    initState(){
        return {
            searchResults : null,
        };
    }

    render(){
        return (
            <div>
                <SearchBar onSubmit={this.searchSong} />
                <SearchResult
                    songs={this.state.searchResults}
                    onSongClick={this.props.songClicked}
                />
            </div>
        );
    }

    searchSong(searchString){
        searchString= encodeURIComponent(searchString);

        const options = {
            url: `https://api.spotify.com/v1/search?q=${searchString}&type=track`,
            method: 'GET',
            headers: {
                'Authorization' : 'Bearer ' + window.state.access_token
            },
        };

        $.get(options, function(error, response, body){
            this.setState({searchResults : body.responseJSON.tracks.items});
        }.bind(this));
    }
}

export {SongSearch};