import React, {Component} from 'react';
import {Form, Input, Button, Message} from 'semantic-ui-react';
import './login.css';

export class Login extends Component {
    render() {
        return (
            <Form className='login-form'>
                <Form.Field>
                    <label>E-Mail</label>
                    <input />
                </Form.Field>
                <Form.Field>
                    <label>Password</label>
                    <input type='password' />
                </Form.Field>
                <Button type='submit'>Login</Button>

                <Message 
                    error
                    header='Login Failed'
                    content='E-Mail or password is incorrect.'
                />
            </Form>
        );
    }
}