// Express
import express from 'express';
import { config } from 'dotenv';
import { connectToRedis, cache_get, redisClient } from './services/database.service';
// Cors
import cors from 'cors';
// CosmWasmClient
import { getCosmWasmClient } from './services/wasmclient.service';
// Initializes env variables
config();

// Variables
const {
    API_PORT, RPC_URL,
    DB_CONN_STRING, DB_NAME, REDIS_CONN_STRING,
    COINGECKO_SUPPORT, COINGECKO_COINS, COINGECKO_CACHE_TIME } = process.env;

// API initialization
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache
connectToRedis(REDIS_CONN_STRING);
// connectToMongo(DB_CONN_STRING, DB_NAME); // future for long term storage

if (!RPC_URL) {
    console.error('RPC_URL not set');
    process.exit(1);
}

let REPLACE_TEXT = RPC_URL.split("//")[1];

// add check to remove : if another port is used, like 80 or 443?
if (REPLACE_TEXT.includes(":")) {
    REPLACE_TEXT = REPLACE_TEXT.split(":")[0];
}


//  routers
var ROUTER_CACHE: string = "";
var HOST_URL: string = ""
var COINGECKO_URL: string = ""
var COINGECKO_CACHE_SECONDS: number = 6;

const TTLs = {
    default: 6,
    health: 15,
    num_unconfirmed_txs: 30,
    genesis: 60 * 60 * 6, // genesis state, 6 hours
    block_query: 60 * 60, // when specific block Tx data is queried
    tx_query: 60 * 60, // Tx hash
    favicon: 60 * 60 * 12, // always return the same since this never changes
};

let TTL_Bindings = { // just have to ensure we also save any extra params passed through as well to the key
    // long term queries
    '/block_by_hash?': TTLs.block_query,
    '/block?': TTLs.block_query,
    '/block_results?': TTLs.tx_query,
    '/commit?': TTLs.tx_query,
    '/abci_query?': TTLs.tx_query,
    '/check_tx?': TTLs.tx_query,
    '/tx?': TTLs.tx_query,

    // only change on gov prop
    '/genesis?': TTLs.genesis,
    '/genesis_chunked?': TTLs.genesis,
    '/consensus_params?': TTLs.genesis,
    '/validators?': TTLs.genesis,

    '/health?': TTLs.health,
    '/dump_consensus_state?': TTLs.default,
    '/num_unconfirmed_txs?': TTLs.num_unconfirmed_txs,
    '/favicon.ico': TTLs.favicon,
}

// Root of the RPC. Makes 1 query to the real RPC & sets that HTML here.
// If extra data is provided (coingecko, nodeinfo) we append that in the HTML/
// In memory for near instant queries
app.get('/', async (req, res) => {
    if (Object.keys(ROUTER_CACHE).length === 0) {
        const v = await fetch(RPC_URL);
        const html = await v.text();
        HOST_URL = `${req.get('host')}`

        // console.log(REPLACE_TEXT, `${req.get('host')}`);      
        ROUTER_CACHE += html.replaceAll(REPLACE_TEXT, HOST_URL)

        // If support is on & there are coins, we can add this special endpoint for prices
        if (COINGECKO_SUPPORT && COINGECKO_COINS && COINGECKO_SUPPORT.toLowerCase().startsWith("t")) {
            // Optional, default = 6 seconds cache per query.
            if (COINGECKO_CACHE_TIME) { COINGECKO_CACHE_SECONDS = parseInt(COINGECKO_CACHE_TIME); }
            ROUTER_CACHE += `<a href="//${HOST_URL}/prices?">//${HOST_URL}/prices?</a>`
        }        
    }

    res.send(ROUTER_CACHE)
});


