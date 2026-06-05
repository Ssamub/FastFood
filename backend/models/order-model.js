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
    const ordine = await coll().findOne({ _id: new ObjectId(id) });
    if (!ordine) return false;

    const statiCucina = ['ordinato', 'in preparazione'];
    const statiFiniti = ['in consegna', 'consegnato'];

    const result = await coll().updateOne(
        { _id: new ObjectId(id) },
        { $set: { stato: nuovoStato } }
    );

    if (result.modifiedCount > 0) {
        if (statiCucina.includes(ordine.stato) && statiFiniti.includes(nuovoStato)) {
            let piattiCompletati = 0;
            ordine.piatti.forEach(p => piattiCompletati += p.quantita);
            let minutiDaScalare = piattiCompletati * 3;

            const ordiniDaAggiornare = await coll().find({
                ristoranteEmail: ordine.ristoranteEmail,
                stato: { $in: ['ordinato', 'in preparazione'] },
                modalita: 'ritiro'
            }).toArray();

            for (const o of ordiniDaAggiornare) {
                let nuovoTempo = (o.tempoAttesaStimato || 0) - minutiDaScalare;
                if (nuovoTempo < 0) nuovoTempo = 0; // Evitiamo che il tempo diventi negativo!
                
                await coll().updateOne(
                    { _id: o._id },
                    { $set: { tempoAttesaStimato: nuovoTempo } }
                );
            }
        }
        return true;
    }
    return false;
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