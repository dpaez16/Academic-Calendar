import { curveCardinal } from "d3";

export const validSubject = function(subject) {
    const validSubjectRegex = RegExp(
        /^[A-Z]{2,4}$/
    );
    return validSubjectRegex.test(subject);
}

export const validCourseNum = function(courseNum) {
    const validCourseNumRegex = RegExp(
        /^[1-9][0-9]{2}$/
    );
    return validCourseNumRegex.test(courseNum);
}

export const deleteItemFromArray = function(arr, valObj) {
    const val = valObj._id;
    const idx = arr.findIndex(obj => obj._id === val);
    arr.splice(idx, 1);
    return arr;
}

export const replaceItemFromArray = function(arr, valObj, newObj) {
    const val = valObj._id;
    const idx = arr.findIndex(obj => obj._id === val);
    arr.splice(idx, 1, newObj);
    return arr;
}

export const courseToStr = function(course) {
    const weighted = course.weighted ? "(Weighted)" : "";
    return `${course.subject}${course.courseNum} - ${course.courseName} ${weighted}`;
}

export const categoryToStr = function(category, weighted) {
    const weight = weighted ? `: ${category.weight}%` : ""
    return `${category.name}${weight}`
}

export const dateToStr = function(date) {
    const dateNum = Number(date);
    return new Date(dateNum).toLocaleString();
}

export const constructDate = function(date, time) {
    const actualTime = time ? time : "23:59";
    return new Date(`${date} ${actualTime}`);
}

export const getGradeEstimatorDisplayProps = function() {
    const fullWidth = 600;
    const fullHeight = 800;
    const margin = {
        top: 25,
        left: 20,
        right: 20,
        bottom: 25
    };

    return {
        width: fullWidth - margin.left - margin.right,
        height: fullHeight - margin.top - margin.bottom,
        margin: margin
    };
}

const normalPDF = function(x, mu = 0, sd = 1) {
	const z = 1.0 * (x - mu) / sd;
	
	return 	(1.0 / (Math.sqrt(2 * Math.PI) * sd)) * 
			Math.exp(-0.5 * Math.pow(z, 2));
}

export const makeData = function(a, b, n, mu = 0, sd = 1) {
	const dx = 1.0 * (b - a) / n;
	const data = [...Array(n + 1).keys()].map(i => {
		const x = a + i * dx;
		return {
			x: x, 
			y: normalPDF(x, mu, sd)
		}
	});

	let yMax = data.reduce((prev, curr) => {
		return prev.y < curr.y ? curr.y : prev.y;
	});
	yMax = Math.round(yMax * 100) / 100

	return { 
		data: data, 
		yMax: yMax
	};
}

