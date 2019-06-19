import React from 'react';

/**
 * Show configuration to join a given room
 *
 * Expected props:
 *
 * onSubmit: function - this will be invoked with the key provided when the
 *                  user clicks the join button
 * room: object -
 *  title: string - the title of the room
 *  private: boolean - whether a key is required to join the room
 */
class RoomView extends React.Component{
    constructor(props){
        super(props);

        this.state= this.initState();

        //bind functions
        this.onFormChange= this.onFormChange.bind(this);
        this.onFormSubmit= this.onFormSubmit.bind(this);
    }

    initState(){
        return {
            //form will be a map from element name to value
            form : {}
        };
    }

    render(){
        return (
            <div>
                <h3>{this.props.room.title}</h3>

                <form onSubmit={this.onFormSubmit}>
                    <div>
                        <label>
                            {"Room key: "}
                            <input type="text" name="key_input" onChange={this.onFormChange}/>
                        </label>
                    </div>
                    <div>
                        <button type="submit">
                            Join this room
                        </button>
                    </div>
                </form>
            </div>
        );
    }


    onFormChange(event){
        let target= event.target;
        //event.target holds the DOM element that was changed
        this.setState(state => {
            return {
                form : newProp(state.form, target.name, target.value)
            }
        });
    }

    onFormSubmit(event){
        //do not refresh page
        event.preventDefault();

        this.props.onSubmit(this.state.form.key_input);
    }
}

//update the prop of the given object and return the object
function newProp(obj, prop, val){
    obj[prop]= val;
    return obj;
}

export {RoomView};