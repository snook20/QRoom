import React from 'react';

/**
 * Show configuration to create a new room
 *
 * Expected props:
 *
 * create: function - this will be invoked when the user submits the form with the
 *                    signature create(title, key)
 */
class RoomCreate extends React.Component{
    constructor(props){
        super(props);

        this.state= this.initState();

        //bind functions
        this.onFormChange= this.onFormChange.bind(this);
        this.onFormSubmit= this.onFormSubmit.bind(this);
    }

    render(){
        return (
            <div>
                <h3>{"Create a new QRoom"}</h3>

                <form onSubmit={this.onFormSubmit}>
                    <div>
                        <label>
                            {"Room title: "}
                            <input type="text" name="title_input" onChange={this.onFormChange}/>
                        </label>
                    </div>
                    <div>
                        <label>
                            {"Room key: "}
                            <input type="text" name="key_input" onChange={this.onFormChange}/>
                        </label>
                    </div>
                    <div>
                        <button type="submit">
                            Create this room
                        </button>
                    </div>
                </form>
            </div>
        );
    }


    onFormChange(event){
        console.log("target", event.target.name);

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

        let form= this.state.form;
        this.props.create(form.title_input, form.key_input);
    }

    initState(){
        return {
            //form will be a map from element name to value
            form : {}
        };
    }

}

//update the prop of the given object and return the object
function newProp(obj, prop, val){
    obj[prop]= val;
    return obj;
}

export {RoomCreate};