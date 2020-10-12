import React, {Component} from 'react';
import {Header, Table} from 'semantic-ui-react';
import {Dimmer, Loader, Segment, Button, Confirm} from 'semantic-ui-react';
import {courseToStr, categoryToStr, dateToStr, replaceItemFromArray, deleteItemFromArray} from '../misc/helpers';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './courseDetails.css';

export class CourseDetails extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...this.props.location.state, 
            ...{
                loading: true,
                clickDeleteCategory: false,
                clickDeleteAttribute: false,
                selectedCategory: {},
                selectedCategoryElement: {}
            }
        };
    }

    async getShallowCategories(categoryIDS) {
        const requestBody = {
            query: `
            {
                categories(categoryIDS: [${categoryIDS}]) {
                    _id
                    name
                    weight
                    elements
                    courseID
                }
            }
            `
        };

        try {
            const res = await fetch(PROXY_URL, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (res.status !== 200 && res.status !== 201) {
                throw new Error("Categories fetch failed! (bad status code)");
            }
            const resData = await res.json();
            if (resData.errors) {
                throw new Error(resData.errors[0].message);
            }

            const categories = resData.data.categories;
            return categories;
        } catch (error) {
            console.log(error);
        }
    }

    async getCategoryElements(categoryElementIDS) {
        const requestBody = {
            query: `
            {
                categoryElements(categoryElementIDS: [${categoryElementIDS}]) {
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

        try {
            const res = await fetch(PROXY_URL, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (res.status !== 200 && res.status !== 201) {
                throw new Error("Category elements fetch failed! (bad status code)");
            }
            const resData = await res.json();
            if (resData.errors) {
                throw new Error(resData.errors[0].message);
            }

            const categoryElements = resData.data.categoryElements;
            return categoryElements;
        } catch (error) {
            console.log(error);
        }
    }

    async getActualCategories(shallowCategories) {
        let actualCategories = [];
        
        for (const shallowCategory of shallowCategories) {
            const categoryElementIDS = shallowCategory.elements.map(categoryElementID => `"${categoryElementID}"`);
            const categoryElements = await this.getCategoryElements(categoryElementIDS);
            const actualCategory = {...shallowCategory, ...{elements: categoryElements}};
            actualCategories.push(actualCategory);
        };

        return actualCategories;
    }

    async deleteCategoryElement(categoryElement) {
        const requestBody = {
            query: `
            mutation {
                deleteCategoryElement(categoryElementID: "${categoryElement._id}") {
                    _id
                }
            }
            `
        };

        try {
            const res = await fetch(PROXY_URL, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (res.status !== 200 && res.status !== 201) {
                throw new Error("Delete category element failed! (bad response status)");
            }
            const resData = await res.json();
            if (!resData.data.deleteCategoryElement) {
                throw new Error("Delete category element failed! failed!");
            }

            return resData;
        } catch (error) {
            console.log(error);
        }
    }

    deleteCategoryElementLocally(oldCategoryElement, oldCategory) {
        const newCategoryElements = deleteItemFromArray(oldCategory.elements, oldCategoryElement);
        const newCategory = {...oldCategory, ...{elements: newCategoryElements}};
        const newCategories = replaceItemFromArray(this.state.categories, oldCategory, newCategory);
        this.setState({categories: newCategories});
    }

    async deleteCategory(category) {
        const requestBody = {
            query: `
            mutation {
                deleteCategory(categoryID: "${category._id}") {
                    _id
                }
            }
            `
        };

        try {
            const res = await fetch(PROXY_URL, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (res.status !== 200 && res.status !== 201) {
                throw new Error("Delete category failed! (bad response status)");
            }
            const resData = await res.json();
            if (!resData.data.deleteCategory) {
                throw new Error("Delete category failed!");
            }

            return resData;
        } catch (error) {
            console.log(error);
        }
    }

    deleteCategoryLocally(oldCategory) {
        const newCategories = deleteItemFromArray(this.state.categories, oldCategory);
        this.setState({categories: newCategories});
    }

    componentDidMount() {
        const categoryIDS = this.state.categories.map(categoryID => `"${categoryID}"`);
        this.getShallowCategories(categoryIDS)
        .then(async shallowCategories => {
            const actualCategories = await this.getActualCategories(shallowCategories);
            this.setState({
                categories: actualCategories,
                loading: false
            });
        });
    }

    render() {
        if (this.state.loading) {
            return (
                <Segment className='categories-loading'>
                    <Dimmer active 
                            inverted
                    >
                        <Loader inverted 
                                content='Loading' 
                        />
                    </Dimmer>
                </Segment>
            );
        }

        const course = this.state;
        const {weighted, categories} = this.state;
        const courseName = courseToStr(course);

        return (
            <div>
                <Header size='huge'
                        className='course-details-header'
                >
                    {courseName}
                </Header>
                <Button positive
                        onClick={e => {
                            e.preventDefault();
                            history.push({
                                pathname: '/addCategory',
                                state: {
                                    weighted: weighted,
                                    courseName: courseName,
                                    courseID: course._id,
                                    oldState: this.state
                                }
                            });
                        }}
                >
                    Add Category
                </Button>
                {categories.map((category, categoryIdx) => {
                    return (
                        <div key={categoryIdx}>
                            <div className='category-title-row'>
                                <div className='category-title-row__name'>
                                    <b>{categoryToStr(category, weighted)}</b>
                                </div>
                                <div className='category-title-row__options'>
                                    <div>
                                        <Button color='grey'
                                                onClick={e => {
                                                    e.preventDefault();
                                                    history.push({
                                                        pathname: '/editCategory',
                                                        state: {
                                                            weighted: weighted,
                                                            oldCategory: category,
                                                            courseID: course._id,
                                                            oldState: this.state
                                                        }
                                                    });
                                                }}
                                        >
                                            Edit
                                        </Button>
                                        <Button negative
                                                onClick={e => {
                                                    e.preventDefault();
                                                    this.setState({
                                                        clickDeleteCategory: true,
                                                        selectedCategory: category
                                                    });
                                                }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <Table  celled
                                    className="category"
                            >
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell>Attribute</Table.HeaderCell>
                                        <Table.HeaderCell>Score</Table.HeaderCell>
                                        <Table.HeaderCell>Total</Table.HeaderCell>
                                        <Table.HeaderCell>Due Date</Table.HeaderCell>
                                        <Table.HeaderCell className='button-column-cell'></Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                            
                                <Table.Body>
                                {category.elements.map((categoryElement, categoryElementIdx) => {
                                    return (
                                        <Table.Row key={categoryElementIdx}>
                                            <Table.Cell>{categoryElement.name}</Table.Cell>
                                            <Table.Cell>{categoryElement.score}</Table.Cell>
                                            <Table.Cell>{categoryElement.total}</Table.Cell>
                                            <Table.Cell>{dateToStr(categoryElement.dueDate)}</Table.Cell>
                                            <Table.Cell className='buttons-cell'>
                                                <Button color='grey'
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            history.push({
                                                                pathname: '/editCategoryElement',
                                                                state: {
                                                                    categoryID: category._id,
                                                                    categoryElementID: categoryElement._id,
                                                                    categoryElementName: categoryElement.name
                                                                }
                                                            });
                                                        }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button negative
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            this.setState({
                                                                clickDeleteAttribute: true,
                                                                selectedCategory: category,
                                                                selectedCategoryElement: categoryElement
                                                            });
                                                        }}
                                                >
                                                    Delete
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                                    <Table.Row>
                                        <Table.Cell colSpan='6'>
                                            <Button positive
                                                    fluid
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        history.push({
                                                            pathname: '/addCategoryElement',
                                                            state: {
                                                                categoryID: category._id,
                                                                courseName: courseName,
                                                                categoryName: categoryToStr(category, weighted)
                                                            }
                                                        });
                                                    }}
                                            >
                                                Add Attribute
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>
                    );
                })}
            <Confirm    open={this.state.clickDeleteAttribute}
                        header={'Delete Course'}
                        content={`Are you sure you wish to delete ${this.state.selectedCategoryElement.name}?`}
                        onCancel={e => {
                            e.preventDefault();
                            this.setState({
                                clickDeleteAttribute: false,
                                selectedCategory: {},
                                selectedCategoryElement: {}
                            });
                        }}
                        onConfirm={e => {
                            e.preventDefault();
                            const {selectedCategoryElement, selectedCategory} = this.state;
                            this.deleteCategoryElement(selectedCategoryElement)
                            .then(resData => {
                                if (resData && resData.errors) {
                                    const error = resData.errors[0].messsage;
                                    console.log(error);
                                    return;
                                }

                                this.deleteCategoryElementLocally(selectedCategoryElement, selectedCategory);
                            });

                            this.setState({
                                clickDeleteAttribute: false,
                                selectedCategory: {},
                                selectedCategoryElement: {}
                            });
                        }}
            />
            <Confirm    open={this.state.clickDeleteCategory}
                        header={'Delete Category'}
                        content={`Are you sure you wish to delete ${categoryToStr(this.state.selectedCategory, weighted)}?`}
                        onCancel={e => {
                            e.preventDefault();
                            this.setState({
                                clickDeleteCategory: false,
                                selectedCategory: {}
                            });
                        }}
                        onConfirm={e => {
                            e.preventDefault();
                            const {selectedCategory} = this.state;
                            this.deleteCategory(selectedCategory)
                            .then(resData => {
                                if (resData && resData.errors) {
                                    const error = resData.errors[0].messsage;
                                    console.log(error);
                                    return;
                                }

                                this.deleteCategoryLocally(selectedCategory);
                            });

                            this.setState({
                                clickDeleteCategory: false,
                                selectedCategory: {}
                            });
                        }}
            />
            </div>
        );
    }
}