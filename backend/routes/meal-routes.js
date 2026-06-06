const express = require('express');
const { getCollection } = require('../db/database.js');

const router = express.Router();

router.get('/meal/list', async (req, res) => {
    try {
        const coll = getCollection('meals');
        const result = await coll.find({}).toArray();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Errore" });
    }
});

module.exports = router;