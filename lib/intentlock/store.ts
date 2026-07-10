import { promises as fs } from "fs";
import path from "path";
import os from "os";
import type { IntentLockStore, Mandate, Receipt } from "./types";

const dataPath =
  process.env.INTENTLOCK_DATA_PATH ??
  (process.env.VERCEL ? path.join(os.tmpdir(), "intentlock-data.json") : path.join(process.cwd(), "intentlock-data.json"));

const initialStore: IntentLockStore = {
  mandates: [],
  receipts: []
};

async function readStore(): Promise<IntentLockStore> {
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    return JSON.parse(raw) as IntentLockStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return initialStore;
    }
    throw error;
  }
}

async function writeStore(store: IntentLockStore) {
  await fs.writeFile(dataPath, JSON.stringify(store, null, 2));
}

export async function listMandates() {
  return (await readStore()).mandates;
}

export async function getMandate(id: string) {
  const store = await readStore();
  return store.mandates.find((mandate) => mandate.id === id) ?? null;
}

export async function saveMandate(mandate: Mandate) {
  const store = await readStore();
  const index = store.mandates.findIndex((item) => item.id === mandate.id);
  if (index >= 0) {
    store.mandates[index] = mandate;
  } else {
    store.mandates.push(mandate);
  }
  await writeStore(store);
  return mandate;
}

export async function saveReceipt(receipt: Receipt) {
  const store = await readStore();
  store.receipts.push(receipt);
  await writeStore(store);
  return receipt;
}

export async function listReceipts(mandateId?: string) {
  const store = await readStore();
  if (!mandateId) {
    return store.receipts;
  }
  return store.receipts.filter((receipt) => receipt.mandateId === mandateId);
}
