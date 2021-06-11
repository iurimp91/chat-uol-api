import express from "express";
import cors from "cors";
import dayjs from "dayjs";

const server = express();

server.use(cors());
server.use(express.json());

let participants = [{
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

server.get("/participants", (req, res) => {
    res.send(participants);
});

server.post("/messages", (req, res) => {
    const { user } = req.headers; 
    const { to, text, type } = req.body;

    if(to === "" || text === "") {
        return res.sendStatus(400);
    }

    if(type !== "message" && type !== "private_message") {
        return res.sendStatus(400);
    }

    const alreadyLogged = participants.find(element => element.name === user);

    if(alreadyLogged === undefined) {
        return res.sendStatus(400);
    }

    const newMessage = {
        from: user,
        to,
        text,
        type,
        time: dayjs().format("HH:mm:ss"),
    }

    messages.push(newMessage);

    res.sendStatus(200);
});

server.get("/messages", (req, res) => {
    const { user } = req.headers;
    const userMessages = messages.filter(message => {
        if(message.to === "Todos") {
            return message;    
        } else if(message.from === user) {
            return message;
        } else if(message.to === user) {
            return message;
        } else if(message.type === "message") {
            return message;
        }
    });
    
    const limit = req.query.limit;
    
    if(limit === undefined) {
        return res.send(userMessages);
    } else if(limit >= userMessages.length) {
        return res.send(userMessages);
    } else {
        const limitedUserMessages = [];
        let i = userMessages.length - limit;
        for(i; i < userMessages.length; i++) {
            limitedUserMessages.push(userMessages[i]);
        }
        return res.send(limitedUserMessages);
    }
});

server.post("/status", (req, res) => {
    const { user } = req.headers;

    const stillLogged = participants.find(element => element.name === user);

    if(stillLogged === undefined) {
        return res.sendStatus(400);
    } else {
        participants.forEach((participant) => {
            if(participant.name === user) {
                participant.lastStatus = Date.now();
            }
        });
        return res.send(200);
    }
});

const intervalID = setInterval(() => {
    participants.forEach(participant => {
        if(participant.lastStatus < (Date.now() - 10000)) {
            participants = participants.filter(element => element.name !== participant.name);
            const exitMessage = {
                from: participant.name,
                to: "Todos",
                text: "sai da sala...",
                type: 'status',
                time: dayjs().format("HH:mm:ss"),
            }
            messages.push(exitMessage);
        }
    });
}, 15000);

server.listen(4000);