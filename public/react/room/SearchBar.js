import React from 'react';

import {RenderIf} from "../components/RenderIf";

/**
 * render the search bar
 * expected props:
 *  onSubmit : function - will be invoked with the search string on submit
 */
export class SearchBar extends React.Component {
    constructor(props){
        super(props);

        this.state= {
            search : null,
            //whether the user has entered a bad search
            badSearch : false
        };

        this.onFormChange= this.onFormChange.bind(this);
        this.onFormSubmit= this.onFormSubmit.bind(this);
    }

    render(){
        return (
            <div>
                <h3>Search</h3>
                <form onSubmit={this.onFormSubmit}>
                    <label>
                        Song search:
                        <input
                            type="text"
                            name="song_search"
                            onChange={this.onFormChange}

                        />
                    </label>
                    <input type="submit" style={{display : 'none'}} />
                </form>
                <RenderIf if={this.state.badSearch}>
                    Please enter a valid search
                </RenderIf>
            </div>
        );
    }

    onFormChange(event){
        if(event.target.name !== 'song_search'){
            window.debug_log("unexpected form change");
        }

        this.setState({search : event.target.value});
    }

    onFormSubmit(event) {
        //do not refresh page
        event.preventDefault();

        if(!this.state.search){
            this.setState({badSearch : true})
            return;
        }
        this.props.onSubmit(this.state.search);
    }
}