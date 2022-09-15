'''
Give the RPC hell wqith async requests
'''


import asyncio
import time 
import aiohttp
from aiohttp.client import ClientSession
import random as r

async def req(url:str,session:ClientSession):
    async with session.get(url) as response:
        result = await response.text()
        print(f'Read {len(result)} from {url}')

async def make_requests(urls:list):
    my_conn = aiohttp.TCPConnector(limit=25)
    async with aiohttp.ClientSession(connector=my_conn) as session:
        tasks = []
        for url in urls:
            if "%NUMBER%" in url:
                url = url.replace("%NUMBER%", str(r.randint(4412839, 4_800_000)))
            task = asyncio.ensure_future(req(url=url,session=session))
            tasks.append(task)
        await asyncio.gather(*tasks,return_exceptions=True)

url_list = [
    "https://juno-rpc.pbcups.org/status?",
    "https://juno-rpc.pbcups.org/abci_info?",
    "https://juno-rpc.pbcups.org/consensus_state?",
    "https://juno-rpc.pbcups.org/num_unconfirmed_txs?",
    "https://juno-rpc.pbcups.org/health?",
    "https://juno-rpc.pbcups.org/consensus_params?height=4500000",
    # "https://juno-rpc.pbcups.org/block?height=%NUMBER%"
]*10

print(url_list)
start = time.time()
asyncio.run(make_requests(url_list))
end = time.time()
print(f'Did {len(url_list)} requests in {end - start} seconds')