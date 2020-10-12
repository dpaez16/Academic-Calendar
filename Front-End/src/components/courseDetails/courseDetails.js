import React, {Component} from 'react';
import {Header, Table} from 'semantic-ui-react';
import {Dimmer, Loader, Segment, Button} from 'semantic-ui-react';
import {courseToStr, categoryToStr, dateToStr} from '../misc/helpers';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './courseDetails.css';

export class CourseDetails extends Component {
    constructor(props) {
        super(props);

        this.state = {...this.props.location.state, ...{loading: true}};
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

        return (
            <div>
                <Header size='huge'>
                    {courseToStr(course)}
                </Header>
                {categories.map((category, categoryIdx) => {
                    return (
                        <div key={categoryIdx}>
                            <b>{categoryToStr(category, weighted)} - {category._id}</b>
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
                                                <Button color='grey'>
                                                    Edit
                                                </Button>
                                                <Button negative>
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
                                                                courseName: courseToStr(course),
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
            </div>
        );
    }
}