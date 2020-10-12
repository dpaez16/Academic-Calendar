import React, {Component} from 'react';
import {Form, Input, Button, Message, Header} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import {constructDate} from '../misc/helpers';
import './editCategoryElement.css';

export class EditCategoryElement extends Component {
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
        const {name, score, total, dueDate, time} = this.state;
        const {categoryID, categoryElementID} = this.state;
        const actualDueDate = constructDate(dueDate, time);

        const requestBody = {
            query: `
            mutation {
                editCategoryElement(categoryElementInput: {
                    name: "${name}",
                    score: ${score},
                    total: ${total},
                    dueDate: "${actualDueDate}",
                    categoryID: "${categoryID}"
                }, categoryElementID: "${categoryElementID}") {
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

    async attemptEditCategoryElement() {
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
                throw new Error("Edit category element failed! (bad status code)");
            }
            const resData = await res.json();
            return resData;
        } catch (error) {
            console.log(error);
        }
    }

    handleEditCategoryElementResult(resData) {
        this.setState({
            name: "",
            score: "",
            total: "",
            dueDate: "",
            time: ""
        });

        if (resData && resData.errors) {
            this.setState({error: resData.errors[0].message});
            return;
        }
        
        history.goBack();
    }

    render() {
        return (
            <div>
            <Header size='huge'>
                Edit Attribute
            </Header>
            <b>{this.state.categoryElementName}</b>
            <Form   className='edit-category-element-form'
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
                            this.attemptEditCategoryElement()
                            .then(resData => this.handleEditCategoryElementResult(resData));
                        }}
                >
                    Save Changes
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