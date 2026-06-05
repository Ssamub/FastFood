const fs = require('fs');
const path = require('path');
const { getCollection } = require('./database.js');

async function initMeals() {
    const coll = getCollection('meals');
    const count = await coll.countDocuments();

    if (count === 0) {
        const filePath = path.join(__dirname, '..', 'data', 'meals.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const meals = JSON.parse(data);
        await coll.insertMany(meals);
    }
}

module.exports = { initMeals };