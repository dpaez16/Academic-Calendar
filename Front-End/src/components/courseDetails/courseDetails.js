import React, {Component} from 'react';
import {Header, Table} from 'semantic-ui-react';
import {Dimmer, Loader, Segment} from 'semantic-ui-react';
import {courseToStr, categoryToStr, dateToStr} from '../misc/helpers';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './courseDetails.css';

export class CourseDetails extends Component {
    constructor(props) {
        super(props);

        this.state = {...this.props.location.state, ...{loading: true}};
    }

    async getCategories(categoryIDS) {
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

    async getActualCategories(categories) {
        let actualCategories = [];
        
        for (const category of categories) {
            const categoryElementIDS = category.elements.map(categoryElementID => `"${categoryElementID}"`);
            const categoryElements = await this.getCategoryElements(categoryElementIDS);
            const actualCategory = {...category, ...{elements: categoryElements}};
            actualCategories.push(actualCategory);
        };

        return actualCategories;
    }

    componentDidMount() {
        const categoryIDS = this.state.categories.map(categoryID => `"${categoryID}"`);
        this.getCategories(categoryIDS)
        .then(async categories => {
            const actualCategories = await this.getActualCategories(categories);
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
                            {category.elements.map((categoryElement, categoryElementIdx) => {
                                return (
                                    <div key={categoryElementIdx}>
                                        {categoryElement.name} - {categoryElement.score} / {categoryElement.total} - Due: {dateToStr(categoryElement.dueDate)}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    }
}