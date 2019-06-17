import React from 'react';
import ReactDOM from 'react-dom';

import {App} from '../react/App';

//once everything has loaded
$(function(){
    //the state will be saved in window.state
    window.state= {};

    let hashParams= getHashParams();
    window.state.access_token= hashParams.access_token;
    window.state.username= hashParams.username;

    console.log("global loaded");
    beginApp();
});

function beginApp() {
    const domContainer = document.querySelector('#react_container');
    ReactDOM.render(React.createElement(App), domContainer);
}

/**
 parses url hash data into object

 copied from spotify web authorization example
 */
function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}