// Non so se serva inizializzare il database con i pasti, se passo direttamente tutte le mie collection di MongoDB già create
// ma lo faccio comunque per sicurezza

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