'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Header = function (_React$Component) {
    _inherits(Header, _React$Component);

    function Header() {
        _classCallCheck(this, Header);

        return _possibleConstructorReturn(this, (Header.__proto__ || Object.getPrototypeOf(Header)).apply(this, arguments));
    }

    _createClass(Header, [{
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                { className: "header" },
                React.createElement(
                    "h1",
                    null,
                    "QRoom"
                ),
                React.createElement(
                    "h6",
                    null,
                    React.createElement("div", { id: "name" })
                ),
                React.createElement(
                    "h6",
                    null,
                    React.createElement(
                        "div",
                        { id: "roomLabel" },
                        "root"
                    )
                )
            );
        }
    }]);

    return Header;
}(React.Component);

var RoomSection = function (_React$Component2) {
    _inherits(RoomSection, _React$Component2);

    function RoomSection() {
        _classCallCheck(this, RoomSection);

        return _possibleConstructorReturn(this, (RoomSection.__proto__ || Object.getPrototypeOf(RoomSection)).apply(this, arguments));
    }

    _createClass(RoomSection, [{
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                { className: "rooms" },
                React.createElement(
                    "center",
                    null,
                    React.createElement(
                        "h3",
                        null,
                        "Rooms"
                    )
                ),
                React.createElement(
                    "button",
                    { id: "showRooms" },
                    "Show rooms"
                ),
                React.createElement("div", { id: "room_list" }),
                React.createElement("br", null),
                React.createElement(
                    "div",
                    null,
                    "Current members:"
                ),
                React.createElement("div", { id: "users" })
            );
        }
    }]);

    return RoomSection;
}(React.Component);

var QueueSection = function (_React$Component3) {
    _inherits(QueueSection, _React$Component3);

    function QueueSection(props) {
        _classCallCheck(this, QueueSection);

        var _this3 = _possibleConstructorReturn(this, (QueueSection.__proto__ || Object.getPrototypeOf(QueueSection)).call(this, props));

        _this3.state = { mute: false };
        return _this3;
    }

    _createClass(QueueSection, [{
        key: "render",
        value: function render() {
            var _this4 = this;

            return React.createElement(
                "div",
                { className: "queue" },
                React.createElement(
                    "div",
                    { className: "playBar", id: "songBar" },
                    React.createElement(
                        "label",
                        { align: "bottom", className: "switch" },
                        React.createElement("input", { id: "volumeSwitch", type: "checkbox", defaultChecked: true,
                            onChange: function onChange() {
                                return _this4.setState({ mute: _this4.changeVolume(_this4.state) });
                            } }),
                        React.createElement("span", { className: "slider" })
                    )
                ),
                React.createElement(
                    "center",
                    null,
                    React.createElement(
                        "h3",
                        null,
                        "Queue"
                    )
                ),
                React.createElement("div", { id: "queue" })
            );
        }
    }, {
        key: "changeVolume",
        value: function changeVolume(state) {
            //state contains the old value, so it's !state.mute to show the switch
            //if mute is true we want no volume
            var volume = !state.mute ? 0 : 100;
            console.log(volume);
            $.ajax({
                url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + volume,
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + access_token,
                    "Content-Type": "application/json"
                },

                data: JSON.stringify({
                    volume_percent: volume
                }),

                error: function error(message) {
                    console.log("failed to change volume");
                    console.log(message);
                },

                success: function success(body) {
                    console.log("changed volume");
                }
            });
            return !state.mute;
        }
    }]);

    return QueueSection;
}(React.Component);

var SearchSection = function (_React$Component4) {
    _inherits(SearchSection, _React$Component4);

    function SearchSection() {
        _classCallCheck(this, SearchSection);

        return _possibleConstructorReturn(this, (SearchSection.__proto__ || Object.getPrototypeOf(SearchSection)).apply(this, arguments));
    }

    _createClass(SearchSection, [{
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                { className: "search" },
                React.createElement(
                    "center",
                    null,
                    React.createElement(
                        "h3",
                        null,
                        "Search"
                    )
                ),
                React.createElement(
                    "form",
                    { id: "songInputForm", method: "get" },
                    "Song search: ",
                    React.createElement("input", { type: "text", name: "song_search", defaultValue: "Sunflower" }),
                    React.createElement("br", null),
                    React.createElement("input", { type: "submit", style: { display: "none" } })
                ),
                React.createElement("div", { id: "search_list" })
            );
        }
    }]);

    return SearchSection;
}(React.Component);

var LikeButton = function (_React$Component5) {
    _inherits(LikeButton, _React$Component5);

    function LikeButton(props) {
        _classCallCheck(this, LikeButton);

        var _this6 = _possibleConstructorReturn(this, (LikeButton.__proto__ || Object.getPrototypeOf(LikeButton)).call(this, props));

        _this6.state = { liked: false };
        return _this6;
    }

    _createClass(LikeButton, [{
        key: "render",
        value: function render() {
            var _this7 = this;

            if (this.state.liked) {
                return 'You liked this.';
            }

            return React.createElement(
                "button",
                { onClick: function onClick() {
                        return _this7.setState({ liked: true });
                    } },
                "Like"
            );
        }
    }]);

    return LikeButton;
}(React.Component);

var App = function (_React$Component6) {
    _inherits(App, _React$Component6);

    function App() {
        _classCallCheck(this, App);

        return _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).apply(this, arguments));
    }

    _createClass(App, [{
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                { className: "body" },
                React.createElement(Header, null),
                React.createElement(
                    "section",
                    null,
                    React.createElement(RoomSection, null),
                    React.createElement(QueueSection, null),
                    React.createElement(SearchSection, null)
                )
            );
        }
    }]);

    return App;
}(React.Component);

var mainContainer = document.querySelector('#react_dom');
ReactDOM.render(React.createElement(App, null), mainContainer);