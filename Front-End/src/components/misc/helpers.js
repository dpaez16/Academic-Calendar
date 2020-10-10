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
    const idx = arr.findIndex(obj => obj._id == val);
    arr.splice(idx, 1);
    return arr;
}