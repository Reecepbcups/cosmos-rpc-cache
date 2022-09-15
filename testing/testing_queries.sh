LOCAL_NODE="--node http://localhost:4000"
REMOTE_NODE="--node https://juno-rpc.pbcups.org:443"


junod status $LOCAL_NODE
# racoon supply CW20 query
junod q wasm contract-state smart juno1r4pzw8f9z0sypct5l9j906d47z998ulwvhvqe5xdwgy8wf84583sxwh0pa '{"token_info": {}}' --output json $LOCAL_NODE


# for i in {1..100}; do junod status $LOCAL_NODE; done



junod status $REMOTE_NODE
# racoon supply CW20 query
junod q wasm contract-state smart juno1r4pzw8f9z0sypct5l9j906d47z998ulwvhvqe5xdwgy8wf84583sxwh0pa '{"token_info": {}}' --output json $REMOTE_NODE

# for i in {1..100}; do junod status $REMOTE_NODE; done