const { MongoClient } = require('mongodb');
require('dotenv').config({path: './.env'});

async function run() {
    const url = "mongodb+srv://vegdadego:baqueta2@questeval.m5lf1at.mongodb.net/?retryWrites=true&w=majority&appName=QuestEval";
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db('QuestEvalDb');
    
    const projects = await db.collection('projects').find({}).toArray();
    for (const p of projects) {
        console.log(p.Name, p.CreatedAt);
        let update = {};
        
        let created = p.CreatedAt;
        let updated = p.UpdatedAt;

        if (created && typeof created === 'object') {
            if (created['$date']) update.CreatedAt = new Date(created['$date']);
            if (created['"$date"']) update.CreatedAt = new Date(created['"$date"']);
        } else if (typeof created === 'string') {
            update.CreatedAt = new Date(created);
        }

        if (updated && typeof updated === 'object') {
            if (updated['$date']) update.UpdatedAt = new Date(updated['$date']);
            if (updated['"$date"']) update.UpdatedAt = new Date(updated['"$date"']);
        } else if (typeof updated === 'string') {
            update.UpdatedAt = new Date(updated);
        }

        if (Object.keys(update).length > 0) {
            await db.collection('projects').updateOne({_id: p._id}, {$set: update});
            console.log('Fixed project', p.Name);
        }
    }
    
    await client.close();
    console.log("Done");
}

run().catch(console.error);