import React from 'react';
import {Header} from 'semantic-ui-react';
import './homePage.css';


export const HomePage = _ => {
    return (
        <div className='home-page'>
            <div>
            <Header size='huge'>
                Welcome to the Academic Calendar!
            </Header>
            <p>
                Once you're logged in, enter your course information (assignments, exams, weights, etc.) 
                and you'll be able to see a beautiful visualization of where you roughly stand in your course!
                The visualization requires that you enter the rough mean and standard deviation of your course,
                and it'll calculate your grade after a typical course curve has been applied.
            </p>
            </div>
        </div>
    );
}
