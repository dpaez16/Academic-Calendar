import React, {Component} from 'react';
import {Message, Form, Input, Button} from 'semantic-ui-react';
import {PROXY_URL} from '../misc/proxyURL';
import {getGradeEstimatorDisplayProps, makeData, normalPDF} from '../misc/helpers';
import * as d3 from 'd3';
import './gradeEstimator.css';


const TICK_VALUES = [-3, -1, -0.5, 0, 0.5, 1, 3];
const COLORS = ["#990000", "#ff00ff", "#f28000", "#0080ff", "#0dc000", "red"];
const LABELS = ["F", "D", "C", "B", "A", "You"];


export class GradeEstimator extends Component {
    constructor(props) {
        super(props);

        const a = TICK_VALUES[0];
        const b = TICK_VALUES[6];
        const {points, yMax} = makeData(a, b);
        const displayProps = getGradeEstimatorDisplayProps();
        this.state = {...{
            error: "",
            grade: 0,
            mu: "80",
            sd: "2.0",
            points: points,
            yMax: yMax,
            letterObjs: []
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
            this.update();
        });
    }

    validInput() {
        let {mu, sd} = this.state;
        mu = parseFloat(mu);
        sd = parseFloat(sd);

        return (
            !isNaN(mu) && 0 <= mu && mu <= 100 &&
            !isNaN(sd) && sd > 0
        );
    }

    update() {
        this.getScales();
        this.getAxes();
        this.addLine();
        this.addAreas();
        this.addGradeLine();
        this.addTitle();
        this.addLegend();

        const {mu, sd, grade} = this.state;
        const letterObjs = getPostCurveGrade(grade, mu, sd);
        this.setState({letterObjs: letterObjs});
    }

