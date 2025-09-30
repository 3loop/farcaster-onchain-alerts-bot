import type { DecodedTransaction, Asset } from "@3loop/transaction-decoder";

export const displayAsset = (asset?: Asset): string => {
  if (!asset?.type) return "unknown asset";

  const symbol = asset.type === "ERC20" ? asset.symbol : asset.name;

  if (symbol) return asset.amount + " " + symbol;

  return (
    asset.amount +
    " " +
    asset.address.slice(0, 6) +
    "..." +
    asset.address.slice(-4)
  );
};

/* 
Interpreter is a funciton that transforms a decoded transaction into a more human-readable format.
Intepreter contains:
- more contract-specific logic 
- can understand important context of the transaction depending on the method/events of the decoded transaction
- creates a human-readable action string
*/

export const interpretTx = function transformEvent(event: DecodedTransaction) {
  const methodName = event.methodCall.name;
  const newEvent = {
    txHash: event.txHash,
    fromAddress: event.fromAddress,
    toAddress: event.toAddress,
    assetsSent: event.transfers.filter(
      (e) => e.from.toLowerCase() === event.fromAddress.toLowerCase()
    ),
    assetsReceived: event.transfers.filter(
      (e) => e.to.toLowerCase() === event.fromAddress.toLowerCase()
    ),
  };

  switch (methodName) {
    case "repay":
    case "repayWithPermit":
    case "repayWithATokens":
      return {
        ...newEvent,
        type: "repay",
        action: "User repaid " + displayAsset(newEvent.assetsSent[0]),
      };

    case "deposit":
    case "supplyWithPermit":
    case "supply":
      return {
        ...newEvent,
        type: "deposit",
        action: "User deposited " + displayAsset(newEvent.assetsSent[0]),
      };

    case "borrow":
      return {
        ...newEvent,
        type: "borrow",
        action: "User borrowed " + displayAsset(newEvent.assetsReceived[0]),
      };

    case "withdraw":
      return {
        ...newEvent,
        type: "withdraw",
        action: "User withdrew " + displayAsset(newEvent.assetsReceived[0]),
      };

    case "flashLoanSimple":
      return {
        ...newEvent,
        type: "flashLoan",
        action:
          "Executed flash loan with " + displayAsset(newEvent.assetsSent[0]),
      };

    case "setUserUseReserveAsCollateral":
      const assetAddress = event.methodCall.params?.[0]?.value;
      const enabled = event.methodCall.params?.[1]?.value === "true";
      return {
        ...newEvent,
        type: "setUserUseReserveAsCollateral",
        action: `User ${
          enabled ? "enabled" : "disabled"
        } ${assetAddress} as collateral`,
      };
  }
  return {
    ...newEvent,
    type: "unknown",
    action: "Unknown action",
  };
};
