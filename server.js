const http = require('http')
const { app } = require('./api')

// To use Socket.io we basically create a new Socket server
const socket = require("socket.io");

const PORT = 3000

const HTTPserver = http.createServer(app)
const socketServer = socket(HTTPserver);

const {listen} = require('./socket');



HTTPserver.listen(PORT, () => {
    console.log(`Server listening to port ${PORT}`)
})

// To separate it into a folder what we will do is that 
// we will export the socketServer and feed it into a function 
// this function will use the socketServer and carry out all the
// tasks

listen(socketServer)