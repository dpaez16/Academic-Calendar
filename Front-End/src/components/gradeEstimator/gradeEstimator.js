import React, {Component} from 'react';
import {Message} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import {getGradeEstimatorDisplayProps, makeData, normalPDF} from '../misc/helpers';
import * as d3 from 'd3';
import './gradeEstimator.css';
import { tickStep } from 'd3';


const mu = 0;
const sd = 1.0;
const v = [mu-3*sd, mu-1*sd, mu-0.5*sd, mu, mu+0.5*sd, mu+1*sd, mu+3*sd];

function getPoints() {
    const a = v[0];
    const b = v[6];
    const n = 100;
    return makeData(a, b, n, mu, sd);
}

export class GradeEstimator extends Component {
    constructor(props) {
        super(props);

        const {points, yMax} = getPoints();
        const displayProps = getGradeEstimatorDisplayProps();
        this.state = {...{
            error: "",
            grade: 0,
            points: points,
            yMax: yMax
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
            this.getScales();
            this.getAxes();
            this.addLine();
            this.addAreas();
            this.addGradeLine();
            this.addTitle();
            this.addLegend();
        });
    }

    getScales() {
        const {yMax, fullWidth, height} = this.state;
        const a = v[0];
        const b = v[6];
        
        this.xScale = d3.scaleLinear().domain([a, b]).range([0, fullWidth]);
        this.yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0]);
    }

    getAxes() {
        let xAxisFunction = d3.axisBottom()
            .scale(this.xScale)
            .tickSize(5)
            .tickValues(v)
            .tickFormat(d3.format(".3f"));

        let yAxisFunction = d3.axisLeft()
            .scale(this.yScale)
            .tickSizeInner(5)
            .tickSizeOuter(10);

        d3.select(this.xAxis)
            .call(xAxisFunction);

        d3.select(this.yAxis)
            .call(yAxisFunction);
    }

    addLine() {
        const {points} = this.state;
        const line = d3.line()
			.x((d) => this.xScale(d.x))
            .y((d) => this.yScale(d.y));
        
        d3.select(this.chartArea)
            .append("path")
			.datum(points)
			.attr("fill", "none")
			.attr("stroke", "black")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", line);
    }

    addAreas() {
        const {height} = this.state;
        const idxs = [[0, 1], [1, 2], [2, 4], [4, 5], [5, 6]];
        const colors = ["#990000", "#ff00ff", "#f28000", "#0080ff", "#0dc000", "red"]
        const n = 100;

        for (let k = 0; k < 5; k++) {
			const area = d3.area()
				.x((d) => this.xScale(d.x))
				.y0(height)
                .y1((d) => this.yScale(d.y));
            
            d3.select(this.chartArea).append("path")
				.data([makeData(v[idxs[k][0]], v[idxs[k][1]], n, mu, sd).points])
				.attr("class", "area")
				.attr("d", area)
				.attr('fill', colors[k]);
		}
    }

    addGradeLine() {
        const {height, grade} = this.state;
        const z = (grade - mu) / sd;
        const color = "red";

        const area = d3.area()
			.x((d) => this.xScale(d.x))
			.y0(height)
            .y1((d) => this.yScale(d.y));
        
        const points = [
            {x: z - 0.01, y: normalPDF(z - 0.01, mu, sd)}, 
            {x: z + 0.02, y: normalPDF(z + 0.02, mu, sd)}
        ];
        
		d3.select(this.chartArea).append("path")
			.data([points])
			.attr("class", "area")
			.attr("d", area)
			.attr('fill', color);
    }

    addTitle() {
        const {width, margin} = this.state;

        d3.select(this.chartArea).append("text")
			.attr("x", (width / 2))
			.attr("y", 0 - 0.35 * margin.top)
			.attr("text-anchor", "middle")
			.style("font-size", "16px")
			.style("text-decoration", "underline")
			.text("Standard Normal Curve");
    }

    addLegend() {
        const legend = d3.select(this.chartArea).append("g");
        const colors = ["#990000", "#ff00ff", "#f28000", "#0080ff", "#0dc000", "red"];
        const labels = ["F", "D", "C", "B", "A", "You"];
        const {margin} = this.state;

        legend.selectAll('rect')
            .data(labels)
            .enter().append("rect")
                .attr("x", margin.left)
                .attr("y", (_, i) => i * 20)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", (_, i) => colors[i]);

		legend.selectAll('text')
			.data(labels)
			.enter().append('text')
				.attr("x", margin.left + 15)
				.attr("y", (_, i) => i * 20 + 10)
				.text((d, _) => `: ${d}`);
    }

    render() {
        const {
            error, 
            grade,
            fullWidth,
            fullHeight,
            height,
            margin
        } = this.state;

        return (
            <div className="grade-visualization">
                <svg    className="chart" 
                        width={fullWidth} 
                        height={fullHeight}
                        hidden={error}
                >
                    <g ref={(node) => { this.chartArea = node; }}
                        transform={`translate(${margin.left}, ${margin.top})`} />

                    {/* Axes */}
                    <g ref={(node) => { this.xAxis = node; }}
                        transform={`translate(0, ${height})`}></g>
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