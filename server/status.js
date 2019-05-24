/* Status Codes:
 * 200 - request completed
 * 420 - not in a room
 * 421 - already in a room
 * 432 - unexpected request method
 * 451 - missing username or access token
 */
module.exports.COMPLETED = 200;         //Request completed
module.exports.NOT_IN_ROOM = 420;       //Making a request that requires the user to be in a room, but they aren't
module.exports.ALREADY_IN_ROOM = 421;   //Making a request that requires the user not to be in a room but they are
module.exports.UNEXPECTED_METHOD = 432; //Unexpected request method i.e. PUT
module.exports.MISSING_INFO = 451;      //Missing username or access token when required
module.exports.BAD_REQUEST = 464;       //Bad request, such as mismatched room title and index
module.exports.NO_PERMISSION = 401;     //Invalid permission, such as missing or incorrect key
