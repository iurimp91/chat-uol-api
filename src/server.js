import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import { stripHtml } from "string-strip-html";
import joi from "joi";
import fs from "fs";

const server = express();

server.use(cors());
server.use(express.json());

let participants = [];

let messages = [];

if(fs.existsSync("./participants.json")) {
    participants = JSON.parse(fs.readFileSync('./participants.json'));
}

if(fs.existsSync("./messages.json")) {
    messages = JSON.parse(fs.readFileSync('./messages.json'));
}

server.post("/participants", (req, res) => {
    const schema = joi.object({
        name: joi.string().min(3).max(30).required()
    }).and("name");

    const bodyValidation = (schema.validate(req.body));

    if(bodyValidation.error !== undefined) {
        return res.status(400).send(bodyValidation.error.message);
    }

    const person = req.body.name;

    const alreadyLogged = participants.find(element => element.name === person);
    
    if(alreadyLogged !== undefined) {
        return res.sendStatus(400);
    }

    const newParticipant = {
        name: stripHtml(person).result.trim(),
        lastStatus: Date.now(),
    }

    participants.push(newParticipant);
    fs.writeFileSync("participants.json", JSON.stringify(participants));

    const message = {
        from: stripHtml(person).result.trim(),
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs().format("HH:mm:ss"),
    }

    messages.push(message);
    fs.writeFileSync("messages.json", JSON.stringify(messages));

    res.sendStatus(200);
});

server.get("/participants", (req, res) => {
    res.send(participants);
});

server.post("/messages", (req, res) => {
    const userSchema = joi.object().and("user", "content-type");
    
    const messageSchema = joi.object({
        to: joi.string().min(3).max(30).required(),
        text: joi.string().required().trim(),
        type: joi.string().required(),
    }).and("to", "text", "type");

    const bodyValidation = (messageSchema.validate(req.body));

    if(bodyValidation.error !== undefined) {
        return res.status(400).send(bodyValidation.error.message);
    }

    const headersValidation = (userSchema.validate(req.headers));

    if(headersValidation.error !== undefined) {
        return res.status(400).send(headersValidation.error.message);
    }

    const { user } = req.headers; 
    const { to, text, type } = req.body;

    const alreadyLogged = participants.find(element => element.name === user);

    if(alreadyLogged === undefined) {
        return res.sendStatus(400);
    }

    const newMessage = {
        from: stripHtml(user).result.trim(),
        to: stripHtml(to).result.trim(),
        text: stripHtml(text).result.trim(),
        type: stripHtml(type).result.trim(),
        time: dayjs().format("HH:mm:ss"),
    }

    messages.push(newMessage);
    fs.writeFileSync("messages.json", JSON.stringify(messages));

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
            if(participant.name === stillLogged.name) {
                participant.lastStatus = Date.now();
            }
        });
        return res.sendStatus(200);
    }
});

const intervalID = setInterval(() => {
    participants.forEach(participant => {
        if(participant.lastStatus < (Date.now() - 10000)) {
            participants = participants.filter(element => element.name !== participant.name);
            fs.writeFileSync("participants.json", JSON.stringify(participants));
            const exitMessage = {
                from: stripHtml(participant.name).result.trim(),
                to: "Todos",
                text: "sai da sala...",
                type: 'status',
                time: dayjs().format("HH:mm:ss"),
            }
            messages.push(exitMessage);
            fs.writeFileSync("messages.json", JSON.stringify(messages));
        }
    });
}, 15000);

server.listen(4000);