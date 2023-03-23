import axios from "axios";
import { ethers } from "ethers";
import { contractAddress, abi } from "./constants/contractInfo";

const { REACT_APP_ALCHEMY_API_KEY } = process.env;

const url = `https://eth-goerli.g.alchemy.com/v2/${REACT_APP_ALCHEMY_API_KEY}`;
const provider = new ethers.providers.AlchemyProvider(
  "goerli",
  REACT_APP_ALCHEMY_API_KEY
);
async function getExistingAgreements(setEscrows) {
  try {
    const response = await axios.post(url, {
      jsonrpc: "2.0",
      id: 0,
      method: "eth_getLogs",
      params: [
        {
          fromBlock: "0x836c21",
          toBlock: "latest",
          address: "0x196c2ae4c84ddbc12f7986f108abb0062d145dc5",
          topics: [
            "0x2cfcb73d0e9e6119ca0bf431d1e37d3dfbd6308ddc6e5d36f665dd34c5d0aa95",
          ],
        },
      ],
    });
    const approvedResponse = await axios.post(url, {
      jsonrpc: "2.0",
      id: 0,
      method: "eth_getLogs",
      params: [
        {
          fromBlock: "0x836c21",
          toBlock: "latest",
          address: "0x196c2ae4c84ddbc12f7986f108abb0062d145dc5",
          topics: [
            "0x3ad93af63cb7967b23e4fb500b7d7d28b07516325dcf341f88bebf959d82c1cb",
          ],
        },
      ],
    });

    const revokedResponse = await axios.post(url, {
      jsonrpc: "2.0",
      id: 0,
      method: "eth_getLogs",
      params: [
        {
          fromBlock: "0x836c21",
          toBlock: "latest",
          address: "0x196c2ae4c84ddbc12f7986f108abb0062d145dc5",
          topics: [
            "0x61e27b0bfd8e18e6b92ec32ce1c28bb698d27bfe93e84c7e94d4db0a3135c760",
          ],
        },
      ],
    });
    let approvedIds = [];
    for (let approvedEvent of approvedResponse.data.result) {
      let approvedId = parseInt(approvedEvent.data);
      approvedIds.push(approvedId);
    }
    let revokedIds = [];
    for (let revokedEvent of revokedResponse.data.result) {
      let revokedId = parseInt(revokedEvent.data);
      revokedIds.push(revokedId);
    }
    let existingAgreements = [];
    for (let result of response.data.result) {
      let agreement = {};

      agreement.id = parseInt(result.data);
      agreement.depositor = `0x${result.topics[1].slice(-40)}`;
      agreement.beneficiary = `0x${result.topics[2].slice(-40)}`;
      agreement.arbiter = `0x${result.topics[3].slice(-40)}`;
      if (approvedIds.includes(agreement.id)) {
        agreement.status = "approved";
      } else if (revokedIds.includes(agreement.id)) {
        agreement.status = "revoked";
      } else {
        agreement.status = "";
      }
      agreement.lockedAmount = "";
      try {
        const contract = new ethers.Contract(contractAddress, abi, provider);
        const lockedAmount = await contract.getLockedAmount(agreement.id);
        agreement.lockedAmount = ethers.utils.formatUnits(
          lockedAmount,
          "ether"
        );
      } catch (e) {
        console.error(e);
      }

      existingAgreements.push(agreement);
    }
    existingAgreements.reverse();
    setEscrows(existingAgreements);
  } catch (e) {
    console.error(e);
  }
}

async function approve(escrowId, signer, setWaitForTx) {
  setWaitForTx(true);
  if (!signer) {
    setTimeout(() => {
      approve(escrowId, signer);
    }, 1000);
  }
  const contract = new ethers.Contract(contractAddress, abi, signer);
  try {
    const tx = await contract.approve(escrowId);
    await tx.wait();
    setWaitForTx(false);
  } catch (e) {
    console.error(e);
    setWaitForTx(false);
    if (e.message.includes("cannot estimate gas")) {
      alert("Only arbiter can approve agreement!");
    } else {
      alert(e);
    }
  }
}

async function revoke(escrowId, signer, setWaitForTx) {
  setWaitForTx(true);
  if (!signer) {
    setTimeout(() => {
      approve(escrowId, signer);
    }, 1000);
  }
  const contract = new ethers.Contract(contractAddress, abi, signer);
  try {
    const tx = await contract.revoke(escrowId);
    await tx.wait();
    setWaitForTx(false);
  } catch (e) {
    setWaitForTx(false);
    console.error(e);
    if (e.message.includes("cannot estimate gas")) {
      alert("Only arbiter can approve agreement!");
    } else {
      alert(e);
    }
  }
}

export { getExistingAgreements, approve, revoke };
