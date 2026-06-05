const express = require('express');
const bcrypt = require('bcrypt');

const { getUserByEmail, createUser, updateUser, deleteUser } = require('../models/user-model.js');
const { deleteRestaurantByEmail } = require('../models/restaurant-model.js');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { ruolo, nome, cognome, email, password, indirizzo, metodoPagamento, preferenze } = req.body;

    if (!nome || nome.length < 2) return res.status(400).json({ error: "Nome troppo corto" });
    if (!cognome || cognome.length < 2) return res.status(400).json({ error: "Cognome troppo corto" });
    if (!password || password.length < 6) return res.status(400).json({ error: "Password troppo corta" });
        
    const lowerEmail = email.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = {
            ruolo: ruolo,
            nome: nome, 
            cognome: cognome, 
            email: lowerEmail,
            password: hashedPassword,
            indirizzo: indirizzo,
            metodoPagamento: metodoPagamento, 
            preferenze: preferenze 
        };

        await createUser(user);
        
        res.status(201).json({ 
            message: "Registrazione completata",
            user: {
                ruolo,
                nome,
                cognome,
                email: lowerEmail, 
                indirizzo,
                metodoPagamento,
                preferenze
            }
        });
        
    } catch (err) {
        if (err.code === 11000) {
            res.status(409).json({ error: "Email già in uso" });
        } else {
            res.status(500).json({ error: "Errore del server" });
        }
    }
});

router.post('/login', async (req, res) => {
    const { ruolo, email, password } = req.body;
    const lowerEmail = email.toLowerCase();

    try {
        const user = await getUserByEmail(lowerEmail);
        if (!user) {
            return res.status(401).json({ error: "Credenziali Errate" });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (user.ruolo === ruolo && passwordMatch) {
            res.json({
                message: "Login riuscito",
                user: {
                    ruolo: user.ruolo,
                    nome: user.nome,
                    cognome: user.cognome,
                    email: user.email,
                    indirizzo: user.indirizzo,
                    metodoPagamento: user.metodoPagamento,
                    preferenze: user.preferenze
                }
            });
        } else {
            res.status(401).json({ error: "Credenziali Errate" });
        }
    } catch (error) {
        res.status(500).json({ error: "Errore del server" });
    }
});

router.put('/profile/update', async (req, res) => {
    const { email, nome, cognome, indirizzo, metodoPagamento, preferenze } = req.body;
    const lowerEmail = email.toLowerCase();

    try {
        const updateData = { 
            nome: nome, 
            cognome: cognome, 
            indirizzo: indirizzo, 
            metodoPagamento: metodoPagamento, 
            preferenze: preferenze 
        };
        
        const result = await updateUser(lowerEmail, updateData);

        if (result.matchedCount > 0) {
            res.json({ message: "Profilo aggiornato" });
        } else {
            res.status(404).json({ error: "Utente non trovato" });
        }
    } catch (err) {
        res.status(500).json({ error: "Errore del server" });
    }
});

router.delete('/profile/delete', async (req, res) => {
        const { email } = req.body;
        const lowerEmail = email.toLowerCase();

    try {
        const user = await getUserByEmail(lowerEmail);
        
        if (user) {
            await deleteUser(lowerEmail);
            
            if (user.ruolo === 'ristoratore') {
                await deleteRestaurantByEmail(lowerEmail);
            }
            res.json({ message: "Profilo eliminato con successo" });
        } else {
            res.status(404).json({ error: "Utente non trovato" });
        }
    } catch (err) {
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;