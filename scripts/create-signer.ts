//@ts-nocheck
/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-console */
import {
  createWalletClient,
  http,
  toHex,
  encodeAbiParameters,
  type EncodeAbiParametersReturnType,
  type Hex,
  type WalletClient,
  getContract,
  createPublicClient,
  type HDAccount,
} from "viem";
import { optimism } from "viem/chains";
import { mnemonicToAccount } from "viem/accounts";
import { ed25519 } from "@noble/curves/ed25519";

//your Farcaster recovery phrase: settings -> advanced -> recovery phrase
const MNEMONIC = "your mnemonic here";

const CONTRACTS = {
  idRegistry: "0x00000000fcaf86937e41ba038b4fa40baa4b780a" as const,
  keyGateway: "0x00000000fc56947c7e7183f8ca4b62398caadf0b" as const,
  signedKeyRequestValidator:
    "0x00000000fc700472606ed4fa22623acf62c60553" as const,
};

const etherscanEndpoint =
  "https://optimism.blockscout.com/api?module=contract&action=getabi&address=";

const IdContract = {
  address: CONTRACTS.idRegistry,
  chain: optimism,
};
const KeyGatewayContract = {
  address: CONTRACTS.keyGateway,
  chain: optimism,
};

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10, // OP Mainnet
  verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

export async function createDeveloperSigner(mnemonic: string): Promise<void> {
  const account = mnemonicToAccount(mnemonic);
  const walletClient = createWalletClient({
    account: account,
    chain: optimism,
    transport: http(),
  });
  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  const idContractAbi = (await fetch(
    `${etherscanEndpoint}${CONTRACTS.idRegistry}`
  ).then((res) => res.json())) as { status: string; result: string };

  const readIdContract = getContract({
    ...IdContract,
    abi: JSON.parse(idContractAbi.result),
    client: {
      public: publicClient,
    },
  });

  const fid = await readIdContract.read.idOf([account.address]);
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = toHex(ed25519.getPublicKey(privateKey));

  const params = await getSignedMetadataParams(
    walletClient,
    account,
    Number(fid),
    account.address,
    publicKey
  );

  const keyGatewayContractAbi = (await fetch(
    `${etherscanEndpoint}${CONTRACTS.keyGateway}`
  ).then((res) => res.json())) as { status: string; result: string };

  const { request: signerAddRequest } = await publicClient.simulateContract({
    ...KeyGatewayContract,
    abi: JSON.parse(keyGatewayContractAbi.result),
    functionName: "add",
    args: [1, publicKey, 1, params], // keyType, publicKey, metadataType, metadata
    account: account,
  });

  const signerAddTxHash = await walletClient.writeContract(signerAddRequest);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(
    `Transaction written to OP Mainnet. Check txn status at https://optimistic.etherscan.io/tx/${signerAddTxHash}`
  );
  await publicClient.waitForTransactionReceipt({ hash: signerAddTxHash });
  console.log("Transaction Confirmed! Your signer is ready to use.");
  console.log(`Signer public key: ${publicKey}`);
  console.log(`Signer private key: ${toHex(privateKey)}`);
}

const SignedKeyRequestMetadataABI = {
  inputs: [
    {
      components: [
        {
          internalType: "uint256",
          name: "requestFid",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "requestSigner",
          type: "address",
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes",
        },
        {
          internalType: "uint256",
          name: "deadline",
          type: "uint256",
        },
      ],
      internalType: "struct SignedKeyRequestValidator.SignedKeyRequestMetadata",
      name: "metadata",
      type: "tuple",
    },
  ],
  name: "encodeMetadata",
  outputs: [
    {
      internalType: "bytes",
      name: "",
      type: "bytes",
    },
  ],
  stateMutability: "pure",
  type: "function",
};

async function getSignedMetadataParams(
  walletClient: WalletClient,
  account: HDAccount,
  fid: number,
  address: Hex,
  signerPublicKey: Hex
): Promise<EncodeAbiParametersReturnType> {
  const deadline = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

  // Sign a EIP-712 message using the account that holds the FID to authorize adding this signer to the key registry
  const signedMetadata = await walletClient.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
    },
    primaryType: "SignedKeyRequest",
    message: {
      requestFid: BigInt(fid),
      key: signerPublicKey,
      deadline: BigInt(deadline),
    },
    account: account,
  });

  return encodeAbiParameters(SignedKeyRequestMetadataABI.inputs, [
    {
      requestFid: BigInt(fid),
      requestSigner: address,
      signature: signedMetadata,
      deadline: BigInt(deadline),
    },
  ]);
}

createDeveloperSigner(MNEMONIC);
