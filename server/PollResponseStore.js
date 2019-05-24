/* The Poll Response Store helps manage response objects
 * for long polling.
 *
 * Each response object is stored with an access token and a poll type
 * the access token is the token of the user who has the poll out,
 * and type is a string identifying what the user is polling for
 *
 * Each express responce object is stored in the map resMap.
 * This map is keyed by access token. Each token maps to a 'type map',
 * a map from poll type to a specific response object.
 *
 * So if a user with access_token=abc123 is polling for queue updates,
 * then resMap['abc123']['queue'] will hold that user's express response object
 */

const resMap = {};

/**
 * @param access_token the user's access token
 * @param type the poll type
 * @return whether this access_token and type has a response registered to it
 */
module.exports.isRegistered = isRegistered = function(access_token, type){
    //if this token has nothing registered at all
    if(!resMap[access_token]){
        return false;
    }

    //if there is something registered
    if(resMap[access_token][type]){
        return true;
    }

    return false;
};

/**
 * register a response object with a token and type
 *
 * @param access_token the user's access token
 * @param type the poll type
 * @param res the express response object
 */
module.exports.register = function(access_token, type, res){
    //don't allow a reregistration
    if(isRegistered(access_token, type)){
        throw `Cannot register: ${access_token} already registered with ${type}`;
    }

    //if there is nothing registered at all with this token
    if(!resMap[access_token]){
        resMap[access_token]= {};
    }

    resMap[access_token][type]= res;
};

/**
 * unregister the responce object associated with a token and type
 *
 * @param access_token the user's access token
 * @param type the poll type
 */
module.exports.unregister = unregister = function(access_token, type){
    //cannot unregister if not already registered
    if(!isRegistered(access_token, type)){
        throw `Cannot unregister: ${access_token} is not registered with ${type}`;
    }

    delete resMap[access_token][type];
};

/**
 * update an already registered token and type
 *
 * @param access_token the user's access token
 * @param type the poll type
 * @param res the express response object
 */
module.exports.update = function(access_token, type, res){
    //cannot update if not already registered
    if(!isRegistered(access_token, type)){
        throw `Cannot update: ${access_token} is not registered with ${type}`;
    }

    resMap[access_token][type]= res;
};

/**
 * respond to the poll with the given object
 * this will unregister the response object automatically
 *
 * @param access_token the user's access token
 * @param type the poll type
 * @param obj the object to send in json form to the poll responce object
 */
module.exports.res_json = function(access_token, type, obj){
    //cannot update if not already registered
    if(!isRegistered(access_token, type)){
        throw `Cannot json: ${access_token} is not registered with ${type}`;
    }

    let res = resMap[access_token][type];

    unregister(access_token, type);

    res.json(obj);
};

/**
 * get a json serialized string representing the resMap
 */
module.exports.jsonify = function(){
    //a simple representation of the map
    //that doesn't include a res object
    let simple = {};
    for(let token in resMap){
        simple[token] = resMap[token];
        for(let type in simple[token]){
            //convert a res object to boolean
            simple[token][type] = !!resMap[token][type];
        }
    }

    return JSON.stringify(simple);
};

