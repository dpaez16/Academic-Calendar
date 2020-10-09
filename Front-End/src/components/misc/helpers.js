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