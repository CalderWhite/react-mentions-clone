import React from 'react';
import ReactDOM from 'react-dom/client';
import MyTextbox from '../components/MyTextbox';
import Head from 'next/head'


export default function Home() {
  return (
    <>
      <Head>
        <title>React-Mentions Demo</title>
      </Head>
      <p>Use the textbox below! Type "@" to mention someone and either hit tab or enter to select your entry. You may also use the arrow keys to move between entries</p>
      <MyTextbox />
    </>
  )
}
