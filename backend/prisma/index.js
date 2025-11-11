#!/usr/bin/env node
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();
const express = require("express");
const app = express();
app.use(express.json());

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// ADD YOUR WORK HERE

const data = [
    {
      title: "Buy groceries",
      description: "Milk, Bread, Eggs, Butter",
      completed: false
    },
    {
      title: "Walk the dog",
      description: "Take Bella for a walk in the park",
      completed: true
    },
    {
      title: "Read a book",
      description: "Finish reading 'The Great Gatsby'",
      completed: false
    }
  ];

const basicAuth = require('./middleware/basicAuth');

app.get("/notes", async (req, res) => {
    let notes = [];
    if (req.query["done"] === "true") {
        notes = await prisma.note.findMany({ where: { completed: true, public: true } });
      } else if (req.query["done"] === "false") {
        notes = await prisma.note.findMany({ where: { completed: false, public: true } });
      } else if (typeof req.query["done"] !== "boolean") {
        res.status(400).send("Invalid payload);
        return;

      } else {
        notes = await prisma.note.findMany({ where: { public: true } });
      }
      
    res.status(200).json(notes);
    return;
    
});

app.post("/notes", basicAuth, async (req, res) => {
/*    console.log(req.body);
    const index = data.push(req.body);
    const dataCopy = structuredClone(req.body);
    dataCopy.id = index-1;
    res.status(201).json(dataCopy);*/
    if (req.user) {
        if (!req.body.title || !req.body.description 
            || typeof req.body.completed !== "boolean" 
            || typeof req.body.public !== "boolean" 
            || typeof req.body.title !== "string" 
            || typeof req.body.description !== "string" 
            || req.body.title.length === 0 
            || req.body.description.length === 0) {
            res.status(400).send("Invalid payload");
            return;
        }
        const newNote = {
            title: req.body.title,
            description: req.body.description,
            completed: req.body.completed,
            public: req.body.public,
            userId: req.user.id
        };

        await prisma.note.create({ data: newNote });
        
        res.status(201).json(newNote);
        return;
    } else {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }


});

app.get("/notes/:noteId", basicAuth, async (req, res) => {
    if (req.user) {
        if (isNaN(req.params["noteId"])) {
            res.status(404).send("Not found");
            return;
        }
        let note = await prisma.note.findUnique({
            where: { id: parseInt(req.params["noteId"]) }
        });
        if (!note) {
            res.status(404).send("Not found");
            return;
        } else if (note.userId !== req.user.id) {
            res.status(403).send("Not permitted");
            return;
        } else {
            res.status(200).json(note);
            return;
        }
     } else {
        res.status(401).json({ message: 'Not authenticated' });
        return;
     }
    
});

app.patch("/notes/:noteId", basicAuth, async (req, res) => {
    if (req.user) {
        if (isNaN(req.params["noteId"])) {
            res.status(404).send("Not found");
            return;
        }
        let note = await prisma.note.findUnique({
            where: { id: parseInt(req.params["noteId"]) }
        });
        if (!note) {
            res.status(404).send("Not found");
            return;
        } else if (note.userId !== req.user.id) {
            res.status(403).send("Not permitted");
            return;
        } else {
            const updatedFields = {};
            if (req.body.title !== undefined) {
                if (typeof req.body.title !== "string" || req.body.title.length === 0) {
                    res.status(400).send("Invalid payload");
                    return;
                }
                updatedFields.title = req.body.title;
            }
            if (req.body.description !== undefined) {
                if (typeof req.body.description !== "string" || req.body.description.length === 0) {
                    res.status(400).send("Invalid payload");
                    return;
                }
                updatedFields.description = req.body.description;
            }
            if (req.body.completed !== undefined) {
                if (typeof req.body.completed !== "boolean") {
                    res.status(400).send("Invalid payload");
                    return;
                }
                updatedFields.completed = req.body.completed;
            }
            if (req.body.public !== undefined) {
                if (typeof req.body.public !== "boolean") {
                    res.status(400).send("Invalid payload");
                    return;
                }
                updatedFields.public = req.body.public;
            }
            note = await prisma.note.update({
                where: { id: parseInt(req.params["noteId"]) },
                data: updatedFields
            });
            res.status(200).json(note);
            return;
        }
     } else {
        res.status(401).json({ message: 'Not authenticated' });
        return;
     }
});


app.get('/hello', basicAuth, (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

app.post('/users', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Invalid payload' });
    }
    const userExists = await prisma.user.findUnique({
        where: { username: username }
    });
    if (userExists) {
        return res.status(409).json({ message: 'A user with that username already exists' });
    }
    const newUser = await prisma.user.create({
        data: { username: username, password: password }
    });
    res.status(201).json({ id: newUser.id, username: newUser.username, password: newUser.password });
});

// ==================

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});