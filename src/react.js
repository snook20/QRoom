'use strict';
class Header extends React.Component {
    render() {
        return (
            <div className="header">
                <h1>QRoom</h1>
                <h6><div id="name"></div></h6>
                <h6><div id="roomLabel">root</div></h6>
            </div>
        );
    }
}

class RoomSection extends React.Component {
    render() {
        return (
            <div className="rooms">
                <center><h3>Rooms</h3></center>
                <button id="showRooms">Show rooms</button>
                <div id="room_list"></div>
                <br />
                <div>Current members:</div>
                <div id="users"></div>
            </div>
        );
    }
}

class QueueSection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {mute: false};
    }
    render() {
        return (
            <div className="queue">
                <div className="playBar" id="songBar">
                    <label align="bottom" className="switch">
                        <input id="volumeSwitch" type="checkbox" defaultChecked
                            onChange={() => this.setState({mute: this.changeVolume(this.state)})}/>
                        <span className="slider"></span>
                    </label>
                </div>
                <center><h3>Queue</h3></center>
                <div id="queue"></div>
            </div>
        );
    }
    changeVolume(state){
        //state contains the old value, so it's !state.mute to show the switch
        //if mute is true we want no volume
        const volume = !state.mute ? 0 : 100;
        console.log(volume);
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + volume,
            method: 'PUT',
            headers: {
                'Authorization' : 'Bearer ' + access_token,
                "Content-Type": "application/json"
            },

            data : JSON.stringify({
                volume_percent : volume
            }),

            error : function(message){
                console.log("failed to change volume");
                console.log(message);
            },

            success : function(body){
                console.log("changed volume");
            }
        });
        return !state.mute;
    }
}

class SearchSection extends React.Component {
    render() {
        return (
            <div className="search">
                <center><h3>Search</h3></center>
                <form id="songInputForm" method="get">
                    Song search: <input type="text" name="song_search" defaultValue="Sunflower"/><br/>
                    <input type="submit" style={{display:"none"}}/>
                </form>
                <div id="search_list"></div>
            </div>
        );
    }
}

class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return (
      <button onClick={() => this.setState({ liked: true })}>
        Like
      </button>
    );
  }
}

class App extends React.Component {
    render() {
        return (
            <div className="body">
                <Header />
                <section>
                    <RoomSection />
                    <QueueSection />
                    <SearchSection />
                </section>
            </div>
        );
    }
}

const mainContainer = document.querySelector('#react_dom');
ReactDOM.render(<App />, mainContainer);
