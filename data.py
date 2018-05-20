# Assuming that 0.00 <= grade <= 100.00
# and cutoffs are properly inputted
def computeGrade(cutoffs, grade):
    if grade == 0:
        return cutoffs[-1][0]
    for i in range(len(cutoffs)-1, -1, -1):
        if cutoffs[i][1] < grade:
            continue
        else:
            return cutoffs[i+1][0]
    return cutoffs[0][0]

if __name__ == '__main__':
    gradeCutoffs = [
        [ 'A+', 90.00 ],
        [ 'A', 85.00 ],
        [ 'A-', 80.00 ],
        [ 'B+', 77.00 ],
        [ 'B', 73.00 ],
        [ 'B-', 70.00 ],
        [ 'C+', 67.00 ],
        [ 'C', 63.00 ],
        [ 'C-', 60.00 ],
        ['D+', 57.00 ],
        [ 'D', 53.00 ],
        [ 'D-', 50.00 ],
        [ 'F', 0.00 ]
    ]
    grade = 0.00
    print("Grade is " + computeGrade(gradeCutoffs, grade))