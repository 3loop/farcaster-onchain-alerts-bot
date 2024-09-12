import type { DecodedTx, Asset } from "@3loop/transaction-decoder";

function assetsSent(s: Asset[], r: string) {
  return s.filter((e) => e.from.toLowerCase() === r.toLowerCase());
}
function assetsReceived(s: Asset[], r: string) {
  return s.filter((e) => e.to.toLowerCase() === r.toLowerCase());
}

export const interpretTx = function transformEvent(event: DecodedTx) {
  const tradeEvent = event.interactions.filter(
    (e) => e.event.eventName === "Trade"
  )[0];

  if (!tradeEvent) return;

  const eventParams = tradeEvent.event.params as {
    trader: string;
    subject: string;
    isBuy: string;
    shareAmount: string;
    supply: string;
  };

  const newEvent = {
    txHash: event.txHash,
    trader: eventParams.trader,
    subject: eventParams.subject,
    isBuy: eventParams.isBuy,
    shareAmount: eventParams.shareAmount,
    supply: eventParams.supply,
    assetsSent: assetsSent(event.transfers, event.fromAddress),
    assetsReceived: assetsReceived(event.transfers, event.fromAddress),
    price: undefined as string | undefined,
  };

  if (newEvent.isBuy === "true" && newEvent.assetsSent[0]) {
    newEvent.price = newEvent.assetsSent[0].amount;
  }

  if (newEvent.isBuy === "false" && newEvent.assetsReceived[0].amount) {
    newEvent.price = newEvent.assetsReceived[0].amount;
  }

  return newEvent;
};
