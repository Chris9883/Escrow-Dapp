# Decentralized Escrow Application

Week 5 project submission for the Alchemy University Blockchain Developer Bootcamp.

## Description

Escrow Dapp to enable Escrow Agreements on-chain.

By creating a new escrow agreement, the depositor names the beneficiary, an independent arbiter and locks a certain amount in the Escrow Contract. The locked amount will be transferred to the beneficiary when the agreement is fulfilled.  
To verify that the agreement has been fulfilled, the arbiter has to approve the payout. Likewise if the agreement fails, the arbiter has to revoke the agreement and the deposit is transferred back to the depositor.

# Demo

https://escrow-dapp-weld.vercel.app/

## Implementation

The escrow functionality relies on a single smart contract, in which escrow agreements are represented as a mapping, instead of deploying a new contract for every escrow agreement.

Benefits: more gas-efficient, persistence (existing escrow agreements can be accessed via event logs)

The contract is deployed on [goerli testnet](https://goerli.etherscan.io/address/0x196C2Ae4C84dDBC12F7986F108aBb0062D145DC5).

## Security considerations

- Smart contract is not owned and there is no withdraw function --> funds can not be stolen
- BUT: The success of an escrow agreement depends largely on the reliability of the independent arbiter. If the arbiter fails to to approve or revoke the agreement or loses their private key, the deposited amount stays locked in the contract.

## Project Layout

There are two top-level folders:

1. `/app` - contains the front-end application built with React + Bootstrap
2. `/hardhat` - hardhat project containing the contract, tests and deploy script

## Setup

To run the front-end application, navigate into the app directory `cd app` and install dependencies with `npm install`.
Then run `npm start` and open [http://localhost:3000](http://localhost:3000) to view it in your browser.

In order to deploy or test the smart contract, navigate into the hardhat directory `cd hardhat` and install dependencies with `npm install`.

- to compile run `npx hardhat compile`
- run test cases with `npx hardhat test`
- to deploy:
  - Modify `hardhat.config.js` to include the destination chain and (optional) blockexplorer info for contract verification
  - create `.env` file, include PRIVATE_KEY, <NETWORK_NAME>\_RPC_URL and (optional) <BLOCKEXPLORER>\_API_KEY
  - run `npx hardhat run scripts/deploy.js --network <network_name>`
