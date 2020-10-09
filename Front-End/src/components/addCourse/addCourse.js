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

    attemptAddCourse() {
        console.log(this.state);
    }

    render() {
        return (
            <Form   className='add-course-form'
                    error={this.state.badInput}
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
                    content='Some error!'
                />
                <Button type='submit'
                        disabled={!this.validInput()}
                        onClick={e => {
                            e.preventDefault();
                            this.attemptAddCourse()
                        }}
                >
                    Add Course
                </Button>
            </Form>
        );
    }
}