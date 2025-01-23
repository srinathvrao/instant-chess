'use client'

import { id, i, init, InstaQLEntity } from "@instantdb/react";
import { useState } from 'react';
import { Chess } from 'chess.js';
import Cookies from 'js-cookie';

// ID for app: instant-chess
const APP_ID = 'INSTANTDB-APP-ID'

// Optional: Declare your schema for intellisense!
const schema = i.schema({
  entities: {
    game: i.entity({
      w: i.string(),
      b: i.string(),
      turn: i.string(),
      fen: i.string(),
      state: i.string(),
      winner: i.string(),
    }),
  },
});

type Todo = InstaQLEntity<typeof schema, "game">;
const db = init({ appId: APP_ID, schema });

function App() { 
  if(!Cookies.get('uData'))
    Cookies.set('uData', JSON.stringify({"id": id()}), { expires: 3 });
  let winCount = 0;
  let loseCount = 0;
  if(Cookies.get('game') && typeof window !== 'undefined')
    window.location.href += "/play";

  if(Cookies.get('uData')){
    let udata = JSON.parse(Cookies.get("uData"));
    let uID = udata["id"];
    let query = { game: { 
                    $: { 
                      where: {
                        w:  uID,
                        state: "end"
                      }
                      }}}
    const { isLoading, error, data }  = db.useQuery(query);
    if (data) {
      let endData = data.game;
      let endLen = endData.length;
      for (let index = 0; index < endLen; index++) {
        const element = endData[index];
        if(element[element["winner"]] == uID) winCount++;
        else loseCount++;
      }
    }
  }
  
  const [isHovered, setIsHovered] = useState(false);
  const [buttonText, setButtonText] = useState("Do it. (EXTREME!)");
  return (
    <div style={styles.container}>
    <div style={styles.board}>
      <h2>Feel like challenging stockfish today?</h2>
        <br></br>
        <a
          href="play"
          style={isHovered ? { ...styles.button, ...styles.hover } : styles.button}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => { setButtonText("You've been warned."); sendToPlay()}}
        >
          {buttonText}
        </a>
        <br></br>
         <h3>
        
          Your stats:
          <br></br>
          <br></br>
          Ws: {winCount}
          <br></br>
          Ls: {loseCount}
         </h3>
  </div>
    {/* {loseCount>0 ? <div style={styles.meme}> MEME <br/> </div> : ""} */}

  </div>
  );
}

function sendToPlay(){
  let udata = JSON.parse(Cookies.get("uData"));
  let userID = udata["id"];
  let gameID = id();
  Cookies.set('game', JSON.stringify({"id": gameID, "uid": userID}), { expires: 1 });
  db.transact(db.tx.game[gameID].update({
                                w: userID,
                                b: "STOCKFISH",
                                turn: "w",
                                fen: (new Chess()).fen(),
                                state: "inprogress",
                                winner: "",
                              }))
  if (typeof window !== 'undefined') window.location.href += "/play";
}

// Styles
// ----------
const styles: Record<string, React.CSSProperties> = {
    meme: {
      boxSizing: 'inherit',
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      textAlign: 'center',
      border: '1px solid gray',
      alignItems: 'center',
      width: 'min(90vw, 70vh)',
      marginTop: '20px',
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
