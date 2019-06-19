import React from 'react';

/**
 * Will scroll its children when they overflow their size
 */
export function ScrollContainer(props){
    return (
        <div className={"scoll_container"}>
            {props.children}
        </div>
    );
}