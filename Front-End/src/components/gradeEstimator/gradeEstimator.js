import React, {Component} from 'react';
import {Message} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import {getGradeEstimatorDisplayProps, makeData} from '../misc/helpers';
import * as d3 from 'd3';
import './gradeEstimator.css';

export class GradeEstimator extends Component {
    constructor(props) {
        super(props);

        const displayProps = getGradeEstimatorDisplayProps();
        this.state = {...{
            error: "",
            grade: 0
        }, ...displayProps};
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

    render() {
        const {error, grade} = this.state;

        return (
            <div className="grade-visualization">
                <svg    className="chart" 
                        width={this.state.width} 
                        height={this.state.height}
                        hidden={error}
                >
                    <g ref={(node) => { this.chartArea = node; }}
                        transform={`translate(${this.state.margin.left}, ${this.state.margin.top})`} />

                    {/* Axes */}
                    <g ref={(node) => { this.xAxis = node; }}
                        transform={`translate(${this.state.margin.left}, ${this.state.height - this.state.margin.bottom})`}></g>
                    <g ref={(node) => { this.yAxis = node; }}
                        transform={`translate(${this.state.margin.left}, ${this.state.margin.top})`}></g>
                </svg>
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