import React, {Component} from 'react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './courses.css';

export class Courses extends Component {
    constructor(props) {
        super(props);
        console.log(this.props);
    }

    render() {
        return (
            <div>
                <ul>
                    {this.props.courses.map((course, i) => {
                        return (
                            <li key={i}>{course._id}</li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}