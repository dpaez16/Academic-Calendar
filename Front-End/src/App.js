import React, {Component} from 'react';
import { Router, Route, Switch, withRouter } from 'react-router-dom';
import {NavBar} from './components/navbar/navbar';
import {HomePage} from './components/home/homePage';
import {Login} from './components/login/login';
import {Profile} from './components/profile/profile';
import {Courses} from './components/courses/courses';
import {CourseDetails} from './components/courseDetails/courseDetails';
import {AddCourse} from './components/addCourse/addCourse';
import history from './history';
import './App.css';


export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userInfo: {
                _id: "5e729a79c4e0560ef8230c14",
                name: "Danny Paez",
                email: "dpaez16@yahoo.com",
                courses: [{_id: "5e72a4bb72395519842a7137"}]
            }
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
                                            updateUserInfo={newUserInfo => {
                                                this.setState({userInfo: newUserInfo});
                                            }}
                                            { ...props }
                                        />
                                    }
                            />
                            <Route  exact
                                    path='/courses'
                                    render={(props) => 
                                        <Courses
                                            courses={this.state.userInfo.courses}
                                        />
                                    }
                            />
                            <Route  exact
                                    path='/addCourse'
                                    render={(props) =>
                                        <AddCourse
                                            userID={this.state.userInfo._id}
                                            addCourse={newCourse => this.setState({
                                                courses: [...this.state.courses, newCourse]
                                            })}
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
            				{/*
                            <Route 
                                exact
                                path='/specialOrders' 
                                component={SpecialOrders} 
                            />
                            <Route 
                                exact
                                path='/tshirts/adult' 
                                render={(props) => 
                                    <Catalog    
                                        catalogName='T-Shirts (Adult)'
                                        catalogList={products.tshirts}
                                        catalogURL='tshirts/adult'
                                        { ...props }
                                    />
                                }
                            />
                            <Route 
                                exact
                                path='/tshirts/adult/:itemNum'
                                render={(props) => 
                                    <CatalogItemPage
                                        catalog={products.tshirts}
                                        itemType="T-Shirts (Adult)"
                                        { ...props }
                                    />
                                }
                            />
                            <Route 
                                exact
                                path='/tshirts/child' 
                                render={(props) => 
                                    <Catalog    
                                        catalogName='T-Shirts (Child)'
                                        catalogList={products.tshirts}
                                        catalogURL='tshirts/child'
                                        { ...props }
                                    />
                                }
                            />
                            <Route 
                                exact
                                path='/tshirts/child/:itemNum'
                                render={(props) => 
                                    <CatalogItemPage
                                        catalog={products.tshirts}
                                        itemType="T-Shirts (Child)"
                                        { ...props }
                                    />
                                }
                            />
                            <Route 
                                exact
                                path='/hoodies/adult' 
                                render={(props) => 
                                    <Catalog    
                                        catalogName='Hoodies (Adult)'
                                        catalogList={products.hoodies}
                                        catalogURL='hoodies/adult'
                                        { ...props }
                                    />
                                }
                            />
                            <Route 
                                exact
                                path='/hoodies/adult/:itemNum'
                                render={(props) => 
                                    <CatalogItemPage
                                        catalog={products.hoodies}
                                        itemType="Hoodies (Adult)"
                                        { ...props }
                                    />
                                }
                            />
                            <Route 
                                exact
                                path='/hoodies/child' 
                                render={(props) => 
                                    <Catalog    
                                        catalogName='Hoodies (Child)'
                                        catalogList={products.hoodies}
                                        catalogURL='hoodies/child'
                                        { ...props }
                                    />
                                }
                            />
                            <Route 
                                exact
                                path='/hoodies/child/:itemNum'
                                render={(props) => 
                                    <CatalogItemPage
                                        catalog={products.hoodies}
                                        itemType="Hoodies (Child)"
                                        { ...props }
                                    />
                                }
                            />
                            <Route 
                                exact
                                path='/sentRequest'
                                render={(props) =>
                                    <PostSendPage { ... props }/>
                                }
                            />
                            */}
                        </Switch>
                    </div>
                </React.Fragment>
            </Router>
        );
    }
};
