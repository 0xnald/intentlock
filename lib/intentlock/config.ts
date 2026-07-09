export const INTENTLOCK_NAME = "IntentLock";
export const XLAYER_MAINNET = "eip155:196" as const;
export const USD_T0_ASSET = "0x779ded0c9e1022225f8e0630b35a9b54be713736";
export const PAY_TO = process.env.INTENTLOCK_PAY_TO ?? "0xec78b1F51adf01bE5D94973c203a40cb4A5f847D";
export const PRICE_USD = process.env.INTENTLOCK_PRICE_USD ?? "0.01";
export const NETWORK = (process.env.INTENTLOCK_NETWORK ?? XLAYER_MAINNET) as `${string}:${string}`;
export const SETTLEMENT_ASSET = process.env.INTENTLOCK_SETTLEMENT_ASSET ?? USD_T0_ASSET;

export const publicBaseUrl = () =>
  process.env.INTENTLOCK_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
