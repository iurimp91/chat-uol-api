import express from "express";
import cors from "cors";
import dayjs from "dayjs";

const server = express();

server.use(cors());
server.use(express.json());

const participants = [{
    name: 'João',
    lastStatus: 12313123
}];

const messages = [{
    from: 'João',
    to: 'Todos',
    text: 'oi galera',
    type: 'message',
    time: '20:04:37'
}];

server.post("/participants", (req, res) => {
    const person = req.body.name;

    if(person === "") {
        return res.sendStatus(400);
    }

    const alreadyLogged = participants.find(element => element.name === person);
    
    if(alreadyLogged !== undefined) {
        return res.sendStatus(400);
    }

    const newParticipant = {
        name: person,
        lastStatus: Date.now(),
    }

    participants.push(newParticipant);

    const message = {
        from: person,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs().format("HH:mm:ss"),
    }

    messages.push(message);

    res.sendStatus(200);
});

server.listen(4000);