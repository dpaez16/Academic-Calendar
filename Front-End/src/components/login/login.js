import React, {Component} from 'react';
import {Form, Input, Button, Message} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
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
        const {email, password} = this.state;
        const requestBody = {
            query: `
            {
                loginUser(email: "${email}", password: "${password}") {
                    _id
                }
            }
            `
        };

        return fetch(PROXY_URL, {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(res => {
            if (res.status !== 200 && res.status !== 201) {
                throw new Error("Login failed!");
            }

            return res.json();
        })
        .then(resData => {
            if (!resData.data.loginUser) {
                throw new Error("Login credentials failed!");
            }

            const userData = resData.data.loginUser;
            console.log(userData);

            // need a way to return this to button onClick
            return true;
        })
        .catch(error => {
            console.log(error);
        });
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