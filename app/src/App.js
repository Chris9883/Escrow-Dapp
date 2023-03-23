import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { contractAddress, abi } from "./constants/contractInfo";
import { getExistingAgreements, approve, revoke } from "./existingAgreements";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
  const [escrows, setEscrows] = useState();
  const [signer, setSigner] = useState();
  const [status, setStatus] = useState();
  const [escrowId, setEscrowId] = useState();
  const [waitForTx, setWaitForTx] = useState(false);

  async function getAccounts() {
    await provider.send("eth_requestAccounts", []);
    setSigner(provider.getSigner());
  }

  useEffect(() => {
    getExistingAgreements(setEscrows);
  }, []);

  async function newAgreement() {
    const beneficiary = document.getElementById("beneficiary").value;
    const arbiter = document.getElementById("arbiter").value;
    const value = document.getElementById("value").value;

    if (
      // user input validation
      value <= 0 ||
      beneficiary.length !== 42 ||
      arbiter.length !== 42 ||
      !beneficiary.startsWith("0x") ||
      !arbiter.startsWith("0x")
    ) {
      alert("Invalid input");
    } else {
      setStatus("pending");
      if (!signer) {
        getAccounts();
      }
      const contract = new ethers.Contract(contractAddress, abi, signer);
      let valueInWei = ethers.utils.parseEther(value.toString());
      try {
        const tx = await contract.createNewEscrow(beneficiary, arbiter, {
          value: valueInWei,
        });
        const txReceipt = await tx.wait();
        setStatus("success");
        setEscrowId(parseInt(txReceipt.logs[0].data));
        getExistingAgreements(setEscrows);
      } catch (e) {
        setStatus("error");

        if (e.message.includes("user rejected transaction")) {
          console.error(e);
        } else {
          console.error(e);
          alert(e);
        }
      }
    }
  }

  function reset() {
    setStatus("");
    document.getElementById("beneficiary").value = "";
    document.getElementById("arbiter").value = "";
    document.getElementById("value").value = "";
  }

  return (
    <main className="container-fluid bg-light d-flex flex-column">
      <div className="row d-flex justify-content-center p-3 mt-lg-5 mt-md-3 mt-2">
        <div className="d-flex flex-column col-12 col-sm-7 col-md-6 col-xl-4 px-lg-5 bg-white contract">
          <h2> New Escrow Agreement </h2>
          <form
            className="d-flex flex-column mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              newAgreement();
            }}
          >
            <label>
              Arbiter Address
              <input type="text" id="arbiter" required />
            </label>

            <label>
              Beneficiary Address
              <input type="text" id="beneficiary" required />
            </label>

            <label>
              Deposit Amount (in Ether)
              <input type="text" id="value" placeholder="e.g. 0.1" required />
            </label>
            {!signer ? (
              <button className="btn btn-primary" onClick={getAccounts}>
                Connect Wallet
              </button>
            ) : status === "pending" ? (
              <button className="btn btn-primary" disabled>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </button>
            ) : status === "success" ? (
              <>
                <p>
                  <span className="text-success">Success!</span> <br />
                  ID of your escrow agreement: {escrowId}
                </p>
                <button className="btn btn-primary" onClick={reset}>
                  New agreement
                </button>
              </>
            ) : (
              <button className="btn btn-primary" id="submit-btn" type="submit">
                Create
              </button>
            )}
          </form>
        </div>
      </div>
      {escrows && (
        <div className="row d-flex justify-content-center p-3 mt-lg-5 mt-md-3">
          <div className="d-flex flex-column col-sm-11 col-lg-9 ">
            <h2 className="text-white"> Existing Agreements </h2>
            <div className="container escrow-container mt-lg-3 mt-2">
              {escrows.map((escrow) => {
                return (
                  <div className="card" key={escrow.id}>
                    <div className="card-body d-flex flex-column">
                      <div className="container-fluid px-2 d-flex justify-content-between">
                        <h5 className="card-title text-center">
                          ID {escrow.id}{" "}
                        </h5>
                        {escrow.lockedAmount !== "" && (
                          <p className="display-amount text-primary">
                            {escrow.lockedAmount} ETH
                          </p>
                        )}
                      </div>
                      <div className="container-fluid px-2 d-flex flex-column mb-3">
                        <p className="card-text card-text-info text-secondary">
                          Depositor:
                        </p>
                        <p className="card-text display-address">
                          {escrow.depositor}
                        </p>
                        <p className="card-text card-text-info pt-1 text-secondary">
                          Beneficiary:
                        </p>
                        <p className="card-text display-address">
                          {escrow.beneficiary}
                        </p>
                        <p className="card-text card-text-info pt-1 text-secondary">
                          Arbiter:
                        </p>
                        <p className="card-text display-address">
                          {escrow.arbiter}
                        </p>
                      </div>
                      {escrow.status === "approved" ? (
                        <p className="text-success">Approved!</p>
                      ) : escrow.status === "revoked" ? (
                        <p className="text-danger">Revoked!</p>
                      ) : waitForTx === true ? (
                        <div
                          className="spinner-border text-secondary"
                          role="status"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      ) : (
                        <div className="d-flex ">
                          <button
                            className="btn btn-outline-success px-2 mx-1"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!signer) {
                                await getAccounts();
                              } else {
                                await approve(escrow.id, signer, setWaitForTx);
                                getExistingAgreements(setEscrows);
                              }
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline-danger px-2 mx-1"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!signer) {
                                await getAccounts();
                              } else {
                                await revoke(escrow.id, signer, setWaitForTx);
                                getExistingAgreements(setEscrows);
                              }
                            }}
                          >
                            Revoke{" "}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
