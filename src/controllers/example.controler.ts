import { Request, Response } from 'express';
import { getCosmWasmClient } from '../services/wasmclient.service';

// Future with Rest Endpoint i think
export const getSomeQuery = async (req: Request, res: Response) => {
    // const { parent_contract_address } = req.params;
    // const client = await getCosmWasmClient();
    // if(!client) { return res.status(500).json({ message: `Error: could not connect to craft node.` }); }

    // const found = await someFunction(client, parent_contract_address);
    // if (found) return res.status(200).json(found) 
    // else return res.status(404).json({ message: 'Specific contract offerings not found' });
};

export default {
    getSomeQuery,
};