/*
const pcGrade = function(grade) {
	let m = document.getElementById("mean").value;
	let s = document.getElementById("sd").value;
	if (s > 0 && m >= 0 && m <= 100) {
		var z = (grade - m) / s;
		if (z < -1) {
			document.getElementById("pcGrade").innerText = "F";
			document.getElementById("pcGrade").style.color = "#990000";
			document.getElementById("pcGradeSep").innerText = "";
			document.getElementById("pcGrade2").innerText = "";
		} else if (z == -1) {
			document.getElementById("pcGrade").innerText = "F";
			document.getElementById("pcGrade").style.color = "#990000";
			document.getElementById("pcGradeSep").innerText = "/";
			document.getElementById("pcGrade2").innerText = "D-";
			document.getElementById("pcGrade2").style.color = "#ff00ff";
		} else if (z < -0.5) {
			document.getElementById("pcGrade").innerText = "D";
			document.getElementById("pcGrade").style.color = "#ff00ff";
			document.getElementById("pcGradeSep").innerText = "";
			document.getElementById("pcGrade2").innerText = "";
		} else if (z == -0.5) {
			document.getElementById("pcGrade").innerText = "D+";
			document.getElementById("pcGrade").style.color = "#ff00ff";
			document.getElementById("pcGradeSep").innerText = "/";
			document.getElementById("pcGrade2").innerText = "C-";
			document.getElementById("pcGrade2").style.color = "#f28000";
		} else if (z < 0.5) {
			document.getElementById("pcGrade").innerText = "C";
			document.getElementById("pcGrade").style.color = "#f28000";
			document.getElementById("pcGradeSep").innerText = "";
			document.getElementById("pcGrade2").innerText = "";
		} else if (z == 0.5) {
			document.getElementById("pcGrade").innerText = "C-";
			document.getElementById("pcGrade").style.color = "#f28000";
			document.getElementById("pcGradeSep").innerText = "/";
			document.getElementById("pcGrade2").innerText = "B-";
			document.getElementById("pcGrade2").style.color = "#0080ff";
		} else if (z < 1) {
			document.getElementById("pcGrade").innerText = "B";
			document.getElementById("pcGrade").style.color = "#0080ff";
			document.getElementById("pcGradeSep").innerText = "";
			document.getElementById("pcGrade2").innerText = "";
		} else if (z == 1) {
			document.getElementById("pcGrade").innerText = "B+";
			document.getElementById("pcGrade").style.color = "#0080ff";
			document.getElementById("pcGradeSep").innerText = "/";
			document.getElementById("pcGrade2").innerText = "A-";
			document.getElementById("pcGrade2").style.color = "#0dc000";
		} else {
			document.getElementById("pcGrade").innerText = "A";
			document.getElementById("pcGrade").style.color = "#0dc000";
			document.getElementById("pcGradeSep").innerText = "";
			document.getElementById("pcGrade2").innerText = "";
		}
		document.getElementById("viz").innerText = "";
		document.getElementById("viz").innerHTML = "";
		// prepare data
		const mu = 0;
		const sd = 1;

		var v = [mu-3*sd, mu-1*sd, mu-0.5*sd, mu, mu+0.5*sd, mu+1*sd, mu+3*sd];
		var idxs = [[0, 1], [1, 2], [2, 4], [4, 5], [5, 6]];

		const a = v[0];
		const b = v[6];
		const n = 100;
		var myData = makeData(a, b, n, mu, sd);
		var colors = ["#990000", "#ff00ff", "#f28000", "#0080ff", "#0dc000", "red"]
		var labels = ["F", "D", "C", "B", "A", "You"];

		// configure svg display margins
		const fullWidth = 600;
		const fullHeight = 250;
		const margin = {
			top: 25,
			right: 20, // 15 by default
			left: 20, // 50 with y-axis
			bottom: 25
		};
		const width = fullWidth - margin.left - margin.right;
		const height = fullHeight - margin.top - margin.bottom;

		// create svg canvas 
		var myViz = d3.select("#viz").append('svg')
			.attr('width', fullWidth)
			.attr('height', fullHeight)
			.style('border', 'solid')
			.append('g')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		// create x-axis
		xScale = d3.scaleLinear()
			.domain([a, b])
			.range([0, width]);
		xMap = function(d) { return xScale(d.x); }
		xAxis = d3.axisBottom(xScale)
			.tickSize(5)
			.tickValues(v)
			.tickFormat(d3.format(".3f"));
		myViz.append('g')
			.attr('transform', 'translate(0,' + height + ')')
			.classed('x axis', true)
			.call(xAxis);

		// create y-axis
		yScale = d3.scaleLinear()
			.domain([0, myData.yMax])
			.range([height, 0]);
		yMap = function(d) { return yScale(d.y); }
		yAxis = d3.axisLeft(yScale)
			.tickSizeInner(5)
			.tickSizeOuter(10);
		//myViz.append('g')
		//	.classed('y axis', true)
		//	.call(yAxis); 
		

		// add black continuous line
		var line = d3.line()
			.x(xMap)
			.y(yMap);
		myViz.append("path")
			.datum(myData.data)
			.attr("fill", "none")
			.attr("stroke", "black")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", line);

		// add F, D, C, B, A grade zones
		for (k = 0; k < 5; k++) {
			// add area under line
			area = d3.area()
				.x(xMap)
				.y0(height)
				.y1(yMap);
			myViz.append("path")
				.data([makeData(v[idxs[k][0]], v[idxs[k][1]], n, mu, sd).data])
				.attr("class", "area")
				.attr("d", area)
				.attr('fill', colors[k]);
		}

		// add grade line
		area = d3.area()
			.x(xMap)
			.y0(height)
			.y1(yMap);
		myViz.append("path")
			.data([[{x: z - 0.01, y: f(z - 0.01, mu, sd)}, {x: z + 0.02, y: f(z + 0.02, mu, sd)}]])
			.attr("class", "area")
			.attr("d", area)
			.attr('fill', colors[5]);

		// add title to plot
		myViz.append("text")
			.attr("x", (width / 2))
			.attr("y", 0 - 0.35*margin.top)
			.attr("text-anchor", "middle")
			.style("font-size", "16px")
			.style("text-decoration", "underline")
			.text("Standard Normal Curve");

		// add legend
		var legend = myViz.append("g")

		legend.selectAll('rect')
			  .data(labels)
			  .enter().append("rect")
				.attr("x", margin.left)
				.attr("y", function(d, i){ return i*20;})
				.attr("width", 10)
				.attr("height", 10)
				.style("fill", function(d, i) { return colors[i]; });

		legend.selectAll('text')
			.data(labels)
			.enter().append('text')
				.attr("x", margin.left + 15)
				.attr("y", function(d, i){ return i*20 + 10;})
				.text(function(d, i) { return ": " + d; })
	} else {
		errMsg = "";
		if (((m < 0) || (m > 100)) && (s <= 0)) {
			if (m < 0)
				errMsg += "Mean must be positive and Standard Deviation must be larger than zero!";
			else
				errMsg += "Mean is too large and Standard Deviation must be larger than zero!";
		} else if (((m < 0) || (m > 100)) && (s > 0)) {
			if (m < 0)
				errMsg += "Mean must be positive!";
			else
				errMsg += "Mean is too large!";
		} else {
			errMsg = "Standard Deviation must be larger than zero!";
		}
		document.getElementById("viz").innerHTML = errMsg;
		document.getElementById("pcGrade").innerHTML = "";
		document.getElementById("pcGradeSep").innerHTML = "";
		document.getElementById("pcGrade2").innerHTML = "";
		document.getElementById("pcGrade").style.color = "black";
		document.getElementById("pcGrade2").style.color = "black";
	}
}
*/