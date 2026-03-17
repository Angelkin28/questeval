const { MongoClient } = require('mongodb');
async function run() {
  const c = new MongoClient('mongodb+srv://vegdadego:baqueta2@questeval.m5lf1at.mongodb.net/QuestEvalDb?retryWrites=true&w=majority&appName=QuestEval');
  await c.connect();
  const db = c.db('QuestEvalDb');
  const r = await db.collection('database_counters').replaceOne(
    { _id: 'projects' },
    { _id: 'projects', LastId: 0 }
  );
  console.log('matched:', r.matchedCount, 'modified:', r.modifiedCount);
  await c.close();
}
run().catch(console.error);
