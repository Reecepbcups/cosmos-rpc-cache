# better-cosmos-rpcs
A cheaper way to allow for public RPCs as a service WITHOUT scaling issues.
No need to rate limit either.

---

### How it is done:
1. User GET requests your hosted URL (This is the front end of this MITM interface)
2. This program queries the real RPC, gets the return value, and caches it.
    - For static data (the initial RPC page), it is saved right to variable memory
    - For other more dynamic data, we use a Redis instance to cache it for the blocktime
    - Some queries such as the genesis file have much longer cache times than say, the current status.
<br />
3. The user gets back the response from the server quickly. (~10x in most cases)
4. It appends "was_cached" & the ms_time it took to get the query at the end of all JSON responses.

### Reason:
- If multiple people use the same endpoints, there will be less strain on the actual RPCs.
- This should help RPC scaling for GET requests, hopefully reducing cost for both the users and the RPC providers.
- Anyone can run it, rather than it being Nginx proxy based. By doing so any dAPP could implement this on their own without the RPC needing to do anything on their end. 

---

## Steps to Install:
### Local:
- Install NodeJS & a Redis Server (127.0.0.1:6379 by default)
- Git clone this repository
- copy .env.example to .env
- Edit the .env file to your liking *(Coingecko support is optional)*
- Run `npm install`
- Run `npm start` *(This calls ts-node src/index.ts)*

### Akash:
- Download and Setup the [Cloudmos Deploy tool](https://cloudmos.io/cloud-deploy)
- Create a new Akash Blank Deployment
- Paste the yaml file located at [akash/akash-deploy.yml](akash/akash-deploy.yml)
- Change the RPC_URL to any public-facing RPC you trust (for any network)
- Edit the COINGECKO_COINS to your liking if you have the COINGECKO_SUPPORT=true
- Deploy! Cost can range from $2 per month up to as many resources as you want to give it.

Future TODO:
```
- Allow ENV file to specify each type of Tx cache time (based on requests)
- if using the rest API, actually use a a CosmWasm client against the RPC to speed up requests? (then cache via blocktime seconds)
- Allow cycling between RPCs, if requests fails retry to another RPC & remove bad one from list
```