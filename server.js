const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb'); // Native MongoDB driver
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// MongoDB connection
const uri = 'mongodb+srv://darshgb:tLD4bfqJz4er1eDU@cluster0.yne46.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
        db = client.db('learnzone'); // Ensure this database exists
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1); // Exit if connection fails
    }
}
connectToMongoDB();

// Middleware
app.use(bodyParser.json()); // For parsing JSON request bodies
app.use(express.static('public')); // Serve static files from the "public" folder

// Logger middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Static file middleware for lesson images
app.get('/images/:imageName', (req, res) => {
    const imagePath = path.join(__dirname, 'images', req.params.imageName);
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).send('Image not found');
    }
});

// REST API Routes

// GET: Retrieve all lessons
app.get('/lessons', async (req, res) => {
    try {
        const lessons = await db.collection('lessons').find({}).toArray();
        res.json(lessons);
    } catch (err) {
        console.error('Error fetching lessons:', err);
        res.status(500).send('Error fetching lessons');
    }
});

// POST: Save a new order
app.post('/orders', async (req, res) => {
    try {
        const newOrder = req.body;
        const result = await db.collection('orders').insertOne(newOrder);
        res.status(201).send({ message: 'Order saved', orderId: result.insertedId });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).send('Error saving order');
    }
});

// PUT: Update a lesson
app.put('/lessons/:id', async (req, res) => {
    const lessonId = parseInt(req.params.id); // Parse the ID as an integer
    const updateData = req.body;

    try {
        const result = await db.collection('lessons').updateOne(
            { id: lessonId }, // Match by the custom 'id' field
            { $set: updateData } // Update the provided fields
        );
        if (result.matchedCount === 0) {
            res.status(404).send('Lesson not found');
        } else {
            res.send('Lesson updated successfully');
        }
    } catch (err) {
        console.error('Error updating lesson:', err);
        res.status(500).send('Error updating lesson');
    }
});

// Fallback route to serve index.html for undefined routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gracefully close MongoDB connection on exit
process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection...');
    await client.close();
    process.exit(0);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});
