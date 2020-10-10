import React, {Component} from 'react';
import {Form, Input, Button, Message, Checkbox, Header} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import {validSubject, validCourseNum, courseToStr} from './../misc/helpers';
import './editCourse.css';

export class EditCourse extends Component {
    constructor(props) {
        super(props);
        
        this.state = {...{
            subject: "",
            courseNum: "",
            courseName: "",
            weighted: false,
        }, ...this.props.location.state};
    }

    validInput() {
        const {subject, courseNum, courseName} = this.state;
        
        return (
            validSubject(subject) &&
            validCourseNum(courseNum) &&
            courseName
        );
    }

    getQuery() {
        const {subject, courseNum, courseName, weighted} = this.state;
        const {userID} = this.props;
        const courseID = this.state.selectedCourse._id;

        const requestBody = {
            query: `
            mutation {
                editCourse(courseInput: {
                    subject: "${subject}",
                    courseNum: ${courseNum},
                    courseName: "${courseName}",
                    weighted: ${weighted},
                    creator: "${userID}"
                }, courseID: "${courseID}") {
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

        return requestBody;
    }

    async attemptEditCourse() {
        const requestBody = this.getQuery();

        try {
            const res = await fetch(PROXY_URL, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (res.status !== 200 && res.status !== 201) {
                throw new Error("Add course failed! (bad status code)");
            }
            const resData = await res.json();
            return resData;
        } catch (error) {
            console.log(error);
        }
    }

    handleEditCourseResult(resData) {
        this.setState({
            subject: "",
            courseNum: "",
            courseName: "",
            weighted: false
        });

        if (resData.errors) {
            this.setState({error: resData.errors[0].message});
            return;
        }
        
        const oldCourse = this.state.selectedCourse;
        const newCourse = resData.data.editCourse;
        this.props.replaceCourse(oldCourse, newCourse);
        history.push('/courses');
    }

    render() {
        return (
            <div>
            <Header size='huge'>
                Edit Course
            </Header>
            <b>{courseToStr(this.state.selectedCourse)}</b>
            <Form   className='edit-course-form'
                    error={this.state.error !== null && this.state.error.length > 0}
            >
                <Form.Field>
                    <label>Subject</label>
                    <Input  value={this.state.subject}
                            onChange={e => {
                                this.setState({subject: e.target.value});
                            }}
                    />
                </Form.Field>
                <Form.Field>
                    <label>Course Number</label>
                    <Input  value={this.state.courseNum}
                    type="number"
                            onChange={e => {
                                this.setState({courseNum: e.target.value});
                            }}
                    />
                </Form.Field>
                <Form.Field>
                    <label>Course Name</label>
                    <Input  value={this.state.courseName}
                            onChange={e => {
                                this.setState({courseName: e.target.value});
                            }}
                    />
                </Form.Field>
                <Form.Field>
                    <Checkbox   label='Weighted'
                                checked={this.state.weighted}
                                onChange={_ => this.setState({weighted: !this.state.weighted})}
                    />
                </Form.Field>
                <Message 
                    error
                    header='Error'
                    content={this.state.error}
                />
                <Button type='submit'
                        disabled={!this.validInput()}
                        onClick={e => {
                            e.preventDefault();
                            this.attemptEditCourse()
                            .then(resData => this.handleEditCourseResult(resData));
                        }}
                >
                    Save Changes
                </Button>
            </Form>
            </div>
        );
    }
}