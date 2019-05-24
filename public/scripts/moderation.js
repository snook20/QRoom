$(function(){
    //register the buttons
    $("button").click(function(){
        //each button's id should be the endpoint it wants to call
        logData(this.id);
    });
});

function logData(endpoint){
    console.log('\n'+endpoint+':');
    const dataObject = {
        key : getEnteredKey()
    };

    const options= {
        url: '/moderation/'+endpoint,
        method: 'GET',
        data: dataObject
    };

    $.get(options, function(error, response, body){
        if(body.responseJSON){
            console.log(body.responseJSON);
        }
        else if(body.responseText){
            //try to read off the string assuming it's json
            try{
                console.log(JSON.parse(body.responseText));
            }
            catch(error){
                //although, it may not be json, in which case just print the string
                console.log(body.responseText);
            }
        }
        else {
            console.log(body);
        }
    });
}

/**
 * return whatever is entered in the key area
 */
function getEnteredKey(){
    return document.getElementById("key_input").value;
}