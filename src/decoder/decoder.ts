import { createPublicClient, webSocket } from "viem";
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
  EtherscanStrategyResolver,
} from "@3loop/transaction-decoder";
import { RPC } from "../constants";

const abiCache = new Map<string, ContractABI>();
const contractMetaCache = new Map<string, ContractData>();

const abiStore: VanillaAbiStore = {
  strategies: [
    EtherscanStrategyResolver({
      apikey: process.env.ETHERSCAN_API_KEY || "",
    }),
    FourByteStrategyResolver(),
  ],
  get: async ({ address, event, signature }) => {
    const value = abiCache.get(address);
    if (value) {
      return {
        status: "success",
        result: value,
      };
    } else if (event != null && value) {
      return {
        status: "success",
        result: value,
      };
    } else if (signature != null && value) {
      return {
        status: "success",
        result: value,
      };
    }

    return {
      status: "empty",
      result: null,
    };
  },
  set: async (_key, value) => {
    if (value.status === "success") {
      if (value.result.type === "address") {
        abiCache.set(value.result.address, value.result);
      } else if (value.result.type === "event") {
        abiCache.set(value.result.event, value.result);
      } else if (value.result.type === "func") {
        abiCache.set(value.result.signature, value.result);
      }
    }
  },
};

const contractMetaStore: VanillaContractMetaStore = {
  strategies: [ERC20RPCStrategyResolver],
  get: async ({ address, chainID }) => {
    const key = `${address}-${chainID}`.toLowerCase();
    const value = contractMetaCache.get(key);

    if (value) {
      return {
        status: "success",
        result: value,
      };
    }

    return {
      status: "empty",
      result: null,
    };
  },
  set: async ({ address, chainID }, result) => {
    const key = `${address}-${chainID}`.toLowerCase();

    if (result.status === "success") {
      contractMetaCache.set(key, result.result);
    }
  },
};

const getPublicClient = (chainId: number) => {
  const rpc = RPC[chainId as keyof typeof RPC];

  if (!rpc) {
    throw new Error(`Missing RPC provider for chain ID ${chainId}`);
  }

  return {
    client: createPublicClient({
      transport: webSocket("wss://base.gateway.tenderly.co/6gIs3xuu3tbmjnHknGD1Z2"),
    }),
    config: {
      traceAPI: rpc.traceAPI as "parity" | "geth" | "none",
    },
  };
};

export const decoder = new TransactionDecoder({
  getPublicClient: getPublicClient,
  abiStore: abiStore,
  contractMetaStore: contractMetaStore,
  logLevel: "None",
});
