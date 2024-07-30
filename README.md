# Farcaster bot for on-chain alerts

> [!NOTE]  
> You can jump to the [Loop Decoder Documentation](https://loop-decoder.3loop.io/recipes/fc-bot/) to read the entire tutorial in one place.

Learn how to create a Farcaster bot that sends human-readable alerts about transactions happening on-chain. You can customize this bot for any EVM-compatible blockchain, and you don't need any specific knowledge about EVM transaction decoding and interpretation.

For the demo, we've used a [friend.tech](https://www.friend.tech) smart contract to track trading activity on the Base Mainnet network. By modifying the contract address and environment variables, you can create a bot to track smart contracts on any other EVM chain.

### Step 0: Prerequisites

- An installed Bun (see installation guide [here](https://bun.sh/docs/installation))
- An Alchemy account (sign up [here](https://www.alchemy.com/))
- An Etherscan(Basescan) account (sign up [here](https://basescan.org/register))
- A Farcaster account (can be yours or a separate one for your bot)

### Step 1: Clone the Repository

Clone the Bot [repository](https://github.com/3loop/farcaster-onchain-alerts-bot) and install project dependencies:

```bash
git clone https://github.com/3loop/farcaster-onchain-alerts-bot
cd farcaster-onchain-alerts-bot
bun i
```

### Step 2: Add Etherescan and Alchemy API Keys

Copy and rename the `.env.example` file to `.env`, then paste the Alchemy and Etherescan API keys into the `ALCHEMY_API_KEY` and `ETHERSCAN_API_KEY` variables.

```bash
cp .env.example .env
vim .env
```

To reproduce the Friend.tech alerts bot, you need to create an Alchemy App for the Base Mainnet and get an API key from the Basescan. We use the Alchemy API key to monitor new transactions, and the Etherscan API key (from the free plan) to fetch contract ABIs and avoid hitting rate limits. The Etherscan API could be optional if the transactions you are interested in do not interact with many contracts.

### Step 3: Create a Farcaster Account Key (Signer)

A Farcaster signer is a separate Ed25519 public and private key pair connected to your Farcaster account that you need for posting messages on your behalf. To connect the key pair, you have to send a transaction from your Farcaster wallet to the Key Registry Farcaster smart contract. At the moment of writing this guide, there was no simple way to create and connect the signer without using 3rd party APIs. So we made a script to generate the required transaction, and to run it you need to do the following:

1. **Fund your Farcaster custody wallet on Optimism:**: You need some ETH on the Optimism chain to pay for the gas. A few dollars would be enough. Click on the 3 dots near your profile, press "About," and there you will find your custody address.
2. **Get your Farcaster recovery phrase**: On your phone, go to settings -> advanced -> recovery phrase, and write this recovery phrase into the `MNEMONIC` variable in the `scripts/create-signer.ts` file.
3. **Run the script**: Run the following command `bun run scripts/create-signer.ts`. The result of this script will be an Optimism transaction like [this](https://optimistic.etherscan.io/tx/0x9eecacefceb6f120c3ef50222eabb15d86fd5feac6dae3fdf09dccb7687c70d4), and a public and private key printed in the console. Do not share the private key.
4. **Add env variables**: Add the private key generated from the script and the bot's account FID into the `SIGNER_PRIVATE_KEY` and `ACCOUNT_FID` variables.

### Step 4: Start the Bot

Use the following command to start bot locally:

```bash
bun run src/index.ts
```

### Step 5: Check the guide to learn how it works and modify it

The [guide](https://loop-decoder.3loop.io/recipes/fc-bot/) describes all components of the bot and how to modify it to monitor the different EVM contacts.


## Feedback

Let us know on X/Twitter ([@3loop_io](https://x.com/3loop_io)) if you encounter any problems or have any questions, we'd love to help you!

Happy coding!
