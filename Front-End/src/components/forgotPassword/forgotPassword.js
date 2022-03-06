import React, {Component} from 'react';
import {Form, Input, Button, Message, Header} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import './forgotPassword.css';

export class ForgotPassword extends Component {
    constructor() {
        super();
        
        this.state = {
            email: '',
            errorMessage: '',
            successMessage: ''
        };
    }

    validInput() {
        return this.state.email;
    }

    async attemptForgotPasswordService() {
        const requestBody = {
            email: this.state.email
        };

        return fetch(`${PROXY_URL}/forgotPassword`, {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then((res) => {
            return res.json();
        })
        .then((body) => {
            return {
                error: body.error ? body.error : '', 
                message: body.message ? body.message : ''
            };
        })
        .catch((err) => {
            this.setState({
                errorMessage: err.message,
                successMessage: ''
            });
            console.log(err);
        });
    }

    handleForgotPasswordResults(messages) {
        if (messages.error) {
            this.setState({
                errorMessage: messages.error,
                successMessage: ''
            });
        } else {
            this.setState({
                errorMessage: '',
                successMessage: messages.message
            });
        }
    }

    render() {
        let message;
        if (this.state.errorMessage && !this.state.successMessage) {
            message = <Message 
                negative
                header='Error'
                content={this.state.errorMessage}
            />;
        } else if (!this.state.errorMessage && this.state.successMessage) {
            message = <Message 
                positive
                header='Success'
                content={this.state.successMessage}
            />;
        }

        return (
            <div className='forgot-password__container'>
                <Header size='huge'>
                    Forgot Password
                </Header>
                <p>
                    Enter the email associated with your account. We will send an email with instructions on what to do next.
                </p>
                <Form   className='forgot-password__form'
                        error={this.state.badEmail}
                >
                    <Form.Field>
                        <label>E-Mail</label>
                        <Input  value={this.state.email}
                                onChange={e => {
                                    this.setState({email: e.target.value});
                                }}
                        />
                    </Form.Field>
                    {message}
                    <Button type='submit'
                        disabled={!this.validInput()}
                        onClick={async () => {
                            this.attemptForgotPasswordService()
                            .then(messages => {
                                this.handleForgotPasswordResults(messages);
                            });
                        }}
                    >
                        Send Email
                    </Button>
                </Form>
            </div>
        );
    }
}
