import numpy as np

def drop(Grades, n):
    if n > len(Grades):
        return 0
    else:
        score = sum(Grades)
        for i in range(1, n+1, 1):
            score -= np.partition(Grades, i-1)[i-1]
        return score

if __name__ == '__main__':
    grades = [1,5,3,5,7,4,2,4,6]
    print(sum(grades))
    print(drop(grades, len(grades)))