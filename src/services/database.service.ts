import * as mongo from 'mongodb';
import * as redis from 'redis';

// List of loaded mongo collections
export const collections: { 
    some_collection?: mongo.Collection;
} = {};
// Connected redis client
export let redisClient: redis.RedisClientType<any, any>;

/**
 * Connect to MongoDB
 *
 * @param connectionString Connection string
 * @param dbName Name of database
 */
export const connectToMongo = async (connectionString, dbName) => {    
    const client: mongo.MongoClient = new mongo.MongoClient(connectionString);
    await client.connect();

    const db: mongo.Db = client.db(dbName);
    
    collections.some_collection = db.collection('some_collection_here');

    console.log(`Successfully connected to Mongo Database ${db.databaseName}`);
};

/**
 * Connect to Redis
 * 
 * @param connectionString Connection string
 */
export const connectToRedis = async (connectionString) => {
    redisClient = redis.createClient({
        url: connectionString
    });

    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('ready', () => console.log('Successfully connected to Redis Server'));

    await redisClient.connect();

    // Auth - No longer required when done in URI
    // redisClient.sendCommand(['AUTH', auth])
}


// TODO: wip
export const cache_get = async (key: string, value_if_not_found: any = null, TTL: number = 0) => {
    const cached = await redisClient?.get(key);
    if (cached) {
        return JSON.parse(cached);
    }

    if(value_if_not_found) {
        await redisClient?.set(key, JSON.stringify(value_if_not_found));
        if(TTL > 0) {
            await redisClient?.expire(key, TTL);
        }
    }

    return value_if_not_found;
}