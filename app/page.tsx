'use client'

import { init, tx, id } from '@instantdb/react'
import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Cookies from 'js-cookie';
import { googleLogout } from '@react-oauth/google';

// ID for app: instant-chess
const APP_ID = '#APPID'

// Optional: Declare your schema for intellisense!
type Schema = {
  users: User
}

const GOOGLE_CLIENT_ID = '#CLIENT_ID';

// Use the google client name in the Instant dashboard auth tab
const GOOGLE_CLIENT_NAME = 'instant-chess';

const db = init<Schema>({ appId: APP_ID })

function App() {
  // Read Data
    
  const { isLoading, user, error } = db.useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  else if (error) {
    return <div>Uh oh! {error.message}</div>;
  }
  else if (user){
    addUser(user.id, user.email);
    Cookies.set('userData', JSON.stringify({"id": user.id , "email":user.email}), { expires: 7 });  
    window.location.href += "/home";
  }
  return (
    <div style={styles.container}>
    <div style={styles.board}>
      <Login />
    </div>
    <div style={ styles.info }>
    <br /> <br />
    Show some ❤️ by ⭐ing <a href="https://github.com/srinathvrao/instant-chess">This Project</a> on Github! :D
    <br /> <br />
    <br /> <br />
    This application uses Cookies to store just your login information, <br /> and does not need/record passwords.
    </div>
  </div>
  );
  

  
}

function Login() {
  const [nonce] = useState(crypto.randomUUID());

  return (
    <div> <h3> Welcome to Instant-Chess!</h3><br></br>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLogin
        nonce={nonce}
        onError={() => alert('Login failed')}
        onSuccess={({ credential }) => {
          db.auth
            .signInWithIdToken({
              clientName: GOOGLE_CLIENT_NAME,
              idToken: credential,
              // Make sure this is the same nonce you passed as a prop
              // to the GoogleLogin button
              nonce,
            })
            .catch((err) => {
              alert('Uh oh: ' + err.body?.message);
            });
        }}
      />
    </GoogleOAuthProvider>

    </div>
  );
}


// Write Data
// ---------
function addUser(uid: string, email: string){
  try{
    db.transact(
      tx.users[uid].update({
        online: true,
        inGame: false,
        email: email,
        winCount: 0,
        drawCount: 0,
        loseCount: 0
      })
    )
  } catch (error) {
    console.log(error.message, "error creating",email);
    return 'error';
  }

  return uid;
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


// Styles
// ----------
const styles: Record<string, React.CSSProperties> = {
  info: {
    boxSizing: 'inherit',
    display: 'inline',
    justifyContent: 'center',
    textAlign: 'center',
    alignItems: 'center',
  },
  board: {
    boxSizing: 'inherit',
    display: 'flex',
    border: '1px solid lightgray',
    justifyContent: 'center',
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