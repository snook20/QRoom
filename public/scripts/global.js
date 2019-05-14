var username = null;
var access_token = null;
var room_list = null;

const topLevelViews= [
	$('#login_page'),
	$('#lobby'),
	$('#room')
];

switchView('login_page');

/**
 * switch the view to show only the given id
 */
function switchView(viewId){
	window.focus();
	console.log("switching view to " + viewId);
	for(view of topLevelViews){
		view.hide();
	}
	$('#'+viewId).show();
}