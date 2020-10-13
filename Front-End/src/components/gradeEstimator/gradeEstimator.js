import React, {Component} from 'react';
import {Message} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import './gradeEstimator.css';

export class GradeEstimator extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: "",
            grade: 0
        };
    }

    async getGrade() {
        const {categories, weighted} = this.props;
        const requestBody = {
            categories: categories,
            weighted: weighted
        };

        try {
            const res = await fetch(`${PROXY_URL}/grade`, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const resData = await res.json();
            return resData;
        } catch(error) {
            console.log(error);
        }
    }

    componentDidMount() {
        this.getGrade().then(resData => {
            const error = resData.error ? resData.error : "";
            this.setState({...resData, ...{error: error}});
        });
    }

    getGradeVisualization(grade) {
        if (grade === null) {
            return null;
        }

        return <p>{grade}</p>
    }

    render() {
        const {error} = this.state;
        const grade = error ? null : this.state.grade;

        return (
            <div className="grade-visualization">
                {this.getGradeVisualization(grade)}
                <Message 
                    error
                    hidden={!error}
                    header='Error'
                    content={`${error}`}
                />
            </div>
        )
    }
};