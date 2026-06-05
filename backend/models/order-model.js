const { getCollection } = require("../db/database.js");
const { ObjectId } = require("mongodb");

const coll = () => getCollection("orders");

async function createOrder(data) {
    const doc = { ...data, createdAt: new Date() };
    const result = await coll().insertOne(doc);
    return { _id: result.insertedId, ...doc };
}

async function getOrdersByClient(email) {
    return coll().find({ clienteEmail: email }).sort({ createdAt: -1 }).toArray();
}

async function getOrdersByRestaurant(email) {
    return coll().find({ ristoranteEmail: email }).sort({ createdAt: 1 }).toArray();
}

async function updateOrderStatus(id, nuovoStato) {
    const result = await coll().updateOne(
        { _id: new ObjectId(id) },
        { $set: { stato: nuovoStato } }
    );
    return result.modifiedCount > 0;
}

async function calcolaTempoAttesa(emailRistorante) {
    const ordiniInCoda = await coll().countDocuments({
        ristoranteEmail: emailRistorante,
        stato: { $in: ['ordinato', 'in preparazione'] },
        modalita: 'ritiro'
    });
    return (ordiniInCoda * 10) + 15;
}

async function getRestaurantStats(email) {
    // Calcola le statistiche solo sugli ordini effettivamente consegnati
    const ordini = await coll().find({ ristoranteEmail: email, stato: 'consegnato' }).toArray();
    
    const totaleGuadagni = ordini.reduce((sum, o) => sum + o.totale, 0);
    const numeroOrdini = ordini.length;

    // Calcolo del piatto più venduto
    const conteggioPiatti = {};
    ordini.forEach(o => {
        o.piatti.forEach(p => {
            conteggioPiatti[p.nome] = (conteggioPiatti[p.nome] || 0) + p.quantita;
        });
    });

    let piattoPiuVenduto = "-";
    let maxVendite = 0;
    for (const [nome, qta] of Object.entries(conteggioPiatti)) {
        if (qta > maxVendite) {
            maxVendite = qta;
            piattoPiuVenduto = nome;
        }
    }

    return { totaleGuadagni, numeroOrdini, piattoPiuVenduto, maxVendite };
}

module.exports = { 
    createOrder, 
    getOrdersByClient, 
    getOrdersByRestaurant, 
    updateOrderStatus,
    calcolaTempoAttesa,
    getRestaurantStats
};