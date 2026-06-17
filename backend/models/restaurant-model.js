const { getCollection } = require("../db/database.js");
const { ObjectId } = require("mongodb");

function coll() {
    return getCollection("restaurants"); // per evitare di dover scrivere getCollection("restaurants") ogni volta
}

async function getAllRestaurants() {
    return coll().find({}).toArray();
}

async function getRestaurantByEmail(email) {
    return coll().findOne({ emailRistoratore: email });
}

async function upsertRestaurantProfile(email, data) {
    const result = await coll().updateOne(
        { emailRistoratore: email },
        {
            $set: {
                nomeRistorante: data.nomeRistorante,
                telefono: data.telefono,
                partitaIva: data.partitaIva,
                indirizzo: data.indirizzo,
            },
            $setOnInsert: {
                emailRistoratore: email,
                menu: [],
            }
        },
        { upsert: true }
    );
    return result;
}

async function addMenuItem(email, itemData) {
    const newItem = {
        _id: new ObjectId(),
        ...itemData
    };
    const result = await coll().updateOne(
        { emailRistoratore: email },
        { $push: { menu: newItem } }
    );
    return result.modifiedCount > 0;
}

async function removeMenuItem(email, itemId) {
    const result = await coll().updateOne(
        { emailRistoratore: email },
        { $pull: { menu: { _id: new ObjectId(itemId) } } }
    );
    return result.modifiedCount > 0;
}

async function deleteRestaurantByEmail(email) {
    const result = await coll().deleteOne({ emailRistoratore: email });
    return result.deletedCount > 0;
}

module.exports = {
    getAllRestaurants,
    getRestaurantByEmail,
    upsertRestaurantProfile,
    addMenuItem,
    removeMenuItem,
    deleteRestaurantByEmail
};