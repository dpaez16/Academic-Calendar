import matplotlib.pyplot as plt, mpld3
import numpy as np

def f(x, m, s):
    return (1 / (np.sqrt(2 * np.pi) * s)) * np.exp(-1 * (np.power(x-m, 2)/(2*np.power(s,2))));

if __name__ == '__main__':
    """
    x = np.linspace(-3, 3, num=100)
    m = 70
    s = 10
    grade = 70
    z = 1.0 * (grade - m) / s

    fig = plt.figure()
    plt.plot(x, f(x, 0, 1), color='black')
    plt.plot(np.array([z for i in range(100)]), np.linspace(0, f(z, 0, 1), num=100), color='blue')
    xF = np.linspace(-3, -1, num=100)
    xD = np.linspace(-1, -0.5, num=100)
    xC = np.linspace(-0.5, 0.5, num=100)
    xB = np.linspace(0.5, 1, num=100)
    xA = np.linspace(1, 3, num=100)
    plt.fill_between(xF, f(xF, 0, 1), color='red')
    plt.fill_between(xD, f(xD, 0, 1), color='pink')
    plt.fill_between(xC, f(xC, 0, 1), color='yellow')
    plt.fill_between(xB, f(xB, 0, 1), color='lawngreen')
    plt.fill_between(xA, f(xA, 0, 1), color='darkgreen')
    plt.xticks([-3, -1, -0.5, 0, 0.5, 1, 3])
    plt.yticks([])
    plt.rcParams["figure.figsize"] = [12, 9]
    plt.title("Standard Normal Curve")

    """
    fig = plt.figure()
    plt.scatter([1, 10], [5, 9])
    mpld3.show()