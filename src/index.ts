// Express
import express from 'express';
import { config } from 'dotenv';
import { connectToRedis, cache_get, redisClient } from './services/database.service';
// Cors
import cors from 'cors';

// import fs
import fs from 'fs';

// Controllers
// import realestateRouter from './routes/realestate.route';

// Initializes env variables
config();

// Variables
const { API_PORT, DB_CONN_STRING, DB_NAME, REDIS_CONN_STRING, DAO_EXP_MODULE_ONLY } = process.env;

// API initialization
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache
connectToRedis(REDIS_CONN_STRING);
// connectToMongo(DB_CONN_STRING, DB_NAME);


const URL = "https://craft-rpc.crafteconomy.io"; // ensure it does not end with a / when loading in
// const REPLACE_TEXT = "craft-rpc.crafteconomy.io";
const REPLACE_TEXT = URL.split("//")[1];


// Run on start to get block time data so we know when to reset the cache
// and / or we subscribe to new blocks & just reset it then?
// Though we may want a long term cache solution for some endpoints (ex: block, Tx query. )
// const get_block_data = async () => { // in seconds
//     const latest_block = await (await fetch(URL + "/status?")).json();    
//     const latest_block_height = latest_block.result.sync_info.latest_block_height; // 232048
//     const latest_block_date = new Date(latest_block.result.sync_info.latest_block_time); // 2022-09-14T09:40:49.83358047Z
    
//     const last_block_time = await (await fetch(URL + `/block?height=${latest_block_height-1}`)).json();
//     const last_blocks_date = new Date(last_block_time.result.block.header.time); // 2022-09-14T09:40:49.83358047Z
        
//     const time_difference = (latest_block_date.getTime() - last_blocks_date.getTime())/1_000; // seconds between blocks
//     console.log(time_difference);
//     return {
//         last_time: latest_block.result.sync_info.latest_block_time, // iso string (so we can know to reset a few MS after the avg block time)
//         time_difference: time_difference
//     };
// }


// Sends all our API endpoints
//  routers
var ROUTER_CACHE: string = "";

const TTLs = {
    default: 6,
    health: 15,
    num_unconfirmed_txs: 30, 
    genesis: 60*60*2, // genesis state, 2 hours
    block_query: 60*60, // when specific block Tx data is queried
    tx_query: 60*60, // Tx hash
};

let TTL_Bindings = { // just have to ensure we also save any extra params passed through as well to the key
    // long term queries
    'block_by_hash?': TTLs.block_query,
    'block?': TTLs.block_query,
    'block_results?': TTLs.tx_query,
    'commit?': TTLs.tx_query,
    'abci_query?': TTLs.tx_query,
    'check_tx?': TTLs.tx_query,
    'tx?': TTLs.tx_query,    

    // only change on gov prop
    'genesis?': TTLs.genesis,
    'genesis_chunked?': TTLs.genesis,
    'consensus_params?': TTLs.genesis,
    'validators?': TTLs.genesis,    

    'health?': TTLs.health,
    'dump_consensus_state?': TTLs.default,
    'num_unconfirmed_txs?': TTLs.num_unconfirmed_txs,                   
}

app.get('/', async (req, res) => {
    // if(block_time == 0) {
    //     block_time = Math.round((await get_block_data()).time_difference);
    // }

    if(Object.keys(ROUTER_CACHE).length === 0) {        
        // const urlStart = `${req.protocol}://${req.get('host')}`

        // make a requests to URL & save all data to ROUTER_CACHE as the HTML
        const v = await fetch(URL);
        const html = await v.text();        
                
        const updated = html.replaceAll(REPLACE_TEXT, `${req.get('host')}`)
        ROUTER_CACHE = updated;
    }
    
    res.send(ROUTER_CACHE)
});


// router get any other query endpoint
app.get('*', async (req, res) => {
    const time_start = Date.now();
    
    //check if URL is in cache, if so use that    
    const REDIS_KEY = `rpc_cache:${req.url}`;
    // const REDIS_HSET_KEY = `${coin}` // for marketplace expansion
    // let cached_usd_price = await redisClient?.hGet(REDIS_KEY, REDIS_HSET_KEY);

    let cached_query = await redisClient?.get(REDIS_KEY);        
    if (cached_query) {    
        const data = JSON.parse(cached_query);
        data.was_cached = true;
        data.ms_time = Date.now() - time_start;
        res.json(data);
        return;
    } 

    const the_url = `${URL}${req.url}`;
    // console.log(the_url);
    
    const v = await fetch(the_url); // ex: = https://rpc/abci_info?

    if(v.status == 200 && v.headers.get('content-type')?.includes("application/json")) {
        const json_res = await v.json();    
        await redisClient?.setEx(REDIS_KEY, TTLs.default, JSON.stringify(json_res));
        json_res.was_cached = false;
        json_res.ms_time = Date.now() - time_start;
        res.send(json_res);
        return;
    }
    
    res.send(await v.text());
});

// TODO: if using the rest API, actually use a a CosmWasm client against the RPC to speed up requests?



// Start REST api
app.listen(API_PORT, async () => {
    console.log(`Started Juno RPC cacher on port ${API_PORT}`);

    // const client = await getCosmWasmClient();
    // if(client) {
    //     console.log(`Connected to Craftd node: ${process.env.CRAFTD_NODE}`);
    // } else {
    //     console.log(`Error connecting to Craftd node: ${process.env.CRAFTD_NODE}/`);
    //     process.exit(1);
    // }
});
