getSums = function(categories) {
    let scores = [];
    let totals = [];
    let weights = [];

    for (const category of categories) {
        const {elements, weight} = category;
        let totalCategoryScore = 0;
        let totalCategoryTotal = 0;

        for (const categoryElement of elements) {
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

        grade += weights[idx] * scores[idx] / totals[idx];
    }

    return grade;
}

module.exports = {
    calculateGrade: function(req, res) {
        const data = req.body;
        const {categories, weighted} = data;

        if (!categories || categories.length === 0) {
            return res.send({error: "No populated categories."});
        }

        const {scores, totals, weights} = getSums(categories);
        if (weighted && weights.sum() !== 100) {
            return res.send({error: "Category weights do not add to 100%."});
        }

        const actualWeights = weighted ? weights : null;
        const grade = getGrade(scores, totals, actualWeights);

        return res.send({grade: grade});
    }
};
