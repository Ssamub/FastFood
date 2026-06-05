const { MongoClient } = require("mongodb"); //mongoclient?

const mongoURL = "mongodb+srv://s4mu:lamammaebella@cluster0.b2nswh9.mongodb.net/";
const client = new MongoClient(mongoURL);
let db;

async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db('fastFood');
    }
    return db;
}

function getCollection(name) {
    return db.collection(name);
}

module.exports = { connectDB, getCollection };