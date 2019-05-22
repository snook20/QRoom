$(function(){
    //register the get state button
    document.getElementById('getState_button').onclick = function(){logState()};
});

function logState(){
    const dataObject = {
        key : getEnteredKey()
    };

    const options= {
        url: '/moderation/current_state',
        method: 'GET',
        data: dataObject
    };

    $.get(options, function(error, response, body){
        console.log(body.responseJSON);
    });
}

/**
 * return whatever is entered in the key area
 */
function getEnteredKey(){
    return document.getElementById("key_input").value;
    return document.getElementById("key_form").elements[0].value;
}