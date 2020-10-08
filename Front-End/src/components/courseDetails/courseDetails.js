import React, {Component} from 'react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './courseDetails.css';

export class CourseDetails extends Component {
    constructor(props) {
        super(props);

        this.state = this.props.location.state;
    }

    render() {
        const {
            subject,
            courseNum,
            courseName,
            weighted
        } = this.state;

        return (
            <div>
                <h1>
                    {subject}{courseNum}: {courseName}
                </h1>
            </div>
        );
    }
}