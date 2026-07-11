import { MongoClient } from 'mongodb';

const uri = process.env.atlas_URL; // Your friend's Atlas connection string
const client = new MongoClient(uri);

async function createVectorIndex() {
  try {
    await client.connect();
    const database = client.db(); // Use your database name
    const collection = database.collection('users'); // Or 'taskers' collection

    const indexName = 'tasker_semantic_search';

    // Check if index already exists to avoid errors
    const existingIndexes = await collection.listSearchIndexes().toArray();
    if (existingIndexes.some(idx => idx.name === indexName)) {
      console.log(`🟡 Vector index "${indexName}" already exists. Skipping creation.`);
      return;
    }

    console.log(`🔵 Creating vector search index "${indexName}" on collection "users"...`);

    const result = await database.command({
      createSearchIndexes: collection.collectionName,
      indexes: [
        {
          name: indexName,
          type: 'vectorSearch',
          definition: {
            fields: [
              {
                type: 'vector',
                path: 'embedding', // The field where you will store the array of numbers
                numDimensions: 768, // Or the dimension you choose for your embedding model
                similarity: 'cosine', // 'cosine', 'euclidean', or 'dotProduct'
              },
            ],
          },
        },
      ],
    });

    console.log('✅ Vector search index created successfully!', result);
  } catch (error) {
    console.error('❌ Failed to create vector search index:', error);
  } finally {
    await client.close();
  }
}

createVectorIndex();