import type { Network } from "@aptos-labs/wallet-adapter-react";

export const NETWORK: Network = (process.env.NEXT_PUBLIC_APP_NETWORK as Network) ?? "testnet";
export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS ?? "";
export const CREATOR_ADDRESS = process.env.NEXT_PUBLIC_COLLECTION_CREATOR_ADDRESS;
export const COLLECTION_ADDRESS = process.env.NEXT_PUBLIC_COLLECTION_ADDRESS ?? "";
export const IS_DEV = Boolean(process.env.DEV);
export const IS_PROD = Boolean(process.env.PROD);
