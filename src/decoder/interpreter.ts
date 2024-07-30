//@ts-nocheck

import type { DecodedTx } from "@3loop/transaction-decoder";

function assetsSent(s, r) {
  return s.filter((e) => e.from.toLowerCase() === r.toLowerCase());
}
function assetsReceived(s, r) {
  return s.filter((e) => e.to.toLowerCase() === r.toLowerCase());
}

export const interpretTx = function transformEvent(event: DecodedTx) {
  const tradeEvent = event.interactions.filter(
    (e) => e.event.eventName === "Trade"
  )[0];

  if (!tradeEvent) return;

  const newEvent = {
    txHash: event.txHash,
    trader: tradeEvent.event.params.trader,
    subject: tradeEvent.event.params.subject,
    isBuy: tradeEvent.event.params.isBuy,
    shareAmount: tradeEvent.event.params.shareAmount,
    supply: tradeEvent.event.params.supply,
    assetsSent: assetsSent(event.transfers, event.fromAddress),
    assetsReceived: assetsReceived(event.transfers, event.fromAddress),
    price: null,
  };

  if (newEvent.isBuy === "true" && newEvent.assetsSent[0]) {
    newEvent.price = newEvent.assetsSent[0].amount;
  }

  if (newEvent.isBuy === "false" && newEvent.assetsReceived[0].amount) {
    newEvent.price = newEvent.assetsReceived[0].amount;
  }

  return newEvent;
};
