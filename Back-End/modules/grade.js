getSums = function(categories) {
    let scores = [];
    let totals = [];
    let weights = [];

    for (const category of categories) {
        const {categoryElements, weight} = category;
        let totalCategoryScore = 0;
        let totalCategoryTotal = 0;

        for (const categoryElement of categoryElements) {
            const {score, total} = categoryElement;
            totalCategoryScore += score;
            totalCategoryTotal += total;
        }

        scores.push(totalCategoryScore);
        totals.push(totalCategoryTotal);
        weights.push(weight);
    }

    return {
        scores: scores,
        totals: totals,
        weights: weights
    };
}

Array.prototype.sum = function() {
    return this.reduce((a, b) => a + b, 0);
}

getGrade = function(scores, totals, weights) {
    if (!weights) {
        return totals.sum() === 0 ? 0 : scores.sum() / totals.sum();
    }

    let grade = 0;
    for (let idx = 0; idx < weights.length; idx++) {
        if (totals[idx] === 0) {
            continue;
        }

        grade += weight[idx] * score[idx] / total[idx];
    }

    return grade;
}

module.exports = {
    // test with:
    // curl -XPOST -d '<data json>' -H 'content-type: application/json' <url>
    calculateGrade: function(req, res) {
        const data = req.body;
        const {categories, weighted} = data;

        if (!categories || categories.length === 0) {
            res.send({error: "No populated categories!"});
        }

        const {scores, totals, weights} = getSums(categories);
        const actualWeights = weighted ? weights : null;
        const grade = getGrade(scores, totals, actualWeights);

        res.send({grade: grade});
    }
};