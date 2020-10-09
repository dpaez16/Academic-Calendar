import React, {Component} from 'react';
import {PROXY_URL} from '../misc/proxyURL';
import {Table, Button} from 'semantic-ui-react';
import {Dimmer, Loader, Segment} from 'semantic-ui-react';
import history from '../../history';
import './courses.css';

export class Courses extends Component {
    constructor(props) {
        super(props);

        this.state = {
            courses: [],
            loading: true
        };
    }

    async getCourses(courseIDS) {
        const requestBody = {
            query: `
            {
                courses(courseIDS: [${courseIDS}]) {
                    _id
                    subject
                    courseNum
                    courseName
                    weighted
                    categories
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

    addCourse(newCourse) {
        this.setState({
            courses: [...this.state.courses, newCourse]
        })
    }

    componentDidMount() {
        const courseIDS = this.props.courses.map(course => `"${course._id}"`);
        this.getCourses(courseIDS)
        .then(courses => {
        	this.setState({
                courses: courses,
                loading: false
            })
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.courses !== this.props.courses) {
            this.setState({courses: this.props.courses});
        }
    }

    render() {
        if (this.state.loading) {
            return (
                <Segment className='courses-loading'>
                    <Dimmer active 
                            inverted
                    >
                        <Loader inverted 
                                content='Loading' 
                        />
                    </Dimmer>
                </Segment>
            );
        }

        let {courses} = this.state;
        return (
            <Table  celled
                    className="courses"
            >
                <Table.Body>
                    {courses.map((course, i) => {
                        return (
                            <Table.Row key={i}>
                                <Table.Cell className="courses__row__metadata">
                                    <a  href=""
                                        onMouseDown={() => history.push({
                                            pathname: "/courseDetails",
                                            state: course
                                        })}
                                    >
                                        {course.subject}{course.courseNum} - {course.courseName} {
                                            course.weighted ? "(Weighted)" : ""
                                        }
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
                                    onClick={() => history.push('/addCourse')}
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