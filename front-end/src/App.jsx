import React from 'react';

const App = () => {
  const fullPageStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    margin: 0,
    backgroundColor: '#f0f2f5' // Optional: background color
  };

  return (
    <div style={fullPageStyle}>
      <h1 style={{ fontSize: '3rem', fontFamily: 'sans-serif' }}>
        My First Page
      </h1>
    </div>
  );
};

export default App;
