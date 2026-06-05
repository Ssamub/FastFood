const express = require('express');
const { 
    getAllRestaurants, 
    getRestaurantByEmail, 
    upsertRestaurantProfile, 
    addMenuItem, 
    removeMenuItem 
} = require('../models/restaurant-model.js');

const router = express.Router();

router.get('/restaurants', async (req, res) => {
    try {
        const ristoranti = await getAllRestaurants();
        res.json(ristoranti);
    } catch (err) {
        res.status(500).json({ error: "Errore interno" });
    }
});

router.get('/restaurant/profile/:email', async (req, res) => {
    try {
        const lowerEmail = req.params.email.toLowerCase();
        const rest = await getRestaurantByEmail(lowerEmail);
        if (rest) {
            res.json(rest);
        } else {
            res.status(404).json({ error: "Ristorante non trovato" });
        }
    } catch (err) {
        res.status(500).json({ error: "Errore interno" });
    }
});

router.put('/restaurant/profile', async (req, res) => {
    try {
        const { email, nomeRistorante, telefono, partitaIva, indirizzo } = req.body;
        const lowerEmail = email.toLowerCase();
        await upsertRestaurantProfile(lowerEmail, { nomeRistorante, telefono, partitaIva, indirizzo });
        res.json({ message: "Profilo ristorante aggiornato" });
    } catch (err) {
        res.status(500).json({ error: "Errore interno" });
    }
});

router.post('/restaurant/menu', async (req, res) => {
    try {
        const { email, nome, tipologia, prezzo, ingredienti, foto } = req.body;
        const lowerEmail = email.toLowerCase();
        await addMenuItem(lowerEmail, { nome, tipologia, prezzo, ingredienti, foto });
        res.status(201).json({ message: "Piatto aggiunto" });
    } catch (err) {
        res.status(500).json({ error: "Errore interno" });
    }
});

router.delete('/restaurant/menu/:email/:id', async (req, res) => {
    try {
        const lowerEmail = req.params.email.toLowerCase();
        const success = await removeMenuItem(lowerEmail, req.params.id);
        if (success) {
            res.json({ message: "Piatto rimosso" });
        } else {
            res.status(404).json({ error: "Piatto non trovato" });
        }
    } catch (err) {
        res.status(500).json({ error: "Errore interno" });
    }
});

module.exports = router;