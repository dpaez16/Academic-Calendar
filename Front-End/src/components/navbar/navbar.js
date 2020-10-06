import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';
import './navbar.css';

export class NavBar extends Component {
    render() {
        return (
            <header className='navbar'>
                <h1 className='navbar__icon'>
                    <NavLink to='/'>📅</NavLink>
                </h1>
                <nav className='navbar__items'>
                    <ul>
                        <li><NavLink to='/login'>Login</NavLink></li>
                        <li><NavLink to='/login'>Login</NavLink></li>
                        <li><NavLink to='/login'>Login</NavLink></li>
                    </ul>
                </nav>
            </header>
        );
    }
}