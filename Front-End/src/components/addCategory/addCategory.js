import React, {Component} from 'react';
import {Form, Input, Button, Message, Header} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './addCategory.css';

export class AddCategory extends Component {
    constructor(props) {
        super(props);
        
        this.state = {...{
            error: "",
            name: "",
            weight: ""
        }, ...this.props.location.state};
    }

    validInput() {
        const {name, weight, weighted} = this.state;
        
        return (
            name &&
            (!weighted || !isNaN(parseFloat(weight)))
        );
    }

    getQuery() {
        const {name, weighted, courseID} = this.state;
        const weight = weighted ? this.state.weight : 100;

        const requestBody = {
            query: `
            mutation {
                createCategory(categoryInput: {
                    name: "${name}",
                    weight: ${weight},
                    courseID: "${courseID}"
                }) {
                    _id
                    name
                    weight
                    elements
                    courseID
                }
            }
            `
        };

        return requestBody;
    }

    async attemptAddCategory() {
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
                throw new Error("Add category failed! (bad status code)");
            }
            const resData = await res.json();
            return resData;
        } catch (error) {
            console.log(error);
        }
    }

    handleAddCategoryResult(resData) {
        this.setState({
            name: "",
            weight: ""
        });

        if (resData.errors) {
            this.setState({error: resData.errors[0].message});
            return;
        }
        
        history.goBack();
    }

    getWeightField() {
        if (!this.state.weighted)
            return;
        
        return (
            <Form.Field>
                <label>Weight</label>
                <Input  value={this.state.weight}
                        onChange={e => {
                            this.setState({weight: e.target.value});
                        }}
                />
            </Form.Field>
        );
    }

    render() {
        const {courseName} = this.state;
        return (
            <div>
            <Header size='huge'>
                Add Attribute
            </Header>

            {courseName}

            <Form   className='add-category-form'
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
                {this.getWeightField()}
                <Message 
                    error
                    header='Error'
                    content={this.state.error}
                />
                <Button type='submit'
                        disabled={!this.validInput()}
                        onClick={e => {
                            e.preventDefault();
                            this.attemptAddCategory()
                            .then(resData => this.handleAddCategoryResult(resData));
                        }}
                >
                    Add Category
                </Button>
            </Form>
            </div>
        );
    }
}