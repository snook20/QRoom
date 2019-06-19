/**
 * Conditionally render children
 *
 * expected props:
 *  if : boolean - whether to render the children
 *  else : React.Component - (Optional) what to render if the condition is false
 */
export function RenderIf(props){
    if(!props.if){
        return props.else ?  props.else : null;
    }

    return props.children;
}