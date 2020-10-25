import React, {Component} from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import {NavBar} from './components/navbar/navbar';
import {HomePage} from './components/home/homePage';
import {Login} from './components/login/login';
import {Register} from './components/register/register';
import {Profile} from './components/profile/profile';
import {Courses} from './components/courses/courses';
import {CourseDetails} from './components/courseDetails/courseDetails';
import {AddCourse} from './components/addCourse/addCourse';
import {EditCourse} from './components/editCourse/editCourse';
import {AddCategory} from './components/addCategory/addCategory';
import {EditCategory} from './components/editCategory/editCategory';
import {AddCategoryElement} from './components/addCategoryElement/addCategoryElement';
import {EditCategoryElement} from './components/editCategoryElement/editCategoryElement';
import { replaceItemFromArray } from './components/misc/helpers';
import history from './history';
import './App.css';


export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userInfo: null
        };
    }

    render() {
        return (
            <Router history={history}>
                <React.Fragment>
                    <NavBar 
                        loggedIn={this.state.userInfo}
                        logoutUser={_ => this.setState({userInfo: null})}
                    />
                    <div className='main-content'>
                        <Switch>
                            <Route  exact
                                    path='/' 
                                    component={HomePage} 
                            />
                            <Route  exact
                                    path='/login'
                                    render={(props) => 
                                        <Login    
                                            updateUserInfo={newUserInfo => this.setState({userInfo: newUserInfo})}
                                            { ...props }
                                        />
                                    }
                            />
                            <Route  exact
                                    path='/register'
                                    render={(props) => 
                                        <Register
                                            updateUserInfo={newUserInfo => this.setState({userInfo: newUserInfo})}
                                            { ...props }
                                        />
                                    }
                            />
                            <Route  exact
                                    path='/courses'
                                    render={(props) => 
                                        <Courses
                                            courses={this.state.userInfo.courses}
                                            deleteCourse={newCourses => {
                                                const newUserInfo = {...this.state.userInfo, ...{courses: newCourses}};
                                                this.setState({userInfo: newUserInfo});
                                            }}
                                            { ...props }
                                        />
                                    }
                            />
                            <Route  exact
                                    path='/addCourse'
                                    render={(props) =>
                                        <AddCourse
                                            userID={this.state.userInfo._id}
                                            addCourse={newCourse => {
                                                const {courses} = this.state.userInfo;
                                                const newCourses = [...courses, newCourse];
                                                const newUserInfo = {...this.state.userInfo, ...{courses: newCourses}};
                                                this.setState({userInfo: newUserInfo});
                                            }}
                                            { ...props }
                                        />
                                    }
                            />
                            <Route  exact
                                    path='/editCourse'
                                    render={(props) =>
                                        <EditCourse
                                            userID={this.state.userInfo._id}
                                            replaceCourse={(oldCourse, newCourse) => {
                                                const {courses} = this.state.userInfo;
                                                const newCourses = replaceItemFromArray(courses, oldCourse, newCourse);
                                                const newUserInfo = {...this.state.userInfo, ...{courses: newCourses}};
                                                this.setState({userInfo: newUserInfo});
                                            }}
                                            { ...props }
                                        />
                                    }
                            />
                            <Route  exact
                                    path='/profile'
                                    render={(props) => 
                                        <Profile 
                                            userInfo={this.state.userInfo}
                                            { ...props }
                                        />
                                    }
                            />
                            <Route  exact
                                    path='/courseDetails'
                                    component={CourseDetails}
                            
                            />
                            <Route  exact
                                    path='/addCategoryElement'
                                    component={AddCategoryElement}
                            />
                            <Route  exact
                                    path='/editCategoryElement'
                                    component={EditCategoryElement}
                            />
                            <Route  exact
                                    path='/addCategory'
                                    component={AddCategory}
                            />
                            <Route  exact
                                    path='/editCategory'
                                    component={EditCategory}
                            />
                        </Switch>
                    </div>
                </React.Fragment>
            </Router>
        );
    }
};
