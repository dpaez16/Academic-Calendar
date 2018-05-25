import numpy as np

def drop(Grades, n):
    if n >= len(Grades):
        return 0
    else:
        score = sum(Grades[:,0])
        possible = sum(Grades[:,1])
        for i in range(1, n+1, 1):
            score -= np.partition(Grades, i - 1, axis=0)[i - 1][0]
            possible -= np.partition(Grades, i - 1, axis=0)[i - 1][1]
        return score, possible

if __name__ == '__main__':
    v = [[1,10], [4,10], [9,10], [0,10], [2,10]]
    v = np.array(v)
    print(v)
    print(len(v))
    print(drop(v, 2))