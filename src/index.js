const http = require("http")
const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const path = require('path');
const socketio = require("socket.io")

require('dotenv').config();

const animalRoute = require('./routes/animalRoute');

const app = express();

const port = process.env.PORT || "4000";
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200 
}

// Setting variables and middlewares
app.set("port", port);
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Defining routes
app.use("/api", animalRoute);

// Defining public front build
app.use(express.static(decodeURIComponent(path.join(__dirname, 'public'))));

// Creating the server
const server = http.createServer(app);

// Setting up socketio
const io = socketio(server,{
    cors: {
      origin: "http://localhost:3000"
    }
}); 

io.on('connection', (socket) => {
    console.log("User connected " + socket.id);
    socket.on('changeAnimals', (message) => {
        io.emit('changeAnimals', message);
    })
});

// Listening on port
server.listen(port);
server.on("listening", () => {
    console.log(`Listening on port ${port}`)
})