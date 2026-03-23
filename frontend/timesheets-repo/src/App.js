import logo from './logo.svg';
import './App.css';
import react from 'react';
import { useEffect } from 'react';

function App() {

  useEffect(() => {
    fetch("http://localhost:8000/api/test/")
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.log("Not connected:", err))
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}



export default App;
