# better-cosmos-rpcs
A cheaper way to allow for public RPCs as a service WITHOUT scaling issues.
No need to rate limit either.


TODO:
```
- Allow ENV file to specify each type of Tx cache time (based on requests)
- if using the rest API, actually use a a CosmWasm client against the RPC to speed up requests? (then cache via blocktime seconds)
- Allow cycling betwen RPCs, if requests fails retry to another RPC & remove bad one from list
```