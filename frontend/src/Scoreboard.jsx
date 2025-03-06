import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState('');
  const [scores, setScores] = useState({});

  useEffect(() => {
    // Example: generate a random userID for demonstration
    const randomUserId = 'User' + Math.floor(Math.random() * 1000);
    setUserId(randomUserId);

    // Create the main namespace connection ("/")
    // We'll add the userId as a query param, 
    // and pass a token in handshake.auth for "default namespace" authentication:
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: 'myAuthToken'
      },
      query: {
        userId: randomUserId
      }
    });

    // Save to state
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for scoreboard updates from the server
    socket.on('scoreboardUpdate', (updatedScores) => {
      setScores(updatedScores);
    });

    // Optional: handle connection errors, etc.
    socket.on('connect_error', (err) => {
      console.log('Connection error:', err.message);
    });

    console.log("useEffect with socket dependency ", socket);

    return () => {
      socket.off('scoreboardUpdate');
      socket.off('connect_error');
      console.log("Component unmounted");
    };
  }, [socket]);


  const handleIncrement = () => {
    console.log("handleIncrement", socket);
    if (!socket) return;
    socket.emit('incrementScore');
  };

  // Render the scoreboard
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Live Scoreboard (Default Namespace)</h1>
      <p>Your ID: <strong>{userId}</strong></p>

      <button onClick={handleIncrement}>Increment My Score</button>

      <h2>Scores</h2>
      <ul>
        {Object.entries(scores).map(([id, score]) => (
          <li key={id}>
            {id}: {score}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
