import React, {Component} from 'react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './courses.css';

export class Courses extends Component {
    constructor(props) {
        super(props);

        this.state = {
            courses: []
        };
    }

    async getCourses(courseIDS) {
        const requestBody = {
            query: `
            {
                courses(courseIDS: [${courseIDS}]) {
                    subject
                    courseNum
                    courseName
                }
            }
            `
        };

        try {
            const res = await fetch(PROXY_URL, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (res.status !== 200 && res.status !== 201) {
                throw new Error("Courses fetch failed!");
            }
            const resData = await res.json();
            if (!resData.data.courses) {
                throw new Error("Courses fetch failed!");
            }

            const courses = resData.data.courses;
            return courses;
        } catch (error) {
            console.log(error);
        }
    }

    componentDidMount() {
        const courseIDS = this.props.courses.map(course => `"${course._id}"`);
        this.getCourses(courseIDS)
        .then(courses => this.setState({courses: courses}));
    }

    componentDidUpdate(prevProps) {
        if (prevProps.courses !== this.props.courses) {
            this.setState({courses: this.props.courses});
        }
    }

    render() {
        return (
            <div>
                <ul>
                    {this.state.courses.map((course, i) => {
                        return (
                        <li key={i}>{course.subject}{course.courseNum} - {course.courseName}</li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}