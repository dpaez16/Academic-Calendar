import React, {Component} from 'react';
import {Form, Input, Button, Message} from 'semantic-ui-react';
import './login.css';

export class Login extends Component {
    constructor() {
        super();
        
        this.state = {
            badLogin: false,
            email: '',
            password: ''
        };
    }

    validInput() {
        return this.state.email && this.state.password;
    }

    attemptLogin() {
        return this.state.email == "d";
    }

    render() {
        return (
            <Form   className='login-form'
                    error={this.state.badLogin}
            >
                <Form.Field>
                    <label>E-Mail</label>
                    <Input  value={this.state.email}
                            onChange={e => {
                                this.setState({email: e.target.value});
                            }}
                    />
                </Form.Field>
                <Form.Field>
                    <label>Password</label>
                    <Input  type='password'
                            value={this.state.password}
                            onChange={e => {
                                this.setState({password: e.target.value});
                            }}
                    />
                </Form.Field>
                <Message 
                    error
                    header='Login Failed'
                    content='E-Mail or password is incorrect.'
                />
                <Button type='submit'
                        disabled={!this.validInput()}
                        onClick={async () => {
                            let loginStatus = this.attemptLogin();
                            this.setState({
                                badLogin: !loginStatus,
                                email: '',
                                password: ''
                            });
                        }}
                >
                    Login
                </Button>
            </Form>
        );
    }
}