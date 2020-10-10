import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';
import history from './../../history';
import './navbar.css';

export class NavBar extends Component {
    handleLogout(event) {
        event.preventDefault();
        this.props.logoutUser();
        history.push('/');
    }

    getOptions() {
        if (!this.props.loggedIn) {
            return (
                <ul>
                    <li><NavLink to='/login'>Login</NavLink></li>
                </ul>
            );
        } else {
            return (
                <ul>
                    <li><NavLink to='/profile'>Profile</NavLink></li>
                    <li><NavLink to='/courses'>Courses</NavLink></li>
                    <li><a href='/' onClick={e => this.handleLogout(e)}>Logout</a></li>
                </ul>
            );
        }
    }

    render() {
        return (
            <header className='navbar'>
                <h1 className='navbar__icon'>
                    <NavLink to='/'><span role='img' aria-label="Calendar">📅</span></NavLink>
                </h1>
                <nav className='navbar__items'>
                    {this.getOptions()}
                </nav>
            </header>
        );
    }
}