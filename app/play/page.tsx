'use client'

import { i, init, InstaQLEntity } from "@instantdb/react";
import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
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
let winner = null;

function App() {
  // this App() function is run every time a move is played. Chessboard is reloaded.

  let [game, setGame] = useState(null);
  let [stockfishChat, setChat] = useState("I'll play black. You start. GLHF.");
  let gameData = null;
  let fen = "";
  let isMyTurn = false;
  let uID = null;
  let gID = null;
  
  if(Cookies.get("game")){
    let gdata = JSON.parse(Cookies.get("game"));
    gID = gdata["id"];
    uID = gdata["uid"];
    const res = db.useQuery({game: { 
      $: { 
        limit: 1,
        where: {
          and: [
            { id: gID },
            { state: 'inprogress' }
          ]
        }
        }}});

    if (res.isLoading || res.error){}
    else {
      if (res.data.game.length != 0) {
        gameData = res.data.game[0];
        if (gameData['turn'] == 'w') isMyTurn = true;
        fen = gameData.fen;
        game = new Chess(fen);
      }
    }
  }

  const safeGameModify = (change) => {
    let move = null;
    try {
      move = game.move(change);
      fen = game.fen();
    } catch (error) {
      // console.log("invalid move / game ended", error.message)
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
    // update the db with game's fen + opponent's turn
    db.transact(db.tx.game[gameData["id"]].update({fen: game.fen(), turn: 'b'}));
    // get chessbot's next move, and update the db.
    fetch('https://6zgfq4kzwc.execute-api.us-east-2.amazonaws.com/prod', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fen: game.fen(), piece: source+","+target+","+game.get(target).type }),
    })
      .then(response => response.json())
      .then(data => {
        const bestMove = data;
        if(data){
          const srcc = bestMove["source"];
          const trgg = bestMove["target"];
          const trashtalk = bestMove["talk"];
          move = safeGameModify({
            from:srcc,
            to: trgg,
            promotion:'q'
          })
          if(trashtalk != "nothing")
            setChat(trashtalk);
          else setChat("Your move.")
          db.transact(db.tx.game[gameData["id"]].update({fen: game.fen(), turn: 'w'}));
        }
      })
      .catch(error => {
        console.error('Error:', error); 
      });
    return true;
  }

  if (game){
    if(game.isGameOver()){
      let winColor = "";
      if(game.isCheckmate())
        winColor = getComplement(game.turn());
      if(!Cookies.get("gameover")){
        Cookies.set("gameover", JSON.stringify({"win": winColor}), { expires: 1 });
        updateWinner(gID, winColor);
      }
    }
    return (
      <div style={styles.container}>
        <div style={styles.column}>
      <div style={ isMyTurn? styles.boardMyTurn : styles.board } >
        <Chessboard
          boardOrientation = 'white'
          position={fen}
          onPieceDrop={onDrop}
          />
      </div>
      <div style={styles.headerbox}>
        <div style={styles.info}>
        <img src="/images/stockfish.png" alt="CHESSGOD.png" style={styles.img} />
        <b>
      { game.isCheckmate() ? ( isMyTurn? "Checkmate! Well played. You're being sent back to the shadow realm (the previous page..)" : "STOCKFISH got owned! Well played." )  : (game.inCheck() ? ( isMyTurn? "You're in check." : "STOCKFISH is in Check!" )  : "")} <br />
          { game.isDraw()? "It's a draw! Well played." : !game.inCheck() ? isMyTurn? stockfishChat : "...": "" } <br />
          </b>
        </div>
      </div>
    </div>
    </div>
    );
  }
  else
    return (<div style={styles.container}>
      <div style={styles.board}>
        Loading...
      </div>
    </div>);
  

}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function updateWinner(gID: string, winColor: string){
  await sleep(5000);
  db.transact(db.tx.game[gID].update({state: "end", winner: winColor })) ;
  await sleep(500);
  Cookies.remove("game");
  Cookies.remove("gameover");
  if (typeof window !== 'undefined') window.location.href = "http://localhost:3000";
}

function getComplement(turnColor: string){
  if(turnColor=='b') return 'w';
  else return 'b';
}

// Write Data
// ---------

// Types
// ----------

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
  headerbox: {
    height: 'min(15vw,15vh)',
    lineHeight: '1.2',
    display: 'flex-start',
    flexDirection: 'row',
    boxSizing: 'inherit',
    margin: '0 auto',
  },
  img: {
    height: 'min(15vw,15vh)',
    display: 'flex-start',
    flexDirection: 'row',
    boxSizing: 'inherit',
    alignSelf: 'flex-start'
  },
  info: {
    paddingTop: '10px',
    boxSizing: 'inherit',
    display: 'flex',
    paddingLeft: '10px',
    lineHeight: '1.2',
  },
  board: {
    boxSizing: 'inherit',
    display: 'flex',
    width: 'min(90vw, 85vh)',
    height: 'min(90vw, 85vh)',
    margin: '0 auto',
  },
  boardMyTurn: {
    boxSizing: 'inherit',
    display: 'flex',
    border: '5px solid green',
    width: 'min(90vw, 85vh)',
    height: 'min(90vw, 85vh)',
    margin: '0 auto',
  },
  container: {
    boxSizing: 'border-box',
    backgroundColor: '#fafafa',
    fontFamily: '"Press Start 2P", monospace',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  column: {
    alignSelf: 'center',
    width: 'min(90vw, 85vh)',
  }
}

export default App
