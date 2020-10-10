import React, {Component} from 'react';
import {PROXY_URL} from '../misc/proxyURL';
import {Table, Button, Confirm} from 'semantic-ui-react';
import {Dimmer, Loader, Segment} from 'semantic-ui-react';
import {deleteItemFromArray} from './../misc/helpers';
import history from '../../history';
import './courses.css';

export class Courses extends Component {
    constructor(props) {
        super(props);

        this.state = {
            courses: [],
            loading: true,
            clickDelete: false,
            selectedCourse: {}
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

    async deleteCourse(course) {
        const requestBody = {
            query: `
            mutation {
                deleteCourse(courseID: "${course._id}") {
                    _id
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
                throw new Error("Delete course failed! (bad response status)");
            }
            const resData = await res.json();
            if (!resData.data.deleteCourse) {
                console.log(resData);
                throw new Error("Delete course failed!");
            }

            return resData;
        } catch (error) {
            console.log(error);
        }
    }

    deleteCourseLocally(course) {
        const newCourses = deleteItemFromArray(this.state.courses, course);
        this.setState({courses: newCourses});
        this.props.deleteCourse(newCourses);
    }

    courseToStr(course) {
        const weighted = course.weighted ? "(Weighted)" : "";
        return `${course.subject}${course.courseNum} - ${course.courseName} ${weighted}`;
    }

    componentDidMount() {
        if (!this.props.courses) {
            this.setState({
                courses: [],
                loading: false
            });
            return;
        }

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
            <React.Fragment>
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
                                        {this.courseToStr(course)}
                                    </a>
                                </Table.Cell>
                                <Table.Cell className="courses__row__options">
                                    <Button color="grey"
                                            onClick={() => history.push({
                                                pathname: '/editCourse',
                                                state: {
                                                    selectedCourse: course,
                                                    error: ""
                                                }
                                            })}
                                    >
                                        Edit
                                    </Button>
                                    <Button negative
                                            onClick={e => {
                                                e.preventDefault();
                                                this.setState({
                                                    clickDelete: true,
                                                    selectedCourse: course
                                                });
                                            }}
                                    >
                                        Delete
                                    </Button>
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
            <Confirm    open={this.state.clickDelete}
                        header={'Delete Course'}
                        content={`Are you sure you wish to delete ${this.courseToStr(this.state.selectedCourse)}?`}
                        onCancel={e => {
                            e.preventDefault();
                            this.setState({
                                clickDelete: false,
                                selectedCourse: {}
                            });
                        }}
                        onConfirm={e => {
                            e.preventDefault();
                            const selectedCourse = this.state.selectedCourse;
                            this.deleteCourse(selectedCourse)
                            .then(resData => {
                                if (resData && resData.errors) {
                                    const error = resData.errors[0].messsage;
                                    console.log(error);
                                    return;
                                }

                                this.deleteCourseLocally(selectedCourse);
                            });

                            this.setState({
                                clickDelete: false,
                                selectedCourse: {}
                            });
                        }}
            />
            </React.Fragment>
        );
    }
}