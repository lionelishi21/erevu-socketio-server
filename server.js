const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Enable JSON body parsing

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now, restrict in production
        methods: ["GET", "POST"]
    }
});

// Store connected clients
let scraperSocket = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Identification event to distinguish scraper from frontend
    socket.on('register', (type) => {
        if (type === 'scraper') {
            scraperSocket = socket;
            console.log('Scraper registered:', socket.id);
        } else if (type === 'client') {
            console.log('Frontend client registered:', socket.id);
        }
    });

    // Event: Scraper sends data
    socket.on('scraper:data', (data) => {
        console.log('Received data from scraper:', data);
        // Broadcast to all connected frontend clients
        io.emit('server:data', data);
    });

    // Event: Client requests scrape (optional)
    socket.on('client:command', (command) => {
        console.log('Received command from client:', command);
        if (scraperSocket) {
            scraperSocket.emit('scraper:command', command);
        } else {
            console.log('Scraper not connected');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket === scraperSocket) {
            scraperSocket = null;
            console.log('Scraper disconnected');
        }
    });
});

// Test endpoint for curl
app.post('/test-notification', (req, res) => {
    const data = req.body;
    console.log('Received test notification via HTTP:', data);
    io.emit('server:data', data);
    res.json({ success: true, message: 'Notification broadcasted' });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
