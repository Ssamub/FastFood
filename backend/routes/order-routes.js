const express = require('express');
const { 
    createOrder, 
    getOrdersByClient, 
    getOrdersByRestaurant, 
    updateOrderStatus,
    calcolaTempoAttesa,
    getRestaurantStats
} = require('../models/order-model.js');

const router = express.Router();

router.post('/order/create', async (req, res) => {
    try {
        const { clienteEmail, ristoranteEmail, piatti, totale, modalita, luogoConsegna } = req.body;

        let tempoAttesaStimato = null;
        if (modalita === 'ritiro') {
            tempoAttesaStimato = await calcolaTempoAttesa(ristoranteEmail, piatti);
        }

        const ordine = await createOrder({
            clienteEmail,
            ristoranteEmail,
            piatti,
            totale,
            modalita,
            luogoConsegna: modalita === 'domicilio' ? luogoConsegna : null,
            tempoAttesaStimato,
            stato: 'ordinato'
        });

        res.status(201).json(ordine);
    } catch (err) {
        res.status(500).json({ error: "Errore creazione ordine" });
    }
});

router.get('/order/client/:email', async (req, res) => {
    try {
        const ordini = await getOrdersByClient(req.params.email);
        res.json(ordini);
    } catch (err) {
        res.status(500).json({ error: "Errore recupero ordini" });
    }
});

router.get('/order/restaurant/:email', async (req, res) => {
    try {
        const ordini = await getOrdersByRestaurant(req.params.email);
        res.json(ordini);
    } catch (err) {
        res.status(500).json({ error: "Errore recupero ordini" });
    }
});

router.put('/order/:id/status', async (req, res) => {
    try {
        const { stato } = req.body;
        const success = await updateOrderStatus(req.params.id, stato);
        if (success) {
            res.json({ message: "Stato aggiornato" });
        } else {
            res.status(404).json({ error: "Ordine non trovato" });
        }
    } catch (err) {
        res.status(500).json({ error: "Errore aggiornamento stato" });
    }
});

router.get('/order/stats/:email', async (req, res) => {
    try {
        const stats = await getRestaurantStats(req.params.email);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: "Errore calcolo statistiche" });
    }
});

module.exports = router;