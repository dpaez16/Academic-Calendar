import React, {Component} from 'react';
import {PROXY_URL} from '../misc/proxyURL';
import {Table, Button, Label, Menu, Icon} from 'semantic-ui-react';
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
        .then(courses => {
        	this.setState({courses: courses})
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.courses !== this.props.courses) {
            this.setState({courses: this.props.courses});
        }
    }

    render() {
        let {courses} = this.state;
        return (
            <Table  celled
                    className="courses"
            >
                <Table.Body>
                    {courses.map(course => {
                        return (
                            <Table.Row>
                                <Table.Cell className="courses__row__metadata">
                                    <a  href=""
                                        onMouseDown={() => history.push({
                                            pathname: "/courseDetails",
                                            state: {
                                                courseID: course._id
                                            }
                                        })}
                                    >
                                        {course.subject}{course.courseNum} - {course.courseName}
                                    </a>
                                </Table.Cell>
                                <Table.Cell className="courses__row__options">
                                    <Button color="grey">Edit</Button>
                                    <Button negative>Delete</Button>
                                </Table.Cell>
                            </Table.Row>
                        );
                    })}
                    <Table.Row>
                        <Table.Cell colSpan='2'>
                            <Button positive
                                    fluid
                            >
                                Add Course
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
    }
}