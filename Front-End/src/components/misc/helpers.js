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
    const weight = weighted ? `${category.weight}%` : ""
    return `${category.name}: ${weight}`
}

export const dateToStr = function(date) {
    const dateNum = Number(date);
    return new Date(dateNum).toLocaleString();
}