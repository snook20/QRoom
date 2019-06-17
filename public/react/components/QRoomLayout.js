import React from 'react';

/**
 * This component defines QRoom's layout
 *
 * props:
 *
 * required:
 *
 * header : the component to layout as the header
 * leftBar : the left bar
 * rightBar : the right bar
 * main : the middle component -- main content
 *
 */
export function QRoomLayout(props){
    return (
        <div>
            <header>
                {props.header}
            </header>

            <div className={"left_layout"}>
                {props.leftBar}
            </div>

            <div className={"main_layout"}>
                {props.main}
            </div>

            <div className={"right_layout"}>
                {props.rightBar}
            </div>
        </div>
    );
}