import React, {Component} from 'react';
import {Form, Input, Button, Message} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './register.css';

export class Register extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            error: '',
            name: '',
            email: '',
            password: ''
        };
    }

    validInput() {
        return this.state.name && this.state.email && this.state.password;
    }

    getQuery() {
        const {name, email, password} = this.state;
        const requestBody = {
            query: `
            mutation {
                createUser(userInput: {
                    name: "${name}",
                    email: "${email}",
                    password: "${password}"
                }) {
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

    async attemptRegister() {
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
                throw new Error("Register failed! (Bad status code)");
            }
            const resData = await res.json();
            return resData;
        } catch (error) {
            console.log(error);
        }
    }

    handleRegisterResults(resData) {
        const error = resData.errors ? resData.errors[0].message : "";

        this.setState({
            error: error,
            name: '',
            email: '',
            password: ''
        });

        const userInfo = resData.createUser;
        if (!userInfo) return;
        this.props.updateUserInfo(userInfo);
        history.push('/');
    }

    render() {
        const {error} = this.state;
        return (
            <Form   className='register-form'
                    error={error.length > 0}
            >
                <Form.Field>
                    <label>Name</label>
                    <Input  value={this.state.name}
                            onChange={e => {
                                this.setState({name: e.target.value});
                            }}
                    />
                </Form.Field>
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
                    header='Register Failed'
                    hidden={!error}
                    content={`${error}`}
                />
                <Button type='submit'
                        disabled={!this.validInput()}
                        onClick={async () => {
                            this.attemptRegister()
                            .then(resData => {
                                this.handleRegisterResults(resData);
                            });
                        }}
                >
                    Register
                </Button>
            </Form>
        );
    }
}