    getScales() {
        const {yMax, width, height} = this.state;
        const xMin = TICK_VALUES[0];
        const xMax = TICK_VALUES[6];
        
        this.xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
        this.yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0]);

        this.xMap = (d) => this.xScale(d.x);
        this.yMap = (d) => this.yScale(d.y);
    }

    getAxes() {
        let xAxisFunction = d3.axisBottom()
            .scale(this.xScale)
            .tickSize(5)
            .tickValues(TICK_VALUES)
            .tickFormat(d3.format(".3f"));

        d3.select(this.xAxis)
            .call(xAxisFunction);
    }

    addLine() {
        const {points} = this.state;
        const line = d3.line()
			.x(this.xMap)
            .y(this.yMap);

        const blackLine = d3.select(this.chartArea).selectAll('.black-line').data([0]);
        blackLine.enter().append("path")
            .merge(blackLine)
            .datum(points)
            .attr('class', 'black-line')
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
        
        idxs.map(([i, j], colorIdx) => {
			const area = d3.area()
				.x(this.xMap)
				.y0(height)
                .y1(this.yMap);
            
            const a = TICK_VALUES[i];
            const b = TICK_VALUES[j];
            const {points} = makeData(a, b);

            const gradeColor = COLORS[colorIdx];
            const gradeLetterArea = d3.select(this.chartArea).selectAll(`.grade-letter-area-${colorIdx}`).data([points]);
            gradeLetterArea.enter().append('path')
				.merge(gradeLetterArea)
				.attr("class", `area grade-letter-area-${colorIdx}`)
				.attr("d", area)
				.attr('fill', gradeColor);
		});
    }

    addGradeLine() {
        const {height, grade} = this.state;
        let {mu, sd} = this.state;
        mu = parseFloat(mu);
        sd = parseFloat(sd);
        
        const z = (grade - mu) / sd;
        const color = COLORS[COLORS.length - 1];

        const area = d3.area()
			.x(this.xMap)
			.y0(height)
            .y1(this.yMap);
        
        const points = [
            {x: z - 0.01, y: normalPDF(z - 0.01)}, 
            {x: z + 0.02, y: normalPDF(z + 0.02)}
        ];
        
        const gradeLine = d3.select(this.chartArea).selectAll('.grade-line').data([points]);
        gradeLine.enter().append('path')
            .merge(gradeLine)
            .attr("class", "area grade-line")
            .transition().duration(500)
			.attr("d", area)
            .attr('fill', color);
    }

    addTitle() {
        const {width, margin} = this.state;
        const chartTitle = d3.select(this.chartArea).selectAll('.chart-title').data([0]);

        chartTitle.enter().append("text")
            .merge(chartTitle)
            .attr("class", "chart-title")
            .attr("x", (width / 2))
            .attr("y", 0 - 0.35 * margin.top)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text("Standard Normal Curve");
    }

    addLegend() {
        const {margin} = this.state;

        let legend = d3.select(this.chartArea).selectAll('.legend').data([0]);
        legend = legend.enter().append("g")
            .merge(legend)
            .attr("class", "legend");
        
        legend.selectAll('rect')
            .data(LABELS)
            .enter().append("rect")
                .attr("x", margin.left)
                .attr("y", (_, i) => i * 20)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", (_, i) => COLORS[i]);
        
        legend.selectAll('text')
            .data(LABELS)
            .enter().append('text')
                .attr("class", "legend-text")
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
            margin,
            letterObjs
        } = this.state;

        return (
            <div className="grade-visualization">
                <Form   className='grade-params-form'
                        hidden={error}
                >
                <Form.Field>
                        <label>Mean</label>
                        <Input  value={this.state.mu}
                                onChange={e => this.setState({mu: e.target.value})}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Standard Deviation</label>
                        <Input  value={this.state.sd}
                                onChange={e => this.setState({sd: e.target.value})}
                        />
                    </Form.Field>
                    <Button type='submit'
                        disabled={!this.validInput()}
                        onClick={e => {
                            e.preventDefault();
                            this.update();
                        }}
                    >
                        Estimate Post-Curve Grade
                    </Button>
                </Form>
                <div    className='grade-visualization__container'
                        hidden={error}
                >
                <table>
                    <tr>
                        <td><strong>Pre-Curve Grade:</strong></td>
                        <td>
                            <strong>
                                {grade}
                            </strong>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Post-Curve Grade:</strong></td>
                        <td>
                            {letterObjs.map((letterObj, i) => {
                                const {letter, color} = letterObj;
                                return (
                                    <span   key={i}
                                            style={{color: color}}
                                    >
                                        {letter}
                                    </span>
                                );
                            })}
                        </td>
                    </tr>
                </table>
                <svg    className="chart" 
                        width={fullWidth} 
                        height={fullHeight}
                        hidden={error}
                >
                    <g  ref={(node) => { this.chartArea = node; }}
                        transform={`translate(${margin.left}, ${margin.top})`} 
                    />

                    <g  ref={(node) => { this.xAxis = node; }}
                        transform={`translate(${margin.left}, ${fullHeight - margin.bottom})`}
                    />
                </svg>
                </div>
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


function getLetterGrade(z) {
    if (z < -1) return "F";
    else if (z === -1) return "F/D-";
    else if (z < -0.5) return "D";
    else if (z === -0.5) return "D+/C-";
    else if (z < 0.5) return "C";
    else if (z === 0.5) return "C+/B-";
    else if (z < 1) return "B";
    else if (z === 1) return "B+/A-";
    else return "A";
}

function getPostCurveGrade(grade, mu, sd) {
    mu = parseFloat(mu);
    sd = parseFloat(sd);
    const z = (grade - mu) / sd;
    let gradeMap = {};

    LABELS.map((grade, i) => {
        if (i === LABELS.length - 1) return;
        gradeMap[grade] = COLORS[i];
    });

    const letterGrade = getLetterGrade(z);
    const letters = letterGrade.split('/');
    let letterObjs = getLetterObjs(letters, gradeMap);

    return letterObjs;
}

function getLetterObjs(letters, gradeMap) {
    let letterObjs = letters.map(letter => {
        return {
            letter: letter,
            color: gradeMap[letter[0]]
        };
    });

    if (letterObjs.length === 1) {
        const emptyLetter = {
            letter: '',
            color: "black"
        };

        letterObjs.concat([emptyLetter, emptyLetter]);
    } else {
        const letterObj = {
            letter: '/',
            color: "black"
        };
        letterObjs.splice(1, 0, letterObj);
    }
    return letterObjs;
}
