junod status --node http://localhost:4000

# racoon supply CW20 query
junod q wasm contract-state smart juno1r4pzw8f9z0sypct5l9j906d47z998ulwvhvqe5xdwgy8wf84583sxwh0pa '{"token_info": {}}' --output json --node http://localhost:4000