// Note there is no need to have socket.io in a seperate file we can have in the server.js

let readyPlayerCount = 0;

function listen(socketServer){
    // If you look into the docs and compare in that case we 
  // are replacing the io with this namespace thing.
  // if not this we would use io in place of pongNamespace
  // for line 30
  const pongNamespace = socketServer.of('/pong');

  // 'connection' is a built in function of socket.io
  pongNamespace.on('connection', (socket) => {

    // This is when a device connects to our server
    let room;

    console.log('a user connected', socket.id);

    // 'ready' is being emitted by the front end when the game loads
    socket.on('ready', () => {
      room = 'room' + Math.floor(readyPlayerCount / 2);
      socket.join(room);

      console.log('Player ready', socket.id, room);

      readyPlayerCount++;

      // We will only start the game if we have two players
      if (readyPlayerCount % 2 === 0) {
        pongNamespace.in(room).emit('startGame', socket.id);
      }
    });

    // If paddle move in that case emit to all except the sender
    socket.on('paddleMove', (paddleData) => {
      socket.to(room).emit('paddleMove', paddleData);
    });

    // If ball move in that case emit to all except the sender
    socket.on('ballMove', (ballData) => {
      socket.to(room).emit('ballMove', ballData);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected: ${reason}`);
      socket.leave(room);
    });
  });
}

module.exports = {
    listen
}