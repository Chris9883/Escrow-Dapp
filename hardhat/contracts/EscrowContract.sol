// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";

// custom errors
error Escrow__IndependentArbiterNeeded();
error Escrow__NotAuthorized();
error Escrow__TransferFailed();
error Escrow__AlreadyPaidOut(uint escrowId);

contract EscrowContract { 
    using Counters for Counters.Counter;

    struct Escrow {
        address depositor;
        address beneficiay;
        address arbiter;
        uint lockedAmount;
        bool isExecuted;
    }

    // events
	event newEscrow(uint escrowId, address indexed depositor, address indexed beneficiary, address indexed arbiter);
    event Approved(uint escrowId);
    event Revoked(uint escrowId);

    // storage variables
    mapping(uint256 => Escrow) internal s_escrows;
    Counters.Counter internal _idCounter;
	
    // modifiers
    modifier onlyArbiter(uint _escrowId) {
        if(s_escrows[_escrowId].arbiter != msg.sender) {
            revert Escrow__NotAuthorized();
        }
        _;
    }

    modifier notExecuted(uint _escrowId) {
        if(s_escrows[_escrowId].isExecuted) {
            revert Escrow__AlreadyPaidOut(_escrowId);
        }
        _;
    }

    // external functions

    /**
     * @notice create new escrow agreement. The sender is set as the depositor.
     * @param _beneficiary address of beneficiary
     * @param _arbiter address of independent arbiter. Beneficiary or depositor can not act as arbiter.
     * returns escrowId
     */
	function createNewEscrow(address _beneficiary, address _arbiter) external payable returns(uint256){
        if(msg.sender == _arbiter || _beneficiary == _arbiter) {
            revert Escrow__IndependentArbiterNeeded();
        }
        uint256 id = _idCounter.current();
        _idCounter.increment();
        s_escrows[id] = Escrow(msg.sender, _beneficiary, _arbiter, msg.value, false);
        emit newEscrow(id, msg.sender, _beneficiary, _arbiter);
        return id;
	}

    /**
     * @notice Arbiter calls approve function when agreement is fulfilled. The locked amount is sent to the beneficiary.
     * @param _escrowId escrowId
     */
	function approve(uint _escrowId) external onlyArbiter(_escrowId) notExecuted(_escrowId) {
		uint balance = s_escrows[_escrowId].lockedAmount;
        s_escrows[_escrowId].isExecuted = true;
		(bool sent, ) = payable(s_escrows[_escrowId].beneficiay).call{value: balance}("");
 		if(!sent){
            revert Escrow__TransferFailed();
        }
		emit Approved(_escrowId);
	}

    /**
     * @notice Arbiter calls revoke function when agreement is revoked. The locked amount is sent back to the depositor.
     * @param _escrowId escrowId
     */
    function revoke(uint _escrowId) external onlyArbiter(_escrowId) notExecuted(_escrowId) {
		uint balance = s_escrows[_escrowId].lockedAmount;
        s_escrows[_escrowId].isExecuted = true;
		(bool sent, ) = payable(s_escrows[_escrowId].depositor).call{value: balance}("");
 		if(!sent){
            revert Escrow__TransferFailed();
        }
		emit Revoked(_escrowId);
	}
    
    // view functions
    function getDepositor(uint _escrowId) external view returns (address) {
        return s_escrows[_escrowId].depositor;
    }

    function getBeneficiary(uint _escrowId) external view returns (address) {
        return s_escrows[_escrowId].beneficiay;
    }

    function getArbiter(uint _escrowId) external view returns (address) {
        return s_escrows[_escrowId].arbiter;
    }

    function getLockedAmount(uint _escrowId) external view returns (uint) {
        return s_escrows[_escrowId].lockedAmount;
    }

    function isExecuted(uint _escrowId) external view returns(bool) {
        return s_escrows[_escrowId].isExecuted;
    }
}
