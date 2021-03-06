const debug_output= true;

const querystring = require('querystring');

const main = require('../app.js');

/**
 * returns the body from the given request object
 * in particular, return req.body for POST
 *				  return req.query for GET
 *				  return null otherwise
 */
module.exports.getBody = function(req){
    //for gets, the body is query, for posts it is in body
    switch(req.method){
        case 'POST':
            return req.body;
        case 'GET':
            return req.query;
        default:
            return null;
    }
};

/**
 * retrun a querystringified version of the path and object
 */
module.exports.hashQS = function(path, obj){
    return path + "#" + querystring.stringify(obj);
};

/**
 * log the given string to the console if the debug
 * setting is true
 */
module.exports.debug_log = function(string){
    if(debug_output){
        console.log(string);
    }
};

/**
 *  return a list of rooms that can be sent to a user
 */
module.exports.getRooms = function(){
    return main.rooms.map(room => room.getRoomInfo());
};

/**
 * determine whether there is already a room with the given name
 * @param name the name to test for
 */
module.exports.roomTitleTaken = function(name){
    for(room of main.rooms){
        if(room.title === name){
            return true;
        }
    }
    return false;
};