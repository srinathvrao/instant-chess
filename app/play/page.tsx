'use client'

import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Cookies from "js-cookie";

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [gameState, setGameState] = useState<string | null>(null);
  let [stockfishChat, setChat] = useState("Your move. Good luck!");

  useEffect(() => {
    const savedGame = Cookies.get("gameInfo");
    if (savedGame) {
      const chessInstance = new Chess();
      chessInstance.load(savedGame);
      setGame(chessInstance);
    }
  }, []);

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    const gameCopy = new Chess(game.fen());
    if(gameCopy.turn()=='b') return false;
    let move = null;
    try{
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", 
      }); 
    }catch (error) {
      return false;
    }

    if (move) {
      setGame(gameCopy);
      setGameState(gameCopy.fen());
      Cookies.set("gameInfo", gameCopy.fen(), { expires: 7 });
      if(!Cookies.get('movesent')){
        Cookies.set('movesent');
        makeAImove(onDropAI, gameCopy, gameCopy.get(targetSquare).type);
      }
    }
    return move !== null;
  };

  const onDropAI = (gameCopy, sourceSquare: string, targetSquare: string, ttalk: string) => {
    const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      }); 
    if (move) {
      setGame(gameCopy);
      setGameState(gameCopy.fen());
      Cookies.set("gameInfo", gameCopy.fen(), { expires: 7 });
      if(ttalk !== 'nothing') setChat(ttalk);
      else setChat("Your move");
    }
    return move !== null;
  };
  const [isHovered, setIsHovered] = useState(false);
  const [isHovered2, setIsHovered2] = useState(false);
  if(game.isCheckmate() && !Cookies.get("redirect")){
    Cookies.set("redirect",1,{expires:1});
    redirectHome(game.turn());
  }
  return (
    <div style={styles.container}>
      <div style={styles.column}>
        <div style={styles.navbar}>
        <a
            href="#"
            style={isHovered ? { ...styles.button, ...styles.hover } : styles.button}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {let newgame = new Chess(); Cookies.set("gameInfo",newgame.fen(), {expires: 7}); Cookies.remove("redirect"); setGame(newgame); setGameState(newgame.fen()); setChat("Your move.");}}
          >
          Reset
        </a>
        <a
            href="https://instantgames.org"
            style={isHovered2 ? { ...styles.button, ...styles.hover } : styles.button}
            onMouseEnter={() => setIsHovered2(true)}
            onMouseLeave={() => setIsHovered2(false)}
            onClick={() => {clearGame()}}
          >
          Quit
        </a>
        </div>
        <br />
      <div style={ game.turn()=='w' ? styles.boardMyTurn : styles.board }>
          <Chessboard
            position={gameState || game.fen()}
            onPieceDrop={onDrop}
            boardOrientation='white'
            arePiecesDraggable={true}
          />
    </div>
    <div style={styles.info}>
      <b>
      { game.isCheckmate() ? ( game.turn()=='w' ? "Checkmate! Well played. Black wins." : "You win! Well played." )  : (game.inCheck() ? ( game.turn()=='w'? "You're in check." : "Black is in Check!" )  : "")} <br />
        { game.isDraw()? "It's a draw! Well played." : !game.inCheck() ? game.turn()=='w'? stockfishChat : "...": "" } <br />
        </b>
      </div>
  </div>
  </div>
  );
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clearGame(){
  Cookies.remove("gameInfo");
  Cookies.remove("redirect");
}

async function redirectHome(loser){
  await sleep(4000);
  if(loser == "w"){
    let losses = 0;
    if(Cookies.get("loss")){
      losses = parseInt(Cookies.get("loss"));
      Cookies.set("loss", losses + 1, {expires:30});
    }
    else
      Cookies.set("loss", 1, {expires:30});
  }
  else if(loser == "b"){
    let wins = 0;
    if(Cookies.get("win")){
      wins = parseInt(Cookies.get("win"));
      Cookies.set("win", wins + 1, {expires:30});
    }
  }
  Cookies.remove("redirect");
}

async function makeAImove(dropAI, gameCopy, cpiece){
  await fetch('https://6zgfq4kzwc.execute-api.us-east-2.amazonaws.com/prod', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fen: gameCopy.fen(), piece: "a,b,"+cpiece }),
  })
    .then(response => response.json())
    .then(data => {
      const bestMove = JSON.parse(data['body']);
      if(bestMove){
        const srcc = bestMove["source"];
        const trgg = bestMove["target"];
        const ttalk = bestMove["talk"];
        dropAI(gameCopy, srcc, trgg, ttalk);
      }
    })
    .catch(error => {
      console.error('Error:', error); 
    });
    Cookies.remove('movesent');
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    display: 'flex',         
    justifyContent: 'center',
    gap: '20px',
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
  },
  info: {
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'center',
    lineHeight: '1.2',
    height: 'auto',
    paddingTop: '20px',
  },
  board: {
    boxSizing: 'inherit',
    display: 'flex',
    width: 'min(90vw, 70vh)',
    height: 'min(90vw, 70vh)',
    margin: '0 auto',
  },
  boardMyTurn: {
    boxSizing: 'inherit',
    display: 'flex',
    border: '5px solid green',
    width: 'min(90vw, 70vh)',
    height: 'min(90vw, 70vh)',
    margin: '0 auto',
  },
  container: {
    backgroundColor: '#fafafa',
    fontFamily: '"Press Start 2P", monospace',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  column: {
    alignSelf: 'center',
    width: 'min(90vw, 70vh)',
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

export default App;
