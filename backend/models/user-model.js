const { getCollection } = require("../db/database.js");
const { ObjectId } = require('mongodb');

const coll = () => getCollection("users");

async function getUserById(id) {
    return await coll().findOne({ _id: ObjectId.createFromHexString(id) });
}

async function getUserByEmail(email) {
    return await coll().findOne({ email: email });
}

async function loginUser(email, password) {
    return await coll().findOne({ email: email }, { password: password });
}

async function createUser(user) {
    return await coll().insertOne(user);
}

async function updateUser(email, updateData) {
    return await coll().updateOne({ email: email }, { $set: updateData });
}

async function deleteUser(email) {
    return await coll().deleteOne({ email: email });
}

module.exports = {
    getUserById,
    getUserByEmail,
    loginUser,
    createUser,
    updateUser,
    deleteUser
};