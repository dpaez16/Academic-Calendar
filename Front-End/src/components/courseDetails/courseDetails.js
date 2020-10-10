import React, {Component} from 'react';
import {courseToStr, categoryToStr} from '../misc/helpers';
import {Header, Table} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import history from '../../history';
import './courseDetails.css';

export class CourseDetails extends Component {
    constructor(props) {
        super(props);

        this.state = this.props.location.state;
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

    componentDidMount() {
        const categoryIDS = this.state.categories.map(categoryID => `"${categoryID}"`);
        this.getCategories(categoryIDS)
        .then(categories => {
            this.setState({categories: categories});
        });
    }

    render() {
        const course = this.state;
        const {categories} = this.state;

        return (
            <React.Fragment>
                <Header size='huge'>
                    {courseToStr(course)}
                </Header>
                {categories.map((category, i) => {
                    return (
                        <div key={i}>
                            <strong>{categoryToStr(category)}</strong>
                            <Table>

                            </Table>
                        </div>
                    );
                })}
            </React.Fragment>
        );
    }
}