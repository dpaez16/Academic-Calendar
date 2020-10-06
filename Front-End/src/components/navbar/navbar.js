import React from 'react';
import {NavLink} from 'react-router-dom';
import './navbar.css';

export const NavBar = _ => {
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