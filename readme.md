# QRoom
QRoom is a dope hangout spot for all the cool kids.

The concept is that you can login with Spotify,
create and/or join a "QRoom", add songs to a shared queue, and stream them straight
to your browser.

Any Spotify user can login to QRoom, create and join rooms, and add songs
to queues.

Streaming is only available for Spotify premium users.

# What's new
QRoom is in the process of being moved to React, for cleanliness and speed.
It's going to be nicer and easier to maintain and grow this way -- hopefully.

**This means that front end code must be built.**

Right now, we are using webpack with babel loaders to convert post-modern JS
and JSX into a single `qroom.bundle.js` file that is `<script>`ed in from the html.

To build this bundled `.js` file, you can run the command `webpack` or `npm build`.
Running `npm start` will do the build and start the NodeJS server all in one.

We have yet to setup code watching or hot reloading, so every time you make
a front-end change, the code will have to be re-built.

Although, we are not this far along in the React porting process, I think that
we will still have the `index.html` page simply be the login screen, which will
redirect to `qroom.html` or something like that, where the React code will be
loaded.

# Test Account
There is a Spotify acccount for testing QRoom.

The username is `qroom_user`, the birthday is July 23, 1998, and the password
is some initials. And the email is `jeni@daymailonline.com`.

# Endpoint Reference
This is a reference to our backend endpoints.
Note that QRoom clients maintain a stateful connection with the server.
This means that many backend calls are intended to change the state of the application.
In particular, the server maintains which room each user is in or whether they are in the lobby.

<table>
    <tr>
        <td colspan="2"><strong>Login</strong></td>
    </tr>
    <tr>
        <td>Description</td>
        <td>
            Login to QRoom with Spotify.
            This will redirect to the Spotify login page and prompt for Spotify credentials.
            The user will then be moved into the lobby.
        </td>
    <tr>
        <td>URL</td>
        <td><code>/login</code></td>
    </tr>
    <tr>
        <td>Method</td>
        <td><code>GET</code></td>
    </tr>
    <tr>
        <td>URL parameters</td>
        <td>None</td>
    </tr>
    <tr>
        <td>Data parameters</td>
        <td>None</td>
    </tr>
    <tr>
        <td>Response</td>
        <td>
            After successful login, this will redirect to <code>/qroom.html</code> with the following hash parameters:<br>
            <code>access_token</code> The OAuth token to make Spotify API requests<br>
            <code>username</code> The Spotify username used for login
        </td>
    </tr>
    <tr>
        <td>Error</td>
        <td></td>
    </tr>
</table>

<table>
    <tr>
        <td colspan="2"><strong>Get Rooms</strong></td>
    </tr>
    <tr>
        <td>Description</td>
        <td>
            Get all the rooms that are registered with QRoom.
        </td>
    <tr>
        <td>URL</td>
        <td><code>/from_lobby/getRooms</code></td>
    </tr>
    <tr>
        <td>Method</td>
        <td><code>GET</code></td>
    </tr>
    <tr>
        <td>URL parameters</td>
        <td>
            <code>access_token</code> The access token for this user
        </td>
    </tr>
    <tr>
        <td>Data parameters</td>
        <td>None</td>
    </tr>
    <tr>
        <td>Response</td>
        <td>
            <code>available_rooms</code> An array of rooms
        </td>
    </tr>
    <tr>
        <td>Error</td>
        <td>
            <code>451</code> If <code>access_token</code> is not supplied<br>
            <code>421</code> If the user is already in a room
        </td>
    </tr>
</table>

<table>
    <tr>
        <td colspan="2"><strong>Poll Rooms</strong></td>
    </tr>
    <tr>
        <td>Description</td>
        <td>
            Get all the rooms that are registered with QRoom.
            This will only be responded to when the list of rooms changes
            (i.e a new room is created)
        </td>
    <tr>
        <td>URL</td>
        <td><code>/from_lobby/pollrooms</code></td>
    </tr>
    <tr>
        <td>Method</td>
        <td><code>GET</code></td>
    </tr>
    <tr>
        <td>URL parameters</td>
        <td>
            <code>access_token</code> The access token for this user
        </td>
    </tr>
    <tr>
        <td>Data parameters</td>
        <td>None</td>
    </tr>
    <tr>
        <td>Response</td>
        <td>
            <code>available_rooms</code> An array of rooms
        </td>
    </tr>
    <tr>
        <td>Error</td>
        <td>
            <code>451</code> If <code>access_token</code> is not supplied<br>
            <code>421</code> If the user is already in a room
        </td>
    </tr>
</table>

<table>
    <tr>
        <td colspan="2"><strong>Move to a room</strong></td>
    </tr>
    <tr>
        <td>Description</td>
        <td>
            Move to a room in QRoom.
            If successful, the server will track that the user is in
            the specified room.
        </td>
    <tr>
        <td>URL</td>
        <td><code>/from_lobby/moveToRoom</code></td>
    </tr>
    <tr>
        <td>Method</td>
        <td><code>POST</code></td>
    </tr>
    <tr>
        <td>URL parameters</td>
        <td>
            None
        </td>
    </tr>
    <tr>
        <td>Data parameters</td>
        <td>
            <code>access_token</code> The access token for this user<br>
            <code>username</code> The username of this user<br>
            <code>moveTo_index</code> The index of the room to move to<br>
            <code>moveTo_title</code> The title of the room to move to<br>
            <code>movTo_key</code> The key to enter this room. This may be omitted if
                no key is required for the room
        </td>
    </tr>
    <tr>
        <td>Response</td>
        <td>
            <code>room</code> The room the user just joined
        </td>
    </tr>
    <tr>
        <td>Error</td>
        <td>
            <code>451</code> If any of the required parameters are not supplied<br>
            <code>421</code> If the user is already in a room<br>
            <code>464</code> If the <code>moveTo_title</code> does not match the <code>moveTo_index</code><br>
            <code>401</code> If the supplied <code>moveTo_key</code> is incorrect or ommitted when required
        </td>
    </tr>
</table>

<table>
    <tr>
        <td colspan="2"><strong>Create a new room</strong></td>
    </tr>
    <tr>
        <td>Description</td>
        <td>
            Create a new room in QRoom.
            If successful, the server will track that the user is in
            the specified room.
        </td>
    <tr>
        <td>URL</td>
        <td><code>/from_lobby/create_room</code></td>
    </tr>
    <tr>
        <td>Method</td>
        <td><code>POST</code></td>
    </tr>
    <tr>
        <td>URL parameters</td>
        <td>
            None
        </td>
    </tr>
    <tr>
        <td>Data parameters</td>
        <td>
            <code>access_token</code> The access token for this user<br>
            <code>username</code> The username of this user<br>
            <code>title</code> The title of the room to create<br>
            <code>key</code> (Optional) The key of the room to create<br>
        </td>
    </tr>
    <tr>
        <td>Response</td>
        <td>
            <code>room</code> The room the user just created
        </td>
    </tr>
    <tr>
        <td>Error</td>
        <td>
            <code>451</code> If any of the required parameters are not supplied<br>
            <code>421</code> If the user is already in a room<br>
            <code>464</code> If the room title is already taken</code><br>
        </td>
    </tr>
</table>