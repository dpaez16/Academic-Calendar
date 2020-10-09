import React, {Component} from 'react';
import {Form, Input, Button, Message, Checkbox} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import {validSubject, validCourseNum} from './../misc/helpers';
import './addCourse.css';

export class AddCourse extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            error: "",
            subject: "",
            courseNum: "",
            courseName: "",
            weighted: false,
        };
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
        const requestBody = {
            query: `
            mutation {
                createCourse(courseInput: {
                    subject: "${subject}",
                    courseNum: ${courseNum},
                    courseName: "${courseName}",
                    weighted: ${weighted},
                    creator: "${userID}"
                }) {
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

    async attemptAddCourse() {
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

    handleAddCourseResult(resData) {
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
        
        const newCourse = resData.data.addCourse;
        this.props.addCourse(newCourse);
        history.push('/courses');
    }

    render() {
        return (
            <Form   className='add-course-form'
                    error={true && this.state.error}
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
                            this.attemptAddCourse()
                            .then(resData => this.handleAddCourseResult(resData));
                        }}
                >
                    Add Course
                </Button>
            </Form>
        );
    }
}