// router get any other query endpoint
app.get('*', async (req, res) => {
    const time_start = Date.now();

    // If cache hit, return that value.
    const REDIS_KEY = `rpc_cache:${req.url}`;
    let cached_query = await redisClient?.get(REDIS_KEY); // hset for specific in future?
    if (cached_query) {
        const data = JSON.parse(cached_query);
        data.was_cached = true;
        data.ms_time = Date.now() - time_start;
        res.json(data);
        return;
    }

    // Custom: Coingecko pricing data
    if (COINGECKO_COINS && req.url.startsWith("/prices")) {
        const v = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_COINS}&vs_currencies=usd`).catch((e) => {
            console.error(e);
            res.status(500).send(e);
            return;
        });
        if (v) {
            const json: any = {};
            json.chains = await v.json();

            json.was_cached = false;
            json.ms_time = Date.now() - time_start;
            res.json(json);
            await redisClient?.setEx(REDIS_KEY, 6, JSON.stringify(json));
            return;
        }
        res.status(500).send("Error");
    }

    const the_url = `${RPC_URL}${req.url}`;
    // console.log(the_url, "->>" , req.url);
    const v = await fetch(the_url); // ex: = https://YOUR_RPC/abci_info?

    // checks if req.url starts with anything in TTL_Bindings
    let ttl = TTLs.default;
    for (const key in TTL_Bindings) {
        if (req.url.startsWith(key)) {
            ttl = TTL_Bindings[key];
            // console.log("TTL for ", key , " -> ", ttl);            
            break;
        }
    }

    if (v.headers.get('content-type')?.includes("application/json")) {
        const json_res = await v.json();
        await redisClient?.setEx(REDIS_KEY, ttl, JSON.stringify(json_res));
        json_res.was_cached = false;
        json_res.ms_time = Date.now() - time_start;
        res.send(json_res);
    } else {
        res.send(await v.text());
    }
});

app.post('*', async (req, res) => {
    const time_start = Date.now();
    const the_url = `${RPC_URL}${req.url}`;
    // console.log(the_url, "->>" , req.url);

    if (!req.body?.method) {
        res.status(400).send({ "err": "no body set" });
        return;
    }

    const REDIS_KEY = `rpc_cache:${req.body?.method}:${JSON.stringify(req.body?.params)}`;
    // console.log("POST", REDIS_KEY);        
    let cached_query = await redisClient?.get(REDIS_KEY); // hset for specific in future?
    if (cached_query) {
        const data = JSON.parse(cached_query);
        data.was_cached = true;
        data.ms_time = Date.now() - time_start;
        res.json(data);
        return;
    }

    let body = {};
    if (req.body) {
        body = req.body;
        // console.log("BODY", body);            
    }

    // let headers: string[][] | Record<string, string> | Headers =  { 'Content-Type': 'application/json' };
    // let headers: RequestInit | IncomingHttpHeaders = {};
    // let headers: string[][] | Record<string, string> | Headers = {};
    // if(req.headers) {
    //     headers = req.headers;
    //     headers.origin = HOST_URL
    // }

    // TODO: does this work now?
    // let proxy_headers = {};
    // if(req.headers) {
    //     req.headers.origin = HOST_URL
    //     proxy_headers = req.headers;
    //     console.log(proxy_headers);
    // }

    let headers = { 'content-type': 'application/json', 'origin': HOST_URL };
    if(req.headers) {
        // console.log("headers", req.headers);        
        const arr: string[] = [
            "sec-fetch-mode", "content-type", "accept-language", "x-scheme", "content-length", "accept-encoding",
            "cf-ipcountry", "cf-visitor", "user-agent", "accept", "accept"
        ];
        for(const item of arr) {
            if(req.headers[item]) {
                headers[item] = req.headers[item];
            }
        }
    }

    const v = await fetch(the_url, {
        method: 'POST',
        body: JSON.stringify(req.body), // body or nothing            
        headers: headers,
    }).catch((err) => {
        console.log(err);
        res.status(404).send({ "err": err });
    });

    if (!v) {
        return;
    }

    // return json if the header is json
    if (v.headers.get('content-type')?.includes("application/json")) {
        const json_res = await v.json();
        json_res.was_cached = false;
        json_res.ms_time = Date.now() - time_start;
        await redisClient?.setEx(REDIS_KEY, TTLs.default, JSON.stringify(json_res));
        res.send(json_res);
    } else {
        try {
            const json_res = await v.json();
            json_res.was_cached = false;
            json_res.ms_time = Date.now() - time_start;
            res.send(json_res);
        } catch (e) {
            res.send(await v.text());
        }
    }
});

// Start REST api
app.listen(API_PORT, async () => {
    console.log(`Started RPC cacher on port ${API_PORT}`);
    console.log(`[+] ${RPC_URL}`);

    const client = await getCosmWasmClient();
    if (client) {
        console.log(`Connected to cosmwasm client`);
    } else {
        console.log(`Error cconnecting to the cosmwasm client, is the RPC correct?`);
        process.exit(1);
    }
});
