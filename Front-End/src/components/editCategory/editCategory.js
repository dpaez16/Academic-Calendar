import React, {Component} from 'react';
import {Form, Input, Button, Message, Header} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import {replaceItemFromArray} from '../misc/helpers';
import history from '../../history';
import './editCategory.css';

export class EditCategory extends Component {
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
        const categoryID = this.state.oldCategory._id;
        const weight = weighted ? this.state.weight : 100;

        const requestBody = {
            query: `
            mutation {
                editCategory(categoryInput: {
                    name: "${name}",
                    weight: ${weight},
                    courseID: "${courseID}"
                }, categoryID: "${categoryID}") {
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

    async attemptEditCategory() {
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
                throw new Error("Edit category failed! (bad status code)");
            }
            const resData = await res.json();
            return resData;
        } catch (error) {
            console.log(error);
        }
    }

    handleEditCategoryResult(resData) {
        this.setState({
            name: "",
            weight: ""
        });

        if (resData && resData.errors) {
            this.setState({error: resData.errors[0].message});
            return;
        }
        
        const {oldCategory} = this.state;
        const newCategory = resData.data.editCategory;
        const oldCategories = this.state.oldState.categories;
        let newCategories = replaceItemFromArray(oldCategories, oldCategory, newCategory);
        newCategories = newCategories.map(newCategory => newCategory._id);

        history.push({
            pathname: '/courseDetails',
            state: {...this.state.oldState, ...{categories: newCategories}}
        });
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
                Edit Category
            </Header>

            {courseName}

            <Form   className='edit-category-form'
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
                            this.attemptEditCategory()
                            .then(resData => this.handleEditCategoryResult(resData));
                        }}
                >
                    Save Changes
                </Button>
            </Form>
            </div>
        );
    }
}