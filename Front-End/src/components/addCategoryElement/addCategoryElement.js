import React, {Component} from 'react';
import {Form, Input, Button, Message, Header} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import {constructDate} from '../misc/helpers';
import history from '../../history';
import './addCategoryElement.css';

export class AddCategoryElement extends Component {
    constructor(props) {
        super(props);
        
        this.state = {...{
            error: "",
            name: "",
            score: "",
            total: "",
            dueDate: "",
            time: ""
        }, ...this.props.location.state};
    }

    validInput() {
        const {name, score, total, dueDate} = this.state;
        
        return (
            name &&
            !isNaN(parseFloat(score)) && 
            !isNaN(parseFloat(total)) &&
            score >= total &&
            dueDate
        );
    }

    getQuery() {
        const {name, score, total, dueDate, time, categoryID} = this.state;
        const actualDueDate = constructDate(dueDate, time);
        const requestBody = {
            query: `
            mutation {
                createCategoryElement(categoryElementInput: {
                    name: "${name}",
                    score: ${score},
                    total: ${total},
                    dueDate: "${actualDueDate}",
                    categoryID: "${categoryID}"
                }) {
                    _id
                    name
                    score
                    total
                    dueDate
                    categoryID
                }
            }
            `
        };

        return requestBody;
    }

    async attemptAddCategoryElement() {
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

    handleAddCategoryElementResult(resData) {
        this.setState({
            name: "",
            score: "",
            total: "",
            dueDate: "",
            time: ""
        });

        if (resData.errors) {
            this.setState({error: resData.errors[0].message});
            return;
        }
        
        history.goBack();
    }

    render() {
        const {courseName, categoryName} = this.state;
        return (
            <div>
            <Header size='huge'>
                Add Attribute
            </Header>

            {courseName} <br/>
            {categoryName}

            <Form   className='add-category-element-form'
                    error={this.state.error !== null && this.state.error.length > 0}
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
                    <label>Score</label>
                    <Input  value={this.state.score}
                            onChange={e => {
                                this.setState({score: e.target.value});
                            }}
                    />
                </Form.Field>
                <Form.Field>
                    <label>Total</label>
                    <Input  value={this.state.total}
                            onChange={e => {
                                this.setState({total: e.target.value});
                            }}
                    />
                </Form.Field>
                <Form.Field>
                    <label>Due Date</label>
                    <Input  value={this.state.dueDate}  
                            type="date"
                            onChange={e => {
                                this.setState({dueDate: e.target.value});
                            }}
                    />
                </Form.Field>
                <Form.Field>
                    <label>Time*</label>
                    <Input  value={this.state.time}  
                            type="time"
                            onChange={e => {
                                this.setState({time: e.target.value});
                            }}
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
                            this.attemptAddCategoryElement()
                            .then(resData => this.handleAddCategoryElementResult(resData));
                        }}
                >
                    Add Attribute
                </Button>
            </Form>
            <p>
                <br/> *This field is optional. It will default
                <br/> to 11:59PM if not filled out properly.
            </p>
            </div>
        );
    }
}