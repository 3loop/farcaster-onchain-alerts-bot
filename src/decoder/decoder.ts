import { createPublicClient, http } from "viem";
import type {
  ContractABI,
  ContractData,
  VanillaAbiStore,
  VanillaContractMetaStore,
} from "@3loop/transaction-decoder";
import {
  TransactionDecoder,
  FourByteStrategyResolver,
  ERC20RPCStrategyResolver,
  EtherscanV2StrategyResolver,
} from "@3loop/transaction-decoder";
import { RPC } from "../constants";

// Cache for storing ABI and contract metadata
const abiCache = new Map<string, ContractABI>();
const contractMetaCache = new Map<string, ContractData>();

/**
 * ABI store implementation with caching and multiple resolution strategies
 */
const abiStore: VanillaAbiStore = {
  strategies: [
    EtherscanV2StrategyResolver({
      apikey: process.env.ETHERSCAN_API_KEY || "",
    }),
    FourByteStrategyResolver(),
  ],

  get: async ({ address, event, signature }) => {
    const key = address?.toLowerCase() || event || signature;
    if (!key) return [];

    const cached = abiCache.get(key);
    return cached
      ? [
          {
            ...cached,
            id: key,
            source: "etherscan" as const,
            status: "success" as const,
          },
        ]
      : [];
  },

  set: async (_key, abi) => {
    const key =
      abi.type === "address"
        ? abi.address.toLowerCase()
        : abi.type === "event"
        ? abi.event
        : abi.type === "func"
        ? abi.signature
        : null;

    if (key) abiCache.set(key, abi);
  },
};

/**
 * Contract metadata store implementation with caching
 */
const contractMetaStore: VanillaContractMetaStore = {
  strategies: [ERC20RPCStrategyResolver],

  get: async ({ address, chainID }) => {
    const key = `${address}-${chainID}`.toLowerCase();
    const cached = contractMetaCache.get(key);
    return cached
      ? { status: "success" as const, result: cached }
      : { status: "empty" as const, result: null };
  },

  set: async ({ address, chainID }, result) => {
    if (result.status === "success") {
      contractMetaCache.set(
        `${address}-${chainID}`.toLowerCase(),
        result.result
      );
    }
  },
};

/**
 * Creates a public client for the specified chain ID
 */
const getPublicClient = (chainId: number) => {
  const rpc = RPC[chainId as keyof typeof RPC];
  if (!rpc) throw new Error(`Missing RPC provider for chain ID ${chainId}`);

  return {
    client: createPublicClient({ transport: http(rpc.archiveUrl) }),
    config: { traceAPI: rpc.traceAPI as "parity" | "geth" | "none" },
  };
};

/**
 * Transaction decoder instance configured with ABI and contract metadata stores
 */
export const decoder = new TransactionDecoder({
  getPublicClient,
  abiStore,
  contractMetaStore,
  // logLevel: "None",
});
