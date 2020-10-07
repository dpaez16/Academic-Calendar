import React, {Component} from 'react';
import './profile.css';

export class Profile extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {_id, name, email} = this.props.userInfo;
        return (
            <div className="user-profile">
                <h2>Name:</h2>
                <p>{name}</p>
                <h2>Email:</h2>
                <p>{email}</p>
            </div>
        );
    }
}