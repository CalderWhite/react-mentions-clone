import React from 'react';
import ReactDOM from 'react-dom/client';
import MyTextbox from './MyTextbox';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <>
      <p>Hi</p>
      <MyTextbox />
    </>
  </React.StrictMode>
);
