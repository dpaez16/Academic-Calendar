import React from 'react';
import {Header} from 'semantic-ui-react';
import './homePage.css';


export const HomePage = _ => {
    return (
        <div className='home-page'>
            <Header size='huge'>
                Welcome to the Academic-Calendar!
            </Header>
            <p>
                (Description Here)
            </p>
        </div>
    );
}
