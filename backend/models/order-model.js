const { getCollection } = require("../db/database.js");
const { ObjectId } = require("mongodb");

const coll = () => getCollection("orders");

async function createOrder(data) {
    const doc = { ...data, createdAt: new Date() };
    const result = await coll().insertOne(doc);
    return { _id: result.insertedId, ...doc };
}

async function getOrdersByClient(email) {
    const ordini = await coll().find({ clienteEmail: email }).sort({ createdAt: -1 }).toArray();
    const ristorantiRitiro = [...new Set(
        ordini
            .filter(o => o.modalita === 'ritiro')
            .map(o => o.ristoranteEmail)
    )];

    if (ristorantiRitiro.length === 0) {
        return ordini;
    }

    const tempiPerOrdine = new Map();
    for (const ristoranteEmail of ristorantiRitiro) {
        const coda = await coll()
            .find({
                ristoranteEmail,
                stato: { $in: ['ordinato', 'in preparazione'] },
                modalita: 'ritiro'
            })
            .sort({ createdAt: 1 })
            .toArray();

        let piattiInCoda = 0;
        for (const ordine of coda) {
            piattiInCoda += contaPiatti(ordine.piatti);
            tempiPerOrdine.set(String(ordine._id), piattiInCoda * 3);
        }
    }

    ordini.forEach(o => {
        if (o.modalita !== 'ritiro') return;
        const tempoStimato = tempiPerOrdine.get(String(o._id));
        if (tempoStimato !== undefined) {
            o.tempoAttesaStimato = tempoStimato;
            return;
        }
        if (o.stato === 'consegnato') {
            o.tempoAttesaStimato = 0;
            return;
        }
        o.tempoAttesaStimato = contaPiatti(o.piatti) * 3;
    });

    return ordini;
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

function contaPiatti(piatti = []) {
    return piatti.reduce((totale, p) => totale + (p.quantita || 1), 0);
}

async function calcolaTempoAttesa(emailRistorante, piattiNuovoOrdine = []) {
    const ordiniInCoda = await coll()
        .find({
            ristoranteEmail: emailRistorante,
            stato: { $in: ['ordinato', 'in preparazione'] },
            modalita: 'ritiro'
        })
        .toArray();

    const piattiInCoda = ordiniInCoda.reduce(
        (totale, ordine) => totale + contaPiatti(ordine.piatti),
        0
    );
    return (piattiInCoda + contaPiatti(piattiNuovoOrdine)) * 3;
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