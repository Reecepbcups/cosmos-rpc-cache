# better-cosmos-rpcs
A cheaper way to allow for public RPCs as a service WITHOUT scaling issues.
No need to rate limit either.

## How it is done:
1. User GET requests your hosted URL (This is the front end of this MITM interface)
2. This program queries the real RPC, gets the return value, and caches it.
    - For static data (the initial RPC page), it is saved right to variable memory
    - For other more dynamic data, we use a Redis instance to cache it for the blocktime
    - Some queries such as the genesis file have much longer cache times than say, the current status.
<br />
3. The user gets back the response from the server quickly. (~10x in most cases)
4. It appends "was_cached" & the ms_time it took to get the query at the end of all JSON responses.

Reason:
- If multiple people use the same endpoints, there will be less strain on the actual RPCs.
- This should help RPC scaling for GET requests, hopefully reducing cost for both the users and the RPC providers.


TODO:
```
- Allow ENV file to specify each type of Tx cache time (based on requests)
- if using the rest API, actually use a a CosmWasm client against the RPC to speed up requests? (then cache via blocktime seconds)
- Allow cycling betwen RPCs, if requests fails retry to another RPC & remove bad one from list
```