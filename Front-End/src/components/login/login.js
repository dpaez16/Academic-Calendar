import React, {Component} from 'react';
import {Form, Input, Button, Message} from 'semantic-ui-react';
import {NavLink} from 'react-router-dom';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './login.css';

export class Login extends Component {
    constructor() {
        super();
        
        this.state = {
            badLogin: false,
            email: '',
            password: '',
            errorMessage: ''
        };
    }

    validInput() {
        return this.state.email && this.state.password;
    }

    getQuery() {
        const {email, password} = this.state;
        const requestBody = {
            query: `
            {
                loginUser(email: "${email}", password: "${password}") {
                    _id
                    name
                    email
                    courses {
                        _id
                    }
                }
            }
            `
        };

        return requestBody;
    }

    async attemptLogin() {
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
                throw new Error("Login failed!");
            }
            const resData = await res.json();
            if (!resData.data.loginUser) {
                throw new Error("Login credentials failed!");
            }

            const userData = resData.data.loginUser;
            return userData;
        } catch (error) {
        	this.setState({errorMessage: error.toString()});
            console.log(error);
        }
    }

    handleLoginResults(userInfo) {
        this.setState({
            badLogin: !userInfo,
            email: '',
            password: ''
        });

        if (!userInfo) return;
        
        this.props.updateUserInfo(userInfo);
        history.push('/');
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
                    content={this.state.errorMessage}
                />
                <div className='login-form__bottom'>
                    <Button type='submit'
                        disabled={!this.validInput()}
                        onClick={async () => {
                            this.attemptLogin()
                            .then(userInfo => {
                                this.handleLoginResults(userInfo);
                            });
                        }}
                    >
                        Login
                    </Button>
                    <NavLink to='/forgotPassword'>Forgot Password</NavLink>
                </div>
            </Form>
        );
    }
}
