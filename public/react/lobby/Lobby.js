import React from 'react';

import {QRoomLayout} from '../components/QRoomLayout';
import {RoomList} from './RoomList';
import {RoomView} from './RoomView';
import {RoomCreate} from './RoomCreate';

/**
 * Component representing the Lobby
 *
 * expected props:
 *  joinRoom: function - this function will be called with the signature joinRoom(index, title, key)
 *                       when the user wishes to join the room
 * createRoom: function - this will be called with the signature createRoom(title, key)
 *                        when the user wished to create a room
 */
class Lobby extends React.Component{
    constructor(props){
        super(props);

        this.state= initState();

        //bind functions
        this.viewRoom= this.viewRoom.bind(this);
        this.createRoom= this.createRoom.bind(this);
        this.recieveKey= this.recieveKey.bind(this);
    }

    render() {
        return (
            <QRoomLayout
                header={renderHeader()}
                leftBar={this.renderRoomList()}
                main={this.renderDetails()}
                rightBar={this.renderCreateButton()}
            />
        );
    }

    /**
     * render the room creation if this.state.create,
     * otherwise render the room to view, or null
     */
    renderDetails(){
        if(this.state.create){
            //note the difference between this.createRoom and props.createRoom
            return (
                <RoomCreate
                    create={this.props.createRoom}
                />
            );
        }

        if(this.state.view){
            return (
                <RoomView
                    room={this.state.view}
                    join={this.recieveKey}
                />
            );
        }

        return null;
    }

    renderRoomList(){
        return (
            <div>
                <h3>Join a QRoom</h3>
                <RoomList viewRoom={this.viewRoom}/>
            </div>
        );
    }

    renderCreateButton(){
        return (
            <div>
                <h3>Create a QRoom</h3>
                <button onClick={this.createRoom}>
                    +
                </button>
            </div>
        );
    }

    /*
     * function to call when the user wants to view a room
     */
    viewRoom(roomIndex, roomTitle){
        this.setState({
            view : {
                index : roomIndex,
                title : roomTitle
            }
        });
    }

    /**
     * function to call when the user wants to create a room
     */
    createRoom(){
        this.setState({
            view : null,
            create : true
        })
    }

    recieveKey(key){
        let room= this.state.view;
        this.props.joinRoom(room.index, room.title, key);
    }
}

function initState(){
    return {
        //whether the user is creating a room
        create: false,

        //the room to join, or null if no room selected
        view: null
    };
}

function renderHeader(){
    return (
        <h1>QRoom</h1>
    );
}



export {Lobby};