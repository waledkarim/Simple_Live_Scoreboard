// src/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function AdminPanel() {
  const [adminSocket, setAdminSocket] = useState(null);
  const [scores, setScores] = useState({});

  useEffect(() => {
    // Connect to the /admin namespace
    const newAdminSocket = io('http://localhost:3000/admin', {
      auth: {
        adminToken: 'secretAdminToken'
      }
    });

    setAdminSocket(newAdminSocket);

    return () => {
      newAdminSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!adminSocket) return;

    // Listen for scoreboard updates
    adminSocket.on('scoreboardUpdate', (updatedScores) => {
      setScores(updatedScores);
    });

    adminSocket.on('connect_error', (err) => {
      console.log('Admin connection error:', err.message);
    });

    return () => {
      adminSocket.off('scoreboardUpdate');
      adminSocket.off('connect_error');
    };
  }, [adminSocket]);

  const handleResetScores = () => {
    if (!adminSocket) return;
    adminSocket.emit('resetScores');
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', marginTop: '1rem' }}>
      <h1>Admin Panel (Admin Namespace)</h1>
      <button onClick={handleResetScores}>Reset Scores</button>

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
