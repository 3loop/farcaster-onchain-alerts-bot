import { createPublicClient, webSocket } from "viem";
import type { ContractData } from "@3loop/transaction-decoder";
import {
  TransactionDecoder,
  FourByteStrategyResolver,
  ERC20RPCStrategyResolver,
  EtherscanStrategyResolver,
} from "@3loop/transaction-decoder";
import { RPC } from "../constants";

const abiCache = new Map<string, string>();
const contractMetaCache = new Map<string, ContractData>();

const abiStore = {
  strategies: [
    EtherscanStrategyResolver({
      apikey: process.env.ETHERSCAN_API_KEY || "",
    }),
    FourByteStrategyResolver(),
  ],
  get: async (req: { address: string }) => {
    return Promise.resolve(abiCache.get(req.address.toLowerCase()) ?? null);
  },
  set: async (req: { address?: Record<string, string> }) => {
    const addresses = Object.keys(req.address ?? {});

    addresses.forEach((address) => {
      abiCache.set(address.toLowerCase(), req.address?.[address] ?? "");
    });
  },
};

const contractMetaStore = {
  strategies: [ERC20RPCStrategyResolver],
  get: async (req: { address: string; chainID: number }) => {
    return contractMetaCache.get(req.address.toLowerCase()) ?? null;
  },
  set: async (
    req: { address: string; chainID: number },
    data: ContractData
  ) => {
    contractMetaCache.set(req.address.toLowerCase(), data);
  },
};

const getPublicClient = (chainId: number) => {
  const rpc = RPC[chainId as keyof typeof RPC];

  if (!rpc) {
    throw new Error(`Missing RPC provider for chain ID ${chainId}`);
  }

  return {
    client: createPublicClient({
      transport: webSocket(rpc.url),
    }),
    config: {
      supportTraceAPI: rpc.supportTraceAPI,
    },
  };
};

export const decoder = new TransactionDecoder({
  getPublicClient: getPublicClient,
  abiStore: abiStore,
  contractMetaStore: contractMetaStore,
  logging: false,
});
