import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';
import './navbar.css';

export class NavBar extends Component {
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
                </ul>
            );
        }
    }

    render() {
        return (
            <header className='navbar'>
                <h1 className='navbar__icon'>
                    <NavLink to='/'>📅</NavLink>
                </h1>
                <nav className='navbar__items'>
                    {this.getOptions()}
                </nav>
            </header>
        );
    }
}