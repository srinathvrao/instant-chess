'use client'

import { init, tx, id } from '@instantdb/react'
import { useMemo, useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import Cookies from 'js-cookie';


// ID for app: instant-chess
const APP_ID = 'INSTANTDB-APP-ID'

// Optional: Declare your schema for intellisense!
type Schema = {
  users: User,
  game: Game
}

const db = init<Schema>({ appId: APP_ID })

let winner = null;

function App() {

  let [game, setGame] = useState(null);
  let gameData = null;
  let fen = "";
  let userColor = "";
  let isMyTurn = false;
  const cookieData = Cookies.get('userData');
  const userID =  useMemo( () => getUserIDFromCookie(cookieData), [cookieData] );
  const userEmail = useMemo( () => getUserEmailFromCookie(cookieData), [cookieData] );

  const res = db.useQuery({game: { 
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

  if (res.isLoading || res.error){}
  else {
    if(!cookieData && typeof window !== 'undefined' ) window.location.href = "https://instantgames.org";
    else if (res.data.game.length == 0) {
      console.log("no game found.");
      if (typeof window !== 'undefined') window.location.href = "https://instantgames.org/home";
    }
    else {
      gameData = res.data.game[0];
      if(gameData['w']==userEmail) userColor = 'w';
      else userColor = 'b';
      if (gameData['turn'] == userColor) isMyTurn = true;
      fen = gameData.fen;
      game = new Chess(fen);
    }
  }

  const safeGameModify = (change) => {
    let move = null;
    try {
      move = game.move(change);
      fen = game.fen();
    } catch (error) {
      console.log("invalid move / game ended", error.message)
    }
    return move
  }

  const onDrop = (source,target) => {
    let move = null;
    if(!isMyTurn){ return false ; }
    move = safeGameModify({
                          from:source,
                          to: target,
                          promotion:'q'
                        })
    //illegal move 
    if(move == null) return false
    //valid move  
    let nextTurn = '';
    if(userEmail == gameData['w']) nextTurn = 'b';
    else nextTurn = 'w';
    // update the db with game's fen + opponent's turn
    db.transact(tx.game[gameData["id"]].update({fen: game.fen(), turn: nextTurn}))
    return true;
  }

  if (game){
    if(game.isGameOver()){
      console.log("game over!!")
      if(game.isDraw()){
        // update game's information
        db.transact(tx.game[gameData["id"]].update({state: "end"})) ;
        // update user stats +1 draw
      }
      if(game.isCheckmate()){
        let winColor = getComplement(game.turn());
        let winID = null;
        let loseID = null;
        if (winColor == "w") {
          winID = gameData["user1id"];
          loseID = gameData["user2id"];
        }
        else { winID = gameData["user2id"]; loseID = gameData["user1id"]; }
        db.transact(tx.game[gameData["id"]].update({state: "end", winner: winColor })) ;
      }
      if (typeof window !== 'undefined') window.location.href = "https://instantgames.org/home";
    }
    // else
    return (
      <div style={styles.container}>
      <div style={styles.board} >
        <Chessboard
          boardOrientation = {userColor=="b" ? 'black' : 'white'}
          position={fen}
          onPieceDrop={onDrop}
          />
      </div>
      <div style={ styles.info }>
      Playing against {gameData[getComplement(userColor)].split("@")[0].includes("Guest") ? gameData[getComplement(userColor)].split("@")[0].slice(0,11) : gameData[getComplement(userColor)].split("@")[0] }.. Good Luck!
    </div>
    </div>
    );
  }
  else
    return (<div style={styles.container}>
      <div style={styles.board}>
        Loading... Please wait.
      </div>
    </div>);
  

}

function getUserIDFromCookie(cookieData){
  if(cookieData){
    let cookie = JSON.parse(cookieData);
    return  cookie["id"];
  }
  return ""
}

function getUserEmailFromCookie(cookieData){
  if(cookieData){
    let cookie = JSON.parse(cookieData);
    return  cookie["email"];
  }
  return ""
}

function getComplement(turnColor: string){
  if(turnColor=='b') return 'w';
  else return 'b';
}

// Write Data
// ---------

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

type Game = {
  id: string
  user1: string
  user2: string
  user1id: string
  user2id: string
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
    borderBottomWidth: '0px',
    width: 'min(90vw, 90vh)',
    height: 'min(90vw, 90vh)',
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
