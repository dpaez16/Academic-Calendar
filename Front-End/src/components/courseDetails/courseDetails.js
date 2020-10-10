import React, {Component} from 'react';
import { courseToStr } from '../misc/helpers';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './courseDetails.css';

export class CourseDetails extends Component {
    constructor(props) {
        super(props);

        this.state = this.props.location.state;
    }

    render() {
        const course = this.state;

        return (
            <div>
                <h1>
                    {courseToStr(course)}
                </h1>
            </div>
        );
    }
}