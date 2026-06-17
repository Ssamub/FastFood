const { getCollection } = require("../db/database.js");
const { ObjectId } = require("mongodb");

function coll() {
    return getCollection("orders"); // per evitare di dover scrivere getCollection("orders") ogni volta
}

async function createOrder(data) {
    const doc = { ...data, createdAt: new Date() };
    const result = await coll().insertOne(doc);
    return { _id: result.insertedId, ...doc };
}

async function getOrdersByClient(email) {
    return coll().find({ clienteEmail: email }).sort({ createdAt: -1 }).toArray();
}

async function getOrdersByRestaurant(email) {
    return coll().find({ ristoranteEmail: email }).sort({ createdAt: -1 }).toArray();
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
            for (const p of ordine.piatti) {
                piattiCompletati += p.quantita;
            }
            let minutiDaScalare = piattiCompletati * 3;

            const ordiniDaAggiornare = await coll().find({
                ristoranteEmail: ordine.ristoranteEmail,
                stato: { $in: ['ordinato', 'in preparazione'] },
                modalita: 'ritiro'
            }).toArray();

            for (const o of ordiniDaAggiornare) {
                let nuovoTempo = (o.tempoAttesaStimato || 0) - minutiDaScalare;
                if (nuovoTempo < 0) nuovoTempo = 0; // Evito tempo negativo
                
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


function contaPiatti(piatti) {
    if (piatti === undefined) {
        piatti = [];
    }

    let totale = 0;
    for (const p of piatti) {
        totale += p.quantita || 1;
    }
    return totale;
}

// come sopra: if (piattiNuovoOrdine === undefined) {piattiNuovoOrdine = [];}    ==     nell'argomento piattiNuovoOrdine = [] : come qui sotto
async function calcolaTempoAttesa(emailRistorante, piattiNuovoOrdine = []) {
    const ordiniInCoda = await coll()
        .find({
            ristoranteEmail: emailRistorante,
            stato: { $in: ['ordinato', 'in preparazione'] },
            modalita: 'ritiro'
        })
        .toArray();

    let piattiInCoda = 0;
    for (const ordine of ordiniInCoda) {
        piattiInCoda += contaPiatti(ordine.piatti);
    }
    return (piattiInCoda + contaPiatti(piattiNuovoOrdine)) * 3;
}

async function getRestaurantStats(email) {
    const ordini = await coll().find({ ristoranteEmail: email, stato: 'consegnato' }).toArray();

    // Calcolo del totale guadagnato e del piatto più venduto
    let totaleGuadagni = 0;
    const conteggioPiatti = {};

    for (const ordine of ordini) {
        totaleGuadagni += ordine.totale;

        for (const piatto of ordine.piatti) {
            if (conteggioPiatti[piatto.nome] === undefined) {
                conteggioPiatti[piatto.nome] = 0;
            }

            conteggioPiatti[piatto.nome] += piatto.quantita;
        }
    }

    const numeroOrdini = ordini.length;

    let piattoPiuVenduto = "-";
    let maxVendite = 0;

    for (const nome in conteggioPiatti) {
        if (conteggioPiatti[nome] > maxVendite) {
            maxVendite = conteggioPiatti[nome];
            piattoPiuVenduto = nome;
        }
    }

    return { totaleGuadagni, numeroOrdini, piattoPiuVenduto, maxVendite };
}

async function haOrdiniAperti(email, ruolo) {
    const query = { stato: { $ne: 'consegnato' } }; // Ordini non completati
    
    if (ruolo === 'ristoratore') {
        query.ristoranteEmail = email;
    } else {
        query.clienteEmail = email;
    }
    
    const openOrder = await coll().findOne(query);

    if (openOrder) {
        return true;
    }
    return false;
}

module.exports = { 
    createOrder, 
    getOrdersByClient, 
    getOrdersByRestaurant, 
    updateOrderStatus,
    calcolaTempoAttesa,
    getRestaurantStats,
    haOrdiniAperti
};