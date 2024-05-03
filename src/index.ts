import { decoder } from "./decoder/decoder.js";
import type { DecodedTx } from "@3loop/transaction-decoder";
import { interpretTx } from "./decoder/interpreter.js";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  ETHERSCAN_ENDPOINT,
  FARCASTER_HUB_URL,
  RPC,
} from "./constants.js";
import { HubRestAPIClient } from "@standard-crypto/farcaster-js-hub-rest";
import { createPublicClient, webSocket, type Hex } from "viem";

const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
const fid = process.env.ACCOUNT_FID;
const client = new HubRestAPIClient({
  hubUrl: FARCASTER_HUB_URL,
});

const publicClient = createPublicClient({
  transport: webSocket(RPC[CHAIN_ID].url),
});

async function publishToFarcaster(cast: { text: string; url: string }) {
  if (!signerPrivateKey || !fid) {
    throw new Error("No signer private key or account fid provided");
  }

  const publishCastResponse = await client.submitCast(
    {
      text: cast.text,
      embeds: [
        {
          url: cast.url,
        },
      ],
    },
    Number(fid),
    signerPrivateKey
  );
  console.log(`new cast hash: ${publishCastResponse.hash}`);
}

async function handleTransaction(txHash?: string) {
  try {
    console.log("Transaction mined!");
    if (!txHash) return;

    await publicClient.waitForTransactionReceipt({ hash: txHash as Hex });

    const decoded = await decoder.decodeTransaction({
      chainID: CHAIN_ID,
      hash: txHash,
    });

    if (!decoded) return;

    const interpreted = interpretTx(decoded);

    //Ignore undecoded transactions or zero shareAmount transactions
    if (!interpreted.shareAmount || interpreted.shareAmount === "0") {
      console.log("No defined action for this transaction: ", txHash);
      return;
    }

    const text = `New trade: ${interpreted.trader} ${
      interpreted.isBuy ? "Bought" : "Sold"
    } ${interpreted.shareAmount} shares of ${interpreted.subject} for ${
      interpreted.price
    } ETH`;

    const message = { text: text, url: `${ETHERSCAN_ENDPOINT}/tx/${txHash}` };
    console.log("Message to publish:", message);

    await publishToFarcaster(message);
  } catch (e) {
    console.error(e);
  }
}

async function createSubscription(address: string) {
  await publicClient.transport.subscribe({
    method: "eth_subscribe",
    params: [
      //@ts-expect-error
      "alchemy_minedTransactions",
      {
        addresses: [{ to: address }],
        includeRemoved: false,
        hashesOnly: true,
      },
    ],
    onData: (data: any) => {
      const hash = data?.result?.transaction?.hash;
      if (hash) handleTransaction(hash);
    },
    onError: (error: any) => {
      console.error(error);
    },
  });
}

createSubscription(CONTRACT_ADDRESS);
