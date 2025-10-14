
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';


import 'bootstrap/dist/css/bootstrap.min.css';

import './assets/css/custom.css';
import './index.css';


import { getItem } from './state/storage';
import { seedDatabase } from './state/seed';


const initializeApp = () => {

  const users = getItem('users');

  if (!users || users.length === 0) {
 
    seedDatabase(); 
  }
};


initializeApp();


ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>
  
    <App />
  </React.StrictMode>,
);
