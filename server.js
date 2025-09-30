const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User  connected');

  socket.on('send_message', (data) => {
    // Kirim ke semua client kecuali pengirim
    socket.broadcast.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User  disconnected');
  });
});

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});