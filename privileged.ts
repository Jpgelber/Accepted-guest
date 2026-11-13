import { definePrivilegedContracts, definePrivilegedHandlers, z } from "@hatch/space-sdk";
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/* ---------- PII encryption key custody ----------
   The AES-256-GCM key for attendee personal data (names, emails, phone
   numbers, registration-question answers) lives in a key file OUTSIDE the
   artifact's database — under the account's private config directory —
   and never enters ctx.db, never ships to the client, and is never logged.
   Only these privileged handlers touch it: action code passes plaintext
   in and gets ciphertext out (and vice versa), so a copy of app.db alone
   reveals nothing about attendees. The blind index is an HMAC of the
   normalized email under a separately derived key, so the app can look a
   person up by email without decrypting (or storing) the address. */

export const privileged = definePrivilegedContracts({
  piiEncrypt: {
    request: z.object({ values: z.array(z.string().nullable()) }),
    response: z.object({ values: z.array(z.string().nullable()) }),
  },
  piiDecrypt: {
    request: z.object({ values: z.array(z.string().nullable()) }),
    response: z.object({ values: z.array(z.string().nullable()) }),
  },
  piiEmailIndex: {
    request: z.object({ email: z.string() }),
    response: z.object({ index: z.string() }),
  },
  /* SMS via the provider the PLATFORM OWNER configured in the
     platform console (Twilio account SID + auth token + sending
     number). Credentials arrive per-call from the action (which reads
     the owner's saved configuration) — nothing is hard-coded here,
     and the handler never logs or returns them. Used by the health
     monitor to text the platform owner when the service is down or
     slow. */
  sendSms: {
    request: z.object({ accountSid: z.string().min(1).max(200), authToken: z.string().min(1).max(200), fromNumber: z.string().min(1).max(40), toNumber: z.string().min(1).max(40), body: z.string().min(1).max(1000) }),
    response: z.object({ sent: z.boolean(), sid: z.string().nullable(), error: z.string().nullable() }),
  },
});

const ENC_PREFIX = "enc:v1:";

function keyFilePath(): string {
  const dir = join(homedir(), ".config", "cbi-event-registration");
  return join(dir, "pii-key.hex");
}

function loadKey(): Buffer {
  const path = keyFilePath();
  if (existsSync(path)) {
    const hex = readFileSync(path, "utf8").trim();
    const key = Buffer.from(hex, "hex");
    if (key.length === 32) return key;
  }
  const key = randomBytes(32);
  mkdirSync(join(homedir(), ".config", "cbi-event-registration"), { recursive: true });
  writeFileSync(path, key.toString("hex"), { mode: 0o600 });
  return key;
}

function encryptValue(key: Buffer, value: string | null): string | null {
  if (value === null || value === "") return value;
  if (value.startsWith(ENC_PREFIX)) return value; // already encrypted
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

function decryptValue(key: Buffer, value: string | null): string | null {
  if (value === null || value === "") return value;
  if (!value.startsWith(ENC_PREFIX)) return value; // legacy plaintext row not yet migrated
  const raw = Buffer.from(value.slice(ENC_PREFIX.length), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export const privilegedHandlers = definePrivilegedHandlers(privileged, {
  piiEncrypt(args) {
    const key = loadKey();
    return { values: args.values.map((v) => encryptValue(key, v)) };
  },
  piiDecrypt(args) {
    const key = loadKey();
    return { values: args.values.map((v) => decryptValue(key, v)) };
  },
  piiEmailIndex(args) {
    const key = loadKey();
    const indexKey = createHmac("sha256", key).update("email-blind-index").digest();
    const index = createHmac("sha256", indexKey).update(args.email.trim().toLowerCase()).digest("hex");
    return { index };
  },
  async sendSms(args) {
    try {
      const form = new URLSearchParams({ From: args.fromNumber, To: args.toNumber, Body: args.body });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(args.accountSid)}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${Buffer.from(`${args.accountSid}:${args.authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const data = (await res.json().catch(() => null)) as { sid?: string; message?: string } | null;
      if (res.ok && data?.sid) return { sent: true, sid: data.sid, error: null };
      return { sent: false, sid: null, error: data?.message ?? `Twilio returned HTTP ${res.status}` };
    } catch (e) {
      return { sent: false, sid: null, error: e instanceof Error ? e.message : "SMS send failed" };
    }
  },
});
