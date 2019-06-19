import React from 'react';

/**
 * This is a react component that automatically
 * updates its children with the results of a long poll from the server
 *
 * Props:
 *
 * Required:
 *
 * init_url : the url to pull the initial data from
 * init_data : a function that returns data to be sent with the initilization
 *
 * poll_url : the url to poll for updated data
 * poll_data : a function that returns data to be sent with the poll request
 *
 * Optional:
 *
 * init_method : the method to use with the init request, 'GET' by default
 * poll_method : the method to use with the poll request, 'GET' by default
 *
 * callback : a function that will be invoked whenever a poll is answered. it will be invoked
 *              with the object sent from the poll
 *
 * onError : a function that will be invoked if there is an error
 */

class Polling extends React.Component {
    constructor(props){
        super(props);

        //ensure defualt methods
        this.init_method = props.hasOwnProperty('init_method') ?
                            props.init_method : 'GET';

        this.poll_method = props.hasOwnProperty('poll_method') ?
                            props.poll_method : 'GET';

        this.state = {
            //the data to be passed to children as props
            data : false,
        };

        this.polling= true;

        //this should refer to this in the recieveResponse function
        this.receiveResponse= this.receiveResponse.bind(this);
        this.initialize= this.initialize.bind(this);
        this.onError= this.onError.bind(this);

        this.initialize();
    }

    componentDidMount(){
        this.polling= true;
    }

    componentWillUnmount(){
        this.polling= false;
    }

    initialize(){
        $.ajax({
            method : this.init_method,
            url : this.props.init_url,
            data : this.props.init_data(),

            success : this.receiveResponse,

            error : this.onError.bind(this)
        });
    }

    poll(){
        $.ajax({
            method : this.poll_method,
            url : this.props.poll_url,
            data : this.props.poll_data(),
            timeout: 5000,

            success : this.receiveResponse,

            error : this.onError
        });
    }

    receiveResponse(response){
        //if we are done polling, stop it
        if(!this.polling){
            return;
        }

        if(this.props.callback){
            this.props.callback(response);
        }

        this.setState({data : response});
        this.poll();
    }

    onError(error){
        //if the error is due to a timeout
        if(error.status === 0){
            this.poll();
        }
        else{
            if(this.props.onError){
                this.props.onError(error);
            }
        }
    }

    render(){
        //if there is no data, render the plain children
        if(!this.state.data){
            return(
                <div>
                    {this.props.children}
                </div>
            );
        }

        //if there is data, add it to the children's props
        //add the extra state to each child
        let childrenWithData= React.Children.map(
            this.props.children,
            child => React.cloneElement(child, {poll : this.state.data})
        );

        return (
            <div>
                {childrenWithData}
            </div>
        );
    }
}

export {Polling};