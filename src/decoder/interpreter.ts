//@ts-nocheck

export const interpretTx = function transformEvent(event) {
  const tradeEvent = event.interactions.filter(
    (e) => e.event.eventName === "Trade"
  )?.[0];

  const newEvent = {
    txHash: event.txHash,
    trader: tradeEvent.event.params.trader,
    subject: tradeEvent.event.params.subject,
    isBuy: tradeEvent.event.params.isBuy,
    shareAmount: tradeEvent.event.params.shareAmount,
    supply: tradeEvent.event.params.supply,
    price: 0,
  };

  if (newEvent.isBuy === "true" && event.assetsSent[0]) {
    newEvent.price = event.assetsSent[0].amount;
  }

  if (newEvent.isBuy === "false" && event.assetsReceived[0].amount) {
    newEvent.price = event.assetsReceived[0].amount;
  }

  return newEvent;
}
