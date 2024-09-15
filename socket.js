// Note there is no need to have socket.io in a seperate file we can have in the server.js

let playerCount = 0;

function listen(socketServer){

    // Here I have to make use of rooms and namespaces. 

    socketServer.on('connection', (socket) => {
        console.log(`Device Connected with id ${socket.id}`)
    })

    
}

module.exports = {
    listen
}