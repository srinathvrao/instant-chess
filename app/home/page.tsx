'use client'

import { init, tx, id } from '@instantdb/react'
import { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import Cookies from 'js-cookie';
import { googleLogout } from '@react-oauth/google';

// ID for app: instant-chess
const APP_ID = 'INSTANTDB-APP-ID'

// Optional: Declare your schema for intellisense!
type Schema = {
  users: User,
  queue: Queue,
  game: Game
}

const db = init<Schema>({ appId: APP_ID })

function App() {
  // this App() function is run every time a move is played. It is reloaded.
  
  const [userID , setUserID ] = useState("");
  const [userEmail , setUserEmail ] = useState("");
  const [isGuest , setIsGuest ] = useState(false);
  let winCount = 0;
  let drawCount = 0;
  let loseCount = 0;
  const cookieData = Cookies.get('userData');  
  let userInfo = null;
  let playersOnline = [];
  if(!cookieData && typeof window !== 'undefined')
    window.location.href = "https://instantgames.org";

  useEffect(() => {
    if(cookieData){
      let cookie = JSON.parse(cookieData);
      setUserID(cookie["id"]);
      setUserEmail(cookie["email"]);
      setIsGuest(cookie["guest"]);
    }
  }, [cookieData]);

  console.log("render");

  let {isLoading , error , data} = db.useQuery({queue: { 
                                                  $: { 
                                                    limit: 10 
                                                    }}});
  if (isLoading || error){}
  else playersOnline = data.queue;
  
  const res = db.useQuery({ game: { 
                              $: { 
                                limit: 1,
                                where: {
                                  or: [
                                    { w: userEmail },
                                    { b: userEmail }
                                  ],
                                  and: [
                                    { state: 'inprogress' }
                                  ]
                                }
                                }}});
  const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  const redirect = async(gameAvailable: Game[]) => {
    await sleep(2000);
    if(gameAvailable.length > 0 && typeof window !== 'undefined' ) window.location.href = "https://instantgames.org/play";
  };
  if (res.isLoading || res.error){}
  else {
    redirect(res.data.game);
  }

  const res2 = db.useQuery({ game: { 
    $: { 
      where: {
        or: [
          { w: userEmail },
          { b: userEmail }
        ],
        state: 'end'
      }
      }}});
  if (res2.isLoading || res2.error){}
  else {
    let endData = res2.data.game;
    let endLen = endData.length;
    for (let index = 0; index < endLen; index++) {
      const element = endData[index];
      if(element["winner"] == "")
        drawCount++;
      else{
        if(element[element["winner"]] == userEmail) winCount++;
        else loseCount++;
      }
    }
  }

  return (
    <div style={styles.container}>
    <div style={styles.board}>
        <h4>
        Hello, {userEmail.includes("Guest") ?  userEmail.split("@")[0].slice(0,11) : userEmail.split("@")[0] }! <br></br>
        Number of players in queue: {playersOnline.length}
        <br></br>
        <br></br>
        Number of wins: {winCount}
        <br></br>
        Number of losses: {loseCount}
        <br></br>
        Number of draws: {drawCount}
        <br></br>
        <br></br>
        <input value='Join Queue!' onClick={() => findOpponent(playersOnline, userEmail, userID)} type='button'></input>
        <br></br>
        <br></br>
        <input value='Sign Out' onClick={() => signOut(userID)} type='button' />
        </h4>
         <br></br>
    </div>
    <div style={ styles.info }>
    { isGuest ? "Guest sessions are deleted in 30 days, or if cookies are cleared, or if you sign out. Have fun! :)" : "" }
    </div>
    
  </div>
  );
}

// Write Data
// ---------

function signOut(userID: string){
  db.transact(tx.queue[userID].delete());
  if(!Cookies.get('userData')["guest"]){
  Cookies.remove('userData');
  db.auth.signOut();
  googleLogout();
  }
  else{
    Cookies.remove('userData');
    window.location.href = "http://localhost:3000/";
  }

  
}

function findOpponent(opponents: Queue[], userEmail: string, userID: string){
  let filtered = opponents.filter(item => item["email"] !== userEmail);
  if(filtered.length > 0){
    // opponents[0] - battle will be legendary!
    // remove opponents[0] from the queue
    db.transact(tx.queue[filtered[0]["id"]].delete())
    // create a game entry between userID and opponents[0]
    db.transact(tx.game[id()].update({
                              w: filtered[0]["email"],
                              b: userEmail,
                              user1id: filtered[0]["id"],
                              user2id: userID,
                              turn: "w",
                              fen: (new Chess()).fen(),
                              state: "inprogress",
                              winner: "",
                            }))
  }
  else if(opponents.length == 0){
    // no opponent found, make current user join queue
    db.transact(
      tx.queue[userID].update({
        email: userEmail,
      })
    )
    alert("You've joined the queue. Searching for an opponent... You can close this box");
  }
  else{
    alert("You've already joined the queue.");
  }
}

// Types
// ----------
type User = {
  id: string
  email: string
  online: boolean
  inGame: boolean
  winCount: number
  drawCount: number
  loseCount: number
}

type Queue = {
  id: string,
  email: string
}

type Game = {
  id: string
  w: string
  b: string
  user1id: string
  user2id: string
  turn: string
  fen: string
  state: string
  winner: string
}

// Styles
// ----------
const styles: Record<string, React.CSSProperties> = {
    info: {
      boxSizing: 'inherit',
      display: 'flex',
      justifyContent: 'center',
      textAlign: 'center',
      alignItems: 'center',
    },
    board: {
      boxSizing: 'inherit',
      display: 'flex',
      border: '1px solid lightgray',
      justifyContent: 'center',
      textAlign: 'center',
      alignItems: 'center',
      width: 'min(50vw, 50vh)',
      height: 'min(50vw, 50vh)',
    },
    container: {
      boxSizing: 'border-box',
      backgroundColor: '#fafafa',
      fontFamily: 'code, monospace',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    },
  }
  
export default App
