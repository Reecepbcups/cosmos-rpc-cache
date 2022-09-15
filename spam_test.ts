const { CosmWasmClient} = require("@cosmjs/cosmwasm-stargate");

async function query() {
    var client = await CosmWasmClient.connect("https://juno-rpc.pbcups.org/")

    let array_to_call: any[] = []

    

    // loop 100 times
    for(let i = 0; i < 20; i++) {    
        array_to_call.push(client.queryContractSmart("juno1r4pzw8f9z0sypct5l9j906d47z998ulwvhvqe5xdwgy8wf84583sxwh0pa", {balance: { address: "juno1fkg9kmfa60ckg2syvnz7vxgtkpetmqdnzaxdnz"}}))
    }

    // start timer
    var start = new Date().getTime();

    // promise all array_to_call
    const data = await Promise.all(array_to_call)
    for(let i = 0; i < data.length; i++) {
        console.log(data[i])
    }

    // end timer
    var end = new Date().getTime();
    console.log("Time taken: " + (end - start) + "ms")

    // let query_output = await client.queryContractSmart("juno1r4pzw8f9z0sypct5l9j906d47z998ulwvhvqe5xdwgy8wf84583sxwh0pa", {balance: { address: "juno1fkg9kmfa60ckg2syvnz7vxgtkpetmqdnzaxdnz"}});
    // console.log(query_output);
}

query()