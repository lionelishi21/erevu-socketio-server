import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the server (adjust URL if deployed)
const socket = io('http://localhost:3000');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [scrapedData, setScrapedData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('register', 'client');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('server:data', (data) => {
      console.log('Received data:', data);
      setScrapedData((prev) => [data, ...prev]);
      setLastUpdate(new Date());
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('server:data');
    };
  }, []);

  const handleScrapeRequest = () => {
    socket.emit('client:command', { action: 'scrape' });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Scraper Dashboard</h1>
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="main-content">
        <div className="control-panel">
          <button className="scrape-btn" onClick={handleScrapeRequest} disabled={!isConnected}>
            Trigger Scrape
          </button>
          {lastUpdate && <span className="last-update">Last update: {lastUpdate.toLocaleTimeString()}</span>}
        </div>

        <div className="data-feed">
          <h2>Live Data Feed</h2>
          {scrapedData.length === 0 ? (
            <div className="empty-state">No data received yet. Waiting for scraper...</div>
          ) : (
            <div className="cards-grid">
              {scrapedData.map((item, index) => (
                <div key={index} className="data-card">
                  <div className="card-header">
                    <span className="timestamp">{new Date(item.timestamp * 1000).toLocaleString()}</span>
                    <span className="badge">New</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
