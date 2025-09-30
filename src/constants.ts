export const CHAIN_ID = 8453;

//We use Alchemy RPC becasue it has custom filters to subscribe to new transactions
export const ALCHEMY_WS_RPC_URL = `wss://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

export const RPC = {
  8453: {
    // Transaciton decoder by default needs archive node for transaction tracing
    // becasue Alchemy free plan does not provide archive nodes, we use a different RPC here
    archiveUrl: process.env.ARCHIVE_RPC_URL,

    // Provide "none" when transaciton tracing is not needed
    traceAPI: "geth",
  },
};

export const CONTRACT_ADDRESS =
  "0xa238dd80c259a72e81d7e4664a9801593f98d1c5".toLowerCase(); // AAVE
export const ETHERSCAN_ENDPOINT = "https://basescan.org";
export const FARCASTER_HUB_URL = "https://hub.farcaster.standardcrypto.vc:2281";
