'use client'

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

function App() { 
  
  const [winCount, setWinCount] = useState(0);
  const [loseCount, setLoseCount] = useState(0);

  useEffect(() => {
    if (!Cookies.get('win')) {
      Cookies.set('win', 0, { expires: 30 });
      Cookies.set('loss', 0, { expires: 30 });
    } else {
      setWinCount(parseInt(Cookies.get('win')) || 0);
      setLoseCount(parseInt(Cookies.get('loss')) || 0);
    }
  }, []);


  if(Cookies.get('gameInfo') && typeof window !== 'undefined')
    window.location.href += '/play';
  
  const [isHovered, setIsHovered] = useState(false);
  const [buttonText, setButtonText] = useState("Advanced");
  const [isHovered2, setIsHovered2] = useState(false);
  const [buttonText2, setButtonText2] = useState("Intermediate");
  const [isHovered3, setIsHovered3] = useState(false);
  const [buttonText3, setButtonText3] = useState("Beginner");
  

  return (
    <div style={styles.container}>
    <div style={styles.board}>
      <h2>Are you smarter than a fifth grader?</h2>
        <br></br>
        <a
          href="play"
          style={isHovered ? { ...styles.button, ...styles.hover } : styles.button}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => { setButtonText("Good luck!"); sendToPlay(1)}}
        >
          {buttonText}
        </a>
        <br></br>
        <a
          href="play"
          style={isHovered2 ? { ...styles.button, ...styles.hover } : styles.button}
          onMouseEnter={() => setIsHovered2(true)}
          onMouseLeave={() => setIsHovered2(false)}
          onClick={() => { setButtonText2("Good luck!"); sendToPlay(2)}}
        >
          {buttonText2}
        </a>
        <br></br>
        <a
          href="play"
          style={isHovered3 ? { ...styles.button, ...styles.hover } : styles.button}
          onMouseEnter={() => setIsHovered3(true)}
          onMouseLeave={() => setIsHovered3(false)}
          onClick={() => { setButtonText3("Good luck!"); sendToPlay(3)}}
        >
          {buttonText3}
        </a>
        <br></br>
          <h3>
          <br></br>
          Wins: {winCount}
          <br></br>
          Losses: {loseCount}
          </h3>
  </div>
  </div>
  );
}

function sendToPlay(diff){
  Cookies.set('diff',diff, {expires: 1});
  if (typeof window !== 'undefined') window.location.href += "/play";
}

// Styles
// ----------
const styles: Record<string, React.CSSProperties> = {
    headerbox: {
      display: 'flex',
      boxSizing: 'inherit',
      margin: '0 auto',
      alignItems: 'center',
    },
    img: {
      height: 'min(30vw,20vh)',
      display: 'flex-start',
      flexDirection: 'row',
      boxSizing: 'inherit',
      alignSelf: 'flex-start'
    },
    board: {
      boxSizing: 'inherit',
      display: 'flex',
      justifyContent: 'center',
      textAlign: 'center',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'min(50vw, 50vh)',
      height: 'auto',
      marginBottom: '20px',
    },
    container: {
      boxSizing: 'border-box',
      backgroundColor: '#fafafa',
      fontFamily: '"Press Start 2P", monospace',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    },
   
    button: {
      textDecoration: 'none',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#fff',
      backgroundColor: '#6c63ff',
      padding: '15px 30px',
      borderRadius: '50px',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      textAlign: 'center' as const,
    },
    hover: {
      transform: 'scale(1.05)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
    },
  }
  
export default App
