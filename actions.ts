import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { privileged } from "@space/privileged";
import { and, asc, desc, eq, inArray, isNull, lt, lte, or } from "drizzle-orm";
import * as schema from "./schema";

const statusEnum = z.enum(["pending", "approved", "denied", "checked_in", "revoked", "waitlisted", "cancelled"]);
const reminderChoiceEnum = z.enum(["1d", "3h", "1h"]);
const questionTypeEnum = z.enum(["text", "choice", "yesno", "radio", "checkboxes"]);

const orgShape = z.object({
  id: z.number(),
  name: z.string(),
  tagline: z.string(),
  websiteUrl: z.string(),
  logoUrl: z.string(),
  motif: z.string(),
  primaryColor: z.string(),
  navColor: z.string(),
  accentColor: z.string(),
  skyColor: z.string(),
  bgColor: z.string(),
  surfaceColor: z.string(),
  textColor: z.string(),
  fontSans: z.string(),
  fontDisplay: z.string(),
  codePrefix: z.string(),
  ownerEmail: z.string(),
  plan: z.string(),
  subscriptionStatus: z.string(),
  trialEndsAt: z.string().nullable(),
  subscriptionEndsAt: z.string().nullable(),
  purgeAfter: z.string().nullable(),
  cardLast4: z.string().nullable(),
  cardBrand: z.string().nullable(),
  onboardingStep: z.number(),
  calendarUrl: z.string(),
  features: z.array(z.string()),
  betaOptIn: z.boolean(),
  staffDomainRestriction: z.boolean(),
  staffAllowedDomains: z.array(z.string()),
  staffDomainIncludeGreeters: z.boolean(),
});

const eventShape = z.object({
  id: z.number(),
  orgId: z.number(),
  title: z.string(),
  date: z.string(),
  timeText: z.string(),
  location: z.string(),
  description: z.string(),
  approvalEmails: z.array(z.string()),
  isSample: z.boolean(),
  logoUrl: z.string(),
  status: z.enum(["published", "draft", "cancelled"]),
  visibility: z.enum(["public", "hidden", "private"]),
  hasInviteLink: z.boolean(),
  inviteSubject: z.string(),
  inviteBody: z.string(),
  senderId: z.number().nullable(),
  guidelineFlag: z.string(),
  guidelineReason: z.string(),
  alertsEnabled: z.boolean(),
  alertFullPct: z.number(),
  alertLowCount: z.number(),
  alertLowDays: z.number(),
  alertChannel: z.enum(["email", "text", "both"]),
  autoApprove: z.boolean(),
  produceEntryCode: z.boolean(),
  walkInRegistration: z.boolean(),
  seriesId: z.string(),
  registrationEnabled: z.boolean(),
  capacity: z.number().nullable(),
  seatsTaken: z.number(),
  isFull: z.boolean(),
  waitlistCount: z.number(),
  reminderDayBefore: z.boolean(),
  reminderSecondDays: z.number().nullable(),
  locationType: z.enum(["physical", "virtual"]),
  virtualLink: z.string(),
  venueLat: z.number().nullable(),
  venueLng: z.number().nullable(),
  checkinRadiusM: z.number(),
  locationCheck: z.enum(["required", "off"]),
  geofenceEnabled: z.boolean(),
  geofenceRadiusM: z.number(),
  geofenceBeforeMins: z.number(),
  geofenceAfterMins: z.number(),
  registrationDeadline: z.string().nullable(),
  registrationClosed: z.boolean(),
  contactName: z.string(),
  contactPhone: z.string(),
});
const eventStructureArgs = {
  locationType: z.enum(["physical", "virtual"]).optional(),
  virtualLink: z.string().max(1000).optional(),
  registrationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  contactName: z.string().max(120).optional(),
  contactPhone: z.string().max(40).optional(),
  venueLat: z.number().min(-90).max(90).nullable().optional(),
  venueLng: z.number().min(-180).max(180).nullable().optional(),
  checkinRadiusM: z.number().int().min(25).max(100000).optional(),
  locationCheck: z.enum(["required", "off"]).optional(),
  geofenceEnabled: z.boolean().optional(),
  geofenceRadiusM: z.number().int().min(50).max(5000).optional(),
  geofenceBeforeMins: z.number().int().min(15).max(1440).optional(),
  geofenceAfterMins: z.number().int().min(15).max(1440).optional(),
  visibility: z.enum(["public", "hidden", "private"]).optional(),
  autoApprove: z.boolean().optional(),
  produceEntryCode: z.boolean().optional(),
  walkInRegistration: z.boolean().optional(),
};
function eventStructureValues(args: { locationType?: "physical" | "virtual"; virtualLink?: string; registrationDeadline?: string | null; contactName?: string; contactPhone?: string; venueLat?: number | null; venueLng?: number | null; checkinRadiusM?: number; locationCheck?: "required" | "off"; geofenceEnabled?: boolean; geofenceRadiusM?: number; geofenceBeforeMins?: number; geofenceAfterMins?: number; visibility?: "public" | "hidden" | "private"; autoApprove?: boolean; produceEntryCode?: boolean; walkInRegistration?: boolean }) {
  return {
    ...(args.locationType !== undefined ? { locationType: args.locationType } : {}),
    ...(args.virtualLink !== undefined ? { virtualLink: args.virtualLink.trim() } : {}),
    ...(args.registrationDeadline !== undefined ? { registrationDeadline: args.registrationDeadline } : {}),
    ...(args.contactName !== undefined ? { contactName: args.contactName.trim() } : {}),
    ...(args.contactPhone !== undefined ? { contactPhone: args.contactPhone.trim() } : {}),
    ...(args.venueLat !== undefined ? { venueLat: args.venueLat } : {}),
    ...(args.venueLng !== undefined ? { venueLng: args.venueLng } : {}),
    ...(args.checkinRadiusM !== undefined ? { checkinRadiusM: args.checkinRadiusM } : {}),
    ...(args.locationCheck !== undefined ? { locationCheck: args.locationCheck } : {}),
    ...(args.geofenceEnabled !== undefined ? { geofenceEnabled: args.geofenceEnabled ? 1 : 0 } : {}),
    ...(args.geofenceRadiusM !== undefined ? { geofenceRadiusM: args.geofenceRadiusM } : {}),
    ...(args.geofenceBeforeMins !== undefined ? { geofenceBeforeMins: args.geofenceBeforeMins } : {}),
    ...(args.geofenceAfterMins !== undefined ? { geofenceAfterMins: args.geofenceAfterMins } : {}),
    ...(args.visibility !== undefined ? { visibility: args.visibility } : {}),
    ...(args.autoApprove !== undefined ? { autoApprove: args.autoApprove ? 1 : 0 } : {}),
    ...(args.produceEntryCode !== undefined ? { produceEntryCode: args.produceEntryCode ? 1 : 0, walkInRegistration: args.walkInRegistration ? 1 : 0 } : {}),
    ...(args.walkInRegistration !== undefined ? { walkInRegistration: args.walkInRegistration ? 1 : 0 } : {}),
  };
}

/* ---------- Location-bound greeter check-in ----------
   For a physical event whose venue coordinates are set and whose
   location check is "required", a greeter's device must be within the
   event's radius of the venue for check-in to work. Virtual events
   never have check-in (no greeter at all); events without venue
   coordinates can't be location-checked yet and say so. An
   administrator of the organization can override a single blocked
   check-in, widen the radius, move the venue pin, or turn the check
   off — greeters cannot override. */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
type CheckinLocationEval = {
  enforced: boolean;
  allowed: boolean;
  isVirtual: boolean;
  distanceM: number | null;
  radiusM: number;
  message: string | null;
};
function evaluateCheckinLocation(ev: EventRow, deviceLat?: number | null, deviceLng?: number | null): CheckinLocationEval {
  const radiusM = ev.checkinRadiusM ?? 300;
  const isVirtual = (ev.locationType ?? "physical") === "virtual";
  if (isVirtual) return { enforced: false, allowed: false, isVirtual: true, distanceM: null, radiusM, message: "This is a virtual event — there's no door check-in. Confirmed attendees join with the “Join the meeting” button on their pass." };
  const hasVenue = typeof ev.venueLat === "number" && typeof ev.venueLng === "number";
  const enforced = (ev.locationCheck ?? "required") === "required" && hasVenue;
  if (!enforced) return { enforced: false, allowed: true, isVirtual: false, distanceM: null, radiusM, message: null };
  if (typeof deviceLat !== "number" || typeof deviceLng !== "number") {
    return { enforced: true, allowed: false, isVirtual: false, distanceM: null, radiusM, message: `Check-in for “${ev.title}” is only available at the event location. This device hasn't shared its location — allow location access and try again, or ask an administrator to override.` };
  }
  const distanceM = haversineMeters(deviceLat, deviceLng, ev.venueLat!, ev.venueLng!);
  if (distanceM <= radiusM) return { enforced: true, allowed: true, isVirtual: false, distanceM, radiusM, message: null };
  return { enforced: true, allowed: false, isVirtual: false, distanceM, radiusM, message: `Check-in is only available at the event location. This device is about ${distanceM.toLocaleString()} m from ${ev.location} — check-in works within ${radiusM.toLocaleString()} m of the venue. Move to the venue and try again, or ask an administrator to override or widen the radius.` };
}
/* ---------- Attendee arrival pop-up (geofence) helpers ----------
   The event's start instant is parsed from its date + time text the
   same way the calendar invite does it (first clock time wins; no
   clock time = start of day). The geofence window is start − before
   through start (or end, when a second time is present) + after. */
function parseEventStartEnd(ev: EventRow): { start: Date; end: Date | null } {
  const matches = [...(ev.timeText ?? "").matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
  const toHM = (m: RegExpMatchArray): [number, number] => { let h = Number(m[1] ?? "0") % 12; if ((m[3] ?? "").toUpperCase() === "PM") h += 12; return [h, Number(m[2] ?? "0")]; };
  if (matches[0]) {
    const [sh, sm] = toHM(matches[0]);
    const start = new Date(`${ev.date}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`);
    if (matches[1]) { const [eh, em] = toHM(matches[1]); return { start, end: new Date(`${ev.date}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`) }; }
    return { start, end: new Date(start.getTime() + 2 * 60 * 60 * 1000) };
  }
  return { start: new Date(`${ev.date}T09:00:00`), end: new Date(`${ev.date}T21:00:00`) };
}
function geofenceWindow(ev: EventRow): { opensAt: Date; closesAt: Date; start: Date } {
  const { start, end } = parseEventStartEnd(ev);
  const before = (ev as { geofenceBeforeMins?: number }).geofenceBeforeMins ?? 180;
  const after = (ev as { geofenceAfterMins?: number }).geofenceAfterMins ?? 120;
  const anchorEnd = end ?? start;
  return { opensAt: new Date(start.getTime() - before * 60000), closesAt: new Date(anchorEnd.getTime() + after * 60000), start };
}
function assertRegistrationOpen(ev: EventRow) {
  if (!ev.registrationDeadline) return;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (today > ev.registrationDeadline) throw new Error(`Registration for “${ev.title}” closed on ${ev.registrationDeadline} (the registration deadline has passed).`);
}

const answerShape = z.object({
  questionId: z.number(),
  label: z.string(),
  type: z.enum(["text", "choice", "yesno", "radio", "checkboxes"]),
  answer: z.string(),
});

const registrationShape = z.object({
  id: z.number(),
  eventId: z.number(),
  orgId: z.number(),
  orgName: z.string(),
  eventTitle: z.string(),
  eventDate: z.string(),
  eventTimeText: z.string(),
  eventLocation: z.string(),
  eventLocationType: z.enum(["physical", "virtual"]),
  // The meeting join link — ONLY on confirmed registrations (approved /
  // checked_in), like the event attachments. Tentative, waitlisted, and
  // not-approved registrations always get an empty string.
  eventVirtualLink: z.string(),
  // Venue pin + check-in radius for the greeter's offline door list, so
  // location-bound check-in can be evaluated on the device too.
  eventVenueLat: z.number().nullable(),
  eventVenueLng: z.number().nullable(),
  eventCheckinRadiusM: z.number(),
  eventLocationCheck: z.enum(["required", "off"]),
  eventGeofenceEnabled: z.boolean(),
  eventGeofenceRadiusM: z.number(),
  eventGeofenceBeforeMins: z.number(),
  eventGeofenceAfterMins: z.number(),
  proximityOptIn: z.boolean(),
  proximityNotifiedAt: z.string().nullable(),
  // Attendee's own radius for this registration (null = event default)
  // and the radius that actually applies (own choice, else the
  // event's default) — the client watcher and the copy both use the
  // effective value; the server re-computes it at arrival time.
  proximityRadiusM: z.number().nullable(),
  proximityEffectiveRadiusM: z.number(),
  name: z.string(),
  email: z.string(),
  contactEmail: z.string().nullable(),
  phone: z.string().nullable(),
  googleId: z.string().nullable(),
  authProvider: z.enum(["google", "apple", "email", "manual"]),
  status: statusEnum,
  code: z.string().nullable(),
  entryCode: z.string().nullable(),
  groupId: z.string().nullable(),
  sharedCode: z.boolean(),
  groupNames: z.array(z.string()),
  decidedVia: z.string().nullable(),
  emailVerified: z.boolean(),
  held: z.boolean(),
  heldReason: z.string(),
  // Attendee flag (admin-only): populated ONLY on the admin path of
  // listRegistrations. Every attendee-facing lookup leaves these
  // null/empty — flagged status is never shown to the attendee.
  flagType: z.enum(["blacklist", "alert"]).nullable(),
  flagReason: z.string(),
  notifyChannel: z.enum(["email", "text", "both"]),
  reminderChoices: z.array(reminderChoiceEnum),
  waitlistOfferedAt: z.string().nullable(),
  waitlistExpiresAt: z.string().nullable(),
  // Event files (agenda, handout, map…): metadata only, and ONLY on
  // confirmed registrations — tentative / waitlisted / not-approved
  // registrations always get an empty list. Opening a file goes
  // through getAttachmentUrl, which re-checks confirmation.
  attachments: z.array(z.object({ id: z.number(), name: z.string(), contentType: z.string(), sizeBytes: z.number() })),
  eventLogoUrl: z.string(),
  registeredByName: z.string().nullable(),
  registeredByEmail: z.string().nullable(),
  faithAffiliation: z.string().nullable(),
  hearAbout: z.string().nullable(),
  securityListOptIn: z.boolean().nullable(),
  customAnswers: z.array(answerShape),
  createdAt: z.string(),
  checkedInAt: z.string().nullable(),
});

const questionShape = z.object({
  id: z.number(),
  orgId: z.number(),
  eventId: z.number().nullable(),
  label: z.string(),
  helpText: z.string(),
  type: z.enum(["text", "choice", "yesno", "radio", "checkboxes"]),
  options: z.array(z.string()),
  required: z.boolean(),
  sortOrder: z.number(),
});

// Legacy free-text "how did you hear" answer (older clients only; new
// registrations answer the organization's own custom questions instead).
const hearAboutEnum = z.string().max(200);

const adminShape = z.object({
  id: z.number(),
  orgId: z.number(),
  googleId: z.string(),
  email: z.string(),
  displayName: z.string(),
  createdAt: z.string(),
});

type OrgRow = typeof schema.organizations.$inferSelect;
type EventRow = typeof schema.events.$inferSelect;
type RegRow = typeof schema.registrations.$inferSelect;
type QuestionRow = typeof schema.customQuestions.$inferSelect;
type CustomAnswer = z.infer<typeof answerShape>;

function parseApprovalEmails(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && v.includes("@")).map((v) => v.trim().toLowerCase());
  } catch { return []; }
}
function normalizeEmailList(input: string[]): string[] {
  const out: string[] = [];
  for (const raw of input) {
    const em = raw.trim().toLowerCase();
    if (em && em.includes("@") && !out.includes(em)) out.push(em);
  }
  return out;
}
function parseOptions(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch { return []; }
}
function parseAnswers(raw: string): CustomAnswer[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: CustomAnswer[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const r = item as Record<string, unknown>;
      if (typeof r["label"] === "string" && typeof r["answer"] === "string") {
        out.push({
          questionId: typeof r["questionId"] === "number" ? r["questionId"] : 0,
          label: r["label"],
          type: r["type"] === "choice" || r["type"] === "yesno" ? r["type"] : "text",
          answer: r["answer"],
        });
      }
    }
    return out;
  } catch { return []; }
}

function toOrg(row: OrgRow): z.infer<typeof orgShape> {
  return {
    id: row.id, name: row.name, tagline: row.tagline, websiteUrl: row.websiteUrl, logoUrl: row.logoUrl, motif: row.motif,
    primaryColor: row.primaryColor, navColor: row.navColor, accentColor: row.accentColor, skyColor: row.skyColor,
    bgColor: row.bgColor, surfaceColor: row.surfaceColor, textColor: row.textColor, fontSans: row.fontSans, fontDisplay: row.fontDisplay,
    codePrefix: row.codePrefix, ownerEmail: row.ownerEmail,
    plan: row.plan, subscriptionStatus: row.subscriptionStatus,
    trialEndsAt: row.trialEndsAt ? row.trialEndsAt.toISOString() : null,
    subscriptionEndsAt: row.accessEndsAt ? new Date(row.accessEndsAt).toISOString() : null,
    purgeAfter: row.purgeAfter ? new Date(row.purgeAfter).toISOString() : null,
    cardLast4: row.cardLast4, cardBrand: row.cardBrand,
    onboardingStep: row.onboardingStep, calendarUrl: row.calendarUrl,
    features: (() => { try { const f = JSON.parse(row.features ?? "[]") as unknown; return Array.isArray(f) ? f.filter((x): x is string => typeof x === "string") : []; } catch { return []; } })(),
    betaOptIn: row.betaOptIn === 1,
    staffDomainRestriction: row.staffDomainRestriction === 1,
    staffAllowedDomains: (row.staffAllowedDomains ?? "").split(/[\s,;]+/).map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter(Boolean),
    staffDomainIncludeGreeters: row.staffDomainIncludeGreeters !== 0,
  };
}
function toEvent(row: EventRow, counts?: { seatsTaken: number; waitlistCount: number }) {
  const capacity = row.capacity ?? null;
  const seatsTaken = counts?.seatsTaken ?? 0;
  return { id: row.id, orgId: row.orgId, title: row.title, date: row.date, timeText: row.timeText, location: row.location, description: row.description, approvalEmails: parseApprovalEmails(row.approvalEmails), isSample: row.isSample === 1, logoUrl: row.logoUrl || "", status: (row.status ?? "published") as "published" | "draft" | "cancelled", visibility: (row.visibility ?? "public") as "public" | "hidden" | "private", hasInviteLink: !!(row.inviteToken && row.inviteToken.length > 0), inviteSubject: row.inviteSubject ?? "", inviteBody: row.inviteBody ?? "", senderId: row.senderId ?? null, guidelineFlag: row.guidelineFlag ?? "", guidelineReason: row.guidelineReason ?? "", seriesId: row.seriesId ?? "", registrationEnabled: row.registrationEnabled !== 0, capacity, seatsTaken, isFull: capacity !== null && seatsTaken >= capacity, waitlistCount: counts?.waitlistCount ?? 0, reminderDayBefore: row.reminderDayBefore !== 0, reminderSecondDays: row.reminderSecondDays ?? null, locationType: (row.locationType ?? "physical") as "physical" | "virtual", virtualLink: row.virtualLink ?? "", venueLat: row.venueLat ?? null, venueLng: row.venueLng ?? null, checkinRadiusM: row.checkinRadiusM ?? 300, locationCheck: (row.locationCheck ?? "required") as "required" | "off", geofenceEnabled: (row as { geofenceEnabled?: number }).geofenceEnabled !== 0, geofenceRadiusM: (row as { geofenceRadiusM?: number }).geofenceRadiusM ?? 400, geofenceBeforeMins: (row as { geofenceBeforeMins?: number }).geofenceBeforeMins ?? 180, geofenceAfterMins: (row as { geofenceAfterMins?: number }).geofenceAfterMins ?? 120, registrationDeadline: row.registrationDeadline ?? null, registrationClosed: (() => { if (!row.registrationDeadline) return false; const n = new Date(); const t = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; return t > row.registrationDeadline; })(), contactName: row.contactName ?? "", contactPhone: row.contactPhone ?? "", alertsEnabled: row.alertsEnabled !== 0, alertFullPct: row.alertFullPct ?? 80, alertLowCount: row.alertLowCount ?? 10, alertLowDays: row.alertLowDays ?? 3, alertChannel: ((row.alertChannel ?? "email") as "email" | "text" | "both"), autoApprove: row.autoApprove === 1, produceEntryCode: (row as { produceEntryCode?: number }).produceEntryCode === 1, walkInRegistration: (row as { walkInRegistration?: number }).walkInRegistration === 1 };
}
function parseReminderChoices(raw: string | null | undefined): Array<"1d" | "3h" | "1h"> {
  try { const v = JSON.parse(raw ?? "[]") as unknown; return Array.isArray(v) ? v.filter((x): x is "1d" | "3h" | "1h" => x === "1d" || x === "3h" || x === "1h") : []; } catch { return []; }
}
function toQuestion(row: QuestionRow): z.infer<typeof questionShape> {
  return {
    id: row.id, orgId: row.orgId, eventId: row.eventId ?? null, label: row.label, helpText: row.helpText,
    type: row.type as "text" | "choice" | "yesno", options: parseOptions(row.options), required: row.required === 1, sortOrder: row.sortOrder,
  };
}

/* ---------- PII encryption ----------
   Attendee personal data (name, email, phone, legacy answers, and custom
   question answers) is stored AES-256-GCM-encrypted. The key lives in a
   key file outside this database and is only ever touched by the
   privileged handlers in server/src/privileged.ts — action code passes
   plaintext in and receives ciphertext out. Email lookups use an HMAC
   blind index (email_hash) so addresses are never stored or queried in
   the clear. Rows written before encryption existed (pii_encrypted = 0)
   are migrated lazily: the first read that touches them re-encrypts them
   in place. */

const PII_PRIVILEGED = [privileged.piiEncrypt, privileged.piiDecrypt, privileged.piiEmailIndex];

type PlainReg = {
  name: string; email: string; phone: string | null;
  faithAffiliation: string | null; hearAbout: string | null; customAnswers: CustomAnswer[];
  contactEmail: string | null;
};

async function encryptFields(ctx: Ctx, values: Array<string | null>): Promise<Array<string | null>> {
  if (values.length === 0) return [];
  const res = await ctx.executePrivileged(privileged.piiEncrypt, { values });
  return res.values;
}
async function decryptFields(ctx: Ctx, values: Array<string | null>): Promise<Array<string | null>> {
  if (values.length === 0) return [];
  const res = await ctx.executePrivileged(privileged.piiDecrypt, { values });
  return res.values;
}
async function emailIndex(ctx: Ctx, email: string): Promise<string> {
  const res = await ctx.executePrivileged(privileged.piiEmailIndex, { email });
  return res.index;
}

// Re-encrypt any not-yet-encrypted rows in place (one-time lazy migration
// for data written before encryption was introduced).
async function migratePlaintextRegs(ctx: Ctx, rows: RegRow[]): Promise<void> {
  const stale = rows.filter((r) => r.piiEncrypted !== 1);
  if (stale.length === 0) return;
  const db = ctx.db<typeof schema>();
  const flat: Array<string | null> = [];
  for (const r of stale) flat.push(r.name, r.email, r.phone, r.faithAffiliation, r.hearAbout, r.customAnswers, r.contactEmail);
  const enc = await encryptFields(ctx, flat);
  for (let i = 0; i < stale.length; i++) {
    const r = stale[i]!;
    const base = i * 7;
    const hash = await emailIndex(ctx, r.email);
    const contactHash = r.contactEmail ? await emailIndex(ctx, r.contactEmail) : null;
    await db.update(schema.registrations).set({
      name: enc[base] ?? r.name, email: enc[base + 1] ?? r.email, phone: enc[base + 2] ?? null,
      faithAffiliation: enc[base + 3] ?? null, hearAbout: enc[base + 4] ?? null, customAnswers: enc[base + 5] ?? "[]",
      contactEmail: enc[base + 6] ?? null, contactEmailHash: contactHash,
      emailHash: hash, piiEncrypted: 1,
    }).where(eq(schema.registrations.id, r.id));
    r.name = enc[base] ?? r.name; r.email = enc[base + 1] ?? r.email; r.phone = enc[base + 2] ?? null;
    r.faithAffiliation = enc[base + 3] ?? null; r.hearAbout = enc[base + 4] ?? null; r.customAnswers = enc[base + 5] ?? "[]";
    r.contactEmail = enc[base + 6] ?? null; r.contactEmailHash = contactHash;
    r.emailHash = hash; r.piiEncrypted = 1;
  }
}

// Decrypt a batch of registration rows into plaintext views.
async function decryptRegs(ctx: Ctx, rows: RegRow[]): Promise<Map<number, PlainReg>> {
  await migratePlaintextRegs(ctx, rows);
  const flat: Array<string | null> = [];
  for (const r of rows) flat.push(r.name, r.email, r.phone, r.faithAffiliation, r.hearAbout, r.customAnswers, r.contactEmail);
  const dec = await decryptFields(ctx, flat);
  const map = new Map<number, PlainReg>();
  rows.forEach((r, i) => {
    const base = i * 7;
    map.set(r.id, {
      name: dec[base] ?? "", email: dec[base + 1] ?? "", phone: dec[base + 2] ?? null,
      faithAffiliation: dec[base + 3] ?? null, hearAbout: dec[base + 4] ?? null,
      customAnswers: parseAnswers(dec[base + 5] ?? "[]"),
      contactEmail: dec[base + 6] ?? null,
    });
  });
  return map;
}

type AttachmentMeta = { id: number; name: string; contentType: string; sizeBytes: number };
async function attachmentsByEvent(ctx: Ctx, orgId: number): Promise<Map<number, AttachmentMeta[]>> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.eventAttachments).where(eq(schema.eventAttachments.orgId, orgId)).orderBy(asc(schema.eventAttachments.id));
  const map = new Map<number, AttachmentMeta[]>();
  for (const r of rows) { const list = map.get(r.eventId) ?? []; list.push({ id: r.id, name: r.name, contentType: r.contentType, sizeBytes: r.sizeBytes }); map.set(r.eventId, list); }
  return map;
}
function toReg(reg: RegRow, ev: EventRow, orgName: string, plain: PlainReg, groupNames: string[] = [], emailVerified = false, attachments: AttachmentMeta[] = [], flag: { flagType: "blacklist" | "alert"; reason: string } | null = null) {
  return {
    id: reg.id,
    eventId: ev.id,
    orgId: ev.orgId,
    orgName,
    eventTitle: ev.title,
    eventDate: ev.date,
    eventTimeText: ev.timeText,
    eventLocation: ev.location,
    eventLocationType: (ev.locationType ?? "physical") as "physical" | "virtual",
    eventVirtualLink: (reg.status === "approved" || reg.status === "checked_in") ? (ev.virtualLink ?? "") : "",
    eventVenueLat: ev.venueLat ?? null,
    eventVenueLng: ev.venueLng ?? null,
    eventCheckinRadiusM: ev.checkinRadiusM ?? 300,
    eventLocationCheck: (ev.locationCheck ?? "required") as "required" | "off",
    eventGeofenceEnabled: (ev as { geofenceEnabled?: number }).geofenceEnabled !== 0,
    eventGeofenceRadiusM: (ev as { geofenceRadiusM?: number }).geofenceRadiusM ?? 400,
    eventGeofenceBeforeMins: (ev as { geofenceBeforeMins?: number }).geofenceBeforeMins ?? 180,
    eventGeofenceAfterMins: (ev as { geofenceAfterMins?: number }).geofenceAfterMins ?? 120,
    proximityOptIn: (reg as { proximityOptIn?: number }).proximityOptIn === 1,
    proximityNotifiedAt: (reg as { proximityNotifiedAt?: number | null }).proximityNotifiedAt ? new Date((reg as { proximityNotifiedAt?: number }).proximityNotifiedAt!).toISOString() : null,
    proximityRadiusM: (reg as { proximityRadiusM?: number | null }).proximityRadiusM ?? null,
    proximityEffectiveRadiusM: (reg as { proximityRadiusM?: number | null }).proximityRadiusM ?? ((ev as { geofenceRadiusM?: number }).geofenceRadiusM ?? 400),
    name: plain.name,
    email: plain.email,
    contactEmail: plain.contactEmail,
    phone: plain.phone,
    googleId: reg.googleId,
    authProvider: (reg.authProvider as "google" | "apple" | "email" | "manual") ?? "manual",
    status: reg.status as z.infer<typeof statusEnum>,
    code: reg.code,
    entryCode: (reg.status === "approved" || reg.status === "checked_in") ? ((reg as { entryCode?: string | null }).entryCode ?? null) : null,
    groupId: reg.groupId ?? null,
    sharedCode: reg.codeSharing === "shared",
    groupNames,
    decidedVia: reg.decidedVia,
    emailVerified,
    held: reg.held === 1,
    // A blacklist hold's stored reason names the flag; the shared
    // registration shape also feeds attendee-facing lookups, where
    // flagged status must never appear — so flag holds read as a
    // plain review hold here. The admin moderation queue reads the
    // column directly and keeps the precise reason.
    heldReason: (reg.heldReason ?? "").startsWith(FLAG_HOLD_PREFIX) ? "Held for review by the event team." : (reg.heldReason ?? ""),
    flagType: flag?.flagType ?? null,
    flagReason: flag?.reason ?? "",
    notifyChannel: (reg.notifyChannel ?? "email") as "email" | "text" | "both",
    reminderChoices: parseReminderChoices(reg.reminderChoices),
    waitlistOfferedAt: reg.waitlistOfferedAt ? new Date(reg.waitlistOfferedAt).toISOString() : null,
    waitlistExpiresAt: reg.waitlistExpiresAt ? new Date(reg.waitlistExpiresAt).toISOString() : null,
    attachments: reg.status === "approved" || reg.status === "checked_in" ? attachments : [],
    eventLogoUrl: ev.logoUrl || "",
    registeredByName: reg.registeredByName ?? null,
    registeredByEmail: reg.registeredByEmail ?? null,
    faithAffiliation: plain.faithAffiliation,
    hearAbout: plain.hearAbout,
    securityListOptIn: reg.securityListOptIn === "yes" ? true : reg.securityListOptIn === "no" ? false : null,
    customAnswers: plain.customAnswers,
    createdAt: reg.createdAt.toISOString(),
    checkedInAt: reg.checkedInAt ? reg.checkedInAt.toISOString() : null,
  };
}


/* ---------- Email address verification (magic link) ----------
   Verification is tracked per email ADDRESS, globally: once an address
   is verified (by clicking a magic link, or by signing in with Google /
   Apple / an email code — all of which prove control of the address),
   future registrations with that address skip re-validation. The
   address is stored encrypted; lookups use the HMAC blind index. */
async function verifiedHashSet(ctx: Ctx, hashes: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  if (hashes.length === 0) return out;
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ emailHash: schema.emailVerifications.emailHash, verifiedAt: schema.emailVerifications.verifiedAt }).from(schema.emailVerifications);
  const wanted = new Set(hashes);
  for (const r of rows) if (r.verifiedAt && wanted.has(r.emailHash)) out.add(r.emailHash);
  return out;
}
async function markEmailVerified(ctx: Ctx, email: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  const em = email.trim().toLowerCase();
  const hash = await emailIndex(ctx, em);
  const existing = await db.select({ id: schema.emailVerifications.id }).from(schema.emailVerifications).where(eq(schema.emailVerifications.emailHash, hash)).limit(1);
  if (existing[0]) {
    await db.update(schema.emailVerifications).set({ verifiedAt: new Date(), token: null, tokenExpiresAt: null }).where(eq(schema.emailVerifications.id, existing[0].id));
  } else {
    const enc = await encryptFields(ctx, [em]);
    await db.insert(schema.emailVerifications).values({ email: enc[0]!, emailHash: hash, verifiedAt: new Date() });
  }
}
const VERIFICATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
async function ensureVerificationRequest(ctx: Ctx, email: string): Promise<{ email: string; token: string; expiresAt: string } | null> {
  const db = ctx.db<typeof schema>();
  const em = email.trim().toLowerCase();
  const hash = await emailIndex(ctx, em);
  const rows = await db.select().from(schema.emailVerifications).where(eq(schema.emailVerifications.emailHash, hash)).limit(1);
  const row = rows[0];
  if (row?.verifiedAt) return null; // already verified once — never re-validate
  const token = `ver-${makeApprovalToken().slice(4)}`;
  const expiresAt = Date.now() + VERIFICATION_TTL_MS;
  if (row) {
    await db.update(schema.emailVerifications).set({ token, tokenExpiresAt: expiresAt }).where(eq(schema.emailVerifications.id, row.id));
  } else {
    const enc = await encryptFields(ctx, [em]);
    await db.insert(schema.emailVerifications).values({ email: enc[0]!, emailHash: hash, token, tokenExpiresAt: expiresAt });
  }
  return { email: em, token, expiresAt: new Date(expiresAt).toISOString() };
}
async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- Base64url + WebAuthn / session helpers ---------- */
function b64urlEncode(bytes: Uint8Array): string {
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(text: string): Uint8Array {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const bin = atob(b64); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function randomB64url(bytes = 32): string { const b = new Uint8Array(bytes); crypto.getRandomValues(b); return b64urlEncode(b); }
const SESSION_FRESH_MS = 10 * 60 * 1000;
const SESSION_VALID_MS = 12 * 60 * 60 * 1000;
const REAUTH_ERROR = "REAUTH_REQUIRED: This is a sensitive action, so it needs a fresh sign-in check. Verify it's you — with your passkey, or by signing in again — then try again. (Sign-ins stay fresh for 10 minutes.)";
async function mintAuthSession(ctx: Ctx, identityId: string, email: string, method: "google" | "apple" | "email" | "password" | "passkey"): Promise<{ sessionToken: string; sessionFreshUntil: string; sessionMethod: string }> {
  const db = ctx.db<typeof schema>();
  const token = randomB64url(32);
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  const hash = await emailIndex(ctx, email.trim().toLowerCase());
  const enc = await encryptFields(ctx, [email.trim().toLowerCase()]);
  await db.insert(schema.authSessions).values({ tokenHash, identityId, email: enc[0]!, emailHash: hash, method, createdAt: now, freshUntil: now + SESSION_FRESH_MS, expiresAt: now + SESSION_VALID_MS });
  return { sessionToken: token, sessionFreshUntil: new Date(now + SESSION_FRESH_MS).toISOString(), sessionMethod: method };
}
type SessionCheck = { found: boolean; valid: boolean; fresh: boolean; method: string | null; freshUntil: string | null };
async function checkAuthSession(ctx: Ctx, identityId?: string | null, email?: string | null, sessionToken?: string | null): Promise<SessionCheck> {
  if (!sessionToken) return { found: false, valid: false, fresh: false, method: null, freshUntil: null };
  const db = ctx.db<typeof schema>();
  const tokenHash = await sha256Hex(sessionToken);
  const rows = await db.select().from(schema.authSessions).where(eq(schema.authSessions.tokenHash, tokenHash)).limit(1);
  const row = rows[0];
  if (!row || row.revokedAt) return { found: false, valid: false, fresh: false, method: null, freshUntil: null };
  const now = Date.now();
  const identityOk = (!identityId || row.identityId === identityId) && (!email || row.emailHash === await emailIndex(ctx, email.trim().toLowerCase()));
  if (!identityOk || row.expiresAt <= now) return { found: true, valid: false, fresh: false, method: row.method, freshUntil: new Date(row.freshUntil).toISOString() };
  return { found: true, valid: true, fresh: row.freshUntil > now, method: row.method, freshUntil: new Date(row.freshUntil).toISOString() };
}
/* Sensitive-action guard: approvals, revocations, exports, billing,
   user administration, and door-mode settings. When the account has
   a live session (i.e. it signed in through a verified flow), the
   call must carry that session token AND the session must still be
   fresh — otherwise REAUTH_ERROR. Accounts with no session at all
   (the prototype's simulated sign-in, or direct API calls carrying
   only the identity the provider verified at sign-in) fall back to
   the existing server-side role check alone; the moment they sign in
   through a verified flow, freshness is enforced for them too. */
async function assertSensitiveAuth(ctx: Ctx, identityId?: string | null, email?: string | null, sessionToken?: string | null): Promise<void> {
  const db = ctx.db<typeof schema>();
  const now = Date.now();
  let hasLiveSession = false;
  if (identityId || email) {
    const hash = email ? await emailIndex(ctx, email.trim().toLowerCase()) : null;
    const rows = await db.select({ identityId: schema.authSessions.identityId, emailHash: schema.authSessions.emailHash, expiresAt: schema.authSessions.expiresAt, revokedAt: schema.authSessions.revokedAt }).from(schema.authSessions);
    hasLiveSession = rows.some((r) => !r.revokedAt && r.expiresAt > now && ((identityId && r.identityId === identityId) || (hash && r.emailHash === hash)));
  }
  if (!hasLiveSession && !sessionToken) return;
  const check = await checkAuthSession(ctx, identityId, email, sessionToken);
  if (!check.valid || !check.fresh) throw new Error(REAUTH_ERROR);
}
/* Per-organization passkey policy: stored in app_settings as JSON
   { requiredForStaff, requiredRoles: [...] } under
   "passkey_policy_<orgId>". Default: passkeys optional for everyone
   (the baseline offer). An owner can require passkeys for chosen
   staff roles; enforcement happens at sign-in (checkAuthorization
   reports passkeyRequired + hasPasskey so the client routes the
   person to add one) and sensitive staff actions re-check it. */
type PasskeyPolicy = { requiredForStaff: boolean; requiredRoles: string[] };
async function getPasskeyPolicy(ctx: Ctx, orgId: number): Promise<PasskeyPolicy> {
  const raw = await getSetting(ctx, `passkey_policy_${orgId}`);
  if (!raw) return { requiredForStaff: false, requiredRoles: [] };
  try { const p = JSON.parse(raw) as Partial<PasskeyPolicy>; return { requiredForStaff: p.requiredForStaff === true, requiredRoles: Array.isArray(p.requiredRoles) ? p.requiredRoles.filter((r): r is string => typeof r === "string") : [] }; } catch { return { requiredForStaff: false, requiredRoles: [] }; }
}
async function identityHasPasskey(ctx: Ctx, identityId?: string | null, email?: string | null): Promise<boolean> {
  const db = ctx.db<typeof schema>();
  const hash = email ? await emailIndex(ctx, email.trim().toLowerCase()) : null;
  const rows = await db.select({ identityId: schema.passkeyCredentials.identityId, emailHash: schema.passkeyCredentials.emailHash }).from(schema.passkeyCredentials);
  return rows.some((r) => (identityId && r.identityId === identityId) || (hash && r.emailHash === hash));
}
/* ---------- Feature flags (platform owner) ----------
   A feature can be built and ready but switched off by the
   platform owner, and switched on later — globally, per plan
   tier, or per organization — with no redeploy. Layers, in
   precedence order: per-organization override → per-plan-tier
   override → global state → built-in default (on). A layer set
   to "inherit" (i.e. absent) defers to the next layer down.
   Resolution is done server-side on every getFeatureAvailability
   call and inside the gated actions themselves, so a disabled
   feature refuses server-side too — it is not merely hidden.
   Each layer entry carries who toggled it and when, which is
   what the platform console shows ("flagged off" + last toggled).
   Stored in app_settings as JSON maps:
     feature_flags_global, feature_flags_plan_<plan>,
     feature_flags_org_<orgId>. */
type FlagEntry = { state: "on" | "off"; updatedAt: string; updatedBy: string };
type FlagLayer = Record<string, FlagEntry>;
const FEATURE_FLAG_REGISTRY: { key: string; label: string; description: string }[] = [
  { key: "arrival_popup", label: "Arrival pass pop-up", description: "The location-based pass pop-up: geofenced arrival detection plus wallet-pass location relevance for confirmed attendees who opt in." },
  { key: "passkeys", label: "Passkey sign-in", description: "WebAuthn passkeys (Face ID, fingerprint, device PIN, security keys) as a sign-in option, and per-organization passkey policies." },
  { key: "wallet_passes", label: "Wallet passes", description: "Apple Wallet, Google Wallet, and Samsung Wallet pass delivery for confirmed registrations." },
  { key: "ai_assistant", label: "AI assistant for admins", description: "The natural-language admin assistant (create events, search the organization, reports and charts). Plan gating still applies on top of this switch." },
  { key: "attendee_messaging", label: "Attendee messaging", description: "Attendees messaging an event's team from their pass, and staff replying in the app." },
  { key: "announcements", label: "Organization announcements", description: "Organization announcement emails/texts to opted-in attendees, from the announcement center." },
];
const FEATURE_FLAG_PLANS = ["trial", "starter", "community", "pro"] as const;
async function readFlagLayer(ctx: Ctx, settingKey: string): Promise<FlagLayer> {
  const raw = await getSetting(ctx, settingKey);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<FlagEntry>>;
    const out: FlagLayer = {};
    for (const [k, v] of Object.entries(parsed)) if (v && (v.state === "on" || v.state === "off")) out[k] = { state: v.state, updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : "", updatedBy: typeof v.updatedBy === "string" ? v.updatedBy : "" };
    return out;
  } catch { return {}; }
}
async function writeFlagLayer(ctx: Ctx, settingKey: string, map: FlagLayer): Promise<void> {
  await setSetting(ctx, settingKey, JSON.stringify(map));
}
async function resolveFeatureEnabled(ctx: Ctx, orgId: number | null, key: string): Promise<boolean> {
  if (orgId) {
    const orgEntry = (await readFlagLayer(ctx, `feature_flags_org_${orgId}`))[key];
    if (orgEntry) return orgEntry.state === "on";
    const org = await getOrgRow(ctx, orgId);
    if (org) {
      const planEntry = (await readFlagLayer(ctx, `feature_flags_plan_${org.plan}`))[key];
      if (planEntry) return planEntry.state === "on";
    }
  }
  const globalEntry = (await readFlagLayer(ctx, "feature_flags_global"))[key];
  if (globalEntry) return globalEntry.state === "on";
  return true;
}
async function assertFeatureEnabled(ctx: Ctx, orgId: number | null, key: string): Promise<void> {
  if (await resolveFeatureEnabled(ctx, orgId, key)) return;
  const def = FEATURE_FLAG_REGISTRY.find((f) => f.key === key);
  throw new Error(`${def?.label ?? "This feature"} is currently turned off by the platform owner.`);
}
/* Minimal CBOR decoder — just enough for a WebAuthn attestation
   object ({fmt, attStmt, authData}) with attestation "none", plus
   the COSE public key inside authData. */
function cborDecode(bytes: Uint8Array, offset = 0): { value: unknown; next: number } {
  const b = bytes[offset]!; const major = b >> 5; let ai = b & 31; let pos = offset + 1;
  const readLen = (): number => { if (ai < 24) return ai; if (ai === 24) { const v = bytes[pos]!; pos += 1; return v; } if (ai === 25) { const v = (bytes[pos]! << 8) | bytes[pos + 1]!; pos += 2; return v; } if (ai === 26) { const v = ((bytes[pos]! << 24) | (bytes[pos + 1]! << 16) | (bytes[pos + 2]! << 8) | bytes[pos + 3]!) >>> 0; pos += 4; return v; } throw new Error("CBOR length too large"); };
  if (major === 0) return { value: readLen(), next: pos };
  if (major === 1) return { value: -1 - readLen(), next: pos };
  if (major === 2 || major === 3) { const len = readLen(); const slice = bytes.slice(pos, pos + len); pos += len; return { value: major === 2 ? slice : new TextDecoder().decode(slice), next: pos }; }
  if (major === 4) { const len = readLen(); const arr: unknown[] = []; for (let i = 0; i < len; i++) { const r = cborDecode(bytes, pos); arr.push(r.value); pos = r.next; } return { value: arr, next: pos }; }
  if (major === 5) { const len = readLen(); const map = new Map<unknown, unknown>(); for (let i = 0; i < len; i++) { const k = cborDecode(bytes, pos); pos = k.next; const v = cborDecode(bytes, pos); pos = v.next; map.set(k.value, v.value); } return { value: map, next: pos }; }
  if (major === 7) { if (ai === 20) return { value: false, next: pos }; if (ai === 21) return { value: true, next: pos }; if (ai === 22) return { value: null, next: pos }; }
  throw new Error("Unsupported CBOR value");
}
function coseEcKeyToSpki(cose: Map<unknown, unknown>): Uint8Array {
  const x = cose.get(-2) as Uint8Array; const y = cose.get(-3) as Uint8Array;
  if (!x || !y || x.length !== 32 || y.length !== 32) throw new Error("That passkey didn't provide a standard EC public key.");
  const prefix = new Uint8Array([0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00, 0x04]);
  const out = new Uint8Array(prefix.length + 64); out.set(prefix, 0); out.set(x, prefix.length); out.set(y, prefix.length + 32); return out;
}
function extractSpkiFromAttestation(attestationObjectB64: string): string {
  const bytes = b64urlDecode(attestationObjectB64);
  const top = cborDecode(bytes).value as Map<unknown, unknown>;
  const authData = top.get("authData") as Uint8Array;
  if (!authData || authData.length < 37) throw new Error("That passkey response was incomplete — try again.");
  const flags = authData[32]!; if (!(flags & 0x40)) throw new Error("That passkey response carried no credential data.");
  let pos = 37 + 16 + 2; // rpIdHash + flags + counter + AAGUID + credIdLen
  const credIdLen = (authData[53]! << 8) | authData[54]!;
  pos = 55 + credIdLen;
  const cose = cborDecode(authData, pos).value as Map<unknown, unknown>;
  return b64urlEncode(coseEcKeyToSpki(cose));
}
function ecdsaDerToRaw(der: Uint8Array): Uint8Array {
  let pos = 0; if (der[pos++] !== 0x30) throw new Error("Bad signature");
  pos++; if (der[pos]! & 0x80) pos += der[pos]! & 0x7f;
  const readInt = (): Uint8Array => { if (der[pos++] !== 0x02) throw new Error("Bad signature"); const len = der[pos++]!; let v = der.slice(pos, pos + len); pos += len; while (v.length > 0 && v[0] === 0) v = v.slice(1); const out = new Uint8Array(32); out.set(v.slice(-32), 32 - Math.min(32, v.length)); return out; };
  const r = readInt(); const s = readInt(); const raw = new Uint8Array(64); raw.set(r, 0); raw.set(s, 32); return raw;
}
async function verifyPasskeyAssertion(publicKeySpkiB64: string, authenticatorDataB64: string, clientDataJsonB64: string, signatureB64: string, expectedChallenge: string): Promise<{ counter: number }> {
  const clientDataBytes = b64urlDecode(clientDataJsonB64);
  const clientData = JSON.parse(new TextDecoder().decode(clientDataBytes)) as { type?: string; challenge?: string };
  if (clientData.type !== "webauthn.get") throw new Error("That passkey response wasn't a sign-in response — try again.");
  if (clientData.challenge !== expectedChallenge) throw new Error("That passkey sign-in expired or doesn't match this attempt — start again.");
  const authData = b64urlDecode(authenticatorDataB64);
  if (authData.length < 37) throw new Error("That passkey response was incomplete — try again.");
  const counter = ((authData[33]! << 24) | (authData[34]! << 16) | (authData[35]! << 8) | authData[36]!) >>> 0;
  const clientHash = new Uint8Array(await crypto.subtle.digest("SHA-256", clientDataBytes.slice().buffer as ArrayBuffer));
  const signed = new Uint8Array(authData.length + clientHash.length); signed.set(authData, 0); signed.set(clientHash, authData.length);
  const key = await crypto.subtle.importKey("spki", b64urlDecode(publicKeySpkiB64).slice().buffer as ArrayBuffer, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const raw = ecdsaDerToRaw(b64urlDecode(signatureB64));
  const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, raw.slice().buffer as ArrayBuffer, signed.slice().buffer as ArrayBuffer);
  if (!ok) throw new Error("That passkey couldn't be verified — the signature didn't check out. Try again.");
  return { counter };
}
async function verifyPasskeyAttestation(attestationObjectB64: string | undefined, clientDataJsonB64: string, expectedChallenge: string): Promise<void> {
  const clientData = JSON.parse(new TextDecoder().decode(b64urlDecode(clientDataJsonB64))) as { type?: string; challenge?: string };
  if (clientData.type !== "webauthn.create") throw new Error("That passkey response wasn't a creation response — try again.");
  if (clientData.challenge !== expectedChallenge) throw new Error("That passkey setup expired or doesn't match this attempt — start again.");
  if (attestationObjectB64) { const top = cborDecode(b64urlDecode(attestationObjectB64)).value as Map<unknown, unknown>; if (top.get("fmt") !== "none") throw new Error("This app accepts passkeys without device attestation — set the passkey up again and it should complete."); }
}

// For a set of registrations being returned together, compute each shared
// group's member names (from the decrypted batch) so pass cards can say
// who a shared group code covers.
function groupNamesFor(rows: RegRow[], plain: Map<number, PlainReg>): Map<number, string[]> {
  const byGroup = new Map<string, string[]>();
  for (const r of rows) {
    if (r.groupId && r.codeSharing === "shared") {
      const arr = byGroup.get(r.groupId) ?? [];
      arr.push(plain.get(r.id)?.name ?? "");
      byGroup.set(r.groupId, arr);
    }
  }
  const out = new Map<number, string[]>();
  for (const r of rows) {
    if (r.groupId && r.codeSharing === "shared") out.set(r.id, byGroup.get(r.groupId) ?? []);
  }
  return out;
}

async function getOrgRow(ctx: Ctx, orgId: number): Promise<OrgRow | null> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
  return rows[0] ?? null;
}
async function getOrgName(ctx: Ctx, orgId: number): Promise<string> {
  const org = await getOrgRow(ctx, orgId);
  return org?.name ?? "Organization";
}

/* ---------- No pre-loaded organization ----------
   Approved Guest starts from a clean slate: there is NO seeded example
   organization, no demo events, and no demo staff accounts. Every
   organization is created through the onboarding wizard (its creator
   becomes its owner and first administrator) or joined by invitation.
   The only bootstrap row anywhere is the platform owner (below), which
   is a product-level role, not an organization. */

// Neutral starter questions every newly created organization begins with;
// their admins can edit, remove, and reorder them right away.
const DEFAULT_ORG_QUESTIONS: Array<{ label: string; type: "text" | "choice" | "yesno"; options: string[] }> = [
  { label: "How did you hear about us?", type: "choice", options: ["Our website", "Email newsletter", "Social media", "A friend or member", "Other"] },
  { label: "Would you like to join our mailing list?", type: "yesno", options: [] },
];

async function seedDefaultQuestions(ctx: Ctx, orgId: number) {
  const db = ctx.db<typeof schema>();
  for (let i = 0; i < DEFAULT_ORG_QUESTIONS.length; i++) {
    const q = DEFAULT_ORG_QUESTIONS[i]!;
    await db.insert(schema.customQuestions).values({ orgId, eventId: null, label: q.label, helpText: "", type: q.type, options: JSON.stringify(q.options), required: 1, sortOrder: i, legacyKey: "" });
  }
}

/* ---------- Tenant-scoped role checks ----------
   An identity is an administrator or gatekeeper OF A SPECIFIC ORGANIZATION
   only. Every check filters by org_id, so access in one organization never
   leaks into another. */

async function ensureSeedOwners(ctx: Ctx, orgId: number) {
  const db = ctx.db<typeof schema>();
  const existing = await db.select({ id: schema.organizationOwners.id }).from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, orgId)).limit(1);
  if (existing.length > 0) return;
  const org = await getOrgRow(ctx, orgId);
  if (!org) return;
  if (org.ownerEmail) {
    await db.insert(schema.organizationOwners).values({ orgId, googleId: org.ownerGoogleId || `pending-${org.ownerEmail.replace(/[^a-z0-9]+/g, "-")}`, email: org.ownerEmail, displayName: org.ownerEmail }).onConflictDoNothing();
  }
}
/* ---------- Staff email-domain restriction (optional, per org) ----------
   When an organization turns it on, staff roles are honored only for
   accounts whose email domain is on the org's allowed list. Owner,
   administrator, and registrant are always covered when it is on;
   greeters are covered only when the org also includes them
   (staff_domain_include_greeters). The check runs against the STORED
   role row's email, so it holds however the person signs in. It never
   applies to attendees — registration paths don't consult it. */
type StaffRole = "owner" | "admin" | "gatekeeper" | "registrant";
function emailDomainOf(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).trim().toLowerCase() : "";
}
function staffDomainsOf(org: OrgRow): string[] {
  return (org.staffAllowedDomains ?? "").split(/[\s,;]+/).map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter(Boolean);
}
function staffDomainAllowed(org: OrgRow | null, role: StaffRole, rowEmail: string): boolean {
  if (!org || org.staffDomainRestriction !== 1) return true;
  if (role === "gatekeeper" && org.staffDomainIncludeGreeters !== 1) return true;
  const domains = staffDomainsOf(org);
  if (domains.length === 0) return true;
  return domains.includes(emailDomainOf(rowEmail));
}
function assertStaffDomainAllowed(org: OrgRow | null, role: StaffRole, email: string): void {
  if (staffDomainAllowed(org, role, email)) return;
  const roleLabel = role === "gatekeeper" ? "greeter" : role;
  throw new Error(`This organization restricts staff accounts to ${staffDomainsOf(org!).map((d) => "@" + d).join(", ")} email addresses — ${email} can't be added as ${roleLabel === "admin" ? "an administrator" : roleLabel === "owner" ? "an owner" : "a " + roleLabel}. Attendees aren't affected by this rule; it covers staff roles only.`);
}

async function isAuthorizedOwner(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null): Promise<boolean> {
  if (!googleId && !email) return false;
  await ensureSeedOwners(ctx, orgId);
  const db = ctx.db<typeof schema>();
  const org = await getOrgRow(ctx, orgId);
  const rows = await db.select().from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, orgId));
  return rows.some((r) => ((googleId && r.googleId === googleId) || (email && r.email.toLowerCase() === email.toLowerCase())) && staffDomainAllowed(org, "owner", r.email));
}
/* User administration: the OWNER holds it by default. An
   administrator manages members, roles, invites, and removals only
   when the owner has granted them user-administration rights
   (per-admin, on/off). Owners always hold it. */
async function canManageUsers(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null): Promise<boolean> {
  if (await isAuthorizedOwner(ctx, orgId, googleId, email)) return true;
  if (!(await isAuthorizedAdmin(ctx, orgId, googleId, email))) return false;
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, orgId));
  const gid = googleId?.trim();
  const em = email?.trim().toLowerCase();
  const row = rows.find((r) => (gid && r.googleId === gid) || (em && r.email === em));
  return !!row && row.canManageUsers === 1;
}
async function requireUserAdmin(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null): Promise<void> {
  await assertNotCoolingOff(ctx, orgId);
  if (await canManageUsers(ctx, orgId, googleId, email)) return;
  throw new Error("User administration for this organization is held by its owner — only the owner, or an administrator the owner has granted user-administration rights, can add, invite, or remove members and change roles. Ask the owner if you need access.");
}
async function requireOwner(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null, opts?: { allowEnded?: boolean }): Promise<void> {
  if (!googleId && !email) throw new Error("Sign in first.");
  const ok = await isAuthorizedOwner(ctx, orgId, googleId, email);
  if (!ok) throw new Error("Only an owner of this organization can do that — owners manage billing and ownership; administrators run day-to-day operations.");
  if (!opts?.allowEnded) await assertNotCoolingOff(ctx, orgId);
}

/* ---------- Subscription end-of-life + freemium feature gates ------
   Cancellation lifecycle: cancel → administration continues to the
   end of the paid period ("ending") → the subscription has ended:
   a 30-day cooling-off window where the owner can sign in ONLY to
   reactivate (no administration, no data export) while events stay
   visible to attendees → after the window, all org data is deleted.
   Separately, the FREEMIUM model: the Free plan (stored plan id
   "trial", a legacy name kept so existing organizations keep their
   plan) is PERMANENT and feature-limited, not event-limited and not
   a trial. Free covers the basics only — one user (the owner; no
   additional admins, registrars, or greeters), create an event,
   send the notice, collect RSVPs, and see who's coming (the
   attendee list). Everything that controls or reports on entry —
   QR passes, approvals, trusted guests, capacity & waitlists,
   greeter check-in / door access, messaging, announcements,
   reports beyond the attendee list, the AI assistant, and
   location-based passes — is a paid-plan feature, shown to Free
   organizations as an upgrade prompt, never as a broken feature.
   Paid plans: Starter $29/mo, Growth $59/mo, Unlimited $99/mo,
   plus the volume-tiered per-phone/QR-user door-access add-on
   ($0.45 / $0.35 / $0.28 / $0.20 per user/month by volume; fob
   users pay no add-on). An organization upgrades when it outgrows
   Free — e.g. its first event where entry must be controlled, or
   when it needs a second user. */
type OrgRowForLifecycle = { subscriptionStatus: string; accessEndsAt: Date | null; purgeAfter: Date | null; plan: string };
function orgLifecycle(org: OrgRowForLifecycle | null | undefined): "current" | "ending" | "cooling_off" | "purge_due" {
  if (!org || org.subscriptionStatus !== "canceled" || !org.accessEndsAt) return "current";
  const now = Date.now();
  if (now < new Date(org.accessEndsAt).getTime()) return "ending";
  if (org.purgeAfter && now >= new Date(org.purgeAfter).getTime()) return "purge_due";
  return "cooling_off";
}
const COOLING_OFF_MESSAGE = "This organization's subscription has ended, so it can no longer be administered. The owner can sign in and reactivate during the 30-day window after the end date to restore everything — after that window, the organization's data is permanently deleted.";
async function assertNotCoolingOff(ctx: Ctx, orgId: number): Promise<void> {
  const org = await getOrgRow(ctx, orgId);
  const state = orgLifecycle(org);
  if (state === "cooling_off" || state === "purge_due") throw new Error(COOLING_OFF_MESSAGE);
}
async function assertAdvancedAllowed(ctx: Ctx, orgId: number, featureLabel: string): Promise<void> {
  const org = await getOrgRow(ctx, orgId);
  if (org && org.plan === "trial") throw new Error(`${featureLabel} is a paid-plan feature. The Free plan is permanent — it covers the basics: one user (the owner), creating events, sending the notice, collecting RSVPs, and seeing who's coming. Upgrade to a paid plan (Starter $29/mo, Growth $59/mo, Unlimited $99/mo) to use ${featureLabel} — an owner picks a plan under Admin → Settings → Subscription & billing.`);
}
/* Paid-plan gate for the features Free never includes (QR passes,
   approvals, door access, and friends). Same upgrade-prompt shape
   as assertAdvancedAllowed; kept as its own helper so call sites
   read as the freemium rule they enforce. */
async function assertPaidAllowed(ctx: Ctx, orgId: number, featureLabel: string): Promise<void> {
  const org = await getOrgRow(ctx, orgId);
  if (org && org.plan === "trial") throw new Error(`${featureLabel} is a paid-plan feature — the Free plan covers the basics only (create an event, send the notice, collect RSVPs, and see who's coming), with one user: the owner. ${featureLabel} unlocks on the paid plans (Starter $29/mo, Growth $59/mo, Unlimited $99/mo) — an owner can upgrade under Admin → Settings → Subscription & billing, for example when an event needs controlled entry or the organization needs a second user.`);
}
async function isFreePlanOrg(ctx: Ctx, orgId: number): Promise<boolean> {
  const org = await getOrgRow(ctx, orgId);
  return (org?.plan ?? "trial") === "trial";
}
/* Paid-only EVENT settings: on the Free plan an event cannot carry a
   capacity (no waitlists without approvals), auto-approve (no
   approval flow at all), or entry codes (no passes). Called by the
   event create / edit / series paths when those settings are set. */
async function assertEventSettingsAllowed(ctx: Ctx, orgId: number, s: { capacity?: number | null; autoApprove?: boolean | number | null; produceEntryCode?: boolean | number | null }): Promise<void> {
  if (!(await isFreePlanOrg(ctx, orgId))) return;
  if (s.capacity !== undefined && s.capacity !== null) throw new Error("Capacity limits and waitlists are a paid-plan feature — the Free plan collects RSVPs without a cap, so the owner simply sees who's coming. Upgrade to Starter ($29/mo), Growth ($59/mo), or Unlimited ($99/mo) under Subscription & billing to set a capacity.");
  if (s.autoApprove) throw new Error("Auto-approve is part of the approvals workflow, a paid-plan feature — on the Free plan every RSVP is confirmed as it arrives, with no approval step and no pass. Upgrade to Starter ($29/mo), Growth ($59/mo), or Unlimited ($99/mo) under Subscription & billing for approvals and QR passes.");
  if (s.produceEntryCode) throw new Error("Entry codes are part of QR passes and door entry, a paid-plan feature — the Free plan has no passes or codes. Upgrade to Starter ($29/mo), Growth ($59/mo), or Unlimited ($99/mo) under Subscription & billing to control entry.");
}
/* Free-plan RSVP confirmation: a Free registration is confirmed as
   an RSVP the moment it is submitted — no approval step, and NO
   pass code or entry code is ever issued on Free (QR passes and
   door entry are paid features). The attendee list is how the
   owner knows who's coming. */
async function confirmFreeRsvp(ctx: Ctx, registrationId: number): Promise<void> {
  const db = ctx.db<typeof schema>();
  await db.update(schema.registrations).set({ status: "approved", code: null, entryCode: null, decidedAt: new Date(), decidedVia: "Free plan — RSVP confirmed (no approval step, no pass)", checkedInAt: null }).where(eq(schema.registrations.id, registrationId));
  await markApprovalRequestsUsed(ctx, registrationId);
}

/* ---------- Private events, invite links, senders, invitations ----
   A PRIVATE event is visible and registerable only to people who
   have attended this organization before (a confirmed registration —
   approved or checked in — at any of its events), matched by email
   blind index or sign-in ID. The event's invite link overrides the
   rule: anyone holding it can view and register. Admins always see
   everything. */
async function isPastAttendee(ctx: Ctx, orgId: number, emailHash: string | null, googleId?: string | null): Promise<boolean> {
  if (!emailHash && !googleId) return false;
  const db = ctx.db<typeof schema>();
  const evs = await db.select({ id: schema.events.id }).from(schema.events).where(eq(schema.events.orgId, orgId));
  if (evs.length === 0) return false;
  const regs = await db.select({ emailHash: schema.registrations.emailHash, googleId: schema.registrations.googleId, status: schema.registrations.status }).from(schema.registrations).where(inArray(schema.registrations.eventId, evs.map((e) => e.id)));
  return regs.some((r) => (r.status === "approved" || r.status === "checked_in") && ((!!emailHash && r.emailHash === emailHash) || (!!googleId && !!r.googleId && r.googleId === googleId)));
}
function inviteTokenMatches(ev: { inviteToken?: string | null }, token?: string | null): boolean {
  return !!token && token.length >= 8 && !!ev.inviteToken && ev.inviteToken === token;
}
async function canAccessPrivateEvent(ctx: Ctx, ev: EventRow, emailHash: string | null, googleId?: string | null, inviteToken?: string | null): Promise<boolean> {
  if ((ev.visibility ?? "public") !== "private") return true;
  if (inviteTokenMatches(ev, inviteToken)) return true;
  return isPastAttendee(ctx, ev.orgId, emailHash, googleId);
}
function newInviteToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* Send-as resolution: the event's own verified sender wins, then the
   organization's verified default sender, then Approved Guest. The
   label is stated on every composed message so recipients always see
   who the mail is from. */
async function resolveSender(ctx: Ctx, orgId: number): Promise<{ fromLabel: string; senderEmail: string | null; source: "org" | "app" }> {
  const db = ctx.db<typeof schema>();
  const org = await getOrgRow(ctx, orgId);
  const pick = async (id: number | null | undefined) => {
    if (!id) return null;
    const row = (await db.select().from(schema.orgSenders).where(eq(schema.orgSenders.id, id)))[0];
    return row && row.orgId === orgId && row.status === "verified" ? row : null;
  };
  // The authorized sender is an ORGANIZATION-level setting: the org's
  // verified default sender covers every event's mail. There is no
  // per-event sender anymore; with no authorized sender set, mail
  // falls back to the Approved Guest sender.
  const orgSender = await pick(org?.defaultSenderId);
  if (orgSender) return { fromLabel: `${orgSender.displayName ? `${orgSender.displayName} ` : ""}<${orgSender.email}> — for ${org?.name ?? "the organization"}, via Approved Guest`, senderEmail: orgSender.email, source: "org" };
  return { fromLabel: "Approved Guest", senderEmail: null, source: "app" };
}

/* Invitation templates: the organization writes the subject and
   message per event; placeholders insert the event's details and the
   recipient's name automatically — {name} {event} {date} {time}
   {location} {org} {link}. Blank template = the defaults below. */
const DEFAULT_INVITE_SUBJECT = "You're invited: {event} on {date}";
const DEFAULT_INVITE_BODY = "Hi {name},\n\n{org} invites you to {event} on {date} at {time} — {location}.\n\nSee the details and register here: {link}\n\nWe hope to see you there!";
async function validateInvitationRows(ctx: Ctx, eventId: number, rows: Array<{ name: string; email: string; phone?: string }>): Promise<Array<{ name: string; email: string; phone: string; status: "ok" | "bad_email" | "missing_name" | "duplicate_in_file" | "already_invited" | "already_registered"; detail: string; hash: string | null }>> {
  const db = ctx.db<typeof schema>();
  const regs = await db.select({ emailHash: schema.registrations.emailHash, status: schema.registrations.status }).from(schema.registrations).where(eq(schema.registrations.eventId, eventId));
  const regByHash = new Map(regs.filter((r) => r.emailHash).map((r) => [r.emailHash!, r.status]));
  const invited = await db.select({ emailHash: schema.eventInvitations.emailHash }).from(schema.eventInvitations).where(eq(schema.eventInvitations.eventId, eventId));
  const invitedHashes = new Set(invited.map((i) => i.emailHash).filter((h): h is string => !!h));
  const seen = new Set<string>();
  const out: Array<{ name: string; email: string; phone: string; status: "ok" | "bad_email" | "missing_name" | "duplicate_in_file" | "already_invited" | "already_registered"; detail: string; hash: string | null }> = [];
  for (const r of rows) {
    const name = r.name.trim();
    const email = r.email.trim().toLowerCase();
    const phone = (r.phone ?? "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { out.push({ name, email, phone, status: "bad_email", detail: "That email address doesn't look right — fix it or remove the row.", hash: null }); continue; }
    if (!name) { out.push({ name, email, phone, status: "missing_name", detail: "No name — add one so the invitation can greet them.", hash: null }); continue; }
    const hash = await emailIndex(ctx, email);
    if (seen.has(hash)) { out.push({ name, email, phone, status: "duplicate_in_file", detail: "The same address appears more than once in this list.", hash }); continue; }
    seen.add(hash);
    if (regByHash.has(hash)) { out.push({ name, email, phone, status: "already_registered", detail: `Already registered for this event (${regByHash.get(hash)}).`, hash }); continue; }
    if (invitedHashes.has(hash)) { out.push({ name, email, phone, status: "already_invited", detail: "Already invited for this event.", hash }); continue; }
    out.push({ name, email, phone, status: "ok", detail: "Ready to invite.", hash });
  }
  return out;
}
function renderInviteText(tpl: string, vars: { name: string; event: string; date: string; time: string; location: string; org: string; link: string }): string {
  return tpl.replaceAll("{name}", vars.name).replaceAll("{event}", vars.event).replaceAll("{date}", vars.date).replaceAll("{time}", vars.time).replaceAll("{location}", vars.location).replaceAll("{org}", vars.org).replaceAll("{link}", vars.link);
}

/* Permanently deletes EVERYTHING about an organization: its events,
   registrations, people lists, groups, messages, billing rows, audit
   logs, and the organization itself. Runs only from the subscription
   lifecycle job once the 30-day post-end window has passed. */
async function purgeOrganization(ctx: Ctx, orgId: number): Promise<void> {
  const db = ctx.db<typeof schema>();
  const evs = await db.select({ id: schema.events.id }).from(schema.events).where(eq(schema.events.orgId, orgId));
  const eventIds = evs.map((e) => e.id);
  const regs = eventIds.length ? await db.select({ id: schema.registrations.id }).from(schema.registrations).where(inArray(schema.registrations.eventId, eventIds)) : [];
  const regIds = regs.map((r) => r.id);
  const groups = await db.select({ id: schema.attendeeGroups.id }).from(schema.attendeeGroups).where(eq(schema.attendeeGroups.orgId, orgId));
  const groupIds = groups.map((g) => g.id);
  const tickets = await db.select({ id: schema.supportTickets.id }).from(schema.supportTickets).where(eq(schema.supportTickets.orgId, orgId));
  const ticketIds = tickets.map((t) => t.id);
  if (regIds.length) await db.delete(schema.approvalRequests).where(inArray(schema.approvalRequests.registrationId, regIds));
  if (eventIds.length) {
    await db.delete(schema.registrations).where(inArray(schema.registrations.eventId, eventIds));
    await db.delete(schema.eventMessages).where(inArray(schema.eventMessages.eventId, eventIds));
    await db.delete(schema.eventReminderRuns).where(inArray(schema.eventReminderRuns.eventId, eventIds));
    await db.delete(schema.eventAttachments).where(inArray(schema.eventAttachments.eventId, eventIds));
    await db.delete(schema.eventNotifications).where(inArray(schema.eventNotifications.eventId, eventIds));
    await db.delete(schema.eventNotices).where(inArray(schema.eventNotices.eventId, eventIds));
    await db.delete(schema.attendanceAlertsLog).where(inArray(schema.attendanceAlertsLog.eventId, eventIds));
    await db.delete(schema.eventShares).where(inArray(schema.eventShares.eventId, eventIds));
  }
  await db.delete(schema.eventShares).where(eq(schema.eventShares.hostOrgId, orgId));
  await db.delete(schema.eventInvitations).where(eq(schema.eventInvitations.orgId, orgId));
  await db.delete(schema.orgSenders).where(eq(schema.orgSenders.orgId, orgId));
  await db.delete(schema.eventShares).where(eq(schema.eventShares.facilityOrgId, orgId));
  if (groupIds.length) await db.delete(schema.attendeeGroupMembers).where(inArray(schema.attendeeGroupMembers.groupId, groupIds));
  if (ticketIds.length) await db.delete(schema.supportMessages).where(inArray(schema.supportMessages.ticketId, ticketIds));
  await db.delete(schema.customQuestions).where(eq(schema.customQuestions.orgId, orgId));
  await db.delete(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, orgId));
  await db.delete(schema.authorizedGatekeepers).where(eq(schema.authorizedGatekeepers.orgId, orgId));
  await db.delete(schema.authorizedRegistrants).where(eq(schema.authorizedRegistrants.orgId, orgId));
  await db.delete(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, orgId));
  await db.delete(schema.trustedParticipants).where(eq(schema.trustedParticipants.orgId, orgId));
  await db.delete(schema.reportDeliveries).where(eq(schema.reportDeliveries.orgId, orgId));
  await db.delete(schema.reportSchedules).where(eq(schema.reportSchedules.orgId, orgId));
  await db.delete(schema.billingInvoices).where(eq(schema.billingInvoices.orgId, orgId));
  await db.delete(schema.attendeeMessages).where(eq(schema.attendeeMessages.orgId, orgId));
  await db.delete(schema.eventMessageTokens).where(eq(schema.eventMessageTokens.orgId, orgId));
  await db.delete(schema.announcementOptins).where(eq(schema.announcementOptins.orgId, orgId));
  await db.delete(schema.orgAnnouncements).where(eq(schema.orgAnnouncements.orgId, orgId));
  await db.delete(schema.attendeeGroups).where(eq(schema.attendeeGroups.orgId, orgId));
  await db.delete(schema.orgMembershipAudit).where(eq(schema.orgMembershipAudit.orgId, orgId));
  await db.delete(schema.orgSubscriptions).where(eq(schema.orgSubscriptions.orgId, orgId));
  await db.delete(schema.supportTickets).where(eq(schema.supportTickets.orgId, orgId));
  await db.delete(schema.subscriptionReminderLog).where(eq(schema.subscriptionReminderLog.orgId, orgId));
  await db.delete(schema.roleInvites).where(eq(schema.roleInvites.orgId, orgId));
  await db.delete(schema.attendanceAlertsLog).where(eq(schema.attendanceAlertsLog.orgId, orgId));
  await db.delete(schema.events).where(eq(schema.events.orgId, orgId));
  await db.delete(schema.organizations).where(eq(schema.organizations.id, orgId));
}

async function isAuthorizedAdmin(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null): Promise<boolean> {
  if (!googleId && !email) return false;
  // Owners hold all administrator rights too.
  if (await isAuthorizedOwner(ctx, orgId, googleId, email)) return true;
  const db = ctx.db<typeof schema>();
  const org = await getOrgRow(ctx, orgId);
  const rows = await db.select().from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, orgId));
  return rows.some((r) => ((googleId && r.googleId === googleId) || (email && r.email.toLowerCase() === email.toLowerCase())) && staffDomainAllowed(org, "admin", r.email));
}

async function isAuthorizedGatekeeper(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null): Promise<boolean> {
  if (!googleId && !email) return false;
  const db = ctx.db<typeof schema>();
  const org = await getOrgRow(ctx, orgId);
  const rows = await db.select().from(schema.authorizedGatekeepers).where(eq(schema.authorizedGatekeepers.orgId, orgId));
  return rows.some((r) => ((googleId && r.googleId === googleId) || (email && r.email.toLowerCase() === email.toLowerCase())) && staffDomainAllowed(org, "gatekeeper", r.email));
}

async function isAuthorizedRegistrant(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null): Promise<boolean> {
  if (!googleId && !email) return false;
  const db = ctx.db<typeof schema>();
  const org = await getOrgRow(ctx, orgId);
  const rows = await db.select().from(schema.authorizedRegistrants).where(eq(schema.authorizedRegistrants.orgId, orgId));
  return rows.some((r) => ((googleId && r.googleId === googleId) || (email && r.email.toLowerCase() === email.toLowerCase())) && staffDomainAllowed(org, "registrant", r.email));
}

// Verifies an on-behalf submitter: they must be a registrant or an admin
// of the organization. Returns the identity to stamp on the registration,
// or null for a normal self-registration. An unverifiable registeredBy
// claim is rejected outright — "registered by" is never taken on trust.
type RegisteredBy = { googleId: string; email: string; name: string };
async function verifyRegisteredBy(ctx: Ctx, orgId: number, rb: { googleId: string; email: string; name: string } | undefined): Promise<RegisteredBy | null> {
  if (!rb) return null;
  const ok = (await isAuthorizedRegistrant(ctx, orgId, rb.googleId, rb.email)) || (await isAuthorizedAdmin(ctx, orgId, rb.googleId, rb.email));
  if (!ok) throw new Error("Only this organization's registrants and administrators can register someone on their behalf.");
  return { googleId: rb.googleId.trim(), email: rb.email.trim().toLowerCase(), name: rb.name.trim() };
}

const registeredByArg = z.object({
  googleId: z.string().min(1).max(200),
  email: z.string().email().max(200),
  name: z.string().min(1).max(120),
}).optional();

async function requireAdmin(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null, opts?: { allowEnded?: boolean }): Promise<void> {
  if (!googleId && !email) throw new Error("Sign in with an authorized Google account first.");
  const ok = await isAuthorizedAdmin(ctx, orgId, googleId, email);
  if (!ok) throw new Error("Only authorized administrators of this organization can do that.");
  if (!opts?.allowEnded) await assertNotCoolingOff(ctx, orgId);
}

/* ---------- Platform owner (product-level, NOT an org role) ----------
   The platform owner runs Approved Guest itself. The bootstrap owner
   is the product owner's own account (JPGelber@gmail.com); the row is
   seeded once when the table is empty. Platform
   ownership never comes from an organization role: org admins and
   owners cannot see or use the platform console. */
const PLATFORM_OWNER_BOOTSTRAP = { email: "jpgelber@gmail.com", displayName: "Jonathan Gelber" };
async function ensurePlatformOwners(ctx: Ctx): Promise<void> {
  const db = ctx.db<typeof schema>();
  const existing = await db.select({ id: schema.platformOwners.id }).from(schema.platformOwners).limit(1);
  if (existing.length > 0) return;
  await db.insert(schema.platformOwners).values({ googleId: "", email: PLATFORM_OWNER_BOOTSTRAP.email, displayName: PLATFORM_OWNER_BOOTSTRAP.displayName }).onConflictDoNothing();
}
async function isPlatformOwner(ctx: Ctx, googleId?: string | null, email?: string | null): Promise<boolean> {
  if (!googleId && !email) return false;
  await ensurePlatformOwners(ctx);
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.platformOwners);
  return rows.some((r) => (googleId && r.googleId && r.googleId === googleId) || (email && r.email.toLowerCase() === email.toLowerCase()));
}
async function requirePlatformOwner(ctx: Ctx, googleId?: string | null, email?: string | null): Promise<void> {
  if (!googleId && !email) throw new Error("Sign in first.");
  if (!(await isPlatformOwner(ctx, googleId, email))) throw new Error("Only the platform owner can do that — the platform console is separate from organization administration.");
}
async function logPlatformAdjustment(ctx: Ctx, orgId: number, kind: "comp" | "uncomp" | "plan_change" | "allowance_change" | "extend_trial" | "extend_billing" | "pause_billing" | "resume_billing" | "credit", details: string, reason: string, actorEmail: string, amountCents?: number): Promise<void> {
  const db = ctx.db<typeof schema>();
  await db.insert(schema.platformAdjustments).values({ orgId, kind, details, reason: reason.trim(), actorEmail: actorEmail.toLowerCase(), amountCents: amountCents ?? null });
}

async function requireStaff(ctx: Ctx, orgId: number, googleId?: string | null, email?: string | null): Promise<void> {
  if (!googleId && !email) throw new Error("Sign in with an authorized Google account first.");
  const ok = (await isAuthorizedAdmin(ctx, orgId, googleId, email)) || (await isAuthorizedGatekeeper(ctx, orgId, googleId, email));
  if (!ok) throw new Error("Only this organization's administrators and gatekeepers can do that.");
}

function makeCode(prefix: string): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  const p = (prefix || "EVT").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "EVT";
  return `${p}-${out}`;
}

/* Entry codes (only for events with produce_entry_code on): a short
   6-digit numeric code, easy to read out loud or type at the door —
   deliberately unlike the pass code's PREFIX-XXXXXX shape so a greeter
   can tell the two apart. Unique across all registrations, like pass
   codes, so a door lookup by entry code alone is never ambiguous. */
function makeEntryCodeCandidate(): string {
  return String(100000 + Math.floor(Math.random() * 900000));
}

async function issueEntryCode(ctx: Ctx, reg: { groupId: string | null; codeSharing: string }): Promise<string> {
  const db = ctx.db<typeof schema>();
  // Shared group pass: the group shares ONE entry code too, mirroring
  // the shared pass code — every approved member carries the same one.
  if (reg.codeSharing === "shared" && reg.groupId) {
    const sibs = await db.select({ entryCode: schema.registrations.entryCode }).from(schema.registrations).where(eq(schema.registrations.groupId, reg.groupId));
    const existing = sibs.find((s) => s.entryCode)?.entryCode;
    if (existing) return existing;
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = makeEntryCodeCandidate();
    const clash = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.entryCode, candidate)).limit(1);
    if (clash.length === 0) return candidate;
  }
  throw new Error("Could not issue a unique entry code. Try again.");
}

/* Backfill used when an admin turns "Produce entry code" ON for an
   event that already has confirmed registrations: each of them gets
   an entry code, as if the setting had been on all along. */
async function backfillEntryCodes(ctx: Ctx, eventId: number): Promise<void> {
  const db = ctx.db<typeof schema>();
  const regs = await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, eventId));
  for (const r of regs) {
    if ((r.status !== "approved" && r.status !== "checked_in") || r.entryCode) continue;
    const entryCode = await issueEntryCode(ctx, r);
    await db.update(schema.registrations).set({ entryCode }).where(eq(schema.registrations.id, r.id));
  }
}

async function getEventRow(ctx: Ctx, eventId: number): Promise<EventRow | null> {
  const db = ctx.db<typeof schema>();
  // Soft-deleted events are invisible to every ordinary lookup: they
  // behave exactly as if they no longer exist. The restore / deleted-
  // events / purge paths query the events table directly instead.
  const rows = await db.select().from(schema.events).where(and(eq(schema.events.id, eventId), isNull(schema.events.deletedAt))).limit(1);
  return rows[0] ?? null;
}

/* Soft-delete retention: a deleted event (with its registrations and
   questions) stays recoverable for 30 days, then the scheduled purge
   (purgeExpiredDeletedEvents) permanently removes the data. */
const EVENT_DELETE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/* Event titles + dates are unique (events_title_date_idx) across ALL
   rows — including soft-deleted ones, which keep their pair reserved
   while they wait in Deleted events. Check before insert/update so an
   admin gets a plain-language explanation instead of a raw database
   constraint error. excludeId spares the event being edited. */
async function assertTitleDateAvailable(ctx: Ctx, title: string, date: string, excludeId?: number): Promise<void> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ id: schema.events.id, deletedAt: schema.events.deletedAt }).from(schema.events).where(and(eq(schema.events.title, title), eq(schema.events.date, date)));
  const clash = rows.find((r) => r.id !== excludeId);
  if (!clash) return;
  if (clash.deletedAt) throw new Error("A deleted event with this title and date is still in Deleted events — titles and dates stay reserved while an event is restorable. Restore that event instead of creating a new one, or pick a different title or date; the pair frees up when the deleted event's 30-day window closes.");
  throw new Error("An event with this title and date already exists — titles and dates must be unique. Pick a different title or date.");
}

/* The permanent-removal cascade for ONE event — used only by the
   retention purge, after the recovery window has closed. Mirrors the
   event-scoped deletions in purgeOrganization; cancellation notices
   are deliberately kept (they are the attendee's own record of the
   cancellation, snapshotted for exactly this situation). */
async function hardDeleteEventData(ctx: Ctx, eventId: number): Promise<void> {
  const db = ctx.db<typeof schema>();
  const regs = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.eventId, eventId));
  for (const r of regs) await db.delete(schema.approvalRequests).where(eq(schema.approvalRequests.registrationId, r.id));
  await db.delete(schema.registrations).where(eq(schema.registrations.eventId, eventId));
  await db.delete(schema.customQuestions).where(eq(schema.customQuestions.eventId, eventId));
  await db.delete(schema.eventMessages).where(eq(schema.eventMessages.eventId, eventId));
  await db.delete(schema.eventReminderRuns).where(eq(schema.eventReminderRuns.eventId, eventId));
  await db.delete(schema.eventAttachments).where(eq(schema.eventAttachments.eventId, eventId));
  await db.delete(schema.eventNotifications).where(eq(schema.eventNotifications.eventId, eventId));
  await db.delete(schema.attendanceAlertsLog).where(eq(schema.attendanceAlertsLog.eventId, eventId));
  await db.delete(schema.eventShares).where(eq(schema.eventShares.eventId, eventId));
  await db.delete(schema.attendeeMessages).where(eq(schema.attendeeMessages.eventId, eventId));
  await db.delete(schema.eventInvitations).where(eq(schema.eventInvitations.eventId, eventId));
  await db.delete(schema.events).where(eq(schema.events.id, eventId));
}

// Effective questions for an event: the event's own questions when the
// event has any, otherwise the organization's defaults.
async function effectiveQuestions(ctx: Ctx, ev: EventRow): Promise<QuestionRow[]> {
  const db = ctx.db<typeof schema>();
  const own = await db.select().from(schema.customQuestions)
    .where(and(eq(schema.customQuestions.orgId, ev.orgId), eq(schema.customQuestions.eventId, ev.id)))
    .orderBy(asc(schema.customQuestions.sortOrder), asc(schema.customQuestions.id));
  if (own.length > 0) return own;
  return db.select().from(schema.customQuestions)
    .where(and(eq(schema.customQuestions.orgId, ev.orgId), isNull(schema.customQuestions.eventId)))
    .orderBy(asc(schema.customQuestions.sortOrder), asc(schema.customQuestions.id));
}

/* ---------- Trusted participants ----------
   A registration is auto-approved when the attendee matches the event
   organization's trusted list — by email blind index, or by Google ID
   when the registration came through Google sign-in. Auto-approval uses
   the same decision path as an admin approval (pass code issued, email
   links retired) with decidedVia recording the trusted source. */

async function isTrustedParticipant(ctx: Ctx, orgId: number, emailHash: string, googleId?: string | null): Promise<boolean> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.trustedParticipants).where(eq(schema.trustedParticipants.orgId, orgId));
  return rows.some((r) => r.emailHash === emailHash || (!!googleId && r.googleId !== "" && r.googleId === googleId));
}

/* ---------- Attendee flags (blacklist / alert) ----------
   Per-organization flags on an attendee, matched by email blind
   index — the mirror image of the trusted list. BLACKLIST refuses
   registration outright (the attendee sees only a plain "we can't
   complete this registration" message — the flag is never named to
   them) and holds the person's existing registrations for admin
   review. ALERT never blocks: it forces the registration through
   the normal approver queue (no trusted / auto-approve shortcut)
   and marks the person for admins in the attendee list and the
   approval queue. Flag data is admin-facing only: it is attached to
   registration rows solely on the admin path of listRegistrations
   and on listApprovalRequests (both admin-gated); attendee-facing
   lookups never receive it. */
type AttendeeFlagRow = typeof schema.attendeeFlags.$inferSelect;

async function getAttendeeFlag(ctx: Ctx, orgId: number, emailHash: string): Promise<AttendeeFlagRow | null> {
  if (!emailHash) return null;
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.attendeeFlags)
    .where(and(eq(schema.attendeeFlags.orgId, orgId), eq(schema.attendeeFlags.emailHash, emailHash)))
    .limit(1);
  return rows[0] ?? null;
}

async function attendeeFlagMap(ctx: Ctx, orgId: number): Promise<Map<string, AttendeeFlagRow>> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.attendeeFlags).where(eq(schema.attendeeFlags.orgId, orgId));
  return new Map(rows.map((r) => [r.emailHash, r]));
}

// The plain refusal a blacklisted person sees — identical on every
// registration path, and it never mentions flags or blacklists.
const BLACKLIST_REFUSAL = "We're sorry — we can't complete this registration. If you have questions, please contact the organization directly.";
// held_reason marker for registrations held BECAUSE of a blacklist
// flag (as opposed to a content-moderation hold), so removing or
// downgrading the flag releases exactly those holds.
const FLAG_HOLD_PREFIX = "Blacklist flag — held for review: ";

// Blacklist side effect: every live registration this person holds in
// the organization is held for review. Already-held rows (e.g. a
// content-moderation hold) keep their original hold and reason.
async function holdRegistrationsForBlacklist(ctx: Ctx, orgId: number, emailHash: string, reason: string): Promise<number> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ reg: schema.registrations }).from(schema.registrations)
    .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
    .where(and(eq(schema.events.orgId, orgId), eq(schema.registrations.emailHash, emailHash),
      inArray(schema.registrations.status, ["pending", "approved", "checked_in", "waitlisted"])));
  let held = 0;
  for (const { reg } of rows) {
    if (reg.held === 1) continue;
    await db.update(schema.registrations).set({ held: 1, heldReason: `${FLAG_HOLD_PREFIX}${reason}` }).where(eq(schema.registrations.id, reg.id));
    // Retire any live approval-email links for the held registration —
    // while it is held, no approver link may decide it.
    await markApprovalRequestsUsed(ctx, reg.id);
    held += 1;
  }
  return held;
}

// Undo the blacklist hold: only holds this feature created (matched
// by the reason prefix) are released; content-moderation holds and
// the registrations' statuses are untouched — each registration
// simply re-enters its normal flow at its current status.
async function releaseFlagHolds(ctx: Ctx, orgId: number, emailHash: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ reg: schema.registrations }).from(schema.registrations)
    .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
    .where(and(eq(schema.events.orgId, orgId), eq(schema.registrations.emailHash, emailHash), eq(schema.registrations.held, 1)));
  for (const { reg } of rows) {
    if ((reg.heldReason ?? "").startsWith(FLAG_HOLD_PREFIX)) {
      await db.update(schema.registrations).set({ held: 0, heldReason: "" }).where(eq(schema.registrations.id, reg.id));
    }
  }
}

// Validate submitted answers against the effective questions and build the
// stored snapshot + legacy column values.
function buildAnswers(questions: QuestionRow[], submitted: Array<{ questionId: number; answer: string }> | undefined): { answers: CustomAnswer[]; faith: string | null; hear: string | null; securityOptIn: boolean | null } {
  const byId = new Map<number, string>();
  for (const s of submitted ?? []) byId.set(s.questionId, (s.answer ?? "").trim());
  const answers: CustomAnswer[] = [];
  let faith: string | null = null;
  let hear: string | null = null;
  let securityOptIn: boolean | null = null;
  for (const q of questions) {
    const raw = byId.get(q.id) ?? "";
    if (q.required === 1 && !raw) throw new Error(`Please answer: ${q.label}`);
    if (q.type === "choice" && raw && !parseOptions(q.options).includes(raw)) throw new Error(`That answer isn't one of the choices for: ${q.label}`);
    if (q.type === "yesno" && raw && raw !== "Yes" && raw !== "No") throw new Error(`Please answer Yes or No for: ${q.label}`);
    if (raw) answers.push({ questionId: q.id, label: q.label, type: q.type as "text" | "choice" | "yesno", answer: raw });
    if (q.legacyKey === "faith") faith = raw || null;
    if (q.legacyKey === "hear") hear = raw || null;
    if (q.legacyKey === "security") securityOptIn = raw === "Yes" ? true : raw === "No" ? false : null;
  }
  return { answers, faith, hear, securityOptIn };
}

/* ---------- Approvals by email ----------
   Each event can name one or more approval email addresses (falling back
   to the organization's administrators). Each new registration creates an
   approval request per approver carrying Approve / Not approved links;
   the link's token IS the credential, so an approver can decide straight
   from the email without signing in. First decision wins. */

const APPROVAL_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function makeApprovalToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return `apr-${hex}`;
}

async function resolveApproverEmails(ctx: Ctx, ev: EventRow): Promise<string[]> {
  const own = parseApprovalEmails(ev.approvalEmails);
  if (own.length > 0) return own;
  const db = ctx.db<typeof schema>();
  const admins = await db.select().from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, ev.orgId));
  return normalizeEmailList(admins.map((a) => a.email));
}

async function createApprovalRequests(ctx: Ctx, registrationId: number, ev: EventRow): Promise<string[]> {
  const db = ctx.db<typeof schema>();
  const approvers = await resolveApproverEmails(ctx, ev);
  await db.delete(schema.approvalRequests).where(and(eq(schema.approvalRequests.registrationId, registrationId), isNull(schema.approvalRequests.usedAt)));
  const expiresAt = new Date(Date.now() + APPROVAL_TOKEN_TTL_MS);
  for (const approverEmail of approvers) {
    await db.insert(schema.approvalRequests).values({ registrationId, approverEmail, token: makeApprovalToken(), expiresAt });
  }
  return approvers;
}

async function markApprovalRequestsUsed(ctx: Ctx, registrationId: number, exceptToken?: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.approvalRequests).where(and(eq(schema.approvalRequests.registrationId, registrationId), isNull(schema.approvalRequests.usedAt)));
  for (const r of rows) {
    if (exceptToken && r.token === exceptToken) continue;
    await db.update(schema.approvalRequests).set({ usedAt: new Date() }).where(eq(schema.approvalRequests.id, r.id));
  }
}

async function applyApprovalDecision(ctx: Ctx, reg: RegRow, decision: "approved" | "denied", decidedVia: string): Promise<{ code: string | null; entryCode: string | null }> {
  const db = ctx.db<typeof schema>();
  const ev = await getEventRow(ctx, reg.eventId);
  const org = ev ? await getOrgRow(ctx, ev.orgId) : null;
  let code: string | null = null;
  let entryCode: string | null = null;
  if (decision === "approved" && org?.plan === "trial") {
    // Safety net for the freemium rule: a Free-plan approval never
    // issues a QR pass or entry code — Free confirmations are RSVPs
    // (confirmFreeRsvp is the normal path; this covers any legacy
    // pending rows decided through an approval channel).
    await db.update(schema.registrations).set({ status: "approved", code: null, entryCode: null, decidedAt: new Date(), decidedVia, checkedInAt: null }).where(eq(schema.registrations.id, reg.id));
    await markApprovalRequestsUsed(ctx, reg.id);
    return { code: null, entryCode: null };
  }
  if (decision === "approved") {
    // Shared group pass: reuse the group's existing code so every approved
    // member of the group carries the SAME code. Revoking one member only
    // clears that member's row — the rest keep the shared code.
    if (reg.codeSharing === "shared" && reg.groupId) {
      const sibs = await db.select({ code: schema.registrations.code }).from(schema.registrations).where(eq(schema.registrations.groupId, reg.groupId));
      code = sibs.find((s) => s.code)?.code ?? null;
    }
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = makeCode(org?.codePrefix ?? "EVT");
      const clash = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.code, candidate)).limit(1);
      if (clash.length === 0) code = candidate;
    }
    if (!code) throw new Error("Could not issue a unique pass code. Try again.");
    // Entry code: only when the event's "Produce entry code" setting
    // is on. Off = no entry code is produced, exactly as before.
    if (ev && (ev as { produceEntryCode?: number }).produceEntryCode === 1) {
      entryCode = await issueEntryCode(ctx, reg);
    }
  }
  await db.update(schema.registrations).set({ status: decision, code, entryCode, decidedAt: new Date(), decidedVia, checkedInAt: null }).where(eq(schema.registrations.id, reg.id));
  await markApprovalRequestsUsed(ctx, reg.id);
  return { code, entryCode };
}


/* ---------- Capacity & waitlists ----------
   An event with a capacity is FULL when seats taken (approved +
   checked in + live waitlist holds) reach it. Registering for a full
   event creates a WAITLISTED registration instead — no approver step,
   no pass. When a seat frees up (an approved registration is denied
   late, revoked, or removed, or the capacity is raised), the next
   waitlisted person in line is automatically OFFERED the seat: a
   time-limited hold (48 hours) that counts toward capacity, surfaced
   on their pass / My Events and in the admin list, and delivered on
   the channel they chose (composed exactly like the app's other
   notifications). Accepting moves them into the normal approval flow
   with the seat still held; declining or letting the hold lapse
   passes the offer to the next person. */
const WAITLIST_OFFER_MS = 48 * 60 * 60 * 1000;
async function eventSeatsTaken(ctx: Ctx, eventId: number, excludeRegId?: number): Promise<number> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ id: schema.registrations.id, status: schema.registrations.status, held: schema.registrations.held, waitlistExpiresAt: schema.registrations.waitlistExpiresAt }).from(schema.registrations).where(eq(schema.registrations.eventId, eventId));
  const now = Date.now();
  let n = 0;
  for (const r of rows) {
    if (r.held === 1 || r.id === excludeRegId) continue;
    if (r.status === "approved" || r.status === "checked_in") n += 1;
    else if ((r.status === "waitlisted" || r.status === "pending") && r.waitlistExpiresAt && r.waitlistExpiresAt > now) n += 1; // live offer hold (waitlisted, or accepted and awaiting approval)
  }
  return n;
}
async function eventIsFull(ctx: Ctx, ev: EventRow): Promise<boolean> {
  if (ev.capacity === null || ev.capacity === undefined) return false;
  return (await eventSeatsTaken(ctx, ev.id)) >= ev.capacity;
}
async function promoteWaitlist(ctx: Ctx, eventId: number): Promise<number> {
  const db = ctx.db<typeof schema>();
  const ev = await getEventRow(ctx, eventId);
  if (!ev || ev.capacity === null || ev.capacity === undefined) return 0;
  const now = Date.now();
  // Expire stale holds first — an expired offer frees its seat.
  const stale = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.eventId, eventId));
  for (const r of stale) {
    const row = (await db.select().from(schema.registrations).where(eq(schema.registrations.id, r.id)).limit(1))[0];
    if (row && (row.status === "waitlisted" || row.status === "pending") && row.waitlistExpiresAt && row.waitlistExpiresAt <= now) {
      await db.update(schema.registrations).set({ waitlistOfferedAt: null, waitlistExpiresAt: null }).where(eq(schema.registrations.id, row.id));
    }
  }
  let offered = 0;
  for (;;) {
    if ((await eventSeatsTaken(ctx, eventId)) >= ev.capacity) break;
    const queue = await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, eventId)).orderBy(asc(schema.registrations.createdAt), asc(schema.registrations.id));
    const next = queue.find((r) => r.status === "waitlisted" && r.held !== 1 && !r.waitlistExpiresAt);
    if (!next) break;
    await db.update(schema.registrations).set({ waitlistOfferedAt: now, waitlistExpiresAt: now + WAITLIST_OFFER_MS }).where(eq(schema.registrations.id, next.id));
    offered += 1;
  }
  if (offered > 0) ctx.invalidateQueries();
  return offered;
}

/* ---------- Registration verification ----------
   There is no CAPTCHA on any registration path. Verification comes from
   the sign-in method itself: Google or Apple sign-in, or the email
   magic link / sign-in code, which proves control of the address.
   (The captcha_challenges table from migration 0007 is now unused.) */

/* ---------- Google OAuth (real Google Identity Services sign-in) ----------
   The client loads Google's GIS library with the OAuth 2.0 Web client ID
   stored in app_settings, and Google returns a signed ID token (JWT),
   verified here server-side: RS256 signature against Google's public keys
   plus iss / aud / exp / email_verified claim checks. Only infrastructure
   failures fall back to Google's tokeninfo endpoint. */

const GOOGLE_CLIENT_ID_KEY = "google_client_id";
/* App download links for the arrival pop-up: when an attendee who
   registered on the WEBSITE (not in the Approved Guest app) answers
   Yes to "Do you want this confirmation to appear when you arrive?",
   the pop-up can't work in a browser tab — they are told they need
   the app and given the download link for their platform. The links
   are product-level configuration (app_settings), set by an admin in
   Admin Review → Settings → "App download links"; empty = not
   configured yet, and the client then names the store to search in
   instead of showing a link. No link is ever invented here. */
const APP_STORE_URL_KEY = "app_store_url";
const GOOGLE_PLAY_URL_KEY = "google_play_url";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

async function getSetting(ctx: Ctx, key: string): Promise<string | null> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, key)).limit(1);
  const value = rows[0]?.value?.trim();
  return value ? value : null;
}
async function setSetting(ctx: Ctx, key: string, value: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  await db.insert(schema.appSettings).values({ key, value }).onConflictDoUpdate({ target: schema.appSettings.key, set: { value } });
}
/* Paid features the upgrade carousel can promote (canonical order = default promotion order). */
const CAROUSEL_FEATURE_KEYS: string[] = ["qr_passes", "approvals", "capacity", "messaging", "reports", "ai", "location_passes", "door_access"];
function b64urlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function b64urlToJson(input: string): Record<string, unknown> {
  const text = new TextDecoder().decode(b64urlToBytes(input));
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Malformed token segment.");
  return parsed as Record<string, unknown>;
}
type JwkKey = { kid?: string; kty?: string; n?: string; e?: string; alg?: string; use?: string };
let jwksCache: { keys: JwkKey[]; expiresAt: number } | null = null;
async function fetchWithTimeout(url: string, ms = 8000, headers?: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, headers: { "user-agent": "Mozilla/5.0 (compatible; OrgBrandingImporter/1.0)", ...(headers ?? {}) } });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error("The request timed out. Check the address and try again.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
async function fetchGoogleJwks(): Promise<{ keys: JwkKey[]; maxAgeSec: number }> {
  const res = await fetchWithTimeout(GOOGLE_JWKS_URL);
  if (!res.ok) throw new Error(`Google key fetch failed (${res.status}).`);
  const cc = res.headers.get("cache-control") ?? "";
  const maxAgePart = cc.split(",").map((p) => p.trim()).find((p) => p.startsWith("max-age="));
  const parsedAge = maxAgePart ? Number.parseInt(maxAgePart.slice("max-age=".length), 10) : NaN;
  const maxAgeSec = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : 3600;
  const body: unknown = await res.json();
  const keys = (body as { keys?: unknown }).keys;
  if (!Array.isArray(keys)) throw new Error("Google key response was malformed.");
  return { keys: keys as JwkKey[], maxAgeSec };
}
async function getGoogleKey(kid: string, forceRefresh = false): Promise<JwkKey> {
  const now = Date.now();
  if (forceRefresh || !jwksCache || jwksCache.expiresAt <= now) {
    const { keys, maxAgeSec } = await fetchGoogleJwks();
    jwksCache = { keys, expiresAt: now + Math.max(60, maxAgeSec) * 1000 };
  }
  const key = jwksCache.keys.find((k) => k.kid === kid);
  if (!key && !forceRefresh) return getGoogleKey(kid, true);
  if (!key) throw new Error("Google signing key not found for this token.");
  return key;
}
type GoogleClaims = { sub: string; email: string; name: string };
function validateClaims(claims: Record<string, unknown>, clientId: string): GoogleClaims {
  const iss = claims["iss"];
  if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") throw new Error("This token was not issued by Google.");
  if (claims["aud"] !== clientId) throw new Error("This token was issued for a different app, not this one.");
  const exp = Number(claims["exp"]);
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) throw new Error("This Google sign-in has expired. Please sign in again.");
  if (claims["email_verified"] !== true && claims["email_verified"] !== "true") throw new Error("That Google account's email is not verified by Google.");
  const sub = claims["sub"];
  const email = claims["email"];
  if (typeof sub !== "string" || !sub) throw new Error("Google's token is missing the account ID.");
  if (typeof email !== "string" || !email.includes("@")) throw new Error("Google's token is missing a verified email address.");
  const nameClaim = claims["name"];
  return { sub, email: email.toLowerCase(), name: typeof nameClaim === "string" && nameClaim.trim() ? nameClaim.trim() : email };
}
async function verifyIdTokenLocally(credential: string, clientId: string): Promise<GoogleClaims> {
  const parts = credential.split(".");
  const [headerPart, payloadPart, signaturePart] = parts;
  if (parts.length !== 3 || !headerPart || !payloadPart || !signaturePart) throw new Error("That does not look like a Google ID token.");
  const header = b64urlToJson(headerPart);
  if (header["alg"] !== "RS256") throw new Error("Unexpected token signing algorithm.");
  const kid = header["kid"];
  if (typeof kid !== "string" || !kid) throw new Error("Token is missing its key ID.");
  const jwk = await getGoogleKey(kid);
  const cryptoKey = await crypto.subtle.importKey("jwk", { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const signed = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, b64urlToBytes(signaturePart), signed);
  if (!ok) throw new Error("Google signature check failed for this token.");
  return validateClaims(b64urlToJson(payloadPart), clientId);
}
async function verifyIdTokenViaTokeninfo(credential: string, clientId: string): Promise<GoogleClaims> {
  // POST with the token in the form body — never in the URL, where a
  // credential could be captured in request logs.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(GOOGLE_TOKENINFO_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: credential }).toString(),
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error("Google could not verify this sign-in token.");
  const body: unknown = await res.json();
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Error("Google's verification response was malformed.");
  return validateClaims(body as Record<string, unknown>, clientId);
}
async function verifyGoogleToken(credential: string, clientId: string): Promise<GoogleClaims> {
  try {
    return await verifyIdTokenLocally(credential, clientId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const hardFail = /signature|issued|expired|verified|algorithm|key ID|look like|missing/.test(msg);
    if (hardFail) throw e;
    return verifyIdTokenViaTokeninfo(credential, clientId);
  }
}
// After a verified sign-in, anchor placeholder admin/gatekeeper entries
// (added by email before the person's first real sign-in, e.g. onboarding
// invites) to their real Google ID, in every organization where the email
// matches and the real ID isn't already listed.
async function reconcileRoleGoogleIds(ctx: Ctx, sub: string, email: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  const em = email.toLowerCase();
  const adminRows = await db.select().from(schema.authorizedAdmins);
  for (const r of adminRows) {
    if (r.email.toLowerCase() === em && r.googleId !== sub && !adminRows.some((o) => o.orgId === r.orgId && o.googleId === sub)) {
      await db.update(schema.authorizedAdmins).set({ googleId: sub }).where(eq(schema.authorizedAdmins.id, r.id));
    }
  }
  const gateRows = await db.select().from(schema.authorizedGatekeepers);
  for (const r of gateRows) {
    if (r.email.toLowerCase() === em && r.googleId !== sub && !gateRows.some((o) => o.orgId === r.orgId && o.googleId === sub)) {
      await db.update(schema.authorizedGatekeepers).set({ googleId: sub }).where(eq(schema.authorizedGatekeepers.id, r.id));
    }
  }
  const regRows = await db.select().from(schema.authorizedRegistrants);
  for (const r of regRows) {
    if (r.email.toLowerCase() === em && r.googleId !== sub && !regRows.some((o) => o.orgId === r.orgId && o.googleId === sub)) {
      await db.update(schema.authorizedRegistrants).set({ googleId: sub }).where(eq(schema.authorizedRegistrants.id, r.id));
    }
  }
}

/* ---------- Branding import from a website ----------
   Fetches the organization's own public website and extracts a branding
   candidate: organization name (og:site_name / <title>), logo (og:image,
   apple-touch-icon, favicon, or a header image whose name mentions
   "logo"), colors (theme-color meta first, then the most-used colors in
   the page's CSS — linked stylesheets included), and font families.
   Nothing is saved by the import itself: an admin reviews the candidate
   and applies it with updateBranding. */

const brandingCandidateShape = z.object({
  sourceUrl: z.string(),
  name: z.string(),
  tagline: z.string(),
  logoUrl: z.string(),
  primaryColor: z.string(),
  navColor: z.string(),
  accentColor: z.string(),
  skyColor: z.string(),
  bgColor: z.string(),
  surfaceColor: z.string(),
  textColor: z.string(),
  fontSans: z.string(),
  fontDisplay: z.string(),
  found: z.array(z.string()),
});

function normalizeHex(raw: string): string | null {
  const m = raw.trim().toLowerCase().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!m) return null;
  const h = m[1]!;
  if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  return `#${h}`;
}
function rgbToHex(r: number, g: number, b: number): string {
  const p = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${p(r)}${p(g)}${p(b)}`;
}
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return { r: parseInt(n.slice(1, 3), 16), g: parseInt(n.slice(3, 5), 16), b: parseInt(n.slice(5, 7), 16) };
}
function luminance(hex: string): number {
  const c = hexToRgb(hex);
  if (!c) return 0;
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}
function darken(hex: string, factor: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex(Math.round(c.r * factor), Math.round(c.g * factor), Math.round(c.b * factor));
}
function lighten(hex: string, factor: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex(Math.round(c.r + (255 - c.r) * factor), Math.round(c.g + (255 - c.g) * factor), Math.round(c.b + (255 - c.b) * factor));
}
function saturation(hex: string): number {
  const c = hexToRgb(hex);
  if (!c) return 0;
  const mx = Math.max(c.r, c.g, c.b);
  const mn = Math.min(c.r, c.g, c.b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}
function isGrayish(hex: string): boolean {
  const c = hexToRgb(hex);
  if (!c) return true;
  return Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) < 14;
}

const KNOWN_FONTS = ["Source Sans 3", "Source Serif 4", "Open Sans", "Roboto", "Lato", "Montserrat", "Poppins", "Inter", "Nunito Sans", "Work Sans", "PT Sans", "PT Serif", "Merriweather", "Playfair Display", "Lora", "Georgia", "Verdana", "Trebuchet MS", "Tahoma", "Arial", "Helvetica Neue", "Times New Roman"];
function matchFont(rawFamily: string): string | null {
  const first = rawFamily.split(",")[0]?.replace(/["']/g, "").trim() ?? "";
  if (!first) return null;
  const found = KNOWN_FONTS.find((f) => f.toLowerCase() === first.toLowerCase());
  return found ?? null;
}


/* ---------- Logo uploads ----------
   Organizations upload their own logo (stored as an owned blob; the
   served blob URL is kept in logo_url so every existing surface uses
   it unchanged). An event can have its own logo that overrides the
   organization's for that event. */
const LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
async function storeLogoBlob(ctx: Ctx, kind: string, ownerId: number, dataBase64: string, mimeType: string): Promise<{ key: string; url: string }> {
  if (!(LOGO_MIME_TYPES as readonly string[]).includes(mimeType)) throw new Error("Please upload a PNG, JPEG, GIF, or WebP image.");
  const raw = dataBase64.includes(",") ? (dataBase64.split(",")[1] ?? "") : dataBase64;
  let bytes: Uint8Array;
  try {
    const bin = atob(raw);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch { throw new Error("That file could not be read as an image."); }
  if (bytes.length < 10) throw new Error("That file looks empty.");
  if (bytes.length > 2_500_000) throw new Error("Please keep logo images under about 2.5 MB.");
  const key = `logos/${kind}-${ownerId}-${makeApprovalToken().slice(4, 20)}`;
  await ctx.blobs.put(key, bytes, { contentType: mimeType });
  const url = await ctx.blobs.getUrl(key);
  return { key, url };
}

async function extractBranding(rawUrl: string): Promise<z.infer<typeof brandingCandidateShape>> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("That doesn't look like a valid website address. Include the full address, e.g. https://example.org.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("The website address must start with http:// or https://.");
  let html: string;
  let finalUrl = url.toString();
  try {
    const res = await fetchWithTimeout(finalUrl, 12000);
    if (!res.ok) throw new Error(`The site answered with an error (${res.status}), so its branding couldn't be read.`);
    finalUrl = res.url || finalUrl;
    html = await res.text();
  } catch (e) {
    if (e instanceof Error && /answered with an error/.test(e.message)) throw e;
    throw new Error("Couldn't fetch that website. Check the address and that the site is publicly reachable, then try again.");
  }
  const base = new URL(finalUrl);
  const resolve = (href: string): string => {
    try { return new URL(href, base).toString(); } catch { return ""; }
  };
  const found: string[] = [];
  const metaContent = (attr: string, value: string): string => {
    const re = new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]*>`, "i");
    const tag = html.match(re)?.[0];
    if (!tag) return "";
    return tag.match(/content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
  };
  // Name + tagline
  let name = metaContent("property", "og:site_name");
  if (!name) {
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
    name = title.split(/[|–—-]/)[0]?.trim() ?? "";
  }
  if (name) found.push("organization name");
  const tagline = metaContent("property", "og:description") || metaContent("name", "description");
  if (tagline) found.push("tagline / description");
  // Logo: og:image, apple-touch-icon, a "logo" image, then favicon
  let logoUrl = "";
  const ogImage = metaContent("property", "og:image");
  const iconLinks = [...html.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi)].map((m) => m[0]);
  const hrefOf = (tag: string): string => tag.match(/href=["']([^"']+)["']/i)?.[1] ?? "";
  const logoImg = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)].find((m) => /logo/i.test(m[0]))?.[1];
  const appleIcon = iconLinks.find((t) => /apple-touch-icon/i.test(t));
  const plainIcon = iconLinks[0];
  const logoCandidate = ogImage || (logoImg ?? "") || (appleIcon ? hrefOf(appleIcon) : "") || (plainIcon ? hrefOf(plainIcon) : "");
  if (logoCandidate) { logoUrl = resolve(logoCandidate); if (logoUrl) found.push("logo / site icon"); }
  // CSS: inline <style> blocks + up to 3 linked stylesheets
  let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1] ?? "").join("\n");
  const sheetHrefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)].map((m) => hrefOf(m[0])).filter(Boolean).slice(0, 3);
  for (const href of sheetHrefs) {
    try {
      const res = await fetchWithTimeout(resolve(href), 8000);
      if (res.ok) css += `\n${(await res.text()).slice(0, 300000)}`;
    } catch { /* a missing stylesheet just means fewer signals */ }
  }
  // Colors
  const themeColor = normalizeHex(metaContent("name", "theme-color"));
  const colorCounts = new Map<string, number>();
  const bump = (hex: string | null, w: number) => { if (hex && hex !== "#ffffff" && hex !== "#000000") colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + w); };
  for (const m of css.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) bump(normalizeHex(m[0]), 1);
  for (const m of css.matchAll(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/g)) bump(rgbToHex(Number(m[1]), Number(m[2]), Number(m[3])), 1);
  // Colors used for backgrounds and headings count double — they carry the brand.
  for (const m of css.matchAll(/(?:background(?:-color)?|color)\s*:\s*(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b)/gi)) bump(normalizeHex(m[1] ?? ""), 2);
  const ranked = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
  const colorful = ranked.filter((h) => !isGrayish(h));
  let primary = themeColor ?? colorful[0] ?? ranked[0] ?? "";
  if (primary) found.push(themeColor ? "theme color" : "main brand color from the site's styles");
  const accent = colorful.find((h) => h !== primary && saturation(h) > 0.25) ?? "";
  if (accent) found.push("accent color");
  const lightBg = ranked.find((h) => luminance(h) > 0.9) ?? "";
  const darkText = ranked.find((h) => luminance(h) < 0.25) ?? "";
  // Fonts
  let fontSans = "";
  let fontDisplay = "";
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const matched = matchFont(m[1] ?? "");
    if (!matched) continue;
    if (!fontSans) fontSans = matched;
    else if (matched !== fontSans && !fontDisplay) fontDisplay = matched;
  }
  // Google Fonts <link> families are a strong signal too.
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^&"']+)/gi)) {
    const fam = decodeURIComponent((m[1] ?? "").replace(/\+/g, " ")).split(":")[0]?.trim() ?? "";
    const matched = fam ? matchFont(fam) : null;
    if (matched) {
      if (!fontSans) fontSans = matched;
      else if (matched !== fontSans && !fontDisplay) fontDisplay = matched;
    }
  }
  if (fontSans || fontDisplay) found.push("fonts");
  if (!primary) throw new Error("The site loaded, but no brand colors could be found in its styles. You can still set the branding manually below.");
  return {
    sourceUrl: finalUrl,
    name: name || "",
    tagline: tagline ? tagline.slice(0, 140) : "",
    logoUrl,
    primaryColor: primary,
    navColor: darken(primary, 0.78),
    accentColor: accent || darken(primary, 0.6),
    skyColor: lighten(primary, 0.45),
    bgColor: lightBg || lighten(primary, 0.93),
    textColor: darkText || "#22303e",
    surfaceColor: "#ffffff",
    fontSans: fontSans || "Source Sans 3",
    fontDisplay: fontDisplay || fontSans || "Source Serif 4",
    found,
  };
}

/* ================= Actions ================= */

const identityArgs = {
  adminGoogleId: z.string().max(200).optional(),
  adminEmail: z.string().max(200).optional(),
  sessionToken: z.string().max(200).optional(),
};
const requesterArgs = {
  requestedByGoogleId: z.string().max(200).optional(),
  requestedByEmail: z.string().max(200).optional(),
  sessionToken: z.string().max(200).optional(),
};

const brandingInput = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).default(""),
  websiteUrl: z.string().max(300).default(""),
  logoUrl: z.string().max(1000).default(""),
  motif: z.string().min(1).max(8).default("✡"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  navColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  skyColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  surfaceColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fontSans: z.string().min(1).max(60),
  fontDisplay: z.string().min(1).max(60),
  codePrefix: z.string().min(1).max(5),
});

async function insertSampleEvent(ctx: Ctx, orgId: number, orgName: string): Promise<number> {
  const db = ctx.db<typeof schema>();
  const existing = await db.select({ id: schema.events.id }).from(schema.events).where(and(eq(schema.events.orgId, orgId), eq(schema.events.isSample, 1))).limit(1);
  if (existing[0]) return existing[0].id;
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const result = await db.insert(schema.events).values({
    orgId, title: "Sample Event — try a test registration", date, timeText: "6:00 PM – 8:00 PM", location: orgName,
    description: "A sample event so you can try the whole flow end to end — register, approve, and scan a pass — before your real events go live. Delete it any time.",
    approvalEmails: "[]", isSample: 1,
  }).returning({ id: schema.events.id });
  return result[0]!.id;
}

/* ---------- Calendar import parsing ----------
   Fetches an organization's events calendar — an iCal (.ics) feed, or an
   events page (JSON-LD schema.org Event data is read from the page, and
   a linked .ics feed on the page is followed one level). Everything the
   feed carries is brought in: title, date, start/end times, location,
   description, image (ICS IMAGE / image ATTACH, JSON-LD image), the
   event's own page URL (ICS URL, JSON-LD url), organizer, categories,
   source status, and the source UID — so the preview shows the admin
   exactly what would be imported, not a stripped-down version. */
type RawCalEvent = {
  title: string; date: string; timeText: string; location: string; description: string;
  imageUrl: string; sourceUrl: string; organizer: string; categories: string[];
  uid: string; feedStatus: string;
};
function fmtClock(h: number, m: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}
function parseCalDateTime(raw: string): { date: string; time: [number, number] | null } | null {
  const v = raw.trim();
  const dm = v.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!dm) {
    const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (!iso) return null;
    return { date: `${iso[1]}-${iso[2]}-${iso[3]}`, time: iso[4] ? [Number(iso[4]), Number(iso[5])] : null };
  }
  const tm = v.match(/T(\d{2})(\d{2})/);
  return { date: `${dm[1]}-${dm[2]}-${dm[3]}`, time: tm ? [Number(tm[1]), Number(tm[2])] : null };
}
function calTimeText(start: { time: [number, number] | null }, end: { time: [number, number] | null } | null): string {
  if (!start.time) return "All day";
  const a = fmtClock(start.time[0], start.time[1]);
  return end?.time ? `${a} – ${fmtClock(end.time[0], end.time[1])}` : a;
}
function unescapeIcs(text: string): string {
  return text.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}
function parseIcsEvents(text: string): RawCalEvent[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.split(/BEGIN:VEVENT/i).slice(1);
  const out: RawCalEvent[] = [];
  for (const block of blocks) {
    const body = block.split(/END:VEVENT/i)[0] ?? "";
    // Keep every property WITH its parameters (ATTACH carries FMTTYPE,
    // ORGANIZER carries CN) — first occurrence wins per name, except
    // ATTACH/IMAGE where all occurrences are candidates for the image.
    const props: Record<string, string> = {};
    const attachLines: Array<{ params: string; value: string }> = [];
    let imageProp = "";
    for (const line of body.split(/\r?\n/)) {
      const colon = line.indexOf(":");
      if (colon < 1) continue;
      const header = line.slice(0, colon);
      const name = (header.split(";")[0] ?? "").toUpperCase();
      const value = line.slice(colon + 1);
      if (!name) continue;
      if (name === "ATTACH" || name === "IMAGE") attachLines.push({ params: header.toUpperCase(), value: value.trim() });
      if (name === "IMAGE" && !imageProp) imageProp = value.trim();
      if (props[name] === undefined) props[name] = value;
    }
    const startRaw = props["DTSTART"];
    if (!startRaw) continue;
    const start = parseCalDateTime(startRaw);
    if (!start) continue;
    const end = props["DTEND"] ? parseCalDateTime(props["DTEND"]) : null;
    // Image: the IMAGE property, else an ATTACH that is an image
    // (by FMTTYPE or by file extension), else an X-…IMAGE property.
    let imageUrl = /^https?:\/\//i.test(imageProp) ? imageProp : "";
    if (!imageUrl) {
      for (const a of attachLines) {
        if (!/^https?:\/\//i.test(a.value)) continue;
        if (/FMTTYPE=IMAGE\//.test(a.params) || /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(a.value)) { imageUrl = a.value; break; }
      }
    }
    if (!imageUrl) {
      for (const [k, v] of Object.entries(props)) {
        if (/^X-.*IMAGE/.test(k) && /^https?:\/\//i.test(v.trim())) { imageUrl = v.trim(); break; }
      }
    }
    // Organizer: prefer the CN parameter, else the address itself.
    let organizer = "";
    const orgLine = body.split(/\r?\n/).find((l) => /^ORGANIZER[;:]/i.test(l)) ?? "";
    const cn = orgLine.match(/CN=([^;:]+)/i)?.[1]?.replace(/^"|"$/g, "").trim();
    if (cn) organizer = cn;
    else if (props["ORGANIZER"]) organizer = unescapeIcs(props["ORGANIZER"]).replace(/^mailto:/i, "");
    const categories = (props["CATEGORIES"] ?? "").split(",").map((c) => unescapeIcs(c)).filter(Boolean).slice(0, 8);
    out.push({
      title: unescapeIcs(props["SUMMARY"] ?? "Untitled event"),
      date: start.date,
      timeText: calTimeText(start, end),
      location: unescapeIcs(props["LOCATION"] ?? ""),
      description: unescapeIcs(props["DESCRIPTION"] ?? "").slice(0, 1500),
      imageUrl,
      sourceUrl: (props["URL"] ?? "").trim(),
      organizer,
      categories,
      uid: (props["UID"] ?? "").trim().slice(0, 200),
      feedStatus: (props["STATUS"] ?? "").trim().toUpperCase().slice(0, 30),
    });
  }
  return out;
}
function jsonLdEvents(html: string): RawCalEvent[] {
  const out: RawCalEvent[] = [];
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node !== "object" || node === null) return;
    const r = node as Record<string, unknown>;
    if (r["@graph"]) walk(r["@graph"]);
    const type = r["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.some((t) => typeof t === "string" && /event/i.test(t)) && typeof r["startDate"] === "string") {
      const start = parseCalDateTime(r["startDate"]);
      if (start) {
        const end = typeof r["endDate"] === "string" ? parseCalDateTime(r["endDate"]) : null;
        const loc = r["location"];
        let location = "";
        if (typeof loc === "string") location = loc;
        else if (typeof loc === "object" && loc !== null) {
          const l = loc as Record<string, unknown>;
          if (typeof l["name"] === "string") location = l["name"];
          const addr = l["address"];
          if (typeof addr === "string" && addr) location = location ? `${location}, ${addr}` : addr;
          else if (typeof addr === "object" && addr !== null) {
            const a = addr as Record<string, unknown>;
            const parts = [a["streetAddress"], a["addressLocality"], a["addressRegion"], a["postalCode"]].filter((p): p is string => typeof p === "string" && !!p);
            if (parts.length > 0) location = location ? `${location}, ${parts.join(", ")}` : parts.join(", ");
          }
        }
        // Image: a string, an array of strings/ImageObjects, or one ImageObject.
        let imageUrl = "";
        const img = r["image"];
        const pickImg = (v: unknown): string => {
          if (typeof v === "string") return v;
          if (typeof v === "object" && v !== null && typeof (v as Record<string, unknown>)["url"] === "string") return (v as Record<string, unknown>)["url"] as string;
          return "";
        };
        if (Array.isArray(img)) { for (const v of img) { imageUrl = pickImg(v); if (imageUrl) break; } }
        else imageUrl = pickImg(img);
        let organizer = "";
        const org = r["organizer"];
        if (typeof org === "string") organizer = org;
        else if (typeof org === "object" && org !== null && typeof (org as Record<string, unknown>)["name"] === "string") organizer = (org as Record<string, unknown>)["name"] as string;
        out.push({
          title: typeof r["name"] === "string" ? r["name"] : "Untitled event",
          date: start.date, timeText: calTimeText(start, end), location,
          description: typeof r["description"] === "string" ? r["description"].slice(0, 1500) : "",
          imageUrl, sourceUrl: typeof r["url"] === "string" ? r["url"] : "",
          organizer, categories: [], uid: typeof r["identifier"] === "string" ? r["identifier"].slice(0, 200) : "",
          feedStatus: typeof r["eventStatus"] === "string" ? r["eventStatus"].replace(/^https?:\/\/schema\.org\//i, "").toUpperCase().slice(0, 30) : "",
        });
      }
    }
  };
  for (const b of blocks) {
    try { walk(JSON.parse(b[1] ?? "")); } catch { /* not valid JSON — skip */ }
  }
  return out;
}
function mentionsRegistration(e: RawCalEvent): boolean {
  return /regist|sign[\s-]?up|rsvp|ticket/i.test(`${e.title} ${e.description} ${e.location}`);
}
/* Calendar addresses are pasted by hand, so they arrive in every
   shape: missing the scheme ("example.org/events.ics"), padded with
   spaces, occasionally not an address at all. Normalize and validate
   BEFORE fetching — the same treatment extractBranding gives website
   addresses — because a raw fetch() on a malformed address throws a
   bare TypeError that reaches the admin as an opaque 500, and a scheme
   the fetcher can't use should say so in plain language. */
function normalizeCalendarUrl(raw: string): string {
  const trimmed = raw.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error("That doesn't look like a valid calendar address. Include the full address, e.g. https://example.org/events.ics.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("The calendar address must start with http:// or https://.");
  return parsed.toString();
}
async function fetchCalendarEvents(rawUrl: string): Promise<{ events: RawCalEvent[]; sourceKind: string }> {
  const url = normalizeCalendarUrl(rawUrl);
  let text: string;
  try {
    const res = await fetchWithTimeout(url, 12000);
    if (!res.ok) throw new Error(`The calendar address returned an error (${res.status}). Check the URL and try again.`);
    text = await res.text();
  } catch (e) {
    // Our own plain-language errors (bad status, timeout) pass through;
    // anything else from the fetch layer (DNS, connection refused, TLS)
    // becomes one friendly sentence instead of a raw TypeError 500.
    if (e instanceof Error && /returned an error|timed out/.test(e.message)) throw e;
    throw new Error("Couldn't read that calendar address. Check the address and that the calendar is publicly reachable, then try again.");
  }
  if (/BEGIN:VCALENDAR/i.test(text)) return { events: parseIcsEvents(text), sourceKind: "iCal feed" };
  const fromJsonLd = jsonLdEvents(text);
  if (fromJsonLd.length > 0) return { events: fromJsonLd, sourceKind: "events page" };
  const icsLink = text.match(/href=["']([^"']+\.ics(?:\?[^"']*)?)["']/i)?.[1];
  if (icsLink) {
    let feedUrl = "";
    try { feedUrl = new URL(icsLink, url).toString(); } catch { feedUrl = ""; }
    if (feedUrl) {
      try {
        const feedRes = await fetchWithTimeout(feedUrl, 12000);
        if (feedRes.ok) {
          const feedText = await feedRes.text();
          if (/BEGIN:VCALENDAR/i.test(feedText)) return { events: parseIcsEvents(feedText), sourceKind: "iCal feed linked from the page" };
        }
      } catch { /* a broken linked feed just means the page itself had no readable events */ }
    }
  }
  return { events: [], sourceKind: "page" };
}

/* ---------- Sign in with Apple ----------
   Same shape as Google: the client loads Apple's JS library with the
   Services ID stored in app_settings; Apple returns a signed ID token,
   verified here — RS256 against Apple's public keys
   (https://appleid.apple.com/auth/keys), iss https://appleid.apple.com,
   aud = the Services ID, exp. Apple's token carries the email; the name
   only comes back (client-side) on the person's first authorization. */
const APPLE_CLIENT_ID_KEY = "apple_client_id";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
let appleJwksCache: { keys: JwkKey[]; expiresAt: number } | null = null;
async function getAppleKey(kid: string, forceRefresh = false): Promise<JwkKey> {
  const now = Date.now();
  if (forceRefresh || !appleJwksCache || appleJwksCache.expiresAt <= now) {
    const res = await fetchWithTimeout(APPLE_JWKS_URL);
    if (!res.ok) throw new Error(`Apple key fetch failed (${res.status}).`);
    const body: unknown = await res.json();
    const keys = (body as { keys?: unknown }).keys;
    if (!Array.isArray(keys)) throw new Error("Apple key response was malformed.");
    appleJwksCache = { keys: keys as JwkKey[], expiresAt: now + 3600 * 1000 };
  }
  const key = appleJwksCache.keys.find((k) => k.kid === kid);
  if (!key && !forceRefresh) return getAppleKey(kid, true);
  if (!key) throw new Error("Apple signing key not found for this token.");
  return key;
}
async function verifyAppleToken(idToken: string, clientId: string): Promise<{ sub: string; email: string }> {
  const parts = idToken.split(".");
  const [headerPart, payloadPart, signaturePart] = parts;
  if (parts.length !== 3 || !headerPart || !payloadPart || !signaturePart) throw new Error("That does not look like an Apple ID token.");
  const header = b64urlToJson(headerPart);
  if (header["alg"] !== "RS256") throw new Error("Unexpected token signing algorithm.");
  const kid = header["kid"];
  if (typeof kid !== "string" || !kid) throw new Error("Token is missing its key ID.");
  const jwk = await getAppleKey(kid);
  const cryptoKey = await crypto.subtle.importKey("jwk", { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const signed = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, b64urlToBytes(signaturePart), signed);
  if (!ok) throw new Error("Apple signature check failed for this token.");
  const claims = b64urlToJson(payloadPart);
  if (claims["iss"] !== "https://appleid.apple.com") throw new Error("This token was not issued by Apple.");
  if (claims["aud"] !== clientId) throw new Error("This token was issued for a different app, not this one.");
  const exp = Number(claims["exp"]);
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) throw new Error("This Apple sign-in has expired. Please sign in again.");
  const sub = claims["sub"];
  const email = claims["email"];
  if (typeof sub !== "string" || !sub) throw new Error("Apple's token is missing the account ID.");
  if (typeof email !== "string" || !email.includes("@")) throw new Error("Apple's token is missing an email address. Apple only shares it when the app requests the email scope.");
  return { sub, email: email.toLowerCase() };
}

/* ---------- Password accounts (PBKDF2) ---------- */
function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$${bytesToB64(salt)}$${bytesToB64(new Uint8Array(bits))}`;
}
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2" || !saltB64 || !hashB64) return false;
  const salt = b64urlToBytes(saltB64.replace(/\+/g, "-").replace(/\//g, "_"));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256);
  return bytesToB64(new Uint8Array(bits)) === hashB64;
}

/* ---------- Role invites ----------
   Accepting an invite is what creates the role assignment: the role row
   is written with the identity the person actually authenticated with
   (Google ID, apple:<sub>, or email:<address> for password/email-code
   accounts). If a placeholder row from an earlier onboarding invite
   exists for the email, it is upgraded to the real identity instead of
   duplicated. */
type InviteRow = typeof schema.roleInvites.$inferSelect;
type RoleName = "admin" | "gatekeeper" | "registrant" | "owner";
function inviteRoles(invite: InviteRow): RoleName[] {
  try {
    const parsed: unknown = JSON.parse(invite.roles || "[]");
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((r): r is RoleName => r === "admin" || r === "gatekeeper" || r === "registrant" || r === "owner");
      if (valid.length > 0) return valid;
    }
  } catch { /* fall through to the single role */ }
  return [invite.role as RoleName];
}
async function grantRoleFromInvite(ctx: Ctx, invite: InviteRow, identityId: string, displayName: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  const em = invite.email.toLowerCase();
  const org = await getOrgRow(ctx, invite.orgId);
  const granted: RoleName[] = [];
  let domainBlocked = 0;
  const tables = {
    admin: schema.authorizedAdmins,
    gatekeeper: schema.authorizedGatekeepers,
    registrant: schema.authorizedRegistrants,
  } as const;
  // A person can hold several roles at once — grant each one on the invite.
  for (const role of inviteRoles(invite)) {
    if (role === "owner") {
      if (!staffDomainAllowed(org, "owner", em)) { domainBlocked += 1; continue; }
      const owners = await db.select().from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, invite.orgId));
      if (!owners.some((r) => r.googleId === identityId)) {
        const placeholder = owners.find((r) => r.email.toLowerCase() === em);
        if (placeholder) await db.update(schema.organizationOwners).set({ googleId: identityId, displayName }).where(eq(schema.organizationOwners.id, placeholder.id));
        else await db.insert(schema.organizationOwners).values({ orgId: invite.orgId, googleId: identityId, email: em, displayName }).onConflictDoNothing();
        granted.push("owner");
      }
      continue;
    }
    if (!staffDomainAllowed(org, role, em)) { domainBlocked += 1; continue; }
    const table = tables[role];
    const rows = await db.select().from(table).where(eq(table.orgId, invite.orgId));
    const byIdentity = rows.find((r) => r.googleId === identityId);
    if (!byIdentity) {
      const placeholder = rows.find((r) => r.email.toLowerCase() === em);
      if (placeholder) {
        await db.update(table).set({ googleId: identityId, displayName }).where(eq(table.id, placeholder.id));
      } else {
        await db.insert(table).values({ orgId: invite.orgId, googleId: identityId, email: em, displayName }).onConflictDoNothing();
      }
      granted.push(role);
    }
  }
  if (domainBlocked > 0 && granted.length === 0) throw new Error(`This organization restricts staff accounts to ${org ? staffDomainsOf(org).map((d) => "@" + d).join(", ") : "its own"} email addresses — ${em} can't take a staff role here. Ask an administrator to invite an address on an allowed domain. (Attendees aren't affected by this rule.)`);
  for (const role of granted) await logMembershipChange(ctx, invite.orgId, role, "added", { email: em, name: displayName, loginId: identityId }, { email: em, loginId: identityId }, "invitation");
  await db.update(schema.roleInvites).set({ acceptedAt: new Date(), acceptedIdentity: identityId }).where(eq(schema.roleInvites.id, invite.id));
}
async function loadInvite(ctx: Ctx, token: string): Promise<InviteRow> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.roleInvites).where(eq(schema.roleInvites.token, token)).limit(1);
  const invite = rows[0];
  if (!invite) throw new Error("This invitation link isn't recognized — it may have been replaced by a newer invite.");
  if (invite.acceptedAt) throw new Error("This invitation has already been accepted.");
  if (invite.expiresAt.getTime() <= Date.now()) throw new Error("This invitation has expired — ask an administrator to send a fresh one.");
  return invite;
}
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
async function insertRoleInvite(ctx: Ctx, orgId: number, role: RoleName | RoleName[], firstName: string, lastName: string, email: string): Promise<InviteRow> {
  const roles = Array.isArray(role) ? role : [role];
  const db = ctx.db<typeof schema>();
  const token = `inv-${makeApprovalToken().slice(4)}`;
  const result = await db.insert(schema.roleInvites).values({ orgId, role: roles[0]!, roles: JSON.stringify(roles), firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), token, expiresAt: new Date(Date.now() + INVITE_TTL_MS) }).returning();
  const row = result[0];
  if (!row) throw new Error("Could not create the invitation.");
  return row;
}


/* ---------- Recurring event series ---------- */
const recurrenceArgs = z.object({
  freq: z.enum(["daily", "weekly", "monthly", "monthly_weekday"]),
  interval: z.number().int().min(1).max(12).default(1),
  count: z.number().int().min(2).max(30),
  nth: z.number().int().min(1).max(5).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
});
function newSeriesId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `ser-${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  if (nth >= 5) { const last = new Date(year, month + 1, 0); const diff = (last.getDay() - weekday + 7) % 7; return new Date(year, month, last.getDate() - diff); }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (nth - 1) * 7);
}
function seriesDates(startDate: string, rec: { freq: "daily" | "weekly" | "monthly" | "monthly_weekday"; interval: number; count: number; nth?: number; weekday?: number }): string[] {
  const [y0 = 1970, m0 = 1, d0 = 1] = startDate.split("-").map(Number);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const start = new Date(y0, m0 - 1, d0);
  const weekday = rec.weekday ?? start.getDay();
  const nth = rec.nth ?? Math.min(5, Math.ceil(d0 / 7));
  const dates: string[] = [startDate];
  let cur = start;
  while (dates.length < rec.count) {
    if (rec.freq === "daily") cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + rec.interval);
    else if (rec.freq === "weekly") cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7 * rec.interval);
    else if (rec.freq === "monthly") { const nm = new Date(cur.getFullYear(), cur.getMonth() + rec.interval, 1); const lastDay = new Date(nm.getFullYear(), nm.getMonth() + 1, 0).getDate(); cur = new Date(nm.getFullYear(), nm.getMonth(), Math.min(d0, lastDay)); }
    else { const t = new Date(cur.getFullYear(), cur.getMonth() + rec.interval, 1); cur = nthWeekdayOfMonth(t.getFullYear(), t.getMonth(), weekday, nth); }
    dates.push(fmt(cur));
  }
  return dates;
}
async function requireAdminOrRegistrant(ctx: Ctx, orgId: number, googleId: string | undefined, email: string | undefined): Promise<void> {
  if (await isAuthorizedAdmin(ctx, orgId, googleId, email)) return;
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ googleId: schema.authorizedRegistrants.googleId, email: schema.authorizedRegistrants.email }).from(schema.authorizedRegistrants).where(eq(schema.authorizedRegistrants.orgId, orgId));
  const ok = rows.some((r) => (googleId && r.googleId === googleId) || (email && r.email.toLowerCase() === email.toLowerCase()));
  if (!ok) throw new Error("Only this organization's administrators and registrants can message attendees.");
}




/* ---------- Plan metering: registration events ----------
   Only events with registration ENABLED count toward a PAID plan's
   allowance (cancelled events and the onboarding sample event don't
   count; plain calendar listings with registration off never count).
   Paid plans meter by the month of the event's date: Starter
   5/month, Growth (stored id "community") 25/month, Unlimited
   (stored id "pro") unlimited.
   The FREE plan is NOT event-limited at all: it is permanent and
   feature-limited — unlimited basic events (create, notice, RSVPs,
   attendee list), one user, no paid features. There is no free-
   events balance, no card, and no expiry clock; the subscription
   starts only when the owner chooses a paid plan. FREE_TRIAL_EVENTS
   survives only as a legacy reporting field for rows written under
   the old 2-free-events model. */
const EVENT_ALLOWANCE: Record<string, number | null> = { starter: 5, community: 25, pro: null, trial: null };
const FREE_TRIAL_EVENTS = 2;
const PLAN_PRICES_CENTS: Record<string, number> = { starter: 2900, community: 5900, pro: 9900 };
const PLAN_DISPLAY_NAMES: Record<string, string> = { trial: "Free", starter: "Starter", community: "Growth", pro: "Unlimited" };

/* ---------- AI usage caps ----------
   Each plan includes a monthly allowance of AI actions (assistant
   requests and AI import reviews). Usage is counted per organization
   per calendar month in app_settings (`ai_usage_<orgId>_<YYYY-MM>`).
   Over the cap, AI features pause until the next month or an upgrade.
   Comped organizations are unmetered. The cap is 0 on Free and on
   Starter because the AI assistant isn't part of either — it is a
   Growth / Unlimited feature. */
const AI_MONTHLY_CAPS: Record<string, number | null> = { trial: 0, starter: 0, community: 100, pro: 500 };
async function getAiUsageCount(ctx: Ctx, orgId: number): Promise<number> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, `ai_usage_${orgId}_${currentMonthKey()}`)).limit(1);
  const n = rows[0] ? Number.parseInt(rows[0].value, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}
async function bumpAiUsage(ctx: Ctx, orgId: number): Promise<void> {
  const db = ctx.db<typeof schema>();
  const key = `ai_usage_${orgId}_${currentMonthKey()}`;
  const next = String((await getAiUsageCount(ctx, orgId)) + 1);
  await db.insert(schema.appSettings).values({ key, value: next }).onConflictDoUpdate({ target: schema.appSettings.key, set: { value: next } });
}
async function aiCapState(ctx: Ctx, org: typeof schema.organizations.$inferSelect | null): Promise<{ cap: number | null; used: number; paused: boolean }> {
  if (!org) return { cap: null, used: 0, paused: false };
  const used = await getAiUsageCount(ctx, org.id);
  if (org.comped === 1) return { cap: null, used, paused: false };
  const cap = AI_MONTHLY_CAPS[org.plan] ?? null;
  return { cap, used, paused: cap !== null && used >= cap };
}

/* ---------- Payment failure & account freeze ----------
   A failed payment starts a 1-week grace window. After it, the
   account is FROZEN (never deleted): attendees can still register,
   but NO approval is processed — manual approvals are refused and
   trusted auto-approvals are held (marked with FROZEN_HOLD_VIA).
   When the owner repairs the payment, the held auto-approvals are
   processed in one batch. */
const FREEZE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
const FROZEN_HOLD_VIA = "Auto-approval held — account frozen";
function freezeState(org: typeof schema.organizations.$inferSelect | null): { failedAt: string | null; graceEndsAt: string | null; frozen: boolean; pastDue: boolean } {
  const failed = org?.paymentFailedAt ?? null;
  if (!failed) return { failedAt: null, graceEndsAt: null, frozen: false, pastDue: false };
  const graceEnd = new Date(failed.getTime() + FREEZE_GRACE_MS);
  const frozen = Date.now() > graceEnd.getTime();
  return { failedAt: failed.toISOString(), graceEndsAt: graceEnd.toISOString(), frozen, pastDue: !frozen };
}
async function processHeldApprovals(ctx: Ctx, orgId: number): Promise<{ processed: number; skipped: number }> {
  const db = ctx.db<typeof schema>();
  const held = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
    .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
    .where(and(eq(schema.events.orgId, orgId), eq(schema.registrations.status, "pending"), eq(schema.registrations.decidedVia, FROZEN_HOLD_VIA)));
  let processed = 0;
  let skipped = 0;
  for (const { reg, ev } of held) {
    if (ev.capacity !== null && ev.capacity !== undefined) {
      const taken = await eventSeatsTaken(ctx, ev.id, reg.id);
      if (taken >= ev.capacity) { skipped++; continue; }
    }
    await applyApprovalDecision(ctx, reg, "approved", "Trusted participant — auto-approved (processed after payment repair)");
    processed++;
  }
  return { processed, skipped };
}
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function monthLabelOf(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[(m ?? 1) - 1] ?? ""} ${y ?? ""}`;
}
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
async function registrationEventsInMonth(ctx: Ctx, orgId: number, monthKey: string): Promise<number> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ date: schema.events.date, status: schema.events.status, registrationEnabled: schema.events.registrationEnabled, isSample: schema.events.isSample, deletedAt: schema.events.deletedAt }).from(schema.events).where(eq(schema.events.orgId, orgId));
  return rows.filter((r) => !r.deletedAt && r.registrationEnabled !== 0 && r.status !== "cancelled" && r.isSample !== 1 && r.date.startsWith(monthKey)).length;
}
/* Legacy helper: registration events across ALL time. Under the
   old model this was the free-trial balance; under freemium the
   Free plan has no event balance, so this now only feeds legacy
   reporting fields (platform console history, billing payloads).
   Sample events are never counted. */
async function trialRegistrationEventsUsed(ctx: Ctx, orgId: number): Promise<number> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ status: schema.events.status, registrationEnabled: schema.events.registrationEnabled, isSample: schema.events.isSample, deletedAt: schema.events.deletedAt }).from(schema.events).where(eq(schema.events.orgId, orgId));
  return rows.filter((r) => !r.deletedAt && r.registrationEnabled !== 0 && r.status !== "cancelled" && r.isSample !== 1).length;
}
async function assertEventAllowance(ctx: Ctx, orgId: number, additionsByMonth: Map<string, number>): Promise<void> {
  const org = await getOrgRow(ctx, orgId);
  if (org?.comped === 1) return; // platform-owner comp: membership is free, no metering
  const plan = org?.plan ?? "trial";
  if (plan === "trial") {
    // Free is feature-limited, NOT event-limited: unlimited basic
    // events, forever. Nothing to meter here.
    return;
  }
  const limit = org?.allowanceOverride ?? EVENT_ALLOWANCE[plan] ?? null;
  if (limit === null) return;
  for (const [monthKey, adding] of additionsByMonth) {
    const used = await registrationEventsInMonth(ctx, orgId, monthKey);
    if (used + adding > limit) {
      throw new Error(`Your ${plan === "starter" ? "Starter" : "Community"} plan includes ${limit} registration events a month, and ${monthLabelOf(monthKey)} already has ${used}. Plain calendar listings (registration turned off) never count toward the allowance. Upgrade for a larger allowance — an owner can change the plan under Subscription & billing.`);
    }
  }
}

/* ---------- Per-plan seat limits ----------
   The Starter plan includes a fixed number of team seats: 2
   administrators, 2 registrars, and 4 greeters. Growth plans
   (Growth and Unlimited) have unlimited seats.
   The FREE plan has exactly ONE user with access: the organization
   owner. The single "admin" seat below is that same owner acting as
   administrator of their own organization — there are NO additional
   administrators, NO registrars, and NO greeters on Free; needing a
   second user is itself an upgrade trigger. Owners are limited
   separately — 1 owner on Free (see TRIAL_OWNER_LIMIT /
   assertTrialOwnerAvailable; the "trial" name predates freemium).
   A seat is used by a current role holder OR by an outstanding
   invitation for that role, so invitations cannot overshoot the
   limit. */
type SeatRole = "admin" | "registrant" | "gatekeeper";
const SEAT_LIMITS: Record<string, Record<SeatRole, number | null>> = {
  trial: { admin: 1, registrant: 0, gatekeeper: 0 },
  starter: { admin: 2, registrant: 2, gatekeeper: 4 },
};
const TRIAL_OWNER_LIMIT = 1;
const SEAT_ROLE_LABEL: Record<SeatRole, string> = { admin: "administrator", registrant: "registrar", gatekeeper: "greeter" };
function seatLimitsForPlan(plan: string): Record<SeatRole, number | null> {
  return SEAT_LIMITS[plan] ?? { admin: null, registrant: null, gatekeeper: null };
}
async function seatUsageCounts(ctx: Ctx, orgId: number): Promise<{ members: Record<SeatRole, number>; pending: Record<SeatRole, number>; used: Record<SeatRole, number> }> {
  const db = ctx.db<typeof schema>();
  const admins = await db.select({ id: schema.authorizedAdmins.id }).from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, orgId));
  const registrants = await db.select({ id: schema.authorizedRegistrants.id }).from(schema.authorizedRegistrants).where(eq(schema.authorizedRegistrants.orgId, orgId));
  const gatekeepers = await db.select({ id: schema.authorizedGatekeepers.id }).from(schema.authorizedGatekeepers).where(eq(schema.authorizedGatekeepers.orgId, orgId));
  const members: Record<SeatRole, number> = { admin: admins.length, registrant: registrants.length, gatekeeper: gatekeepers.length };
  const pending: Record<SeatRole, number> = { admin: 0, registrant: 0, gatekeeper: 0 };
  const invites = await db.select().from(schema.roleInvites).where(eq(schema.roleInvites.orgId, orgId));
  const now = Date.now();
  for (const inv of invites) {
    if (inv.acceptedAt || inv.expiresAt.getTime() <= now) continue;
    for (const r of inviteRoles(inv)) if (r === "admin" || r === "registrant" || r === "gatekeeper") pending[r as SeatRole] += 1;
  }
  const used: Record<SeatRole, number> = { admin: members.admin + pending.admin, registrant: members.registrant + pending.registrant, gatekeeper: members.gatekeeper + pending.gatekeeper };
  return { members, pending, used };
}
async function assertSeatAvailable(ctx: Ctx, orgId: number, role: SeatRole): Promise<void> {
  const org = await getOrgRow(ctx, orgId);
  if (org?.comped === 1) return; // comped membership: no seat limits
  const plan = org?.plan ?? "trial";
  const limit = seatLimitsForPlan(plan)[role];
  if (limit === null) return;
  const { used } = await seatUsageCounts(ctx, orgId);
  if (used[role] >= limit) {
    if (plan === "trial") {
      throw new Error(limit === 0
        ? `${SEAT_ROLE_LABEL[role] === "registrar" ? "Registrars" : "Greeters"} aren't included in the Free plan — Free has exactly one user with access: the organization owner, who runs events and sees who's coming. Adding a second person is a paid-plan feature: upgrade to Starter ($29/mo), Growth ($59/mo), or Unlimited ($99/mo) — an owner picks a plan under Subscription & billing.`
        : `The Free plan has one user with access — the organization owner — and that seat is already in use (current members plus pending invitations). Needing a second user is exactly when organizations upgrade: Starter ($29/mo), Growth ($59/mo), or Unlimited ($99/mo) under Subscription & billing.`);
    }
    throw new Error(`Your Starter plan includes ${limit} ${SEAT_ROLE_LABEL[role]} seats, and all ${limit} are already in use (current members plus pending invitations). Upgrade to Growth ($59/mo) or Unlimited ($99/mo) for unlimited ${SEAT_ROLE_LABEL[role]} seats — an owner can change the plan under Subscription & billing.`);
  }
}
/* Owners on the Free plan: exactly 1 (the creator) — Free has one
   user with access, period. Counted the same way as seats — current
   owners plus outstanding owner invites. */
async function trialOwnerUsage(ctx: Ctx, orgId: number): Promise<{ owners: number; pendingInvites: number; used: number }> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ id: schema.organizationOwners.id }).from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, orgId));
  const invites = await db.select().from(schema.roleInvites).where(eq(schema.roleInvites.orgId, orgId));
  const now = Date.now();
  let pendingInvites = 0;
  for (const inv of invites) {
    if (inv.acceptedAt || inv.expiresAt.getTime() <= now) continue;
    if (inviteRoles(inv).includes("owner")) pendingInvites += 1;
  }
  return { owners: rows.length, pendingInvites, used: rows.length + pendingInvites };
}
async function assertTrialOwnerAvailable(ctx: Ctx, orgId: number): Promise<void> {
  const org = await getOrgRow(ctx, orgId);
  if (org?.comped === 1) return;
  if ((org?.plan ?? "trial") !== "trial") return;
  const { used } = await trialOwnerUsage(ctx, orgId);
  if (used >= TRIAL_OWNER_LIMIT) {
    throw new Error(`The Free plan includes ${TRIAL_OWNER_LIMIT} owner — the one user with access — and that seat is already in use. Adding another owner means a second user, which is a paid-plan feature: upgrade to Starter ($29/mo), Growth ($59/mo), or Unlimited ($99/mo) under Subscription & billing.`);
  }
}

/* ---------- Content moderation ----------
   Every user-entered field that would be shown to the people running an
   event (attendee names, emails, registration answers, and messages to
   attendees) is screened BEFORE it reaches them. Two layers: a built-in
   filter (baseline — slurs and obscenities, including simple evasions
   like spaced/dotted letters for slurs) and a moderation classification
   via the model service when available; if the service is unreachable,
   the baseline stands. Flagged registrations are HELD: no approval
   requests, no auto-approval, no notifications, and reports/exports/
   lookups redact or exclude them until an admin releases or rejects
   them in the moderation queue. */
const MODERATION_SLURS = ["nigger", "nigga", "faggot", "kike", "spic", "chink", "wetback", "raghead", "retard", "tranny", "dyke", "beaner", "gook", "zipperhead", "sandnigger"];
const MODERATION_WORDS = ["fuck", "shit", "bitch", "whore", "slut", "porn", "penis", "vagina", "cunt", "dickhead", "asshole", "bastard", "pussy", "boobs", "rape", "molest", "pedophile", "nazi", "hitler"];
function builtinModeration(texts: string[]): { flagged: boolean; terms: string[] } {
  const raw = texts.join(" \n ").toLowerCase();
  const squashed = raw.replace(/[^a-z0-9]+/g, "");
  const hits = new Set<string>();
  for (const term of MODERATION_SLURS) {
    const re = new RegExp(`(^|[^a-z0-9])${term}([^a-z0-9]|$)`);
    if (re.test(raw) || squashed.includes(term)) hits.add(term);
  }
  for (const term of MODERATION_WORDS) {
    const re = new RegExp(`(^|[^a-z0-9])${term}([^a-z0-9]|$)`);
    if (re.test(raw)) hits.add(term);
  }
  return { flagged: hits.size > 0, terms: [...hits] };
}
async function moderateTexts(ctx: Ctx, texts: string[]): Promise<{ flagged: boolean; reason: string }> {
  const base = builtinModeration(texts);
  if (base.flagged) return { flagged: true, reason: `Built-in filter matched: ${base.terms.join(", ")}` };
  const joined = texts.map((t) => t.trim()).filter(Boolean).join(" | ").slice(0, 1200);
  if (!joined) return { flagged: false, reason: "" };
  try {
    const verdict = await ctx.inference.complete(
      `You are a strict content-moderation classifier for a community events app. Decide whether the following user-entered text contains offensive content: racial or ethnic slurs, sexual or explicit content, obscene profanity, hate speech, or harassment. Ordinary names, places, religious terms, and everyday words are fine. Text: "${joined.replace(/"/g, "'")}"`,
      { schema: z.object({ flagged: z.boolean(), categories: z.array(z.string()) }) },
    );
    if (verdict.flagged) return { flagged: true, reason: `Moderation service flagged: ${verdict.categories.join(", ") || "offensive content"}` };
  } catch { /* service unavailable — the built-in baseline stands */ }
  return { flagged: false, reason: "" };
}

/* ---------- Report delivery (admins only) ---------- */
async function adminEmailSet(ctx: Ctx, orgId: number): Promise<Set<string>> {
  const db = ctx.db<typeof schema>();
  const set = new Set<string>();
  const admins = await db.select({ email: schema.authorizedAdmins.email }).from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, orgId));
  for (const a of admins) set.add(a.email.toLowerCase());
  const owners = await db.select({ email: schema.organizationOwners.email }).from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, orgId));
  for (const o of owners) set.add(o.email.toLowerCase());
  const org = await getOrgRow(ctx, orgId);
  if (org?.ownerEmail) set.add(org.ownerEmail.toLowerCase());
  return set;
}
async function validateAdminRecipients(ctx: Ctx, orgId: number, emails: string[]): Promise<string[]> {
  const cleaned = normalizeEmailList(emails);
  if (cleaned.length === 0) throw new Error("Pick at least one administrator to receive the report.");
  const allowed = await adminEmailSet(ctx, orgId);
  const bad = cleaned.filter((e) => !allowed.has(e));
  if (bad.length > 0) throw new Error(`Reports can only be emailed to registered administrators of this organization. Not an administrator: ${bad.join(", ")}`);
  return cleaned;
}
async function compileReportText(ctx: Ctx, orgId: number, eventId: number | null, final: boolean): Promise<{ subject: string; body: string }> {
  const db = ctx.db<typeof schema>();
  const org = await getOrgRow(ctx, orgId);
  const orgName = org?.name ?? "Organization";
  const evs = eventId ? (await db.select().from(schema.events).where(eq(schema.events.id, eventId))).filter((e) => e.orgId === orgId) : await db.select().from(schema.events).where(eq(schema.events.orgId, orgId)).orderBy(asc(schema.events.date));
  const lines: string[] = [];
  let tTotal = 0, tChecked = 0, tApproved = 0, tPending = 0;
  for (const ev of evs) {
    const regs = await db.select({ status: schema.registrations.status, held: schema.registrations.held }).from(schema.registrations).where(eq(schema.registrations.eventId, ev.id));
    const c = { pending: 0, approved: 0, checkedIn: 0, denied: 0, total: 0 };
    for (const r of regs) { if (r.status === "revoked" || r.held === 1) continue; c.total += 1; if (r.status === "pending") c.pending += 1; else if (r.status === "approved") c.approved += 1; else if (r.status === "checked_in") c.checkedIn += 1; else if (r.status === "denied") c.denied += 1; }
    tTotal += c.total; tChecked += c.checkedIn; tApproved += c.approved; tPending += c.pending;
    const rate = c.approved + c.checkedIn > 0 ? Math.round((c.checkedIn / (c.approved + c.checkedIn)) * 100) : 0;
    lines.push(`${ev.title} — ${ev.date} · ${ev.timeText} · ${ev.location}${ev.status !== "published" ? ` (${ev.status})` : ""}`);
    lines.push(`  Registrations: ${c.total} · Checked in: ${c.checkedIn} · Approved, not checked in: ${c.approved} · Awaiting approval: ${c.pending}${c.denied > 0 ? ` · Not approved: ${c.denied}` : ""} · Attendance rate: ${rate}%`);
  }
  const scopeName = eventId && evs[0] ? evs[0].title : `${orgName} — all events`;
  const subject = `${final ? "Final report" : "Report"}: ${scopeName} (${tChecked}/${tTotal} checked in)`;
  const body = [
    `${final ? "Final registration and attendance numbers" : "Registration and attendance update"} for ${scopeName}.`,
    ``,
    ...lines,
    ``,
    `Totals: ${tTotal} registrations · ${tChecked} checked in · ${tApproved} approved and not yet checked in · ${tPending} awaiting approval.`,
    `Reports are for administrators only and are built from the check-ins recorded at the door.`,
  ].join("\n");
  return { subject, body };
}
function dateKeyOf(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addDaysKey(key: string, days: number): string { const [y = 1970, m = 1, dd = 1] = key.split("-").map(Number); const d = new Date(y, m - 1, dd + days); return dateKeyOf(d); }


/* ---------- Event message threads (attendee ↔ event team) ----------
   A conversation about one event, anchored to ONE registration: the
   attendee writes from My Events (or by replying to the notification
   email), the event's administrators and registrars read and reply in
   the app (Messages inbox) or from their own notification email.
   Notification emails carry a single-use reply token (the approval-link
   pattern): the token is scoped to this one thread, so replying by
   email can never expose or touch another attendee's information.
   Every message is moderation-screened before it is stored. */
const MESSAGE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
type EventMessageRow = typeof schema.eventMessages.$inferSelect;
const eventMessageShape = z.object({ id: z.number(), fromAttendee: z.boolean(), senderName: z.string(), body: z.string(), createdAt: z.string(), readAt: z.string().nullable() });
function toEventMessage(m: EventMessageRow): z.infer<typeof eventMessageShape> {
  return { id: m.id, fromAttendee: m.fromAttendee === 1, senderName: m.senderName, body: m.body, createdAt: new Date(m.createdAt).toISOString(), readAt: m.readAt ? new Date(m.readAt).toISOString() : null };
}
async function threadForRegistration(ctx: Ctx, registrationId: number): Promise<{ reg: RegRow; ev: EventRow }> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, registrationId)).limit(1);
  const reg = rows[0];
  if (!reg) throw new Error("Registration not found.");
  const ev = await getEventRow(ctx, reg.eventId);
  if (!ev) throw new Error("That event no longer exists.");
  return { reg, ev };
}
async function assertAttendeeIdentity(ctx: Ctx, reg: RegRow, email?: string, googleId?: string): Promise<void> {
  let ok = !!(googleId && reg.googleId && reg.googleId === googleId);
  if (!ok && email) { const hash = await emailIndex(ctx, email); ok = reg.emailHash === hash || reg.contactEmailHash === hash; }
  if (!ok) throw new Error("That sign-in or email doesn't match this registration.");
}
async function staffRecipientEmails(ctx: Ctx, orgId: number): Promise<string[]> {
  const db = ctx.db<typeof schema>();
  const admins = await db.select({ email: schema.authorizedAdmins.email }).from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, orgId));
  const registrants = await db.select({ email: schema.authorizedRegistrants.email }).from(schema.authorizedRegistrants).where(eq(schema.authorizedRegistrants.orgId, orgId));
  return [...new Set([...admins, ...registrants].map((r) => r.email.trim().toLowerCase()).filter(Boolean))];
}
async function staffDisplayName(ctx: Ctx, orgId: number, googleId?: string, email?: string): Promise<string> {
  const db = ctx.db<typeof schema>();
  const admins = await db.select().from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, orgId));
  const hit = admins.find((r) => (googleId && r.googleId === googleId) || (email && r.email.toLowerCase() === email.toLowerCase()));
  if (hit) return hit.displayName;
  const registrants = await db.select().from(schema.authorizedRegistrants).where(eq(schema.authorizedRegistrants.orgId, orgId));
  const hit2 = registrants.find((r) => (googleId && r.googleId === googleId) || (email && r.email.toLowerCase() === email.toLowerCase()));
  if (hit2) return hit2.displayName;
  return email ?? "Event team";
}
async function issueMessageTokens(ctx: Ctx, orgId: number, registrationId: number, messageId: number, side: "staff" | "attendee", recipients: string[]): Promise<void> {
  const db = ctx.db<typeof schema>();
  const now = Date.now();
  for (const recipientEmail of recipients) {
    if (!recipientEmail) continue;
    await db.insert(schema.eventMessageTokens).values({ orgId, registrationId, messageId, side, recipientEmail, token: `msg-${makeApprovalToken().slice(4)}`, expiresAt: now + MESSAGE_TOKEN_TTL_MS, createdAt: now });
  }
}
async function appendEventMessage(ctx: Ctx, reg: RegRow, ev: EventRow, fromAttendee: boolean, senderName: string, body: string): Promise<number> {
  const db = ctx.db<typeof schema>();
  const inserted = await db.insert(schema.eventMessages).values({ orgId: ev.orgId, eventId: ev.id, registrationId: reg.id, fromAttendee: fromAttendee ? 1 : 0, senderName, body, createdAt: Date.now() }).returning({ id: schema.eventMessages.id });
  return inserted[0]!.id;
}
// After a message is appended, notify the other side: staff get one
// notification email each (admins + registrars); the attendee gets one,
// addressed where their passes go (group contact if set, else their own
// address). Each notification carries its own reply token.
async function notifyOtherSide(ctx: Ctx, reg: RegRow, ev: EventRow, messageId: number, fromAttendee: boolean): Promise<void> {
  if (fromAttendee) {
    await issueMessageTokens(ctx, ev.orgId, reg.id, messageId, "staff", await staffRecipientEmails(ctx, ev.orgId));
  } else {
    const plain = (await decryptRegs(ctx, [reg])).get(reg.id);
    const to = plain?.contactEmail ?? plain?.email ?? "";
    await issueMessageTokens(ctx, ev.orgId, reg.id, messageId, "attendee", [to]);
  }
}

/* ---------- Organization subscribers (new-event alerts) ----------
   When an organization posts a new PUBLISHED event, everyone who
   subscribed to that organization is notified automatically — the
   send is composed and logged in event_notifications with audience
   "subscribers", consistent with the prototype mail posture. Drafts
   never notify; publishing a draft notifies at publish time (the
   setEventStatus / updateEvent paths call this too). */
/* ---------- Platform guidelines screening for events ----------
   Separate from the attendee-content moderation (offensive words in
   registration fields): this screens the EVENT itself — title,
   description, location — for anything illegal, dangerous, or
   otherwise against the platform guidelines. A flagged event cannot
   be published: it is held as a draft with the guideline named, and
   lands in the admins' guideline review queue. The screen only flags
   when the event's PURPOSE is the violation — education, support,
   recovery, safety training, and licensed/professional activity
   about a topic are not violations. If the screening model is
   unreachable, no flag is raised (the publish path re-screens). */
const PLATFORM_GUIDELINES = ["Illegal activity", "Violence or dangerous activity", "Weapons or explosives", "Illicit drugs", "Hate or extremist content", "Fraud or scams", "Sexual services", "Self-harm", "Other serious safety concern"];
async function screenEventGuidelines(ctx: Ctx, fields: { title: string; description: string; location: string }): Promise<{ flag: string; reason: string }> {
  try {
    const out = await ctx.inference.complete(
      [
        `You screen events for a community event-registration platform against its hosting guidelines. The platform cannot host an event whose PURPOSE is illegal, dangerous, or a serious concern to society.`,
        `Guidelines (use these exact names): ${PLATFORM_GUIDELINES.join("; ")}.`,
        `Flag the event ONLY when organizing or attending it is itself the violation — e.g. an event to sell illicit drugs, plan violence, distribute weapons, run a scam, or host extremist organizing. Do NOT flag: education, awareness, prevention, recovery/support groups, safety training, history, art, journalism, religious or political discussion, or lawful licensed activity (a licensed venue's wine tasting, a certified firearms-safety course, a pharmacy take-back day). When genuinely unsure, do not flag.`,
        `Event title: "${fields.title.replace(/"/g, "'")}"`,
        `Event description: "${fields.description.replace(/"/g, "'")}"`,
        `Event location: "${fields.location.replace(/"/g, "'")}"`,
        `If it violates a guideline: violates=true, guideline = the exact guideline name, reason = one plain sentence saying what in the event violates it. Otherwise violates=false and empty strings.`,
      ].join("\n"),
      { schema: z.object({ violates: z.boolean(), guideline: z.string(), reason: z.string() }) },
    );
    if (out.violates) {
      // Map the model's guideline wording onto a canonical guideline
      // name — an exact-match-or-drop check would silently discard
      // real flags over trivial wording differences.
      const g = out.guideline.trim().toLowerCase();
      const canonical = PLATFORM_GUIDELINES.find((name) => name.toLowerCase() === g)
        ?? (g.includes("weapon") || g.includes("explosiv") ? "Weapons or explosives"
          : g.includes("drug") ? "Illicit drugs"
            : g.includes("violence") || g.includes("dangerous") ? "Violence or dangerous activity"
              : g.includes("hate") || g.includes("extremist") ? "Hate or extremist content"
                : g.includes("fraud") || g.includes("scam") ? "Fraud or scams"
                  : g.includes("sexual") ? "Sexual services"
                    : g.includes("self-harm") || g.includes("self harm") ? "Self-harm"
                      : g.includes("illegal") ? "Illegal activity"
                        : "Other serious safety concern");
      return { flag: canonical, reason: out.reason || "The event's content appears to violate this guideline." };
    }
    return { flag: "", reason: "" };
  } catch {
    return { flag: "", reason: "" };
  }
}
function guidelineBlockMessage(flag: string, reason: string): string {
  return `This event can't be published on Approved Guest — it was flagged under our platform guideline on ${flag}. ${reason} Edit the event so it no longer violates the guideline, or an administrator can review it in the guideline review queue (Admin → Events) and clear the flag if the flag is wrong.`;
}

/* Event cancellation/deletion notices: one per active registration,
   snapshotting the attendee's (already-encrypted) email + blind index
   so the notice survives even a full event deletion. The org picks
   the mode: "announcement" carries its own message with the notice;
   "quiet" is the plain cancellation notice only. */
async function createCancellationNotices(ctx: Ctx, ev: EventRow, mode: "announcement" | "quiet", message: string, deleted: boolean): Promise<number> {
  const db = ctx.db<typeof schema>();
  const regs = await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, ev.id));
  const active = regs.filter((r) => r.held !== 1 && ["pending", "approved", "checked_in", "waitlisted"].includes(r.status));
  for (const r of active) {
    await db.insert(schema.eventNotices).values({ orgId: ev.orgId, eventId: ev.id, eventTitle: ev.title, eventDate: ev.date, registrationId: r.id, email: r.email, emailHash: r.emailHash, mode, message: mode === "announcement" ? message.trim() : "", eventDeleted: deleted ? 1 : 0 });
  }
  return active.length;
}

async function notifySubscribersOfNewEvent(ctx: Ctx, org: OrgRow, ev: EventRow): Promise<void> {
  // Hidden events are invite-only: subscribers are NOT auto-notified
  // about them (that would announce an event meant to stay unlisted).
  if ((ev.visibility ?? "public") === "hidden") return;
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.orgSubscriptions).where(eq(schema.orgSubscriptions.orgId, org.id));
  if (rows.length === 0) return;
  const dec = await decryptFields(ctx, rows.map((r) => r.email));
  const recipients = dec.filter((e): e is string => !!e && e.includes("@"));
  if (recipients.length === 0) return;
  const subject = `New event: ${ev.title} — ${org.name}`;
  await db.insert(schema.eventNotifications).values({ orgId: org.id, eventId: ev.id, audience: "subscribers", recipientCount: recipients.length, subject });
}

/* ---------- Announcement opt-ins (per organization, per attendee) ----------
   Chosen at registration and changeable later by the attendee under
   Preferences. The FIRST recorded choice stands: a later registration
   never silently overwrites it — only the attendee's own Preferences
   change (setAnnouncementPreference) updates it. A missing row means
   the attendee has not chosen yet and is treated as opted in (the
   registration form presents the choice pre-checked, the common case). */
async function recordAnnouncementOptIn(ctx: Ctx, orgId: number, email: string, displayName: string, optedIn: boolean): Promise<void> {
  const em = email.trim().toLowerCase();
  if (!em.includes("@")) return;
  const db = ctx.db<typeof schema>();
  const hash = await emailIndex(ctx, em);
  const existing = await db.select({ id: schema.announcementOptins.id }).from(schema.announcementOptins).where(and(eq(schema.announcementOptins.orgId, orgId), eq(schema.announcementOptins.emailHash, hash))).limit(1);
  if (existing[0]) return;
  const enc = await encryptFields(ctx, [em]);
  await db.insert(schema.announcementOptins).values({ orgId, email: enc[0]!, emailHash: hash, displayName: displayName.trim(), optedIn: optedIn ? 1 : 0, updatedAt: Date.now() }).onConflictDoNothing();
}

/* ---------- Arrival pop-up standing answer (per organization, per attendee) ----------
   The registration-completion question — "Do you want this
   confirmation to appear when you arrive?" — is asked every time, but
   the attendee's PREVIOUS answer is the default: it pre-fills the
   question and is applied to each new registration as its starting
   proximity_opt_in. Unlike announcements (first choice stands), an
   arrival answer always updates the stored one — answering the
   question again IS how the attendee changes it, alongside the
   per-registration control in My Events / Preferences. No row means
   never answered: the default is NO and no location permission is
   ever requested on the strength of a default alone — the stored YES
   only takes effect because the attendee opted in, in person, when
   they answered. */
/* The attendee-chosen arrival radii. The event's default radius is
   the admin's free choice (50–5000 m); an attendee's OWN radius is
   one of these four plain choices, or null ("use the event
   default"). Anything else sent by a client is treated as null. */
const ATTENDEE_RADIUS_OPTIONS: readonly number[] = [100, 250, 500, 1000];
function normalizeAttendeeRadius(v: number | null | undefined): number | null {
  return typeof v === "number" && ATTENDEE_RADIUS_OPTIONS.includes(v) ? v : null;
}
async function upsertArrivalDefaultByHash(ctx: Ctx, orgId: number, emailHash: string, encryptedEmail: string, displayName: string, enabled: boolean, radiusM?: number | null): Promise<void> {
  const db = ctx.db<typeof schema>();
  const existing = await db.select({ id: schema.arrivalPopupPreferences.id }).from(schema.arrivalPopupPreferences).where(and(eq(schema.arrivalPopupPreferences.orgId, orgId), eq(schema.arrivalPopupPreferences.emailHash, emailHash))).limit(1);
  if (existing[0]) {
    await db.update(schema.arrivalPopupPreferences).set({ enabled: enabled ? 1 : 0, ...(radiusM !== undefined ? { radiusM: normalizeAttendeeRadius(radiusM) } : {}), updatedAt: Date.now() }).where(eq(schema.arrivalPopupPreferences.id, existing[0].id));
  } else {
    await db.insert(schema.arrivalPopupPreferences).values({ orgId, email: encryptedEmail, emailHash, displayName: displayName.trim(), enabled: enabled ? 1 : 0, radiusM: normalizeAttendeeRadius(radiusM), updatedAt: Date.now() });
  }
}
async function recordArrivalDefault(ctx: Ctx, orgId: number, email: string, displayName: string, enabled: boolean, radiusM?: number | null): Promise<void> {
  const em = email.trim().toLowerCase();
  if (!em.includes("@")) return;
  const hash = await emailIndex(ctx, em);
  const enc = await encryptFields(ctx, [em]);
  await upsertArrivalDefaultByHash(ctx, orgId, hash, enc[0]!, displayName, enabled, radiusM);
}
async function arrivalAnswerFor(ctx: Ctx, orgId: number, emailHash: string | null): Promise<{ hasAnswer: boolean; enabled: boolean; radiusM: number | null }> {
  if (!emailHash) return { hasAnswer: false, enabled: false, radiusM: null };
  const db = ctx.db<typeof schema>();
  const row = (await db.select().from(schema.arrivalPopupPreferences).where(and(eq(schema.arrivalPopupPreferences.orgId, orgId), eq(schema.arrivalPopupPreferences.emailHash, emailHash))).limit(1))[0];
  return row ? { hasAnswer: true, enabled: row.enabled === 1, radiusM: normalizeAttendeeRadius((row as { radiusM?: number | null }).radiusM) } : { hasAnswer: false, enabled: false, radiusM: null };
}

/* ---------- Organization membership audit ----------
   Every addition to / removal from an organization's owners,
   administrators, greeters, or registrants lists is recorded with
   when it happened and who did it (login email + login ID). Role
   changes are these same adds/removes — each entry names the role.
   Auditing must never block the membership change itself, so
   failures here are swallowed. */
async function logMembershipChange(ctx: Ctx, orgId: number, role: string, action: "added" | "removed", member: { email: string; name?: string; loginId?: string }, actor: { email?: string | null; loginId?: string | null }, source: string = "direct"): Promise<void> {
  try {
    const db = ctx.db<typeof schema>();
    await db.insert(schema.orgMembershipAudit).values({ orgId, memberEmail: member.email ?? "", memberName: member.name ?? "", memberLoginId: member.loginId ?? "", role, action, source, actorEmail: actor.email ?? "", actorLoginId: actor.loginId ?? "", createdAt: Date.now() });
  } catch { /* never block the change being audited */ }
}

/* ---------- Support tickets & support lookup (platform console) ---------- */
const supportTicketShape = z.object({ id: z.number(), orgId: z.number().nullable(), orgName: z.string(), askerEmail: z.string(), askerName: z.string(), askerLoginId: z.string(), question: z.string(), contextScreen: z.string(), contextTried: z.string(), channel: z.enum(["email", "text", "both"]), status: z.enum(["open", "answered", "closed"]), createdAt: z.string(), updatedAt: z.string(), messages: z.array(z.object({ id: z.number(), sender: z.enum(["user", "support"]), body: z.string(), byEmail: z.string(), deliveredVia: z.string(), createdAt: z.string() })) });

type SupportTicketRow = typeof schema.supportTickets.$inferSelect;
async function buildSupportTickets(ctx: Ctx, rows: SupportTicketRow[]): Promise<Array<z.infer<typeof supportTicketShape>>> {
  const db = ctx.db<typeof schema>();
  const out: Array<z.infer<typeof supportTicketShape>> = [];
  for (const t of rows) {
    const msgs = await db.select().from(schema.supportMessages).where(eq(schema.supportMessages.ticketId, t.id)).orderBy(asc(schema.supportMessages.id));
    const org = t.orgId ? await getOrgRow(ctx, t.orgId) : null;
    out.push({ id: t.id, orgId: t.orgId ?? null, orgName: org?.name ?? "", askerEmail: t.askerEmail, askerName: t.askerName, askerLoginId: t.askerLoginId, question: t.question, contextScreen: t.contextScreen, contextTried: t.contextTried, channel: t.channel, status: t.status, createdAt: new Date(t.createdAt).toISOString(), updatedAt: new Date(t.updatedAt).toISOString(), messages: msgs.map((m) => ({ id: m.id, sender: m.sender, body: m.body, byEmail: m.byEmail, deliveredVia: m.deliveredVia, createdAt: new Date(m.createdAt).toISOString() })) });
  }
  return out;
}

const supportLookupShape = z.object({ found: z.boolean(), kind: z.string(), heading: z.string(), fields: z.array(z.object({ label: z.string(), value: z.string() })), links: z.array(z.object({ kind: z.string(), id: z.number(), label: z.string() })), items: z.array(z.object({ kind: z.string(), id: z.number(), label: z.string(), sub: z.string(), email: z.string() })) });

async function supportLookup(ctx: Ctx, kind: "organization" | "event" | "registration" | "group" | "message", id: number): Promise<z.infer<typeof supportLookupShape>> {
  const db = ctx.db<typeof schema>();
  const empty: z.infer<typeof supportLookupShape> = { found: false, kind, heading: `No ${kind} with ID ${id}`, fields: [], links: [], items: [] };
  if (kind === "organization") {
    const org = await getOrgRow(ctx, id);
    if (!org) return empty;
    const evs = await db.select().from(schema.events).where(eq(schema.events.orgId, id)).orderBy(desc(schema.events.id)).limit(100);
    const regCount = evs.length === 0 ? 0 : (await db.select({ id: schema.registrations.id }).from(schema.registrations).where(inArray(schema.registrations.eventId, evs.map((e) => e.id)))).length;
    return { found: true, kind, heading: `${org.name} — Organization #${org.id}`, fields: [{ label: "Organization ID", value: String(org.id) }, { label: "Owner email", value: org.ownerEmail }, { label: "Plan", value: org.plan }, { label: "Subscription", value: org.subscriptionStatus }, { label: "Events", value: String(evs.length) }, { label: "Registrations (all events)", value: String(regCount) }], links: [], items: evs.map((e) => ({ kind: "event", id: e.id, label: `${e.title} — ${e.date}`, sub: `${e.status}${e.visibility === "hidden" ? " · hidden" : ""}`, email: "" })) };
  }
  if (kind === "event") {
    const ev = await getEventRow(ctx, id);
    if (!ev) return empty;
    const org = await getOrgRow(ctx, ev.orgId);
    const regs = await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, id)).orderBy(desc(schema.registrations.id)).limit(100);
    const decNames = await decryptFields(ctx, regs.map((r) => r.name));
    const decEmails = await decryptFields(ctx, regs.map((r) => r.email));
    return { found: true, kind, heading: `${ev.title} — Event #${ev.id}`, fields: [{ label: "Event ID", value: String(ev.id) }, { label: "When", value: `${ev.date} · ${ev.timeText}` }, { label: "Location", value: ev.locationType === "virtual" ? `Virtual — ${ev.virtualLink || "no link set"}` : ev.location }, { label: "Status", value: `${ev.status}${ev.visibility === "hidden" ? " · hidden (link only)" : ""}` }, { label: "Capacity", value: ev.capacity ? String(ev.capacity) : "No limit" }, { label: "Registrations", value: String(regs.length) }], links: [{ kind: "organization", id: ev.orgId, label: `Organization: ${org?.name ?? ev.orgId}` }], items: regs.map((r, i) => ({ kind: "registration", id: r.id, label: `${decNames[i] ?? ""} — ${r.status}`, sub: decEmails[i] ?? "", email: "" })) };
  }
  if (kind === "registration") {
    const r = (await db.select().from(schema.registrations).where(eq(schema.registrations.id, id)).limit(1))[0];
    if (!r) return empty;
    const ev = await getEventRow(ctx, r.eventId);
    const org = ev ? await getOrgRow(ctx, ev.orgId) : null;
    const dec = await decryptFields(ctx, [r.name, r.email, r.phone ?? ""]);
    return { found: true, kind, heading: `Registration #${r.id} — ${dec[0] ?? ""}`, fields: [{ label: "Registration ID", value: String(r.id) }, { label: "Attendee", value: dec[0] ?? "" }, { label: "Email", value: dec[1] ?? "" }, { label: "Phone", value: dec[2] ?? "" }, { label: "Status", value: r.status }, { label: "Pass code", value: r.code ?? "(none — issued at confirmation)" }, { label: "Delivery channel", value: r.notifyChannel }, { label: "Registered", value: r.createdAt.toISOString() }, ...(r.registeredByName ? [{ label: "Registered by", value: `${r.registeredByName} (${r.registeredByEmail ?? ""})` }] : [])], links: [...(ev ? [{ kind: "event", id: ev.id, label: `Event: ${ev.title}` }] : []), ...(org ? [{ kind: "organization", id: org.id, label: `Organization: ${org.name}` }] : [])], items: [] };
  }
  if (kind === "group") {
    const g = (await db.select().from(schema.attendeeGroups).where(eq(schema.attendeeGroups.id, id)).limit(1))[0];
    if (!g) return empty;
    const org = await getOrgRow(ctx, g.orgId);
    const members = await db.select().from(schema.attendeeGroupMembers).where(eq(schema.attendeeGroupMembers.groupId, id)).orderBy(asc(schema.attendeeGroupMembers.id));
    const decEmails = await decryptFields(ctx, members.map((m) => m.email));
    return { found: true, kind, heading: `${g.name} — Group #${g.id}`, fields: [{ label: "Group ID", value: String(g.id) }, { label: "Members", value: String(members.length) }, { label: "Created", value: new Date(g.createdAt).toISOString() }], links: [{ kind: "organization", id: g.orgId, label: `Organization: ${org?.name ?? g.orgId}` }], items: members.map((m, i) => ({ kind: "attendee", id: 0, label: m.displayName || (decEmails[i] ?? ""), sub: `added ${new Date(m.createdAt).toLocaleDateString()}${m.addedByEmail ? ` by ${m.addedByEmail}` : ""}`, email: decEmails[i] ?? "" })) };
  }
  const m = (await db.select().from(schema.eventMessages).where(eq(schema.eventMessages.id, id)).limit(1))[0];
  if (!m) return empty;
  const ev = await getEventRow(ctx, m.eventId);
  const org = await getOrgRow(ctx, m.orgId);
  return { found: true, kind, heading: `Message #${m.id}`, fields: [{ label: "Message ID", value: String(m.id) }, { label: "From", value: `${m.senderName} (${m.fromAttendee === 1 ? "attendee" : "event team"})` }, { label: "Body", value: m.body }, { label: "Sent", value: new Date(m.createdAt).toISOString() }], links: [{ kind: "event", id: m.eventId, label: `Event: ${ev?.title ?? m.eventId}` }, { kind: "registration", id: m.registrationId, label: `Registration #${m.registrationId}` }, { kind: "organization", id: m.orgId, label: `Organization: ${org?.name ?? m.orgId}` }], items: [] };
}

async function announcementOptInMap(ctx: Ctx, orgId: number): Promise<Map<string, boolean>> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select({ emailHash: schema.announcementOptins.emailHash, optedIn: schema.announcementOptins.optedIn }).from(schema.announcementOptins).where(eq(schema.announcementOptins.orgId, orgId));
  return new Map(rows.map((r) => [r.emailHash ?? "", r.optedIn === 1]));
}


/* ---------- Service health, incidents, beta program ---------- */
type HealthProbe = { ok: boolean; dbOk: boolean; responseMs: number };

async function runHealthProbe(ctx: Ctx): Promise<HealthProbe> {
  const t0 = Date.now();
  let dbOk = true;
  try {
    const db = ctx.db<typeof schema>();
    await db.select({ id: schema.organizations.id }).from(schema.organizations).limit(1);
  } catch { dbOk = false; }
  return { ok: dbOk, dbOk, responseMs: Date.now() - t0 };
}

async function recordHealthCheck(ctx: Ctx, probe: HealthProbe, note: string): Promise<void> {
  const db = ctx.db<typeof schema>();
  await db.insert(schema.healthChecks).values({ checkedAt: Date.now(), ok: probe.ok ? 1 : 0, dbOk: probe.dbOk ? 1 : 0, responseMs: probe.responseMs, note });
  const rows = await db.select({ id: schema.healthChecks.id }).from(schema.healthChecks).orderBy(desc(schema.healthChecks.id)).limit(801);
  if (rows.length > 800) {
    const cutoff = rows[rows.length - 1]!.id;
    await db.delete(schema.healthChecks).where(lt(schema.healthChecks.id, cutoff));
  }
}

type HealthAlertConfig = { enabled: boolean; phone: string; twilioSid: string; twilioFrom: string; twilioToken: string; slowMs: number };

async function healthAlertConfig(ctx: Ctx): Promise<HealthAlertConfig> {
  const slow = Number((await getSetting(ctx, "health_slow_ms")) ?? "2000");
  return {
    enabled: (await getSetting(ctx, "health_alerts_enabled")) === "1",
    phone: (await getSetting(ctx, "health_alert_phone")) ?? "",
    twilioSid: (await getSetting(ctx, "health_twilio_sid")) ?? "",
    twilioFrom: (await getSetting(ctx, "health_twilio_from")) ?? "",
    twilioToken: (await getSetting(ctx, "health_twilio_token")) ?? "",
    slowMs: Number.isFinite(slow) && slow > 0 ? slow : 2000,
  };
}

async function maybeSendHealthSms(ctx: Ctx, body: string): Promise<{ sent: boolean; error: string | null }> {
  const cfg = await healthAlertConfig(ctx);
  if (!cfg.enabled) return { sent: false, error: "Text alerts are switched off in the platform console." };
  if (!cfg.phone || !cfg.twilioSid || !cfg.twilioFrom || !cfg.twilioToken) return { sent: false, error: "Alert phone number or Twilio settings are incomplete in the platform console." };
  const res = await ctx.executePrivileged(privileged.sendSms, { accountSid: cfg.twilioSid, authToken: cfg.twilioToken, fromNumber: cfg.twilioFrom, toNumber: cfg.phone, body });
  return { sent: res.sent, error: res.error };
}

async function maintenanceState(ctx: Ctx): Promise<{ maintenance: boolean; manual: boolean; message: string; since: string | null }> {
  const db = ctx.db<typeof schema>();
  const manual = (await getSetting(ctx, "maintenance_mode")) === "1";
  const open = (await db.select().from(schema.serviceIncidents).where(and(eq(schema.serviceIncidents.kind, "outage"), isNull(schema.serviceIncidents.endedAt))).limit(1))[0];
  const message = (await getSetting(ctx, "maintenance_message")) ?? "";
  return { maintenance: manual || !!open, manual, message, since: open ? new Date(open.startedAt).toISOString() : null };
}

/* ---------- Beta program ---------- */
type BetaFeatureDef = { key: string; label: string; status: "beta" | "released" };

async function betaFeatureDefs(ctx: Ctx): Promise<BetaFeatureDef[]> {
  try {
    const raw = await getSetting(ctx, "beta_features");
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is BetaFeatureDef => !!x && typeof x === "object" && typeof (x as BetaFeatureDef).key === "string" && typeof (x as BetaFeatureDef).label === "string" && ((x as BetaFeatureDef).status === "beta" || (x as BetaFeatureDef).status === "released"));
  } catch { return []; }
}

async function orgBetaEnrolled(ctx: Ctx, org: OrgRow): Promise<boolean> {
  const override = await getSetting(ctx, `beta_override_${org.id}`);
  if (override === "in") return true;
  if (override === "out") return false;
  return org.betaOptIn === 1;
}


/* ---------- Terms of Service (legal) ----------
   The current Terms of Service text lives here, server-side, so
   onboarding, Settings, and registration all present the SAME text.
   Organization creators must accept before an organization is
   created; the acceptance (who, when, which version) is recorded.
   Attendees accept the short attendee terms as part of registering. */
const TERMS_VERSION = "2026-11-09.3";
const TERMS_OF_SERVICE = [
  "APPROVED GUEST — TERMS OF SERVICE",
  `Version ${TERMS_VERSION}. By creating an organization on Approved Guest, you agree to these terms.`,
  "",
  "1. THE SERVICE. Approved Guest provides event calendaring, registration, approval, pass, and check-in tools to organizations. The organization — not Approved Guest — plans, runs, and is responsible for its events, its guest list decisions, and its communications with attendees.",
  "",
  "2. ACCEPTABLE USE. You will use the service only for lawful events and purposes. You will not publish events that are illegal, dangerous, or against the platform guidelines (including events whose purpose is violence, illicit drugs, weapons or explosives, fraud, hate or extremist activity, sexual services, or self-harm); will not enter offensive, deceptive, or infringing content; will not attempt to access another organization's data; and will not misuse attendee information. Flagged events cannot be published and may be removed.",
  "",
  "3. YOUR RESPONSIBILITIES. You are responsible for the accuracy of your event information, for honoring the registrations you confirm, for complying with the laws that apply to your events and your handling of attendee data, and for keeping your account credentials secure. Attendee personal information is provided to you only to run your events.",
  "",
  "4. PLANS AND BILLING. Approved Guest is freemium: there is no pilot program, and no time- or event-limited trial. (a) FREE PLAN. The Free plan is permanent and free. It covers one user — the organization owner — and basic events only: create an event, send the notice (including an email invite with a calendar file), collect RSVPs, and see who is coming. The Free plan does not include QR codes or passes, approvals, the AI assistant, door access, or reports beyond the attendee list. It never expires, never requires a payment card, and never turns into a paid plan on its own. (b) PAID PLANS. The paid plans — Starter ($29/month), Growth ($59/month), and Unlimited ($99/month) — unlock additional features by plan, as shown in the app. A subscription starts only when the owner chooses a paid plan. (c) DOOR ACCESS ADD-ON. Door access is charged separately from the plan prices above, as a per-user add-on priced by volume (per phone/QR user per month, at the rates shown in the app). (d) CANCELLATION AND PAYMENT FAILURE. A subscription may be cancelled at any time; access continues to the end of the paid period. If payment fails and is not repaired within the stated grace period, the account is frozen (never deleted) until payment is repaired. (e) PRICING CHANGES. Approved Guest may change the pricing model on at least 30 days' notice. That can include plan prices, add-on prices, and what is included in each plan. We will notify your organization when the 30-day notice period starts, and the change takes effect at the end of the 30 days or at your next payment renewal, whichever is later. If you do not want the change, you can opt out before it takes effect by cancelling, or by moving to a plan the change does not affect. If you do neither, the change applies to your organization when it takes effect.",
  "",
  "5. DISCLAIMER OF WARRANTIES. The service is provided \"as is\" and \"as available\", without warranties of any kind, express or implied, including fitness for a particular purpose, merchantability, and non-infringement, to the maximum extent permitted by law. We do not warrant that the service will be uninterrupted, error-free, or that passes, notifications, or check-in will work in every environment.",
  "",
  "6. LIMITATION OF LIABILITY. To the maximum extent permitted by law, Approved Guest and its owners will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, data, or goodwill, arising from or related to the service or your events. Our total aggregate liability for any claim arising from the service is limited to the amounts you paid us for the service in the twelve months before the claim, or $100 if you have paid nothing.",
  "",
  "7. INDEMNITY. You agree to indemnify and hold harmless Approved Guest and its owners from claims, damages, and expenses arising from your events, your content, or your violation of these terms or applicable law.",
  "",
  "8. CHANGES AND TERMINATION. We may update these terms; material changes will be announced in the app, and continued use after an update takes effect is acceptance. We may suspend or terminate accounts that violate these terms. You may stop using the service at any time.",
  "",
  "9. GOVERNING LAW. These terms are governed by the laws of the State of Connecticut, without regard to its conflict-of-laws rules.",
].join("\n");
const PRIVACY_NOTICE = [
  "APPROVED GUEST — PRIVACY NOTICE",
  "",
  "WHAT WE COLLECT",
  "• Your name, email, and — if you give it — phone number, when you register",
  "• Your answers to the organization's registration questions",
  "• Your sign-in identity (Google, Apple, email, or a passkey if you set one up)",
  "",
  "HOW IT'S USED",
  "• To run the event: RSVPs, and — on paid plans — approvals, passes, reminders, and messages about it",
  "• Each organization sees only its own guests — never another organization's",
  "",
  "HOW IT'S PROTECTED",
  "• Attendee names, emails, phone numbers, and answers are encrypted at rest",
  "• The encryption key is kept separate from the database",
  "• Passkeys: your fingerprint, face, or PIN never leaves your device — we store only the passkey's public key",
  "",
  "LOCATION",
  "• Arrival pop-up: only if you opt in. Your pass appears when you're near the venue, and your location is used on your device only — it is not sent to or stored by Approved Guest",
  "• Door check-in: where an event requires a location check, the greeter's device location is checked at that moment to confirm it is at the venue",
  "• Event search: only if you tap “Current location”. Your location is used for that one search, to show events near you — it is not stored",
  "• Location is asked for at the moment it's needed — never before",
  "",
  "CAMERA",
  "• The camera is used only while a pass is being scanned at the door",
  "• Scanning happens on the device — no photo or video is stored or sent",
  "",
  "AT THE DOOR",
  "• Each check-in is recorded in the event's access log (pass, time, and result) — the organization's attendance record",
  "",
  "YOUR CHOICES",
  "• We don't sell personal information",
  "• Turn the arrival pop-up off any time in your preferences",
  "• Cancel a registration any time from My Events",
  "• Privacy questions: reach us through Contact us in the footer",
].join("\n");
const ATTENDEE_TERMS = [
  "ATTENDEE TERMS",
  "When you register for an event you agree that:",
  "• The information you provide (your name, contact details, and answers to the organization's registration questions) is accurate and belongs to you, or you are registering with the other person's permission.",
  "• You will follow the organization's rules for the event, and you understand the organization — not Approved Guest — runs the event and decides approvals, capacity, and admission.",
  "• If the event issues you a pass (QR code or text code), it is yours: don't share it. The organization may revoke a pass if these terms or its rules are broken. Basic events may not issue a pass at all — your RSVP on the attendee list is your confirmation.",
  "• The organization will use your information to run the event (RSVPs, approvals and passes where the event uses them, reminders, and messages about the event), and you can cancel your registration at any time from My Events.",
].join("\n");

export const Actions = {
  /* ---------- Organizations & onboarding ---------- */

  listOrganizations: defineAction({
    description: "Lists every organization using the app (id + branding) for the organization switcher. Branding is public — it's what each organization's registration page looks like.",
    request: z.object({}),
    response: z.object({ organizations: z.array(orgShape) }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.organizations).orderBy(asc(schema.organizations.id));
      return { organizations: rows.map(toOrg) };
    },
  }),

  getOrganization: defineAction({
    description: "Returns one organization's branding and identity by id.",
    request: z.object({ orgId: z.number().int().positive() }),
    response: z.object({ organization: orgShape.nullable() }),
    async handler(ctx, args) {
      const row = await getOrgRow(ctx, args.orgId);
      return { organization: row ? toOrg(row) : null };
    },
  }),

  listMyOrganizations: defineAction({
    description: "Lists the organizations a signed-in person belongs to and their role in each (owner / administrator / gatekeeper), for the organization switcher and setup flow.",
    request: z.object({ googleId: z.string().max(200).optional(), email: z.string().max(200).optional() }),
    response: z.object({ memberships: z.array(z.object({ orgId: z.number(), orgName: z.string(), role: z.enum(["owner", "admin", "gatekeeper", "registrant"]) })) }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const gid = args.googleId?.trim();
      const em = args.email?.trim().toLowerCase();
      if (!gid && !em) return { memberships: [] };
      const match = (r: { googleId: string; email: string }) => (!!gid && r.googleId === gid) || (!!em && r.email.toLowerCase() === em);
      const orgs = await db.select().from(schema.organizations);
      const admins = await db.select().from(schema.authorizedAdmins);
      const gates = await db.select().from(schema.authorizedGatekeepers);
      const registrants = await db.select().from(schema.authorizedRegistrants);
      const owners = await db.select().from(schema.organizationOwners);
      const memberships: Array<{ orgId: number; orgName: string; role: "owner" | "admin" | "gatekeeper" | "registrant" }> = [];
      for (const org of orgs) {
        const isOwner = owners.some((r) => r.orgId === org.id && match(r)) || (!!gid && org.ownerGoogleId === gid) || (!!em && org.ownerEmail.toLowerCase() === em);
        if (isOwner) { memberships.push({ orgId: org.id, orgName: org.name, role: "owner" }); continue; }
        if (admins.some((r) => r.orgId === org.id && match(r))) { memberships.push({ orgId: org.id, orgName: org.name, role: "admin" }); continue; }
        if (gates.some((r) => r.orgId === org.id && match(r))) { memberships.push({ orgId: org.id, orgName: org.name, role: "gatekeeper" }); continue; }
        if (registrants.some((r) => r.orgId === org.id && match(r))) { memberships.push({ orgId: org.id, orgName: org.name, role: "registrant" }); }
      }
      return { memberships };
    },
  }),

  createOrganization: defineAction({
    description: "Onboarding: creates a new organization (tenant) with its own branding, starter registration questions, optional first event, and invited admins/gatekeepers. The signed-in creator automatically becomes the organization's owner and first administrator. Everything is stored under the new org's id only — fully separate from every other organization.",
    request: z.object({
      creatorGoogleId: z.string().min(1).max(200),
      creatorEmail: z.string().email().max(200),
      creatorName: z.string().min(1).max(120),
      branding: brandingInput,
      firstEvent: z.object({
        title: z.string().min(1).max(200), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        timeText: z.string().min(1).max(100), location: z.string().min(1).max(200), description: z.string().max(1000).default(""),
      }).optional(),
      questions: z.array(z.object({
        label: z.string().min(1).max(300), helpText: z.string().max(300).default(""),
        type: z.enum(["text", "choice", "yesno", "radio", "checkboxes"]), options: z.array(z.string().max(120)).max(30).default([]), required: z.boolean().default(true),
      })).max(20).optional(),
      inviteAdminEmails: z.array(z.string().email().max(200)).max(20).default([]),
      inviteGatekeeperEmails: z.array(z.string().email().max(200)).max(20).default([]),
      plan: z.enum(["trial", "starter", "community", "pro"]).default("trial"),
      includeSampleEvent: z.boolean().default(false),
      // Legal: the creator must accept the Terms of Service
      // (limitation of liability, disclaimer of warranties,
      // acceptable use) before the organization is created. The
      // acceptance is recorded with the creator, time, and version.
      termsAccepted: z.boolean().default(false),
    }),
    response: z.object({ orgId: z.number() }),
    async handler(ctx, args) {
      if (!args.termsAccepted) throw new Error("Please accept the Terms of Service first — creating an organization requires it. The full terms are linked on the setup screen.");
      const db = ctx.db<typeof schema>();
      const b = args.branding;
      const result = await db.insert(schema.organizations).values({
        name: b.name.trim(), tagline: b.tagline.trim(), websiteUrl: b.websiteUrl.trim(), logoUrl: b.logoUrl.trim(), motif: b.motif.trim() || "✦",
        primaryColor: b.primaryColor, navColor: b.navColor, accentColor: b.accentColor, skyColor: b.skyColor,
        bgColor: b.bgColor, surfaceColor: b.surfaceColor, textColor: b.textColor,
        fontSans: b.fontSans, fontDisplay: b.fontDisplay, codePrefix: b.codePrefix.toUpperCase(),
        ownerGoogleId: args.creatorGoogleId.trim(), ownerEmail: args.creatorEmail.trim().toLowerCase(),
        // Free plan (stored id "trial"): permanent and feature-
        // limited, not a trial — trialEndsAt stays null (no expiry
        // clock, no event limit). The subscription starts only if
        // and when the owner chooses a paid plan.
        plan: args.plan, subscriptionStatus: "trialing", trialEndsAt: null, onboardingStep: 1,
      }).returning({ id: schema.organizations.id });
      const org = result[0];
      if (!org) throw new Error("Could not create the organization.");
      const orgId = org.id;
      await setSetting(ctx, `tos_acceptance_${orgId}`, JSON.stringify({ email: args.creatorEmail.trim().toLowerCase(), at: new Date().toISOString(), version: TERMS_VERSION }));
      // The creator is the owner and the first administrator.
      await db.insert(schema.authorizedAdmins).values({ orgId, googleId: args.creatorGoogleId.trim(), email: args.creatorEmail.trim().toLowerCase(), displayName: args.creatorName.trim() }).onConflictDoNothing();
      await db.insert(schema.organizationOwners).values({ orgId, googleId: args.creatorGoogleId.trim(), email: args.creatorEmail.trim().toLowerCase(), displayName: args.creatorName.trim() }).onConflictDoNothing();
      await logMembershipChange(ctx, orgId, "owner", "added", { email: args.creatorEmail.trim().toLowerCase(), name: args.creatorName.trim(), loginId: args.creatorGoogleId.trim() }, { email: args.creatorEmail, loginId: args.creatorGoogleId }, "onboarding");
      await logMembershipChange(ctx, orgId, "admin", "added", { email: args.creatorEmail.trim().toLowerCase(), name: args.creatorName.trim(), loginId: args.creatorGoogleId.trim() }, { email: args.creatorEmail, loginId: args.creatorGoogleId }, "onboarding");
      // Invited admins / gatekeepers receive role INVITATIONS: no role is
      // assigned until the person opens the invite and creates their
      // account (password, Google, or Apple), which binds their identity
      // to the role. Pending invites are listed in the admin portal,
      // where the links can be copied or resent.
      for (const em of normalizeEmailList(args.inviteAdminEmails)) {
        if (em === args.creatorEmail.trim().toLowerCase()) continue;
        await insertRoleInvite(ctx, orgId, "admin", em.split("@")[0] ?? em, "", em);
      }
      for (const em of normalizeEmailList(args.inviteGatekeeperEmails)) {
        await insertRoleInvite(ctx, orgId, "gatekeeper", em.split("@")[0] ?? em, "", em);
      }
      // Registration questions chosen in the setup flow (or the defaults).
      if (args.questions && args.questions.length > 0) {
        for (let i = 0; i < args.questions.length; i++) {
          const q = args.questions[i]!;
          await db.insert(schema.customQuestions).values({ orgId, eventId: null, label: q.label.trim(), helpText: q.helpText.trim(), type: q.type, options: JSON.stringify(q.options.map((o) => o.trim()).filter(Boolean)), required: q.required ? 1 : 0, sortOrder: i, legacyKey: "" });
        }
      } else {
        await seedDefaultQuestions(ctx, orgId);
      }
      if (args.firstEvent) {
        const fe = args.firstEvent;
        await db.insert(schema.events).values({ orgId, title: fe.title.trim(), date: fe.date, timeText: fe.timeText.trim(), location: fe.location.trim(), description: fe.description.trim(), approvalEmails: "[]" }).onConflictDoNothing();
      }
      if (args.includeSampleEvent) await insertSampleEvent(ctx, orgId, b.name.trim());
      ctx.invalidateQueries();
      return { orgId };
    },
  }),


  uploadOrgLogo: defineAction({
    description: "Uploads an organization's logo image (PNG/JPEG/GIF/WebP, sent base64). Stored as an owned file and shown in the app header, on registration pages, embeds, and passes. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), dataBase64: z.string().min(10).max(4_000_000), mimeType: z.string().max(60), ...identityArgs }),
    response: z.object({ logoUrl: z.string() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const { key, url } = await storeLogoBlob(ctx, "org", args.orgId, args.dataBase64, args.mimeType);
      const db = ctx.db<typeof schema>();
      await db.update(schema.organizations).set({ logoUrl: url, logoBlobKey: key }).where(eq(schema.organizations.id, args.orgId));
      ctx.invalidateQueries();
      return { logoUrl: url };
    },
  }),

  removeOrgLogo: defineAction({
    description: "Removes an organization's logo (the decorative motif is used instead). Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      await db.update(schema.organizations).set({ logoUrl: "", logoBlobKey: "" }).where(eq(schema.organizations.id, args.orgId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  uploadEventLogo: defineAction({
    description: "Uploads an event-specific logo that overrides the organization logo on that event's pages and passes. Admin of the event's organization only.",
    request: z.object({ eventId: z.number().int().positive(), dataBase64: z.string().min(10).max(4_000_000), mimeType: z.string().max(60), ...identityArgs }),
    response: z.object({ logoUrl: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.events).where(eq(schema.events.id, args.eventId)).limit(1);
      const event = rows[0];
      if (!event) throw new Error("Event not found.");
      await requireAdmin(ctx, event.orgId, args.adminGoogleId, args.adminEmail);
      const { key, url } = await storeLogoBlob(ctx, "event", args.eventId, args.dataBase64, args.mimeType);
      await db.update(schema.events).set({ logoUrl: url, logoBlobKey: key }).where(eq(schema.events.id, args.eventId));
      ctx.invalidateQueries();
      return { logoUrl: url };
    },
  }),

  removeEventLogo: defineAction({
    description: "Removes an event-specific logo; the event falls back to the organization logo. Admin of the event's organization only.",
    request: z.object({ eventId: z.number().int().positive(), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.events).where(eq(schema.events.id, args.eventId)).limit(1);
      const event = rows[0];
      if (!event) throw new Error("Event not found.");
      await requireAdmin(ctx, event.orgId, args.adminGoogleId, args.adminEmail);
      await db.update(schema.events).set({ logoUrl: "", logoBlobKey: "" }).where(eq(schema.events.id, args.eventId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  updateBranding: defineAction({
    description: "Updates an organization's name, tagline, logo, motif, colors, fonts, and pass-code prefix. Admin of that organization only.",
    request: brandingInput.extend({ orgId: z.number().int().positive(), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      await db.update(schema.organizations).set({
        name: args.name.trim(), tagline: args.tagline.trim(), websiteUrl: args.websiteUrl.trim(), logoUrl: args.logoUrl.trim(), motif: args.motif.trim() || "✦",
        primaryColor: args.primaryColor, navColor: args.navColor, accentColor: args.accentColor, skyColor: args.skyColor,
        bgColor: args.bgColor, surfaceColor: args.surfaceColor, textColor: args.textColor,
        fontSans: args.fontSans, fontDisplay: args.fontDisplay, codePrefix: args.codePrefix.toUpperCase(),
      }).where(eq(schema.organizations.id, args.orgId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  extractBrandingFromUrl: defineAction({
    description: "Fetches a public website and extracts a branding candidate — organization name, tagline, logo, brand colors, and fonts — for an admin to review and apply. With an orgId, the requester must be an admin of that organization; without one (during onboarding), any signed-in creator may use it.",
    request: z.object({ url: z.string().min(4).max(500), orgId: z.number().int().positive().optional(), ...requesterArgs }),
    response: z.object({ candidate: brandingCandidateShape }),
    async handler(ctx, args) {
      if (args.orgId) {
        await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      } else if (!args.requestedByGoogleId && !args.requestedByEmail) {
        throw new Error("Sign in first, then pull branding from your website.");
      }
      const candidate = await extractBranding(args.url);
      return { candidate };
    },
  }),

getCalendarFeed: defineAction({
    description: "Returns the organization's subscribe-able iCal calendar feed (ICS text) — PUBLISHED events only, so drafts and cancelled events never leak into anyone's calendar app. The feed address is the app URL with ?feed=ical&org=<id>; calendar apps (Google Calendar, Outlook, Apple Calendar) poll an address like this to stay in sync.",
    request: z.object({ orgId: z.number().int().positive().default(1) }),
    response: z.object({ ics: z.string(), eventCount: z.number(), feedPath: z.string() }),
    async handler(ctx, args) {
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.events).where(eq(schema.events.orgId, args.orgId)).orderBy(asc(schema.events.date), asc(schema.events.id));
      // Hidden events stay out of the public calendar feed too, as do
      // soft-deleted events.
      const published = rows.filter((e) => !e.deletedAt && (e.status ?? "published") === "published" && (e.visibility ?? "public") === "public");
      const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
      const p2 = (n: number) => String(n).padStart(2, "0");
      const stamp = (d: Date) => `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`;
      const parseRange = (timeText: string) => {
        const matches = [...timeText.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
        const toHM = (m: RegExpMatchArray): [number, number] => { let h = Number(m[1] ?? "0") % 12; if ((m[3] ?? "").toUpperCase() === "PM") h += 12; return [h, Number(m[2] ?? "0")]; };
        const first = matches[0]; if (!first) return null; const second = matches[1]; return { start: toHM(first), end: second ? toHM(second) : null };
      };
      const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Approved Guest//Calendar Feed//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(org.name)}`];
      for (const ev of published) {
        const day = ev.date.replace(/-/g, "");
        lines.push("BEGIN:VEVENT", `UID:event-${ev.id}@approvedguest`, `DTSTAMP:${stamp(new Date())}`);
        const range = parseRange(ev.timeText);
        if (range) { const [sh, sm] = range.start; lines.push(`DTSTART:${day}T${p2(sh)}${p2(sm)}00`); let endH = sh + 2; let endM = sm; if (range.end) { [endH, endM] = range.end; } lines.push(`DTEND:${day}T${p2(endH % 24)}${p2(endM)}00`); }
        else { const start = new Date(`${ev.date}T00:00:00`); const end = new Date(start.getTime() + 24 * 60 * 60 * 1000); const ymd = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`; lines.push(`DTSTART;VALUE=DATE:${ymd(start)}`, `DTEND;VALUE=DATE:${ymd(end)}`); }
        lines.push(`SUMMARY:${esc(ev.title)}`, `LOCATION:${esc(ev.location)}`);
        const desc = [ev.description, `Time: ${ev.timeText}`, `Register with ${org.name} in Approved Guest (event ${ev.id}).`].filter(Boolean).join("\n");
        lines.push(`DESCRIPTION:${esc(desc)}`, "END:VEVENT");
      }
      lines.push("END:VCALENDAR");
      return { ics: `${lines.join("\r\n")}\r\n`, eventCount: published.length, feedPath: `?feed=ical&org=${args.orgId}` };
    },
  }),

  /* ---------- Custom registration questions ---------- */


  listQuestionLibrary: defineAction({
    description: "The organization's reusable question library: every question ever used (organization-wide or on any event), deduplicated by wording + type + options, with how often it was used. Admins pick from it with one tap when building a new event instead of retyping. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ questions: z.array(z.object({ label: z.string(), helpText: z.string(), type: questionTypeEnum, options: z.array(z.string()), required: z.boolean(), timesUsed: z.number(), lastUsedAt: z.string(), exampleEventTitle: z.string().nullable() })) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ q: schema.customQuestions, ev: schema.events }).from(schema.customQuestions).leftJoin(schema.events, eq(schema.customQuestions.eventId, schema.events.id)).where(eq(schema.customQuestions.orgId, args.orgId)).orderBy(asc(schema.customQuestions.id));
      const byKey = new Map<string, { label: string; helpText: string; type: z.infer<typeof questionTypeEnum>; options: string[]; required: boolean; timesUsed: number; lastUsedAt: string; exampleEventTitle: string | null }>();
      for (const { q, ev } of rows) {
        let options: string[] = [];
        try { const parsed: unknown = JSON.parse(q.options || "[]"); if (Array.isArray(parsed)) options = parsed.filter((o): o is string => typeof o === "string"); } catch { options = []; }
        const key = `${q.label.trim().toLowerCase()}|${q.type}|${options.join("~")}`;
        const hit = byKey.get(key);
        if (hit) { hit.timesUsed += 1; if (q.createdAt.toISOString() > hit.lastUsedAt) hit.lastUsedAt = q.createdAt.toISOString(); if (!hit.exampleEventTitle && ev) hit.exampleEventTitle = ev.title; }
        else byKey.set(key, { label: q.label, helpText: q.helpText, type: q.type as z.infer<typeof questionTypeEnum>, options, required: q.required === 1, timesUsed: 1, lastUsedAt: q.createdAt.toISOString(), exampleEventTitle: ev?.title ?? null });
      }
      return { questions: [...byKey.values()].sort((a, b) => b.timesUsed - a.timesUsed || b.lastUsedAt.localeCompare(a.lastUsedAt) || a.label.localeCompare(b.label)) };
    },
  }),

  listQuestions: defineAction({
    description: "Returns the registration questions that apply: for an event, its own questions when it has any, otherwise the organization's defaults. Public — the registration form renders from this.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive().optional() }),
    response: z.object({ questions: z.array(questionShape), scope: z.enum(["event", "organization"]) }),
    async handler(ctx, args) {
      if (args.eventId) {
        const ev = await getEventRow(ctx, args.eventId);
        if (!ev || ev.orgId !== args.orgId) return { questions: [], scope: "organization" as const };
        const db = ctx.db<typeof schema>();
        const own = await db.select().from(schema.customQuestions).where(and(eq(schema.customQuestions.orgId, args.orgId), eq(schema.customQuestions.eventId, ev.id))).orderBy(asc(schema.customQuestions.sortOrder), asc(schema.customQuestions.id));
        if (own.length > 0) return { questions: own.map(toQuestion), scope: "event" as const };
      }
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.customQuestions).where(and(eq(schema.customQuestions.orgId, args.orgId), isNull(schema.customQuestions.eventId))).orderBy(asc(schema.customQuestions.sortOrder), asc(schema.customQuestions.id));
      return { questions: rows.map(toQuestion), scope: "organization" as const };
    },
  }),

  listAllQuestions: defineAction({
    description: "Lists every question in an organization — the organization defaults plus each event's overrides — for the admin question manager. Admin only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ questions: z.array(questionShape) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.customQuestions).where(eq(schema.customQuestions.orgId, args.orgId)).orderBy(asc(schema.customQuestions.sortOrder), asc(schema.customQuestions.id));
      return { questions: rows.map(toQuestion) };
    },
  }),

  createQuestion: defineAction({
    description: "Adds a registration question to an organization (eventId null) or to one event's override set. Admin of the organization only; the event must belong to the organization.",
    request: z.object({
      orgId: z.number().int().positive(), eventId: z.number().int().positive().nullable().default(null),
      label: z.string().min(1).max(300), helpText: z.string().max(300).default(""),
      type: z.enum(["text", "choice", "yesno", "radio", "checkboxes"]), options: z.array(z.string().max(120)).max(30).default([]), required: z.boolean().default(true),
      ...requesterArgs,
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      if (args.eventId) {
        const ev = await getEventRow(ctx, args.eventId);
        if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      }
      if (args.type === "choice" && args.options.map((o) => o.trim()).filter(Boolean).length < 2) throw new Error("A single-choice question needs at least two choices.");
      const siblings = await db.select({ sortOrder: schema.customQuestions.sortOrder }).from(schema.customQuestions)
        .where(args.eventId
          ? and(eq(schema.customQuestions.orgId, args.orgId), eq(schema.customQuestions.eventId, args.eventId))
          : and(eq(schema.customQuestions.orgId, args.orgId), isNull(schema.customQuestions.eventId)));
      const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.sortOrder)) + 1 : 0;
      const result = await db.insert(schema.customQuestions).values({
        orgId: args.orgId, eventId: args.eventId, label: args.label.trim(), helpText: args.helpText.trim(), type: args.type,
        options: JSON.stringify(args.options.map((o) => o.trim()).filter(Boolean)), required: args.required ? 1 : 0, sortOrder: nextOrder, legacyKey: "",
      }).returning({ id: schema.customQuestions.id });
      const inserted = result[0];
      if (!inserted) throw new Error("Could not add the question.");
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  updateQuestion: defineAction({
    description: "Edits a registration question's label, help text, type, choices, and required flag. Admin of the owning organization only.",
    request: z.object({
      id: z.number().int().positive(), orgId: z.number().int().positive(),
      label: z.string().min(1).max(300), helpText: z.string().max(300).default(""),
      type: z.enum(["text", "choice", "yesno", "radio", "checkboxes"]), options: z.array(z.string().max(120)).max(30).default([]), required: z.boolean().default(true),
      ...requesterArgs,
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      if (args.type === "choice" && args.options.map((o) => o.trim()).filter(Boolean).length < 2) throw new Error("A single-choice question needs at least two choices.");
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.customQuestions).where(and(eq(schema.customQuestions.id, args.id), eq(schema.customQuestions.orgId, args.orgId))).limit(1);
      if (!rows[0]) throw new Error("Question not found in this organization.");
      await db.update(schema.customQuestions).set({
        label: args.label.trim(), helpText: args.helpText.trim(), type: args.type,
        options: JSON.stringify(args.options.map((o) => o.trim()).filter(Boolean)), required: args.required ? 1 : 0,
      }).where(eq(schema.customQuestions.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  deleteQuestion: defineAction({
    description: "Removes a registration question. Answers already collected keep their label/answer snapshot on each registration. Admin of the owning organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.customQuestions).where(and(eq(schema.customQuestions.id, args.id), eq(schema.customQuestions.orgId, args.orgId)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  moveQuestion: defineAction({
    description: "Moves a registration question up or down within its set (organization defaults or one event's overrides). Admin of the owning organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive(), direction: z.enum(["up", "down"]), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.customQuestions).where(eq(schema.customQuestions.id, args.id)).limit(1);
      const q = rows[0];
      if (!q || q.orgId !== args.orgId) throw new Error("Question not found in this organization.");
      const siblings = await db.select().from(schema.customQuestions)
        .where(q.eventId
          ? and(eq(schema.customQuestions.orgId, args.orgId), eq(schema.customQuestions.eventId, q.eventId))
          : and(eq(schema.customQuestions.orgId, args.orgId), isNull(schema.customQuestions.eventId)))
        .orderBy(asc(schema.customQuestions.sortOrder), asc(schema.customQuestions.id));
      const idx = siblings.findIndex((s) => s.id === q.id);
      const swapIdx = args.direction === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return { ok: true };
      const other = siblings[swapIdx]!;
      await db.update(schema.customQuestions).set({ sortOrder: other.sortOrder }).where(eq(schema.customQuestions.id, q.id));
      await db.update(schema.customQuestions).set({ sortOrder: q.sortOrder }).where(eq(schema.customQuestions.id, other.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  /* ---------- Events (tenant-scoped) ---------- */

  listEvents: defineAction({
    description: "Lists one organization's events, soonest first. Public callers see published events only; an administrator of the organization can pass includeAll to also see drafts and cancelled events (for the admin calendar). Events from other organizations are never included.",
    request: z.object({ orgId: z.number().int().positive().default(1), includeAll: z.boolean().default(false), ...requesterArgs }),
    response: z.object({ events: z.array(eventShape) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.events).where(eq(schema.events.orgId, args.orgId)).orderBy(asc(schema.events.date), asc(schema.events.id));
      const showAll = args.includeAll && (await isAuthorizedAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail));
      // Hidden events are admin-only here: they never appear on the
      // public calendar — the direct event link (getEventForLink) is
      // the only attendee way in.
      // Private events join the public list only for people who have
      // attended this organization before (signed-in identity).
      let pastAttendee = false;
      if (!showAll) {
        const viewerHash = args.requestedByEmail ? await emailIndex(ctx, args.requestedByEmail) : null;
        pastAttendee = await isPastAttendee(ctx, args.orgId, viewerHash, args.requestedByGoogleId);
      }
      const visible = rows.filter((r) => {
        if (r.deletedAt) return false; // soft-deleted: hidden from admin + public calendars alike; lives in Deleted events
        if (showAll) return true;
        if ((r.status ?? "published") !== "published") return false;
        const v = r.visibility ?? "public";
        return v === "public" || (v === "private" && pastAttendee);
      });
      const out = [];
      for (const r of visible) {
        const seats = await eventSeatsTaken(ctx, r.id);
        const wl = (await db.select({ id: schema.registrations.id }).from(schema.registrations).where(and(eq(schema.registrations.eventId, r.id), eq(schema.registrations.status, "waitlisted")))).length;
        out.push(toEvent(r, { seatsTaken: seats, waitlistCount: wl }));
      }
      return { events: out };
    },
  }),

  getEventForLink: defineAction({
    description: "Fetches ONE event by its direct link (org id + event id) — the way attendees reach a HIDDEN event, which never appears on the public calendar, in search, or in the calendar feed. Possession of the link is the access: published events (public or hidden) are returned; drafts are not (admins use listEvents with includeAll). Registration through the link then works exactly like any other event.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), email: z.string().max(200).optional(), googleId: z.string().max(200).optional(), inviteToken: z.string().max(100).optional() }),
    response: z.object({ event: eventShape.nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId || (ev.status ?? "published") === "draft") return { event: null };
      // PRIVATE events: the bare link is not enough — the visitor must
      // be a past attendee of the organization or hold the invite link.
      if ((ev.visibility ?? "public") === "private") {
        const hash = args.email ? await emailIndex(ctx, args.email) : null;
        if (!(await canAccessPrivateEvent(ctx, ev, hash, args.googleId, args.inviteToken))) return { event: null };
      }
      const seats = await eventSeatsTaken(ctx, ev.id);
      const wl = (await db.select({ id: schema.registrations.id }).from(schema.registrations).where(and(eq(schema.registrations.eventId, ev.id), eq(schema.registrations.status, "waitlisted")))).length;
      return { event: toEvent(ev, { seatsTaken: seats, waitlistCount: wl }) };
    },
  }),

  /* ---------- Private-event invite links ---------- */

  setEventInviteLink: defineAction({
    description: "Generates (or regenerates — invalidating the previous link) or revokes an event's invite link token. Anyone holding the invite link can view and register for a PRIVATE event without being a past attendee; revoking cuts that off immediately. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), mode: z.enum(["generate", "revoke"]), ...identityArgs }),
    response: z.object({ ok: z.literal(true), inviteToken: z.string().nullable() }),
    async handler(ctx, args): Promise<{ ok: true; inviteToken: string | null }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      const token = args.mode === "generate" ? newInviteToken() : null;
      await db.update(schema.events).set({ inviteToken: token }).where(eq(schema.events.id, args.eventId));
      ctx.invalidateQueries();
      return { ok: true, inviteToken: token };
    },
  }),

  getEventInviteLink: defineAction({
    description: "Returns an event's current invite-link token (admin only — the token is a credential and is never exposed in public event data), so the admin UI can display the full invite URL.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ inviteToken: z.string().nullable() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      return { inviteToken: ev.inviteToken ?? null };
    },
  }),

  /* ---------- Invitation template (per event) ---------- */

  updateEventInvitation: defineAction({
    description: "Saves an event's invitation template — the subject and message the organization writes for its invitations (CSV invitations and invite sends). Placeholders {name} {event} {date} {time} {location} {org} {link} insert the details automatically at send time; blank fields fall back to the built-in defaults. Admin only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), subject: z.string().max(300), body: z.string().max(4000), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      await db.update(schema.events).set({ inviteSubject: args.subject.trim(), inviteBody: args.body.trim() }).where(eq(schema.events.id, args.eventId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  previewEventInvitation: defineAction({
    description: "Renders an event's invitation exactly as a recipient would receive it — template (or the submitted subject/body) with the event's details and the registration link inserted, for a sample recipient name — plus the From label the mail will carry (the event's/org's authorized sender, or Approved Guest). Admin only; sends nothing.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), subject: z.string().max(300).optional(), body: z.string().max(4000).optional(), sampleName: z.string().max(120).default("Alex"), registrationBaseUrl: z.string().max(500), ...requesterArgs }),
    response: z.object({ subject: z.string(), body: z.string(), fromLabel: z.string(), link: z.string() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      const org = await getOrgRow(ctx, args.orgId);
      const token = ev.inviteToken ?? null;
      const link = `${args.registrationBaseUrl}?org=${args.orgId}&event=${args.eventId}${token ? `&invite=${token}` : ""}`;
      const vars = { name: args.sampleName.trim() || "Alex", event: ev.title, date: ev.date, time: ev.timeText, location: (ev.locationType ?? "physical") === "virtual" ? "Online" : ev.location, org: org?.name ?? "", link };
      const subjectTpl = (args.subject ?? ev.inviteSubject ?? "").trim() || DEFAULT_INVITE_SUBJECT;
      const bodyTpl = (args.body ?? ev.inviteBody ?? "").trim() || DEFAULT_INVITE_BODY;
      const sender = await resolveSender(ctx, args.orgId);
      return { subject: renderInviteText(subjectTpl, vars), body: `${renderInviteText(bodyTpl, vars)}\n\n— From: ${sender.fromLabel}`, fromLabel: sender.fromLabel, link };
    },
  }),

  /* ---------- CSV invitations ---------- */

  checkInvitationList: defineAction({
    description: "Validates an uploaded invitation list for one event WITHOUT sending anything: each row is flagged ready, duplicate in the file, already invited, already registered (with their status), bad email address, or missing name — the preview the admin reviews before sending. Admin only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), rows: z.array(z.object({ name: z.string().max(200), email: z.string().max(300), phone: z.string().max(60).optional() })).max(500), ...requesterArgs }),
    response: z.object({ rows: z.array(z.object({ name: z.string(), email: z.string(), phone: z.string(), status: z.enum(["ok", "bad_email", "missing_name", "duplicate_in_file", "already_invited", "already_registered"]), detail: z.string() })), sendable: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      const checked = await validateInvitationRows(ctx, args.eventId, args.rows);
      return { rows: checked.map(({ hash, ...rest }) => rest), sendable: checked.filter((r) => r.status === "ok").length };
    },
  }),

  sendCsvInvitations: defineAction({
    description: "Sends event invitations to the valid rows of an uploaded list (re-validated at send time — duplicates, bad addresses, already-invited, and already-registered people are skipped and reported). Each invitation is rendered from the event's invitation template with the event's details and the registration link inserted; for a PRIVATE event the link carries the invite token (one is generated automatically if the event has none, so invitees can register). The rendered subject/message and the From label (authorized sender or Approved Guest) are recorded per recipient. Returns who was invited and who was skipped, with reasons. Admin only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), rows: z.array(z.object({ name: z.string().max(200), email: z.string().max(300), phone: z.string().max(60).optional() })).max(500), registrationBaseUrl: z.string().max(500), subject: z.string().max(300).optional(), body: z.string().max(4000).optional(), ...identityArgs }),
    response: z.object({ invited: z.array(z.object({ name: z.string(), email: z.string() })), skipped: z.array(z.object({ email: z.string(), reason: z.string() })), autoCreatedInviteLink: z.boolean(), fromLabel: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      const org = await getOrgRow(ctx, args.orgId);
      // Editor content, when supplied, becomes the event's template.
      if (args.subject !== undefined || args.body !== undefined) {
        await db.update(schema.events).set({ inviteSubject: (args.subject ?? ev.inviteSubject ?? "").trim(), inviteBody: (args.body ?? ev.inviteBody ?? "").trim() }).where(eq(schema.events.id, args.eventId));
        ev.inviteSubject = (args.subject ?? ev.inviteSubject ?? "").trim();
        ev.inviteBody = (args.body ?? ev.inviteBody ?? "").trim();
      }
      // A private event's invitations must carry the invite link —
      // create one if the event doesn't have one yet.
      let autoCreatedInviteLink = false;
      if ((ev.visibility ?? "public") === "private" && !ev.inviteToken) {
        const token = newInviteToken();
        await db.update(schema.events).set({ inviteToken: token }).where(eq(schema.events.id, args.eventId));
        ev.inviteToken = token;
        autoCreatedInviteLink = true;
      }
      const sender = await resolveSender(ctx, args.orgId);
      const subjectTpl = (ev.inviteSubject ?? "").trim() || DEFAULT_INVITE_SUBJECT;
      const bodyTpl = (ev.inviteBody ?? "").trim() || DEFAULT_INVITE_BODY;
      const checked = await validateInvitationRows(ctx, args.eventId, args.rows);
      const invited: Array<{ name: string; email: string }> = [];
      const skipped: Array<{ email: string; reason: string }> = [];
      for (const row of checked) {
        if (row.status !== "ok" || !row.hash) { skipped.push({ email: row.email, reason: row.detail }); continue; }
        const link = `${args.registrationBaseUrl}?org=${args.orgId}&event=${args.eventId}${ev.inviteToken ? `&invite=${ev.inviteToken}` : ""}`;
        const vars = { name: row.name, event: ev.title, date: ev.date, time: ev.timeText, location: (ev.locationType ?? "physical") === "virtual" ? "Online" : ev.location, org: org?.name ?? "", link };
        const subject = renderInviteText(subjectTpl, vars);
        const message = `${renderInviteText(bodyTpl, vars)}\n\n— From: ${sender.fromLabel}`;
        const enc = await encryptFields(ctx, [row.email]);
        await db.insert(schema.eventInvitations).values({ orgId: args.orgId, eventId: args.eventId, name: row.name, email: enc[0]!, emailHash: row.hash, phone: row.phone, subject, message, createdBy: args.adminEmail ?? "", fromLabel: sender.fromLabel, createdAt: Date.now() });
        invited.push({ name: row.name, email: row.email });
      }
      ctx.invalidateQueries();
      return { invited, skipped, autoCreatedInviteLink, fromLabel: sender.fromLabel };
    },
  }),

  listEventInvitations: defineAction({
    description: "The invitation report for one event: everyone who has been invited, when, the From label their invitation carried, and whether they have since registered (and their registration status). Admin only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ invitations: z.array(z.object({ id: z.number(), name: z.string(), email: z.string(), phone: z.string(), invitedAt: z.string(), registered: z.boolean(), registrationStatus: z.string().nullable(), fromLabel: z.string() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      const rows = await db.select().from(schema.eventInvitations).where(eq(schema.eventInvitations.eventId, args.eventId)).orderBy(asc(schema.eventInvitations.id));
      const regs = await db.select({ emailHash: schema.registrations.emailHash, status: schema.registrations.status }).from(schema.registrations).where(eq(schema.registrations.eventId, args.eventId));
      const regByHash = new Map(regs.filter((r) => r.emailHash).map((r) => [r.emailHash!, r.status]));
      const dec = await decryptFields(ctx, rows.map((r) => r.email));
      return { invitations: rows.map((r, i) => ({ id: r.id, name: r.name, email: dec[i] ?? "", phone: r.phone, invitedAt: new Date(r.createdAt).toISOString(), registered: !!r.emailHash && regByHash.has(r.emailHash), registrationStatus: r.emailHash ? (regByHash.get(r.emailHash) ?? null) : null, fromLabel: r.fromLabel })) };
    },
  }),

  /* ---------- Send-as authorized senders ---------- */

  listOrgSenders: defineAction({
    description: "Lists an organization's send-as sender addresses with their authorization status (pending confirmation or verified), and the organization's current default sender. Admin only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ senders: z.array(z.object({ id: z.number(), email: z.string(), displayName: z.string(), status: z.enum(["pending", "verified"]), createdAt: z.string(), verifiedAt: z.string().nullable() })), defaultSenderId: z.number().nullable(), fromLabel: z.string() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const org = await getOrgRow(ctx, args.orgId);
      const rows = await db.select().from(schema.orgSenders).where(eq(schema.orgSenders.orgId, args.orgId)).orderBy(asc(schema.orgSenders.id));
      const sender = await resolveSender(ctx, args.orgId);
      return { senders: rows.map((r) => ({ id: r.id, email: r.email, displayName: r.displayName, status: r.status, createdAt: new Date(r.createdAt).toISOString(), verifiedAt: r.verifiedAt ? new Date(r.verifiedAt).toISOString() : null })), defaultSenderId: org?.defaultSenderId ?? null, fromLabel: sender.fromLabel };
    },
  }),

  addOrgSender: defineAction({
    description: "Adds a send-as sender address for an organization in PENDING state and issues its confirmation token: a confirmation email goes to that address (composed and logged in this prototype; the confirmation link is returned so the admin can also pass it along), and only when the person confirms does the address become an authorized, usable sender. This verified-authorization step is what lets mail go out under a registrar's or staff member's own address. Admin only.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().email().max(200), displayName: z.string().max(120).default(""), ...identityArgs }),
    response: z.object({ ok: z.literal(true), senderId: z.number(), confirmToken: z.string(), expiresAt: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; senderId: number; confirmToken: string; expiresAt: string }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const email = args.email.trim().toLowerCase();
      const existing = (await db.select().from(schema.orgSenders).where(eq(schema.orgSenders.orgId, args.orgId))).find((r) => r.email === email);
      if (existing) throw new Error(existing.status === "verified" ? "That address is already an authorized sender for this organization." : "That address is already waiting for confirmation — ask them to use the confirmation link sent to them, or remove it and add it again.");
      const token = makeApprovalToken();
      const expires = new Date(Date.now() + 7 * 86400000);
      const [inserted] = await db.insert(schema.orgSenders).values({ orgId: args.orgId, email, displayName: args.displayName.trim(), status: "pending", token, tokenExpiresAt: expires, createdBy: args.adminEmail ?? "", createdAt: Date.now() }).returning({ id: schema.orgSenders.id });
      ctx.invalidateQueries();
      return { ok: true, senderId: inserted?.id ?? 0, confirmToken: token, expiresAt: expires.toISOString() };
    },
  }),

  confirmOrgSender: defineAction({
    description: "The confirmation link a prospective sender clicks in their email: authorizes the app to send mail as their address for that organization. Reports verified / already verified / expired / invalid — a pending authorization can never be used until this succeeds.",
    request: z.object({ token: z.string().min(8).max(200) }),
    response: z.object({ outcome: z.enum(["verified", "already_verified", "expired", "invalid"]), orgName: z.string(), email: z.string() }),
    async handler(ctx, args): Promise<{ outcome: "verified" | "already_verified" | "expired" | "invalid"; orgName: string; email: string }> {
      const db = ctx.db<typeof schema>();
      const row = (await db.select().from(schema.orgSenders).where(eq(schema.orgSenders.token, args.token))).filter((r) => r.token && r.token === args.token)[0];
      if (!row) return { outcome: "invalid", orgName: "", email: "" };
      const org = await getOrgRow(ctx, row.orgId);
      const orgName = org?.name ?? "the organization";
      if (row.status === "verified") return { outcome: "already_verified", orgName, email: row.email };
      if (row.tokenExpiresAt && new Date(row.tokenExpiresAt).getTime() < Date.now()) return { outcome: "expired", orgName, email: row.email };
      await db.update(schema.orgSenders).set({ status: "verified", verifiedAt: new Date() }).where(eq(schema.orgSenders.id, row.id));
      ctx.invalidateQueries();
      return { outcome: "verified", orgName, email: row.email };
    },
  }),

  removeOrgSender: defineAction({
    description: "Removes a send-as sender address (pending or verified). If it was the organization's authorized sender, mail for all events falls back to Approved Guest. Admin only.",
    request: z.object({ orgId: z.number().int().positive(), senderId: z.number().int().positive(), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const row = (await db.select().from(schema.orgSenders).where(eq(schema.orgSenders.id, args.senderId)))[0];
      if (!row || row.orgId !== args.orgId) throw new Error("That sender belongs to a different organization.");
      const org = await getOrgRow(ctx, args.orgId);
      if (org?.defaultSenderId === args.senderId) await db.update(schema.organizations).set({ defaultSenderId: null }).where(eq(schema.organizations.id, args.orgId));
      await db.update(schema.events).set({ senderId: null }).where(and(eq(schema.events.orgId, args.orgId), eq(schema.events.senderId, args.senderId)));
      await db.delete(schema.orgSenders).where(eq(schema.orgSenders.id, args.senderId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  setOrgDefaultSender: defineAction({
    description: "Chooses the organization's authorized sender: a VERIFIED sender address, or null for Approved Guest. Set once per organization, it applies to ALL of the organization's events — there is no per-event sender. Admin only.",
    request: z.object({ orgId: z.number().int().positive(), senderId: z.number().int().positive().nullable(), ...identityArgs }),
    response: z.object({ ok: z.literal(true), fromLabel: z.string() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      if (args.senderId !== null) {
        const row = (await db.select().from(schema.orgSenders).where(eq(schema.orgSenders.id, args.senderId)))[0];
        if (!row || row.orgId !== args.orgId) throw new Error("That sender belongs to a different organization.");
        if (row.status !== "verified") throw new Error("That address hasn't confirmed yet — only a verified sender can be used. Ask them to click the confirmation link in their email first.");
      }
      await db.update(schema.organizations).set({ defaultSenderId: args.senderId }).where(eq(schema.organizations.id, args.orgId));
      ctx.invalidateQueries();
      const sender = await resolveSender(ctx, args.orgId);
      return { ok: true as const, fromLabel: sender.fromLabel };
    },
  }),

  /* ---------- Cross-organization event sharing (hosting) ----------
     The HOST org shares ONE event with a FACILITY org and grants it
     specific roles for that event: view attendees, view check-in
     status, approver (facility admins decide registrations), greeter
     (facility greeters check guests in). The facility is an extension
     of the host for those roles only; the event counts toward the
     HOST's plan. The host can change grants or revoke at any time. */
  shareEventWithOrganization: defineAction({
    description: "Host organization shares one of its events with a facility organization, granting the facility specific roles for that event: view the attendee list, view check-in status, approve registrations (facility admins), and/or greeter check-in (facility greeters). Event details are always shared. Re-sharing to the same facility updates the grants and un-revokes the share. Host admin only; the event keeps counting toward the HOST's plan allowance.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), facilityOrgId: z.number().int().positive(), shareAttendees: z.boolean().default(false), shareCheckins: z.boolean().default(false), grantApprover: z.boolean().default(false), grantGreeter: z.boolean().default(false), ...identityArgs }),
    response: z.object({ ok: z.literal(true), shareId: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; shareId: number }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertAdvancedAllowed(ctx, args.orgId, "Cross-organization hosting");
      if (args.facilityOrgId === args.orgId) throw new Error("That's your own organization — pick the facility organization hosting you.");
      const db = ctx.db<typeof schema>();
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      const facility = await getOrgRow(ctx, args.facilityOrgId);
      if (!facility) throw new Error("That facility organization doesn't exist.");
      const grants = { shareAttendees: args.shareAttendees ? 1 : 0, shareCheckins: args.shareCheckins ? 1 : 0, grantApprover: args.grantApprover ? 1 : 0, grantGreeter: args.grantGreeter ? 1 : 0 };
      const existing = (await db.select().from(schema.eventShares).where(and(eq(schema.eventShares.hostOrgId, args.orgId), eq(schema.eventShares.eventId, args.eventId), eq(schema.eventShares.facilityOrgId, args.facilityOrgId))))[0];
      if (existing) {
        await db.update(schema.eventShares).set({ ...grants, revokedAt: null }).where(eq(schema.eventShares.id, existing.id));
        ctx.invalidateQueries();
        return { ok: true, shareId: existing.id };
      }
      const [inserted] = await db.insert(schema.eventShares).values({ hostOrgId: args.orgId, eventId: args.eventId, facilityOrgId: args.facilityOrgId, ...grants, createdByEmail: (args.adminEmail ?? "").toLowerCase() }).returning({ id: schema.eventShares.id });
      ctx.invalidateQueries();
      return { ok: true, shareId: inserted?.id ?? 0 };
    },
  }),

  revokeEventShare: defineAction({
    description: "Host organization revokes a cross-organization event share: the facility immediately loses the shared details and every granted role for that event. Host admin only.",
    request: z.object({ orgId: z.number().int().positive(), shareId: z.number().int().positive(), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const share = (await db.select().from(schema.eventShares).where(eq(schema.eventShares.id, args.shareId)))[0];
      if (!share || share.hostOrgId !== args.orgId) throw new Error("That share belongs to a different organization.");
      await db.update(schema.eventShares).set({ revokedAt: new Date() }).where(eq(schema.eventShares.id, args.shareId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listEventShares: defineAction({
    description: "Lists an organization's outgoing event shares (host view): which facility each event is shared with and the roles granted. Host admin only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ shares: z.array(z.object({ id: z.number(), eventId: z.number(), eventTitle: z.string(), facilityOrgId: z.number(), facilityOrgName: z.string(), shareAttendees: z.boolean(), shareCheckins: z.boolean(), grantApprover: z.boolean(), grantGreeter: z.boolean(), active: z.boolean(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventShares).where(eq(schema.eventShares.hostOrgId, args.orgId)).orderBy(asc(schema.eventShares.id));
      const out = [];
      for (const s of rows) {
        const ev = await getEventRow(ctx, s.eventId);
        const fac = await getOrgRow(ctx, s.facilityOrgId);
        out.push({ id: s.id, eventId: s.eventId, eventTitle: ev?.title ?? "(event removed)", facilityOrgId: s.facilityOrgId, facilityOrgName: fac?.name ?? "(organization removed)", shareAttendees: s.shareAttendees === 1, shareCheckins: s.shareCheckins === 1, grantApprover: s.grantApprover === 1, grantGreeter: s.grantGreeter === 1, active: !s.revokedAt, createdAt: s.createdAt ? s.createdAt.toISOString() : "" });
      }
      return { shares: out };
    },
  }),

  listSharedEventsForOrg: defineAction({
    description: "Facility view: the events OTHER organizations have shared with this organization, with exactly what the host granted — event details always; the attendee list only when share_attendees was granted (names/emails decrypted); check-in status only when check-in sharing was granted (otherwise only counts it may see are withheld — attendee rows carry status only under the check-in grant); approver/greeter grants flagged so the facility UI can offer those tools. Caller must be a member (owner/admin/greeter/registrant) of the facility organization. Revoked shares disappear. The host's other events and data are never included.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ shared: z.array(z.object({
      shareId: z.number(), hostOrgId: z.number(), hostOrgName: z.string(),
      event: eventShape,
      expectedAttendance: z.number(),
      shareAttendees: z.boolean(), shareCheckins: z.boolean(), grantApprover: z.boolean(), grantGreeter: z.boolean(),
      canDecide: z.boolean(),
      attendees: z.array(z.object({ id: z.number(), name: z.string(), email: z.string(), status: statusEnum })),
    })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const gid = args.requestedByGoogleId; const email = args.requestedByEmail;
      const isMember = (await isAuthorizedAdmin(ctx, args.orgId, gid, email)) || (await isAuthorizedGatekeeper(ctx, args.orgId, gid, email)) || (await isAuthorizedRegistrant(ctx, args.orgId, gid, email));
      if (!isMember) throw new Error("Only members of this organization can see events shared with it.");
      const callerIsFacilityAdmin = await isAuthorizedAdmin(ctx, args.orgId, gid, email);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventShares).where(and(eq(schema.eventShares.facilityOrgId, args.orgId), isNull(schema.eventShares.revokedAt))).orderBy(asc(schema.eventShares.id));
      const out = [];
      for (const s of rows) {
        const ev = await getEventRow(ctx, s.eventId);
        if (!ev) continue;
        const host = await getOrgRow(ctx, s.hostOrgId);
        const seats = await eventSeatsTaken(ctx, ev.id);
        const wl = (await db.select({ id: schema.registrations.id }).from(schema.registrations).where(and(eq(schema.registrations.eventId, ev.id), eq(schema.registrations.status, "waitlisted")))).length;
        let attendees: Array<{ id: number; name: string; email: string; status: z.infer<typeof statusEnum> }> = [];
        if (s.shareAttendees === 1) {
          const regs = await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, ev.id)).orderBy(asc(schema.registrations.id));
          const plain = await decryptRegs(ctx, regs);
          attendees = regs.filter((r) => r.held !== 1).map((r) => ({ id: r.id, name: plain.get(r.id)?.name ?? "", email: plain.get(r.id)?.email ?? "", status: (s.shareCheckins === 1 || s.grantApprover === 1 ? r.status : "approved") as z.infer<typeof statusEnum> }));
          // Without the check-in grant, statuses are masked to the
          // confirmed list only (pending/denied rows are excluded).
          if (s.shareCheckins !== 1 && s.grantApprover !== 1) attendees = attendees.filter((a) => a.status === "approved" || a.status === "checked_in");
        }
        out.push({ shareId: s.id, hostOrgId: s.hostOrgId, hostOrgName: host?.name ?? "Another organization", event: toEvent(ev, { seatsTaken: seats, waitlistCount: wl }), expectedAttendance: seats, shareAttendees: s.shareAttendees === 1, shareCheckins: s.shareCheckins === 1, grantApprover: s.grantApprover === 1, grantGreeter: s.grantGreeter === 1, canDecide: s.grantApprover === 1 && callerIsFacilityAdmin, attendees });
      }
      return { shared: out };
    },
  }),

  facilityDecideRegistration: defineAction({
    description: "A facility organization's admin approves or denies a registration for a HOST organization's event, under an active approver grant on the share for that event. The decision is the host's decision (pass code issued from the host org, capacity and freeze rules of the host org apply, recorded as decided via the facility). Without an active grant — or for anyone who isn't a facility admin — this does nothing.",
    request: z.object({ facilityOrgId: z.number().int().positive(), registrationId: z.number().int().positive(), decision: z.enum(["approved", "denied"]), ...requesterArgs }),
    response: z.object({ id: z.number(), status: z.enum(["approved", "denied"]), code: z.string().nullable() }),
    async handler(ctx, args) {
      if (!(await isAuthorizedAdmin(ctx, args.facilityOrgId, args.requestedByGoogleId, args.requestedByEmail))) throw new Error("Only the facility organization's administrators can decide registrations under an approver grant.");
      const db = ctx.db<typeof schema>();
      const reg = (await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.registrationId)))[0];
      if (!reg) throw new Error("Registration not found.");
      if (reg.held === 1) throw new Error("That registration is held for moderation review by the host organization.");
      const ev = await getEventRow(ctx, reg.eventId);
      if (!ev) throw new Error("That event no longer exists.");
      const share = (await db.select().from(schema.eventShares).where(and(eq(schema.eventShares.eventId, ev.id), eq(schema.eventShares.facilityOrgId, args.facilityOrgId), eq(schema.eventShares.grantApprover, 1), isNull(schema.eventShares.revokedAt))))[0];
      if (!share) throw new Error("The host organization hasn't granted your organization the approver role for this event (or the share was revoked).");
      const host = await getOrgRow(ctx, ev.orgId);
      if (args.decision === "approved" && freezeState(host).frozen) throw new Error("The host organization's account is frozen (payment issue), so approvals are paused.");
      if (args.decision === "approved" && ev.capacity !== null && ev.capacity !== undefined && reg.status !== "approved" && reg.status !== "checked_in") {
        const taken = await eventSeatsTaken(ctx, ev.id, reg.id);
        if (taken >= ev.capacity) throw new Error(`“${ev.title}” is full (${ev.capacity} confirmed) — confirming this registration would overbook it.`);
      }
      const facility = await getOrgRow(ctx, args.facilityOrgId);
      const { code } = await applyApprovalDecision(ctx, reg, args.decision, `Facility approver · ${facility?.name ?? "facility organization"}`);
      if (args.decision === "denied") await promoteWaitlist(ctx, reg.eventId);
      ctx.invalidateQueries();
      return { id: args.registrationId, status: args.decision, code };
    },
  }),

  searchEvents: defineAction({
    description: "Attendee event search across ALL organizations: published events only, matched by keyword (title, description, location, organization name — every word must match), by location (substring of the event's location; 'virtual' or 'online' matches virtual events), and by date range (dateFrom / dateTo, YYYY-MM-DD). With no date range, only upcoming events are returned. When nearLat/nearLng are sent — only after the attendee chooses 'Current location' and grants permission — results are instead the physical events with a venue pin within radiusKm (default 40), sorted nearest first, each with distanceKm set; the coordinates are used for that search only and never stored. This powers the attendee side of the home page — attendees don't join an organization to use it.",
    request: z.object({
      keyword: z.string().max(200).default(""),
      location: z.string().max(200).default(""),
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      orgId: z.number().int().positive().optional(),
      viewerEmail: z.string().max(200).optional(),
      viewerGoogleId: z.string().max(200).optional(),
      nearLat: z.number().min(-90).max(90).optional(),
      nearLng: z.number().min(-180).max(180).optional(),
      radiusKm: z.number().min(1).max(500).optional(),
    }),
    response: z.object({ results: z.array(eventShape.extend({ orgName: z.string(), orgLogoUrl: z.string(), orgPrimaryColor: z.string(), distanceKm: z.number().nullable() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const orgs = await db.select().from(schema.organizations);
      const orgById = new Map(orgs.map((o) => [o.id, o]));
      let rows = await db.select().from(schema.events).orderBy(asc(schema.events.date), asc(schema.events.id));
      // Hidden events are never searchable — direct link only.
      // Private events are searchable only by that organization's
      // past attendees (viewer identity, when provided).
      rows = rows.filter((e) => !e.deletedAt && (e.status ?? "published") === "published" && ((e.visibility ?? "public") === "public" || (e.visibility ?? "public") === "private"));
      if (rows.some((e) => (e.visibility ?? "public") === "private")) {
        const viewerHash = args.viewerEmail ? await emailIndex(ctx, args.viewerEmail) : null;
        const privOrgIds = [...new Set(rows.filter((e) => (e.visibility ?? "public") === "private").map((e) => e.orgId))];
        const eligible = new Set<number>();
        for (const oid of privOrgIds) if (await isPastAttendee(ctx, oid, viewerHash, args.viewerGoogleId)) eligible.add(oid);
        rows = rows.filter((e) => (e.visibility ?? "public") !== "private" || eligible.has(e.orgId));
      }
      if (args.orgId) rows = rows.filter((e) => e.orgId === args.orgId);
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const from = args.dateFrom ?? today;
      rows = rows.filter((e) => e.date >= from);
      if (args.dateTo) rows = rows.filter((e) => e.date <= args.dateTo!);
      const locNeedle = args.location.trim().toLowerCase();
      if (locNeedle) {
        rows = rows.filter((e) => {
          const hay = `${e.location} ${(e.locationType ?? "physical") === "virtual" ? "virtual online" : ""}`.toLowerCase();
          return hay.includes(locNeedle);
        });
      }
      const words = args.keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        rows = rows.filter((e) => {
          const org = orgById.get(e.orgId);
          const hay = `${e.title} ${e.description} ${e.location} ${e.timeText} ${org?.name ?? ""}`.toLowerCase();
          return words.every((w) => hay.includes(w));
        });
      }
      // "Near me" search: the coordinates are present only when the
      // attendee chose Current location and allowed the permission —
      // they are used for this search and never stored. Only physical
      // events with a venue pin can be measured, so those are the
      // results, nearest first, each carrying its distance.
      const distById = new Map<number, number>();
      const nearLat = typeof args.nearLat === "number" ? args.nearLat : null;
      const nearLng = typeof args.nearLng === "number" ? args.nearLng : null;
      if (nearLat !== null && nearLng !== null) {
        const radiusKm = args.radiusKm ?? 40;
        rows = rows.filter((e) => {
          if ((e.locationType ?? "physical") === "virtual") return false;
          if (typeof e.venueLat !== "number" || typeof e.venueLng !== "number") return false;
          const dKm = haversineMeters(nearLat, nearLng, e.venueLat, e.venueLng) / 1000;
          if (dKm > radiusKm) return false;
          distById.set(e.id, Math.round(dKm * 10) / 10);
          return true;
        });
        rows.sort((a, b) => (distById.get(a.id) ?? 0) - (distById.get(b.id) ?? 0) || (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));
      }
      const out = [];
      for (const r of rows.slice(0, 60)) {
        const org = orgById.get(r.orgId);
        if (!org) continue;
        const seats = await eventSeatsTaken(ctx, r.id);
        const wl = (await db.select({ id: schema.registrations.id }).from(schema.registrations).where(and(eq(schema.registrations.eventId, r.id), eq(schema.registrations.status, "waitlisted")))).length;
        out.push({ ...toEvent(r, { seatsTaken: seats, waitlistCount: wl }), orgName: org.name, orgLogoUrl: org.logoUrl || "", orgPrimaryColor: org.primaryColor, distanceKm: distById.get(r.id) ?? null });
      }
      return { results: out };
    },
  }),

  /* ---------- Organization subscriptions (attendee new-event alerts) ---------- */

  subscribeToOrganization: defineAction({
    description: "Subscribes an attendee to an organization so they're notified when it posts new events. No account or membership needed — just an email address. The address is stored encrypted with a blind index; subscribing twice with the same address is a no-op that reports alreadySubscribed.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().email().max(200), name: z.string().max(120).default("") }),
    response: z.object({ ok: z.literal(true), alreadySubscribed: z.boolean(), subscriberCount: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; alreadySubscribed: boolean; subscriberCount: number }> {
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      const db = ctx.db<typeof schema>();
      const em = args.email.trim().toLowerCase();
      const hash = await emailIndex(ctx, em);
      const existing = await db.select({ id: schema.orgSubscriptions.id }).from(schema.orgSubscriptions).where(and(eq(schema.orgSubscriptions.orgId, args.orgId), eq(schema.orgSubscriptions.emailHash, hash))).limit(1);
      let already = false;
      if (existing[0]) {
        already = true;
      } else {
        const enc = await encryptFields(ctx, [em]);
        await db.insert(schema.orgSubscriptions).values({ orgId: args.orgId, email: enc[0]!, emailHash: hash, displayName: args.name.trim() }).onConflictDoNothing();
      }
      const count = (await db.select({ id: schema.orgSubscriptions.id }).from(schema.orgSubscriptions).where(eq(schema.orgSubscriptions.orgId, args.orgId))).length;
      ctx.invalidateQueries();
      return { ok: true, alreadySubscribed: already, subscriberCount: count };
    },
  }),

  unsubscribeFromOrganization: defineAction({
    description: "Removes an attendee's subscription to an organization — they stop receiving new-event notifications from it. Matched by the email blind index; reports whether a subscription existed.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().email().max(200) }),
    response: z.object({ ok: z.literal(true), wasSubscribed: z.boolean() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; wasSubscribed: boolean }> {
      const db = ctx.db<typeof schema>();
      const hash = await emailIndex(ctx, args.email.trim().toLowerCase());
      const existing = await db.select({ id: schema.orgSubscriptions.id }).from(schema.orgSubscriptions).where(and(eq(schema.orgSubscriptions.orgId, args.orgId), eq(schema.orgSubscriptions.emailHash, hash))).limit(1);
      if (existing[0]) await db.delete(schema.orgSubscriptions).where(eq(schema.orgSubscriptions.id, existing[0].id));
      ctx.invalidateQueries();
      return { ok: true, wasSubscribed: !!existing[0] };
    },
  }),

  getSubscriptionState: defineAction({
    description: "Reports whether an email address is subscribed to an organization, plus the organization's subscriber count — drives the Subscribe / Subscribed toggle attendees see. With no email, only the count is meaningful.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().max(200).optional() }),
    response: z.object({ subscribed: z.boolean(), subscriberCount: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const all = await db.select({ id: schema.orgSubscriptions.id, emailHash: schema.orgSubscriptions.emailHash }).from(schema.orgSubscriptions).where(eq(schema.orgSubscriptions.orgId, args.orgId));
      let subscribed = false;
      const em = args.email?.trim().toLowerCase();
      if (em && em.includes("@")) {
        const hash = await emailIndex(ctx, em);
        subscribed = all.some((r) => r.emailHash === hash);
      }
      return { subscribed, subscriberCount: all.length };
    },
  }),

  listOrgSubscribers: defineAction({
    description: "Lists an organization's subscribers (emails decrypted for display) — the attendees who get notified automatically when a new event is posted. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ subscribers: z.array(z.object({ id: z.number(), email: z.string(), displayName: z.string(), createdAt: z.string() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orgSubscriptions).where(eq(schema.orgSubscriptions.orgId, args.orgId)).orderBy(asc(schema.orgSubscriptions.id));
      const dec = await decryptFields(ctx, rows.map((r) => r.email));
      return { subscribers: rows.map((r, i) => ({ id: r.id, email: dec[i] ?? "", displayName: r.displayName, createdAt: r.createdAt.toISOString() })) };
    },
  }),

  getAnnouncementPreference: defineAction({
    description: "Reports an attendee's announcement opt-in choice for one organization (chosen at registration, changeable under Preferences). No recorded choice yet reads as opted in — the registration form presents the choice pre-checked.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().max(200) }),
    response: z.object({ optedIn: z.boolean(), hasChoice: z.boolean() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ optedIn: boolean; hasChoice: boolean }> {
      const em = args.email.trim().toLowerCase();
      if (!em.includes("@")) return { optedIn: true, hasChoice: false };
      const db = ctx.db<typeof schema>();
      const hash = await emailIndex(ctx, em);
      const row = (await db.select().from(schema.announcementOptins).where(and(eq(schema.announcementOptins.orgId, args.orgId), eq(schema.announcementOptins.emailHash, hash))).limit(1))[0];
      return { optedIn: row ? row.optedIn === 1 : true, hasChoice: !!row };
    },
  }),

  setAnnouncementPreference: defineAction({
    description: "Sets an attendee's announcement opt-in/out choice for one organization — the Preferences control. Unlike registration (which only records a first choice), this always updates the stored choice.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().email().max(200), name: z.string().max(120).default(""), optedIn: z.boolean() }),
    response: z.object({ ok: z.literal(true), optedIn: z.boolean() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; optedIn: boolean }> {
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      const db = ctx.db<typeof schema>();
      const em = args.email.trim().toLowerCase();
      const hash = await emailIndex(ctx, em);
      const existing = (await db.select().from(schema.announcementOptins).where(and(eq(schema.announcementOptins.orgId, args.orgId), eq(schema.announcementOptins.emailHash, hash))).limit(1))[0];
      if (existing) {
        await db.update(schema.announcementOptins).set({ optedIn: args.optedIn ? 1 : 0, updatedAt: Date.now() }).where(eq(schema.announcementOptins.id, existing.id));
      } else {
        const enc = await encryptFields(ctx, [em]);
        await db.insert(schema.announcementOptins).values({ orgId: args.orgId, email: enc[0]!, emailHash: hash, displayName: args.name.trim(), optedIn: args.optedIn ? 1 : 0, updatedAt: Date.now() });
      }
      ctx.invalidateQueries();
      return { ok: true, optedIn: args.optedIn };
    },
  }),

  getArrivalPopupDefault: defineAction({
    description: "Reports an attendee's standing answer to the arrival pop-up question for one organization — the answer they gave at a previous registration completion (or in My Events / Preferences), used to pre-fill the question at the bottom of the registration completion screen and as the starting proximity preference on new registrations. Also returns their standing radius choice (radiusM: 100/250/500/1000, or null = use each event's default radius). No recorded answer reads as enabled=false (the default is NO) with hasAnswer=false.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().max(200) }),
    response: z.object({ enabled: z.boolean(), hasAnswer: z.boolean(), radiusM: z.number().nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ enabled: boolean; hasAnswer: boolean; radiusM: number | null }> {
      const em = args.email.trim().toLowerCase();
      if (!em.includes("@")) return { enabled: false, hasAnswer: false, radiusM: null };
      const hash = await emailIndex(ctx, em);
      return arrivalAnswerFor(ctx, args.orgId, hash);
    },
  }),

  setArrivalPopupDefault: defineAction({
    description: "Records an attendee's answer to the arrival pop-up question as their standing default for one organization (answering at registration completion, or changing it later in Preferences). Always updates the stored answer. radiusM is the attendee's own notification radius — one of 100/250/500/1000 meters, or null to use each event's default radius; omitting it leaves any stored radius unchanged. This records the PREFERENCE only — it never requests location permission and never turns any pass's pop-up on by itself; the per-registration switch (setProximityPreference) is what the attendee's tap drives, after the browser's own location prompt.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().email().max(200), name: z.string().max(120).default(""), enabled: z.boolean(), radiusM: z.number().int().nullable().optional() }),
    response: z.object({ ok: z.literal(true), enabled: z.boolean(), radiusM: z.number().nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; enabled: boolean; radiusM: number | null }> {
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      await recordArrivalDefault(ctx, args.orgId, args.email, args.name, args.enabled, args.radiusM);
      const em = args.email.trim().toLowerCase();
      const hash = await emailIndex(ctx, em);
      const stored = await arrivalAnswerFor(ctx, args.orgId, hash);
      ctx.invalidateQueries();
      return { ok: true, enabled: args.enabled, radiusM: stored.radiusM };
    },
  }),

  getAnnouncementCenter: defineAction({
    description: "Everything the admin Announcements / group-management panel needs for one organization: its attendee groups (with member counts and member lists), every attendee (from registrations — name, email, announcement opt-in state, group memberships, and their own chosen delivery channel), and the announcement history. Membership audit details (when each person was added to a group and who added them, by login email and login ID) are included only when includeAudit is set — hidden by default. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), includeAudit: z.boolean().default(false), ...requesterArgs }),
    response: z.object({
      groups: z.array(z.object({ id: z.number(), name: z.string(), memberCount: z.number(), members: z.array(z.object({ email: z.string(), name: z.string(), addedAt: z.string().nullable(), addedByEmail: z.string().nullable(), addedByLoginId: z.string().nullable() })) })),
      people: z.array(z.object({ email: z.string(), name: z.string(), optedIn: z.boolean(), hasChoice: z.boolean(), groupIds: z.array(z.number()), notifyChannel: z.enum(["email", "text", "both"]) })),
      announcements: z.array(z.object({ id: z.number(), subject: z.string(), body: z.string(), audience: z.string(), recipientCount: z.number(), byChannel: z.record(z.string(), z.number()), createdAt: z.string(), createdBy: z.string(), fromLabel: z.string() })),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const groupRows = await db.select().from(schema.attendeeGroups).where(eq(schema.attendeeGroups.orgId, args.orgId)).orderBy(asc(schema.attendeeGroups.id));
      const memberRows = await db.select().from(schema.attendeeGroupMembers).where(eq(schema.attendeeGroupMembers.orgId, args.orgId));
      const memberCount = new Map<number, number>();
      const groupsByHash = new Map<string, number[]>();
      for (const m of memberRows) {
        memberCount.set(m.groupId, (memberCount.get(m.groupId) ?? 0) + 1);
        if (m.emailHash) groupsByHash.set(m.emailHash, [...(groupsByHash.get(m.emailHash) ?? []), m.groupId]);
      }
      const decMemberEmails = await decryptFields(ctx, memberRows.map((m) => m.email));
      const membersByGroup = new Map<number, Array<{ email: string; name: string; addedAt: string | null; addedByEmail: string | null; addedByLoginId: string | null }>>();
      memberRows.forEach((m, i) => {
        const entry = { email: decMemberEmails[i] ?? "", name: m.displayName, addedAt: args.includeAudit ? new Date(m.createdAt).toISOString() : null, addedByEmail: args.includeAudit ? (m.addedByEmail || null) : null, addedByLoginId: args.includeAudit ? (m.addedByLoginId || null) : null };
        membersByGroup.set(m.groupId, [...(membersByGroup.get(m.groupId) ?? []), entry]);
      });
      const optMap = await announcementOptInMap(ctx, args.orgId);
      const evRows = await db.select({ id: schema.events.id }).from(schema.events).where(eq(schema.events.orgId, args.orgId));
      const evIds = evRows.map((e) => e.id);
      type Person = { email: string; name: string; optedIn: boolean; hasChoice: boolean; groupIds: number[]; notifyChannel: "email" | "text" | "both" };
      const people: Person[] = [];
      if (evIds.length > 0) {
        const regs = await db.select().from(schema.registrations).where(inArray(schema.registrations.eventId, evIds)).orderBy(asc(schema.registrations.id));
        const active = regs.filter((r) => r.held !== 1 && ["pending", "approved", "checked_in", "waitlisted"].includes(r.status));
        const byHash = new Map<string, (typeof active)[number]>();
        for (const r of active) { if (r.emailHash) byHash.set(r.emailHash, r); }
        const deduped = [...byHash.entries()];
        const decNames = await decryptFields(ctx, deduped.map(([, r]) => r.name));
        const decEmails = await decryptFields(ctx, deduped.map(([, r]) => r.email));
        deduped.forEach(([hash, r], i) => {
          const email = decEmails[i] ?? "";
          if (!email.includes("@")) return;
          people.push({ email, name: decNames[i] ?? "", optedIn: optMap.get(hash) ?? true, hasChoice: optMap.has(hash), groupIds: groupsByHash.get(hash) ?? [], notifyChannel: (r.notifyChannel as "email" | "text" | "both") ?? "email" });
        });
        people.sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
      }
      const annRows = await db.select().from(schema.orgAnnouncements).where(eq(schema.orgAnnouncements.orgId, args.orgId)).orderBy(desc(schema.orgAnnouncements.id)).limit(50);
      return {
        groups: groupRows.map((g) => ({ id: g.id, name: g.name, memberCount: memberCount.get(g.id) ?? 0, members: membersByGroup.get(g.id) ?? [] })),
        people,
        announcements: annRows.map((a) => { let byChannel: Record<string, number> = {}; try { byChannel = JSON.parse(a.byChannel) as Record<string, number>; } catch { byChannel = {}; } return { id: a.id, subject: a.subject, body: a.body, audience: a.audience, recipientCount: a.recipientCount, byChannel, createdAt: new Date(a.createdAt).toISOString(), createdBy: a.createdBy, fromLabel: a.fromLabel ?? "" }; }),
      };
    },
  }),

  createAttendeeGroup: defineAction({
    description: "Creates a named attendee group for an organization (by event, interest, role — the name is free-form) so announcements can target it. A person can belong to many groups. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), name: z.string().min(1).max(120), ...identityArgs }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      await assertAdvancedAllowed(ctx, args.orgId, "Attendee groups & announcements");
      const result = await db.insert(schema.attendeeGroups).values({ orgId: args.orgId, name: args.name.trim(), createdAt: Date.now() }).returning({ id: schema.attendeeGroups.id });
      const inserted = result[0];
      if (!inserted) throw new Error("createAttendeeGroup: insert returned no rows");
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  deleteAttendeeGroup: defineAction({
    description: "Deletes an attendee group and its memberships. The attendees themselves and their other groups are untouched. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), groupId: z.number().int().positive(), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.attendeeGroupMembers).where(eq(schema.attendeeGroupMembers.groupId, args.groupId));
      await db.delete(schema.attendeeGroups).where(and(eq(schema.attendeeGroups.id, args.groupId), eq(schema.attendeeGroups.orgId, args.orgId)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  setGroupMembership: defineAction({
    description: "Adds an attendee to an organization group or removes them from it. Membership is keyed by the attendee's email (stored encrypted with its blind index). Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), groupId: z.number().int().positive(), email: z.string().email().max(200), name: z.string().max(120).default(""), member: z.boolean(), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const group = (await db.select().from(schema.attendeeGroups).where(and(eq(schema.attendeeGroups.id, args.groupId), eq(schema.attendeeGroups.orgId, args.orgId))).limit(1))[0];
      if (!group) throw new Error("That group doesn't belong to this organization.");
      const em = args.email.trim().toLowerCase();
      const hash = await emailIndex(ctx, em);
      const existing = (await db.select().from(schema.attendeeGroupMembers).where(and(eq(schema.attendeeGroupMembers.groupId, args.groupId), eq(schema.attendeeGroupMembers.emailHash, hash))).limit(1))[0];
      if (args.member && !existing) {
        const enc = await encryptFields(ctx, [em]);
        await db.insert(schema.attendeeGroupMembers).values({ groupId: args.groupId, orgId: args.orgId, email: enc[0]!, emailHash: hash, displayName: args.name.trim(), addedByEmail: args.adminEmail ?? "", addedByLoginId: args.adminGoogleId ?? "", createdAt: Date.now() });
      } else if (!args.member && existing) {
        await db.delete(schema.attendeeGroupMembers).where(eq(schema.attendeeGroupMembers.id, existing.id));
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  sendAnnouncement: defineAction({
    description: "Sends an organization announcement to attendees — everyone, one attendee group, or a hand-picked subset — delivered on each attendee's OWN chosen channel (email, text, or both, from their registrations). Attendees who opted out of announcements are always excluded and counted as skipped. The announcement is composed and logged in the organization's announcement history with the exact recipient count and per-channel breakdown (prototype posture: composed and logged in-app, like the other notifications). Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), subject: z.string().min(1).max(200), body: z.string().min(1).max(4000), audience: z.enum(["all", "group", "selected"]), groupId: z.number().int().positive().optional(), emails: z.array(z.string().email().max(200)).max(500).default([]), ...identityArgs }),
    response: z.object({ ok: z.literal(true), recipientCount: z.number(), byChannel: z.record(z.string(), z.number()), skippedOptedOut: z.number(), fromLabel: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; recipientCount: number; byChannel: Record<string, number>; skippedOptedOut: number; fromLabel: string }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      await assertAdvancedAllowed(ctx, args.orgId, "Announcements");
      await assertFeatureEnabled(ctx, args.orgId, "announcements");
      let audienceLabel = "all attendees";
      let groupHashes: Set<string> | null = null;
      if (args.audience === "group") {
        if (!args.groupId) throw new Error("Choose a group for this announcement.");
        const group = (await db.select().from(schema.attendeeGroups).where(and(eq(schema.attendeeGroups.id, args.groupId), eq(schema.attendeeGroups.orgId, args.orgId))).limit(1))[0];
        if (!group) throw new Error("That group doesn't belong to this organization.");
        audienceLabel = `group: ${group.name}`;
        const members = await db.select({ emailHash: schema.attendeeGroupMembers.emailHash }).from(schema.attendeeGroupMembers).where(eq(schema.attendeeGroupMembers.groupId, args.groupId));
        groupHashes = new Set(members.map((m) => m.emailHash ?? ""));
      }
      let selectedHashes: Set<string> | null = null;
      if (args.audience === "selected") {
        if (args.emails.length === 0) throw new Error("Pick at least one attendee for this announcement.");
        audienceLabel = `selected attendees (${args.emails.length})`;
        selectedHashes = new Set<string>();
        for (const e of args.emails) selectedHashes.add(await emailIndex(ctx, e.trim().toLowerCase()));
      }
      const optMap = await announcementOptInMap(ctx, args.orgId);
      const evRows = await db.select({ id: schema.events.id }).from(schema.events).where(eq(schema.events.orgId, args.orgId));
      const evIds = evRows.map((e) => e.id);
      const byChannel: Record<string, number> = { email: 0, text: 0, both: 0 };
      let recipientCount = 0;
      let skippedOptedOut = 0;
      if (evIds.length > 0) {
        const regs = await db.select().from(schema.registrations).where(inArray(schema.registrations.eventId, evIds)).orderBy(asc(schema.registrations.id));
        const active = regs.filter((r) => r.held !== 1 && ["pending", "approved", "checked_in", "waitlisted"].includes(r.status));
        const byHash = new Map<string, (typeof active)[number]>();
        for (const r of active) { if (r.emailHash) byHash.set(r.emailHash, r); }
        for (const [hash, r] of byHash) {
          if (groupHashes && !groupHashes.has(hash)) continue;
          if (selectedHashes && !selectedHashes.has(hash)) continue;
          if (optMap.get(hash) === false) { skippedOptedOut += 1; continue; }
          const ch = (r.notifyChannel as string) || "email";
          byChannel[ch] = (byChannel[ch] ?? 0) + 1;
          recipientCount += 1;
        }
      }
      const sender = await resolveSender(ctx, args.orgId);
      await db.insert(schema.orgAnnouncements).values({ orgId: args.orgId, subject: args.subject.trim(), body: args.body.trim(), audience: audienceLabel, recipientCount, byChannel: JSON.stringify(byChannel), createdAt: Date.now(), createdBy: args.adminEmail ?? "", fromLabel: sender.fromLabel });
      ctx.invalidateQueries();
      return { ok: true, recipientCount, byChannel, skippedOptedOut, fromLabel: sender.fromLabel };
    },
  }),

  geocodeVenue: defineAction({
    description: "Looks up coordinates for an event venue address (OpenStreetMap Nominatim) so an admin can pin the venue for location-bound greeter check-in. Returns the best match or found=false — the admin can always pin the venue from their own device location instead. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), query: z.string().min(3).max(300), ...requesterArgs }),
    response: z.object({ found: z.boolean(), lat: z.number().nullable(), lng: z.number().nullable(), displayName: z.string() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(args.query)}`;
        const res = await fetch(url, { headers: { "User-Agent": "ApprovedGuest/1.0 (event check-in venue lookup)" } });
        if (!res.ok) return { found: false, lat: null, lng: null, displayName: "" };
        const data: unknown = await res.json();
        if (!Array.isArray(data) || data.length === 0) return { found: false, lat: null, lng: null, displayName: "" };
        const first = data[0] as { lat?: string; lon?: string; display_name?: string };
        const lat = Number(first.lat);
        const lng = Number(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { found: false, lat: null, lng: null, displayName: "" };
        return { found: true, lat, lng, displayName: first.display_name ?? "" };
      } catch {
        return { found: false, lat: null, lng: null, displayName: "" };
      }
    },
  }),

  updateEventCheckinSettings: defineAction({
    description: "Sets an event's location-bound check-in settings: the venue pin (latitude/longitude, or null to clear), the radius in meters greeters must be within, and whether the check is required or off. Physical events only — virtual events have no greeter check-in. This is also how an admin widens the radius. Admin of the event's organization only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), venueLat: z.number().min(-90).max(90).nullable(), venueLng: z.number().min(-180).max(180).nullable(), checkinRadiusM: z.number().int().min(25).max(100000), locationCheck: z.enum(["required", "off"]), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const db = ctx.db<typeof schema>();
      await assertSensitiveAuth(ctx, args.adminGoogleId, args.adminEmail, args.sessionToken);
      await db.update(schema.events).set({ venueLat: args.venueLat, venueLng: args.venueLng, checkinRadiusM: args.checkinRadiusM, locationCheck: args.locationCheck }).where(eq(schema.events.id, args.eventId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  createEvent: defineAction({
    description: "Adds a new event to an organization. Admin of that organization only. approvalEmails lists the addresses that receive approval-request emails for this event (empty = the organization's administrators).",
    request: z.object({
      orgId: z.number().int().positive().default(1),
      title: z.string().min(1).max(200),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      timeText: z.string().min(1).max(100),
      location: z.string().min(1).max(200),
      description: z.string().max(2000).default(""),
      approvalEmails: z.array(z.string().email().max(200)).max(20).default([]),
      status: z.enum(["published", "draft"]).default("published"),
      registrationEnabled: z.boolean().optional(),
      capacity: z.number().int().min(1).max(100000).nullable().optional(),
      reminderDayBefore: z.boolean().optional(),
      reminderSecondDays: z.number().int().min(1).max(60).nullable().optional(),
      ...eventStructureArgs,
      logoUrl: z.string().max(1000).optional(), // e.g. the image carried in by a calendar import
      ...identityArgs,
    }),
    response: z.object({ id: z.number(), guidelineFlag: z.string(), guidelineReason: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertEventSettingsAllowed(ctx, args.orgId, { capacity: args.capacity, autoApprove: args.autoApprove, produceEntryCode: args.produceEntryCode });
      const regEnabled = args.registrationEnabled !== false;
      if (regEnabled) await assertEventAllowance(ctx, args.orgId, new Map([[args.date.slice(0, 7), 1]]));
      // Platform guidelines screening: a flagged event is created as a
      // DRAFT (never published) with the guideline named, for the
      // admins' review queue.
      const screen = await screenEventGuidelines(ctx, { title: args.title, description: args.description, location: args.location });
      const status = screen.flag ? "draft" : args.status;
      const db = ctx.db<typeof schema>();
      await assertTitleDateAvailable(ctx, args.title.trim(), args.date);
      const result = await db.insert(schema.events).values({ orgId: args.orgId, title: args.title.trim(), date: args.date, timeText: args.timeText.trim(), location: args.location.trim(), description: args.description.trim(), approvalEmails: JSON.stringify(normalizeEmailList(args.approvalEmails)), status, guidelineFlag: screen.flag, guidelineReason: screen.reason, registrationEnabled: regEnabled ? 1 : 0, logoUrl: (args.logoUrl ?? "").trim(), capacity: args.capacity ?? null, reminderDayBefore: args.reminderDayBefore === false ? 0 : 1, reminderSecondDays: args.reminderSecondDays ?? null, locationType: args.locationType ?? "physical", virtualLink: (args.virtualLink ?? "").trim(), registrationDeadline: args.registrationDeadline ?? null, contactName: (args.contactName ?? "").trim(), contactPhone: (args.contactPhone ?? "").trim(), venueLat: args.venueLat ?? null, venueLng: args.venueLng ?? null, checkinRadiusM: args.checkinRadiusM ?? 300, locationCheck: args.locationCheck ?? "required", geofenceEnabled: args.geofenceEnabled === false ? 0 : 1, geofenceRadiusM: args.geofenceRadiusM ?? 400, geofenceBeforeMins: args.geofenceBeforeMins ?? 180, geofenceAfterMins: args.geofenceAfterMins ?? 120, visibility: args.visibility ?? "public", autoApprove: args.autoApprove ? 1 : 0, produceEntryCode: args.produceEntryCode ? 1 : 0, walkInRegistration: args.walkInRegistration ? 1 : 0 }).returning({ id: schema.events.id });
      const inserted = result[0];
      if (!inserted) throw new Error("createEvent: insert returned no rows");
      // A newly posted (published) event notifies the organization's subscribers.
      if (status === "published") {
        const org = await getOrgRow(ctx, args.orgId);
        const evRow = await getEventRow(ctx, inserted.id);
        if (org && evRow) await notifySubscribersOfNewEvent(ctx, org, evRow);
      }
      ctx.invalidateQueries();
      return { id: inserted.id, guidelineFlag: screen.flag, guidelineReason: screen.reason };
    },
  }),

  updateEvent: defineAction({
    description: "Edits an event's title, date, time, location, description, and approval email addresses. Admin of the event's organization only.",
    request: z.object({
      id: z.number().int().positive(),
      orgId: z.number().int().positive().default(1),
      title: z.string().min(1).max(200),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      timeText: z.string().min(1).max(100),
      location: z.string().min(1).max(200),
      description: z.string().max(2000).default(""),
      approvalEmails: z.array(z.string().email().max(200)).max(20).default([]),
      status: z.enum(["published", "draft", "cancelled"]).optional(),
      registrationEnabled: z.boolean().optional(),
      capacity: z.number().int().min(1).max(100000).nullable().optional(),
      reminderDayBefore: z.boolean().optional(),
      reminderSecondDays: z.number().int().min(1).max(60).nullable().optional(),
      ...eventStructureArgs,
      ...identityArgs,
    }),
    response: z.object({ ok: z.literal(true), guidelineFlag: z.string(), guidelineReason: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; guidelineFlag: string; guidelineReason: string }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const ev = await getEventRow(ctx, args.id);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      await assertEventSettingsAllowed(ctx, args.orgId, { capacity: args.capacity, autoApprove: args.autoApprove, produceEntryCode: args.produceEntryCode });
      // Turning registration ON starts counting this event toward the month's allowance.
      if (args.registrationEnabled === true && ev.registrationEnabled === 0) await assertEventAllowance(ctx, args.orgId, new Map([[args.date.slice(0, 7), 1]]));
      // Platform guidelines re-screen on every edit: newly flagged
      // content unpublishes the event into the review queue; content
      // that no longer violates clears the flag.
      const screen = await screenEventGuidelines(ctx, { title: args.title, description: args.description, location: args.location });
      const db = ctx.db<typeof schema>();
      if (args.title.trim() !== ev.title || args.date !== ev.date) await assertTitleDateAvailable(ctx, args.title.trim(), args.date, args.id);
      await db.update(schema.events).set({ title: args.title.trim(), date: args.date, timeText: args.timeText.trim(), location: args.location.trim(), description: args.description.trim(), approvalEmails: JSON.stringify(normalizeEmailList(args.approvalEmails)), ...(screen.flag ? { status: "draft" as const, guidelineFlag: screen.flag, guidelineReason: screen.reason } : { guidelineFlag: "", guidelineReason: "", ...(args.status ? { status: args.status } : {}) }), ...(args.registrationEnabled !== undefined ? { registrationEnabled: args.registrationEnabled ? 1 : 0 } : {}), ...(args.capacity !== undefined ? { capacity: args.capacity } : {}), ...(args.reminderDayBefore !== undefined ? { reminderDayBefore: args.reminderDayBefore ? 1 : 0 } : {}), ...(args.reminderSecondDays !== undefined ? { reminderSecondDays: args.reminderSecondDays } : {}), ...eventStructureValues(args) }).where(eq(schema.events.id, args.id));
      // Publishing an event that wasn't public notifies the organization's subscribers.
      if (!screen.flag && args.status === "published" && ev.status !== "published") {
        const org = await getOrgRow(ctx, args.orgId);
        const evRow = await getEventRow(ctx, args.id);
        if (org && evRow) await notifySubscribersOfNewEvent(ctx, org, evRow);
      }
      // "Produce entry code" transitions: turning it ON gives every
      // already-confirmed registration an entry code, as if it had
      // been on all along; turning it OFF withdraws the event's entry
      // codes so they stop verifying at the door.
      if (args.produceEntryCode === true && ev.produceEntryCode !== 1) await backfillEntryCodes(ctx, args.id);
      if (args.produceEntryCode === false && ev.produceEntryCode === 1) await db.update(schema.registrations).set({ entryCode: null }).where(eq(schema.registrations.eventId, args.id));
      // A larger capacity (or removing the limit) can free waitlist seats.
      if (args.capacity !== undefined) await promoteWaitlist(ctx, args.id);
      ctx.invalidateQueries();
      return { ok: true, guidelineFlag: screen.flag, guidelineReason: screen.reason };
    },
  }),

  clearEventGuidelineFlag: defineAction({
    description: "Admin review of a guideline-flagged event: after reviewing the event, an administrator clears the platform-guideline flag (recording that a review happened via the cleared state) so the event can be published. For flags that are correct, the fix is editing the event — saving re-screens it. Admin of the event's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const ev = await getEventRow(ctx, args.id);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const db = ctx.db<typeof schema>();
      await db.update(schema.events).set({ guidelineFlag: "", guidelineReason: "" }).where(eq(schema.events.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),


  setEventStatus: defineAction({
    description: "Publishes, unpublishes (back to draft), cancels, or reactivates an event. Cancelled events stay visible on the admin calendar marked cancelled and are closed to registration; drafts are hidden from the public. CANCELLING notifies every registered attendee (a cancellation notice they see in My Events, with a calendar-cancellation download) — the admin chooses notifyMode: 'announcement' shares the admin's own message with the notice, 'quiet' sends the plain cancellation notice only. Admin of the event's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), status: z.enum(["published", "draft", "cancelled"]), notifyMode: z.enum(["announcement", "quiet"]).default("quiet"), announcementMessage: z.string().max(1000).default(""), ...identityArgs }),
    response: z.object({ ok: z.literal(true), notifiedCount: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; notifiedCount: number }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const ev = await getEventRow(ctx, args.id);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const db = ctx.db<typeof schema>();
      if (args.status === "published") {
        // Platform guidelines gate: a flagged event cannot publish,
        // and publishing re-screens the current content.
        if (ev.guidelineFlag) throw new Error(guidelineBlockMessage(ev.guidelineFlag, ev.guidelineReason ?? ""));
        const screen = await screenEventGuidelines(ctx, { title: ev.title, description: ev.description ?? "", location: ev.location });
        if (screen.flag) {
          await db.update(schema.events).set({ guidelineFlag: screen.flag, guidelineReason: screen.reason, status: "draft" }).where(eq(schema.events.id, args.id));
          ctx.invalidateQueries();
          throw new Error(guidelineBlockMessage(screen.flag, screen.reason));
        }
      }
      await db.update(schema.events).set({ status: args.status }).where(eq(schema.events.id, args.id));
      let notifiedCount = 0;
      if (args.status === "cancelled" && ev.status !== "cancelled") {
        notifiedCount = await createCancellationNotices(ctx, ev, args.notifyMode, args.announcementMessage, false);
      }
      // Publishing a draft posts the event — subscribers are notified.
      if (args.status === "published" && ev.status !== "published") {
        const org = await getOrgRow(ctx, args.orgId);
        const evRow = await getEventRow(ctx, args.id);
        if (org && evRow) await notifySubscribersOfNewEvent(ctx, org, evRow);
      }
      ctx.invalidateQueries();
      return { ok: true, notifiedCount };
    },
  }),

  duplicateEvent: defineAction({
    description: "Duplicates an event — description, approvers, logo, settings, and its event-specific questions — as a DRAFT the admin can adjust and publish. With a new date (and optionally a new time) it is the 'duplicate for another day' flow and keeps the same title; without one it is a straight copy titled with “(copy)”. Registrations are never copied. Admin of the event's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), timeText: z.string().min(1).max(100).optional(), ...identityArgs }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const ev = await getEventRow(ctx, args.id);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      await assertEventSettingsAllowed(ctx, args.orgId, { capacity: ev.capacity, autoApprove: ev.autoApprove, produceEntryCode: (ev as { produceEntryCode?: number }).produceEntryCode });
      if (ev.registrationEnabled !== 0) await assertEventAllowance(ctx, args.orgId, new Map([[(args.date ?? ev.date).slice(0, 7), 1]]));
      const db = ctx.db<typeof schema>();
      await assertTitleDateAvailable(ctx, args.date ? ev.title : `${ev.title} (copy)`, args.date ?? ev.date);
      const result = await db.insert(schema.events).values({ orgId: ev.orgId, title: args.date ? ev.title : `${ev.title} (copy)`, date: args.date ?? ev.date, timeText: args.timeText?.trim() || ev.timeText, location: ev.location, description: ev.description, approvalEmails: ev.approvalEmails, status: "draft", logoUrl: ev.logoUrl, logoBlobKey: ev.logoBlobKey, registrationEnabled: ev.registrationEnabled, capacity: ev.capacity, reminderDayBefore: ev.reminderDayBefore, reminderSecondDays: ev.reminderSecondDays, locationType: ev.locationType ?? "physical", virtualLink: ev.virtualLink ?? "", registrationDeadline: ev.registrationDeadline ?? null, contactName: ev.contactName ?? "", contactPhone: ev.contactPhone ?? "", venueLat: ev.venueLat ?? null, venueLng: ev.venueLng ?? null, checkinRadiusM: ev.checkinRadiusM ?? 300, locationCheck: ev.locationCheck ?? "required", geofenceEnabled: (ev as { geofenceEnabled?: number }).geofenceEnabled ?? 1, geofenceRadiusM: (ev as { geofenceRadiusM?: number }).geofenceRadiusM ?? 400, geofenceBeforeMins: (ev as { geofenceBeforeMins?: number }).geofenceBeforeMins ?? 180, geofenceAfterMins: (ev as { geofenceAfterMins?: number }).geofenceAfterMins ?? 120, visibility: ev.visibility ?? "public", autoApprove: ev.autoApprove ?? 0, produceEntryCode: (ev as { produceEntryCode?: number }).produceEntryCode ?? 0, walkInRegistration: (ev as { walkInRegistration?: number }).walkInRegistration ?? 0 }).returning({ id: schema.events.id });
      const inserted = result[0];
      if (!inserted) throw new Error("duplicateEvent: insert returned no rows");
      const questions = await db.select().from(schema.customQuestions).where(eq(schema.customQuestions.eventId, args.id));
      for (const q of questions) {
        await db.insert(schema.customQuestions).values({ orgId: ev.orgId, eventId: inserted.id, label: q.label, helpText: q.helpText, type: q.type, options: q.options, required: q.required, sortOrder: q.sortOrder, legacyKey: "" });
      }
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

createEventSeries: defineAction({
    description: "Creates a repeating event series: the first occurrence on the given date plus further occurrences on a daily, weekly, monthly, or nth-weekday-of-the-month pattern (e.g. every first Tuesday). Every occurrence is its own event row — shown on the calendar as a series, and each occurrence can be edited, cancelled, and registered for individually. Admin only.",
    request: z.object({
      orgId: z.number().int().positive().default(1),
      title: z.string().min(1).max(200), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), timeText: z.string().min(1).max(100),
      location: z.string().min(1).max(200), description: z.string().max(2000).default(""),
      approvalEmails: z.array(z.string().email().max(200)).max(20).default([]),
      status: z.enum(["published", "draft"]).default("published"),
      registrationEnabled: z.boolean().optional(),
      capacity: z.number().int().min(1).max(100000).nullable().optional(),
      reminderDayBefore: z.boolean().optional(),
      reminderSecondDays: z.number().int().min(1).max(60).nullable().optional(),
      ...eventStructureArgs,
      recurrence: recurrenceArgs,
      ...identityArgs,
    }),
    response: z.object({ seriesId: z.string(), ids: z.array(z.number()) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertEventSettingsAllowed(ctx, args.orgId, { capacity: args.capacity, autoApprove: args.autoApprove, produceEntryCode: args.produceEntryCode });
      const db = ctx.db<typeof schema>();
      const seriesId = newSeriesId();
      const dates = seriesDates(args.date, args.recurrence);
      const regEnabled = args.registrationEnabled !== false;
      if (regEnabled) {
        const byMonth = new Map<string, number>();
        for (const d of dates) byMonth.set(d.slice(0, 7), (byMonth.get(d.slice(0, 7)) ?? 0) + 1);
        await assertEventAllowance(ctx, args.orgId, byMonth);
      }
      // Platform guidelines screening applies to series too: a
      // flagged series is created as drafts in the review queue.
      const screen = await screenEventGuidelines(ctx, { title: args.title, description: args.description, location: args.location });
      const seriesStatus = screen.flag ? "draft" : args.status;
      const ids: number[] = [];
      for (const date of dates) {
        const result = await db.insert(schema.events).values({ orgId: args.orgId, title: args.title.trim(), date, timeText: args.timeText.trim(), location: args.location.trim(), description: args.description.trim(), approvalEmails: JSON.stringify(normalizeEmailList(args.approvalEmails)), status: seriesStatus, guidelineFlag: screen.flag, guidelineReason: screen.reason, seriesId, registrationEnabled: regEnabled ? 1 : 0, capacity: args.capacity ?? null, reminderDayBefore: args.reminderDayBefore === false ? 0 : 1, reminderSecondDays: args.reminderSecondDays ?? null, locationType: args.locationType ?? "physical", virtualLink: (args.virtualLink ?? "").trim(), registrationDeadline: args.registrationDeadline ?? null, contactName: (args.contactName ?? "").trim(), contactPhone: (args.contactPhone ?? "").trim(), venueLat: args.venueLat ?? null, venueLng: args.venueLng ?? null, checkinRadiusM: args.checkinRadiusM ?? 300, locationCheck: args.locationCheck ?? "required", geofenceEnabled: args.geofenceEnabled === false ? 0 : 1, geofenceRadiusM: args.geofenceRadiusM ?? 400, geofenceBeforeMins: args.geofenceBeforeMins ?? 180, geofenceAfterMins: args.geofenceAfterMins ?? 120, visibility: args.visibility ?? "public", autoApprove: args.autoApprove ? 1 : 0, produceEntryCode: args.produceEntryCode ? 1 : 0, walkInRegistration: args.walkInRegistration ? 1 : 0 }).returning({ id: schema.events.id });
        const inserted = result[0];
        if (inserted) ids.push(inserted.id);
      }
      // A published series notifies subscribers once (for its first occurrence).
      if (args.status === "published" && ids[0]) {
        const org = await getOrgRow(ctx, args.orgId);
        const evRow = await getEventRow(ctx, ids[0]);
        if (org && evRow) await notifySubscribersOfNewEvent(ctx, org, evRow);
      }
      ctx.invalidateQueries();
      return { seriesId, ids };
    },
  }),

  createSeriesFromEvent: defineAction({
    description: "Turns an existing event into a repeating series: the event becomes the first occurrence and copies (same details, approvers, settings, and event-specific questions) are created on the chosen pattern. Each occurrence stays individually manageable. Admin only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), recurrence: recurrenceArgs, ...identityArgs }),
    response: z.object({ seriesId: z.string(), ids: z.array(z.number()) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const ev = await getEventRow(ctx, args.id);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const db = ctx.db<typeof schema>();
      const seriesId = ev.seriesId || newSeriesId();
      if (!ev.seriesId) await db.update(schema.events).set({ seriesId }).where(eq(schema.events.id, ev.id));
      const dates = seriesDates(ev.date, args.recurrence).slice(1);
      if (ev.registrationEnabled !== 0 && dates.length > 0) {
        const byMonth = new Map<string, number>();
        for (const d of dates) byMonth.set(d.slice(0, 7), (byMonth.get(d.slice(0, 7)) ?? 0) + 1);
        await assertEventAllowance(ctx, args.orgId, byMonth);
      }
      const ids: number[] = [ev.id];
      const questions = await db.select().from(schema.customQuestions).where(eq(schema.customQuestions.eventId, args.id));
      for (const date of dates) {
        const result = await db.insert(schema.events).values({ orgId: ev.orgId, title: ev.title, date, timeText: ev.timeText, location: ev.location, description: ev.description, approvalEmails: ev.approvalEmails, status: ev.status === "cancelled" ? "draft" : ev.status, logoUrl: ev.logoUrl, logoBlobKey: ev.logoBlobKey, seriesId, registrationEnabled: ev.registrationEnabled, capacity: ev.capacity, reminderDayBefore: ev.reminderDayBefore, reminderSecondDays: ev.reminderSecondDays, locationType: ev.locationType ?? "physical", virtualLink: ev.virtualLink ?? "", registrationDeadline: ev.registrationDeadline ?? null, contactName: ev.contactName ?? "", contactPhone: ev.contactPhone ?? "", venueLat: ev.venueLat ?? null, venueLng: ev.venueLng ?? null, checkinRadiusM: ev.checkinRadiusM ?? 300, locationCheck: ev.locationCheck ?? "required", geofenceEnabled: (ev as { geofenceEnabled?: number }).geofenceEnabled ?? 1, geofenceRadiusM: (ev as { geofenceRadiusM?: number }).geofenceRadiusM ?? 400, geofenceBeforeMins: (ev as { geofenceBeforeMins?: number }).geofenceBeforeMins ?? 180, geofenceAfterMins: (ev as { geofenceAfterMins?: number }).geofenceAfterMins ?? 120, visibility: ev.visibility ?? "public", autoApprove: ev.autoApprove ?? 0, produceEntryCode: (ev as { produceEntryCode?: number }).produceEntryCode ?? 0, walkInRegistration: (ev as { walkInRegistration?: number }).walkInRegistration ?? 0 }).returning({ id: schema.events.id });
        const inserted = result[0];
        if (!inserted) continue;
        ids.push(inserted.id);
        for (const q of questions) await db.insert(schema.customQuestions).values({ orgId: ev.orgId, eventId: inserted.id, label: q.label, helpText: q.helpText, type: q.type, options: q.options, required: q.required, sortOrder: q.sortOrder, legacyKey: "" });
      }
      ctx.invalidateQueries();
      return { seriesId, ids };
    },
  }),

  /* ---------- Attendee messaging (admins & registrars) ---------- */

  sendAttendeeMessage: defineAction({
    description: "Sends a message to an event's registrants — all of them or a subset (approved, approved-but-not-checked-in, checked in, awaiting approval) — on each attendee's chosen channel (email, text, or both; text falls back to email when no mobile number is on file). Templates (reminder, change of time, thank-you) are prefilled by the client and recorded. The message is composed and logged per the prototype mail posture. Admin or registrant of the organization only.",
    request: z.object({
      orgId: z.number().int().positive().default(1), eventId: z.number().int().positive(),
      audience: z.enum(["all", "approved", "not_checked_in", "checked_in", "pending"]),
      template: z.enum(["custom", "reminder", "time_change", "thank_you"]).default("custom"),
      subject: z.string().min(1).max(200), body: z.string().min(1).max(4000),
      ...requesterArgs, senderName: z.string().max(120).default(""),
    }),
    response: z.object({
      sentCount: z.number(), byChannel: z.object({ email: z.number(), text: z.number(), both: z.number() }),
      recipients: z.array(z.object({ name: z.string(), channel: z.string() })), subject: z.string(), body: z.string(), smsBody: z.string(),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdminOrRegistrant(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertPaidAllowed(ctx, args.orgId, "Messaging attendees");
      const modMsg = await moderateTexts(ctx, [args.subject, args.body]);
      if (modMsg.flagged) throw new Error("That message couldn't be sent — it was flagged by content moderation. Please revise the wording and try again.");
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const org = await getOrgRow(ctx, args.orgId);
      const db = ctx.db<typeof schema>();
      const regs = await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, args.eventId));
      const plain = await decryptRegs(ctx, regs);
      const keep = (status: string) => args.audience === "all" ? (status === "pending" || status === "approved" || status === "checked_in")
        : args.audience === "approved" ? (status === "approved" || status === "checked_in")
        : args.audience === "not_checked_in" ? status === "approved"
        : status === args.audience;
      const recipients: Array<{ name: string; channel: string }> = [];
      const byChannel = { email: 0, text: 0, both: 0 };
      for (const reg of regs) {
        if (reg.held === 1) continue; // held (moderation) registrations are never messaged
        if (!keep(reg.status)) continue;
        const p = plain.get(reg.id);
        if (!p) continue;
        let channel: "email" | "text" | "both" = reg.notifyChannel ?? "email";
        if (channel !== "email" && !(p.phone ?? "").trim()) channel = "email";
        byChannel[channel] += 1;
        recipients.push({ name: p.name, channel });
      }
      await db.insert(schema.attendeeMessages).values({ orgId: args.orgId, eventId: args.eventId, senderName: args.senderName, senderEmail: args.requestedByEmail ?? "", audience: args.audience, template: args.template, subject: args.subject.trim(), body: args.body.trim(), recipientCount: recipients.length });
      ctx.invalidateQueries();
      return { sentCount: recipients.length, byChannel, recipients: recipients.slice(0, 60), subject: args.subject.trim(), body: args.body.trim(), smsBody: `${org?.name ?? "Event"}: ${args.subject.trim()} — ${args.body.trim()}` };
    },
  }),

  listAttendeeMessages: defineAction({
    description: "Lists the messages sent to an event's registrants (newest first) — the per-event sent-message history. Admin or registrant of the organization only.",
    request: z.object({ orgId: z.number().int().positive().default(1), eventId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ messages: z.array(z.object({ id: z.number(), senderName: z.string(), audience: z.string(), template: z.string(), subject: z.string(), body: z.string(), recipientCount: z.number(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requireAdminOrRegistrant(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.attendeeMessages).where(eq(schema.attendeeMessages.eventId, args.eventId)).orderBy(desc(schema.attendeeMessages.id));
      return { messages: rows.map((m) => ({ id: m.id, senderName: m.senderName, audience: m.audience, template: m.template, subject: m.subject, body: m.body, recipientCount: m.recipientCount, createdAt: new Date(m.createdAt).toISOString() })) };
    },
  }),

  deleteEvent: defineAction({
    description: "SOFT-deletes an event: the event is stamped deleted and immediately hidden from calendars, the calendar feed, search, and registration (its passes stop verifying and its registrations no longer show in My Events) — but the event, its questions, and ALL of its registrations are kept, so an admin/owner can restore the whole thing from Deleted events. Every registered attendee still gets a cancellation notice first (snapshotted, so it reaches them in My Events with a calendar-cancellation download) — the admin chooses notifyMode: 'announcement' shares the admin's own message with the notice, 'quiet' is the plain cancellation notice only. The data is permanently purged only after the 30-day retention window closes (purgeExpiredDeletedEvents). Admin of the event's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), notifyMode: z.enum(["announcement", "quiet"]).default("quiet"), announcementMessage: z.string().max(1000).default(""), ...identityArgs }),
    response: z.object({ ok: z.literal(true), notifiedCount: z.number(), purgeAt: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; notifiedCount: number; purgeAt: string }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.events).where(eq(schema.events.id, args.id)).limit(1);
      const ev = rows[0];
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      if (ev.deletedAt) throw new Error("That event is already deleted — it's in Deleted events, where it can be restored.");
      const notifiedCount = await createCancellationNotices(ctx, ev, args.notifyMode, args.announcementMessage, true);
      const now = new Date();
      await db.update(schema.events).set({ deletedAt: now, deletedBy: (args.adminEmail ?? "").trim().toLowerCase() }).where(eq(schema.events.id, args.id));
      ctx.invalidateQueries();
      return { ok: true, notifiedCount, purgeAt: new Date(now.getTime() + EVENT_DELETE_RETENTION_MS).toISOString() };
    },
  }),

  restoreEvent: defineAction({
    description: "Restores a soft-deleted event WITH its registrations and questions, exactly as they were: the event returns to the calendar with its previous status, its registrations reappear in My Events, and confirmed passes verify at the door again. Possible any time until the 30-day retention window closes and the data is purged. If another live event has since taken the same title and date, the restore is refused (titles + dates are unique) until that event is renamed, rescheduled, or deleted. Admin/owner of the event's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ ok: z.literal(true), registrationsRestored: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; registrationsRestored: number }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.events).where(eq(schema.events.id, args.id)).limit(1);
      const ev = rows[0];
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      if (!ev.deletedAt) throw new Error("That event isn't deleted — there's nothing to restore.");
      if (Date.now() - new Date(ev.deletedAt).getTime() > EVENT_DELETE_RETENTION_MS) throw new Error("The 30-day recovery window for this event has closed — its data is being permanently deleted and it can no longer be restored.");
      const clash = await db.select({ id: schema.events.id }).from(schema.events).where(and(eq(schema.events.title, ev.title), eq(schema.events.date, ev.date), isNull(schema.events.deletedAt))).limit(1);
      if (clash[0] && clash[0].id !== ev.id) throw new Error("Another event with the same title and date exists now, and titles and dates must be unique. Rename or reschedule that event (or delete it) before restoring this one.");
      await db.update(schema.events).set({ deletedAt: null, deletedBy: "" }).where(eq(schema.events.id, args.id));
      const regs = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.eventId, args.id));
      ctx.invalidateQueries();
      return { ok: true, registrationsRestored: regs.length };
    },
  }),

  listDeletedEvents: defineAction({
    description: "The Deleted events view: one organization's soft-deleted events still inside their 30-day recovery window (or past it but not yet purged), newest deletion first — title, date, who deleted it and when, how many registrations are being kept with it, and the exact date its data will be permanently purged. Admin/owner of the organization only; other organizations' deleted events are never included.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ deleted: z.array(z.object({ id: z.number(), title: z.string(), date: z.string(), timeText: z.string(), location: z.string(), status: z.string(), deletedAt: z.string(), deletedBy: z.string(), purgeAt: z.string(), daysLeft: z.number(), registrations: z.number() })) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.events).where(eq(schema.events.orgId, args.orgId)).orderBy(desc(schema.events.deletedAt));
      const out = [];
      for (const ev of rows) {
        if (!ev.deletedAt) continue;
        const deletedMs = new Date(ev.deletedAt).getTime();
        const purgeMs = deletedMs + EVENT_DELETE_RETENTION_MS;
        const regs = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.eventId, ev.id));
        out.push({ id: ev.id, title: ev.title, date: ev.date, timeText: ev.timeText, location: ev.location, status: ev.status ?? "published", deletedAt: new Date(deletedMs).toISOString(), deletedBy: ev.deletedBy ?? "", purgeAt: new Date(purgeMs).toISOString(), daysLeft: Math.max(0, Math.ceil((purgeMs - Date.now()) / 86400000)), registrations: regs.length });
      }
      return { deleted: out };
    },
  }),

  purgeExpiredDeletedEvents: defineAction({
    description: "The retention purge for soft-deleted events (scheduled daily; no arguments): every event whose 30-day recovery window has closed is PERMANENTLY removed — the event, its registrations, questions, messages, attachments, shares, invitations, and alert/reminder logs — across all organizations. Events still inside the window are untouched and remain restorable. Cancellation notices are kept: they are the attendees' own record of the cancellation. Returns how many events were purged.",
    request: z.object({}),
    response: z.object({ purged: z.number() }),
    async handler(ctx): Promise<{ purged: number }> {
      const db = ctx.db<typeof schema>();
      const cutoff = new Date(Date.now() - EVENT_DELETE_RETENTION_MS);
      const rows = await db.select({ id: schema.events.id }).from(schema.events).where(and(lte(schema.events.deletedAt, cutoff)));
      for (const r of rows) await hardDeleteEventData(ctx, r.id);
      if (rows.length > 0) ctx.invalidateQueries();
      return { purged: rows.length };
    },
  }),

  /* ---------- Registration ---------- */

  register: defineAction({
    description: "Registers one attendee for an event. The event determines the organization (tenant); the organization's effective questions for the event are validated from customAnswers. Personal data is stored encrypted. No CAPTCHA — verification comes from the sign-in method (Google, Apple, or email magic link). On success, approval requests with tokenized email links are created for the event's approvers.",
    request: z.object({
      eventId: z.number().int().positive(),
      name: z.string().min(1).max(120),
      email: z.string().email().max(200),
      phone: z.string().max(40).optional(),
      notifyChannel: z.enum(["email", "text", "both"]).default("email"),
      googleId: z.string().max(200).optional(),
      authProvider: z.enum(["google", "apple", "email", "manual"]).optional(),
      registeredBy: registeredByArg,
      // Legal: a person registering themselves accepts the
      // attendee terms (accurate information; follow the
      // organization's rules). Staff registering someone else on
      // their behalf are exempt — they record who registered them.
      attendeeTermsAccepted: z.boolean().default(false),
      // Announcements: the attendee opts in/out of organization
      // announcements at registration (first recorded choice stands;
      // changeable later under Preferences).
      announcementOptIn: z.boolean().default(true),
      inviteToken: z.string().max(100).optional(),
      customAnswers: z.array(z.object({ questionId: z.number(), answer: z.string().max(1000) })).max(30).optional(),
      // Legacy direct fields (kept for compatibility with older clients):
      faithAffiliation: z.string().max(200).optional(),
      hearAbout: hearAboutEnum.optional(),
      securityListOptIn: z.boolean().optional(),
    }),
    response: z.object({ id: z.number(), status: z.enum(["pending", "approved"]), code: z.string().nullable(), entryCode: z.string().nullable(), autoApproved: z.boolean(), heldForReview: z.boolean(), approverEmails: z.array(z.string()), verificationRequests: z.array(z.object({ email: z.string(), token: z.string(), expiresAt: z.string(), channel: z.enum(["email", "text", "both"]), phone: z.string().nullable() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ id: number; status: "pending" | "approved"; code: string | null; entryCode: string | null; autoApproved: boolean; heldForReview: boolean; approverEmails: string[]; verificationRequests: Array<{ email: string; token: string; expiresAt: string; channel: "email" | "text" | "both"; phone: string | null }> }> {
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev) throw new Error("That event no longer exists.");
      if ((ev.status ?? "published") !== "published") throw new Error(ev.status === "cancelled" ? "This event has been cancelled, so registration is closed." : "This event isn't open for registration yet.");
      if (ev.registrationEnabled === 0) throw new Error("Registration isn't enabled for this event — it's a calendar listing only.");
      if (!args.registeredBy && !args.attendeeTermsAccepted) throw new Error("Please accept the attendee terms to register — they confirm your information is accurate and that you'll follow the organization's rules for the event.");
      assertRegistrationOpen(ev);
      const onBehalf = await verifyRegisteredBy(ctx, ev.orgId, args.registeredBy);
      const questions = await effectiveQuestions(ctx, ev);
      let built = buildAnswers(questions, args.customAnswers);
      if (questions.length === 0) {
        built = {
          answers: [],
          faith: args.faithAffiliation?.trim() ? args.faithAffiliation.trim() : null,
          hear: args.hearAbout ?? null,
          securityOptIn: args.securityListOptIn === undefined ? null : args.securityListOptIn,
        };
      }
      if (args.notifyChannel !== "email" && !(args.phone ?? "").trim()) throw new Error("A mobile number is needed for text messages — add one, or choose email delivery.");
      const mod = await moderateTexts(ctx, [args.name, args.email, built.faith ?? "", built.hear ?? "", ...built.answers.map((a) => a.answer)]);
      const db = ctx.db<typeof schema>();
      const phone = args.phone?.trim();
      const enc = await encryptFields(ctx, [args.name.trim(), args.email.trim().toLowerCase(), phone ? phone : null, built.faith, built.hear, JSON.stringify(built.answers), null]);
      const hash = await emailIndex(ctx, args.email);
      // Attendee flag for THIS organization: a blacklist flag refuses
      // the registration outright — no row is created, and the
      // attendee sees only the plain refusal (the flag is never
      // mentioned). An alert flag lets the registration through but
      // keeps it in the approver queue — the trusted and auto-approve
      // shortcuts below are skipped for flagged people.
      const attendeeFlag = await getAttendeeFlag(ctx, ev.orgId, hash);
      if (attendeeFlag?.flagType === "blacklist") throw new Error(BLACKLIST_REFUSAL);
      const flagAlert = attendeeFlag?.flagType === "alert";
      // Arrival pop-up: the attendee's standing answer (if they have
      // one) is the new registration's starting proximity preference.
      // Never answered = off — and nothing here asks for location.
      const arrivalAnswer = await arrivalAnswerFor(ctx, ev.orgId, hash);
      const result = await db.insert(schema.registrations).values({
        eventId: args.eventId,
        name: enc[0]!, email: enc[1]!, emailHash: hash, phone: enc[2] ?? null, piiEncrypted: 1,
        proximityOptIn: arrivalAnswer.enabled ? 1 : 0,
        proximityRadiusM: arrivalAnswer.radiusM,
        contactEmail: enc[6] ?? null, contactEmailHash: null,
        googleId: onBehalf ? null : args.googleId?.trim() ? args.googleId.trim() : null,
        authProvider: onBehalf ? "manual" : args.authProvider ?? (args.googleId ? "google" : "manual"),
        registeredByName: onBehalf?.name ?? null,
        registeredByEmail: onBehalf?.email ?? null,
        registeredByGoogleId: onBehalf?.googleId ?? null,
        notifyChannel: args.notifyChannel,
        status: "pending",
        faithAffiliation: enc[3] ?? null, hearAbout: enc[4] ?? null,
        securityListOptIn: built.securityOptIn === null ? null : built.securityOptIn ? "yes" : "no",
        customAnswers: enc[5] ?? "[]",
        held: mod.flagged ? 1 : 0, heldReason: mod.flagged ? mod.reason : "",
      }).returning({ id: schema.registrations.id });
      const inserted = result[0];
      if (!inserted) throw new Error("register: insert returned no rows");
      await recordAnnouncementOptIn(ctx, ev.orgId, args.email, args.name, args.announcementOptIn);
      if (mod.flagged) { ctx.invalidateQueries(); return { id: inserted.id, status: "pending", code: null, entryCode: null, autoApproved: false, heldForReview: true, approverEmails: [], verificationRequests: [] }; }
      // Trusted participants skip the approver step entirely.
      // Email verification (magic link): unverified addresses get a
      // verification email; verified addresses skip it — once only.
      const verification = await ensureVerificationRequest(ctx, args.email);
      const verificationRequests = verification ? [{ ...verification, channel: args.notifyChannel, phone: phone ? phone : null }] : [];
      // PRIVATE event gate: past attendees of this organization, or
      // anyone holding the event's invite link — nobody else.
      if ((ev.visibility ?? "public") === "private" && !(await canAccessPrivateEvent(ctx, ev, hash, onBehalf ? null : args.googleId, args.inviteToken))) {
        throw new Error("This is a private event — it's open to people who have attended this organization before, or to anyone with the event's invite link. If you were invited, register through the invite link you were sent.");
      }
      // FREE plan: an RSVP is the whole flow — confirmed on the spot,
      // no approval step, no pass code, no entry code, no waitlist.
      // The attendee list is how the owner knows who's coming.
      if (await isFreePlanOrg(ctx, ev.orgId)) {
        await confirmFreeRsvp(ctx, inserted.id);
        ctx.invalidateQueries();
        return { id: inserted.id, status: "approved", code: null, entryCode: null, autoApproved: false, heldForReview: false, approverEmails: [], verificationRequests };
      }
      // Per-event Auto approve: everyone is confirmed immediately —
      // pass and calendar invite, no approver step. A frozen account
      // (failed payment) still holds all approvals, including these.
      // Alert-flagged attendees are the exception: they always go
      // through the approver queue, even on auto-approve events.
      if (ev.autoApprove === 1 && !flagAlert) {
        if (freezeState(await getOrgRow(ctx, ev.orgId)).frozen) {
          await db.update(schema.registrations).set({ decidedVia: FROZEN_HOLD_VIA }).where(eq(schema.registrations.id, inserted.id));
          ctx.invalidateQueries();
          return { id: inserted.id, status: "pending", code: null, entryCode: null, autoApproved: false, heldForReview: false, approverEmails: [], verificationRequests };
        }
        const regRows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, inserted.id)).limit(1);
        const { code, entryCode } = await applyApprovalDecision(ctx, regRows[0]!, "approved", "Auto-approved — this event is set to Auto approve");
        ctx.invalidateQueries();
        return { id: inserted.id, status: "approved", code, entryCode, autoApproved: true, heldForReview: false, approverEmails: [], verificationRequests };
      }
      const trusted = !flagAlert && (await isTrustedParticipant(ctx, ev.orgId, hash, onBehalf ? null : args.googleId));
      if (trusted && freezeState(await getOrgRow(ctx, ev.orgId)).frozen) {
        // Frozen account: trusted auto-approval is held, not run — it is
        // processed in a batch when the owner repairs the payment.
        await db.update(schema.registrations).set({ decidedVia: FROZEN_HOLD_VIA }).where(eq(schema.registrations.id, inserted.id));
        ctx.invalidateQueries();
        return { id: inserted.id, status: "pending", code: null, entryCode: null, autoApproved: false, heldForReview: false, approverEmails: [], verificationRequests };
      }
      if (trusted) {
        const regRows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, inserted.id)).limit(1);
        const { code, entryCode } = await applyApprovalDecision(ctx, regRows[0]!, "approved", "Trusted participant — auto-approved");
        ctx.invalidateQueries();
        return { id: inserted.id, status: "approved", code, entryCode, autoApproved: true, heldForReview: false, approverEmails: [], verificationRequests };
      }
      const approverEmails = await createApprovalRequests(ctx, inserted.id, ev);
      ctx.invalidateQueries();
      return { id: inserted.id, status: "pending", code: null, entryCode: null, autoApproved: false, heldForReview: false, approverEmails, verificationRequests };
    },
  }),

  registerGroup: defineAction({
    description: "Registers several attendees for one event in a single submission. Every attendee needs their own name and email; each becomes their own registration with their own pass. The event determines the organization; the organization's effective questions are answered once (customAnswers) and stored, encrypted, on every registration. When the submitter is signed in (Google, Apple, or email), the first attendee is linked to that sign-in. No CAPTCHA on any path — verification comes from the sign-in method itself.",
    request: z.object({
      eventId: z.number().int().positive(),
      attendees: z.array(z.object({
        name: z.string().min(1).max(120),
        email: z.string().email().max(200),
        phone: z.string().max(40).optional(),
      })).min(1).max(10),
      customAnswers: z.array(z.object({ questionId: z.number(), answer: z.string().max(1000) })).max(30).default([]),
      registeredBy: registeredByArg,
      // Group contact option: "submitter" sends every attendee's approval
      // email and QR pass to contactEmail instead of each person's own
      // address. Approvals and pass codes stay per-person either way.
      notifyChannel: z.enum(["email", "text", "both"]).default("email"),
      reminderChoices: z.array(reminderChoiceEnum).max(3).default(["1d"]),
      contactMode: z.enum(["each", "submitter"]).default("each"),
      contactEmail: z.string().email().max(200).optional(),
      // Pass style for the group: "individual" = a code per person
      // (default); "shared" = one code for the whole group, with
      // attendance and revocation still tracked per person.
      codeMode: z.enum(["individual", "shared"]).default("individual"),
      googleId: z.string().max(200).optional(),
      authProvider: z.enum(["google", "apple", "email", "manual"]).optional(),
      attendeeTermsAccepted: z.boolean().default(false),
      // Announcements opt-in, recorded for each attendee in the group
      // (first recorded choice per person stands).
      announcementOptIn: z.boolean().default(true),
      inviteToken: z.string().max(100).optional(),
    }),
    response: z.object({ ids: z.array(z.number()), results: z.array(z.object({ id: z.number(), status: z.enum(["pending", "approved", "waitlisted"]), code: z.string().nullable(), entryCode: z.string().nullable(), autoApproved: z.boolean(), heldForReview: z.boolean() })), skipped: z.array(z.object({ email: z.string(), reason: z.string() })), approverEmails: z.array(z.string()), verificationRequests: z.array(z.object({ email: z.string(), token: z.string(), expiresAt: z.string(), channel: z.enum(["email", "text", "both"]), phone: z.string().nullable() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ids: number[]; results: Array<{ id: number; status: "pending" | "approved" | "waitlisted"; code: string | null; entryCode: string | null; autoApproved: boolean; heldForReview: boolean }>; skipped: Array<{ email: string; reason: string }>; approverEmails: string[]; verificationRequests: Array<{ email: string; token: string; expiresAt: string; channel: "email" | "text" | "both"; phone: string | null }> }> {
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev) throw new Error("That event no longer exists.");
      if ((ev.status ?? "published") !== "published") throw new Error(ev.status === "cancelled" ? "This event has been cancelled, so registration is closed." : "This event isn't open for registration yet.");
      if (ev.registrationEnabled === 0) throw new Error("Registration isn't enabled for this event — it's a calendar listing only.");
      if (!args.registeredBy && !args.attendeeTermsAccepted) throw new Error("Please accept the attendee terms to register — they confirm your information is accurate and that you'll follow the organization's rules for the event.");
      assertRegistrationOpen(ev);
      const onBehalf = await verifyRegisteredBy(ctx, ev.orgId, args.registeredBy);
      const isGoogle = !onBehalf && (!!args.authProvider && args.authProvider !== "manual" || (!args.authProvider && !!args.googleId)) && !!args.googleId?.trim();
      const seen = new Set<string>();
      for (const a of args.attendees) {
        const em = a.email.trim().toLowerCase();
        if (seen.has(em)) throw new Error(`Each attendee needs their own email address — ${em} is listed more than once.`);
        seen.add(em);
      }
      if (args.notifyChannel !== "email") {
        for (const a of args.attendees) {
          if (!(a.phone ?? "").trim()) throw new Error(`A mobile number is needed to send text messages to ${a.name.trim() || a.email} — add one, or choose email delivery.`);
        }
      }
      const questions = await effectiveQuestions(ctx, ev);
      const built = buildAnswers(questions, args.customAnswers);
      const groupContact = args.contactMode === "submitter" ? (args.contactEmail?.trim().toLowerCase() ?? null) : null;
      if (args.contactMode === "submitter" && !groupContact) throw new Error("To send all approval emails and passes to one address, provide that contact email.");
      const groupContactHash = groupContact ? await emailIndex(ctx, groupContact) : null;
      const groupId = `grp-${makeApprovalToken().slice(4, 20)}`;
      const db = ctx.db<typeof schema>();
      const ids: number[] = [];
      const results: Array<{ id: number; status: "pending" | "approved" | "waitlisted"; code: string | null; entryCode: string | null; autoApproved: boolean; heldForReview: boolean }> = [];
      const skipped: Array<{ email: string; reason: string }> = [];
      const verificationRequests: Array<{ email: string; token: string; expiresAt: string; channel: "email" | "text" | "both"; phone: string | null }> = [];
      let approverEmails: string[] = [];
      for (let i = 0; i < args.attendees.length; i++) {
        const a = args.attendees[i]!;
        const phone = a.phone?.trim();
        const isSubmitter = i === 0 && isGoogle;
        const mod = await moderateTexts(ctx, [a.name, a.email, built.faith ?? "", built.hear ?? "", ...built.answers.map((x) => x.answer)]);
        const enc = await encryptFields(ctx, [a.name.trim(), a.email.trim().toLowerCase(), phone ? phone : null, built.faith, built.hear, JSON.stringify(built.answers), groupContact]);
        const hash = await emailIndex(ctx, a.email);
        // Attendee flag for THIS organization, per attendee: a
        // blacklist flag refuses just that person — skipped with the
        // plain message, never naming the flag; an alert flag keeps
        // them in the approver queue (no trusted / auto-approve
        // shortcut for them below).
        const attendeeFlag = await getAttendeeFlag(ctx, ev.orgId, hash);
        if (attendeeFlag?.flagType === "blacklist") {
          skipped.push({ email: a.email, reason: BLACKLIST_REFUSAL });
          continue;
        }
        const flagAlert = attendeeFlag?.flagType === "alert";
        // PRIVATE event gate, per attendee: past attendees of this
        // organization, or anyone registering through the invite link.
        if ((ev.visibility ?? "public") === "private" && !(await canAccessPrivateEvent(ctx, ev, hash, isSubmitter ? args.googleId : null, args.inviteToken))) {
          skipped.push({ email: a.email, reason: "Private event — this person hasn't attended this organization before, and no invite link was used." });
          continue;
        }
        const arrivalAnswer = await arrivalAnswerFor(ctx, ev.orgId, hash);
        const result = await db.insert(schema.registrations).values({
          eventId: args.eventId,
          name: enc[0]!, email: enc[1]!, emailHash: hash, phone: enc[2] ?? null, piiEncrypted: 1,
          proximityOptIn: arrivalAnswer.enabled ? 1 : 0,
          proximityRadiusM: arrivalAnswer.radiusM,
          contactEmail: enc[6] ?? null, contactEmailHash: groupContactHash,
          googleId: isSubmitter ? args.googleId!.trim() : null,
          authProvider: isSubmitter ? (args.authProvider ?? "google") : "manual",
          registeredByName: onBehalf?.name ?? null,
          registeredByEmail: onBehalf?.email ?? null,
          registeredByGoogleId: onBehalf?.googleId ?? null,
          groupId,
          codeSharing: args.codeMode,
          notifyChannel: args.notifyChannel,
          reminderChoices: JSON.stringify(args.reminderChoices),
          status: "pending",
          faithAffiliation: enc[3] ?? null, hearAbout: enc[4] ?? null,
          securityListOptIn: built.securityOptIn === null ? null : built.securityOptIn ? "yes" : "no",
          customAnswers: enc[5] ?? "[]",
          held: mod.flagged ? 1 : 0, heldReason: mod.flagged ? mod.reason : "",
        }).returning({ id: schema.registrations.id });
        const inserted = result[0];
        if (!inserted) throw new Error("registerGroup: insert returned no rows");
        ids.push(inserted.id);
        await recordAnnouncementOptIn(ctx, ev.orgId, a.email, a.name, args.announcementOptIn);
        if (mod.flagged) { results.push({ id: inserted.id, status: "pending", code: null, entryCode: null, autoApproved: false, heldForReview: true }); continue; }
        const verification = await ensureVerificationRequest(ctx, a.email);
        if (verification) verificationRequests.push({ ...verification, channel: args.notifyChannel, phone: phone ? phone : null });
        // FREE plan: each group member's RSVP is confirmed on the
        // spot — no approval step, no pass code (shared or otherwise),
        // no capacity waitlist.
        if (await isFreePlanOrg(ctx, ev.orgId)) {
          await confirmFreeRsvp(ctx, inserted.id);
          results.push({ id: inserted.id, status: "approved", code: null, entryCode: null, autoApproved: false, heldForReview: false });
          continue;
        }
        // Capacity: a full event waitlists new registrations — no
        // approver step and no pass until a seat opens and is accepted.
        if (await eventIsFull(ctx, ev)) {
          await db.update(schema.registrations).set({ status: "waitlisted" }).where(eq(schema.registrations.id, inserted.id));
          results.push({ id: inserted.id, status: "waitlisted", code: null, entryCode: null, autoApproved: false, heldForReview: false });
          continue;
        }
        // Trusted participants are approved on the spot — no approver
        // step, pass issued immediately. Everyone else goes to approvers.
        // FROZEN account (failed payment, grace window passed): not even
        // trusted auto-approval runs — the registration is held and the
        // auto-approval is processed in a batch when payment is repaired.
        // Per-event Auto approve: confirmed immediately, no approver
        // step (frozen accounts still hold, as with trusted guests).
        // Alert-flagged attendees skip this — approver queue only.
        if (ev.autoApprove === 1 && !flagAlert) {
          if (freezeState(await getOrgRow(ctx, ev.orgId)).frozen) {
            await db.update(schema.registrations).set({ decidedVia: FROZEN_HOLD_VIA }).where(eq(schema.registrations.id, inserted.id));
            results.push({ id: inserted.id, status: "pending", code: null, entryCode: null, autoApproved: false, heldForReview: false });
          } else {
            const regRows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, inserted.id)).limit(1);
            const { code, entryCode } = await applyApprovalDecision(ctx, regRows[0]!, "approved", "Auto-approved — this event is set to Auto approve");
            results.push({ id: inserted.id, status: "approved", code, entryCode, autoApproved: true, heldForReview: false });
          }
          continue;
        }
        const trusted = !flagAlert && (await isTrustedParticipant(ctx, ev.orgId, hash, isSubmitter ? args.googleId : null));
        if (trusted && freezeState(await getOrgRow(ctx, ev.orgId)).frozen) {
          await db.update(schema.registrations).set({ decidedVia: FROZEN_HOLD_VIA }).where(eq(schema.registrations.id, inserted.id));
          results.push({ id: inserted.id, status: "pending", code: null, entryCode: null, autoApproved: false, heldForReview: false });
        } else if (trusted) {
          const regRows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, inserted.id)).limit(1);
          const { code, entryCode } = await applyApprovalDecision(ctx, regRows[0]!, "approved", "Trusted participant — auto-approved");
          results.push({ id: inserted.id, status: "approved", code, entryCode, autoApproved: true, heldForReview: false });
        } else {
          approverEmails = await createApprovalRequests(ctx, inserted.id, ev);
          results.push({ id: inserted.id, status: "pending", code: null, entryCode: null, autoApproved: false, heldForReview: false });
        }
      }
      ctx.invalidateQueries();
      return { ids, results, skipped, approverEmails, verificationRequests };
    },
  }),

  registerWalkIn: defineAction({
    description: "On-site walk-in registration at the door: a greeter (or admin) on the check-in screen registers someone who just showed up — name, email, and phone if given. Only for events whose 'Accept walk-ins' setting is on (default off; the organizer controls it per event). The registration is created immediately and decided by the event's normal rules: auto-approve events and trusted participants are confirmed on the spot with a pass; everyone else goes to the approvers (a full event waitlists). Frozen accounts hold auto-approvals as usual. The walk-in receives an email confirmation — composed and returned here per the prototype mail posture — with the event details, a link to the app / their pass, and their pass code when confirmed. Door features are paid-plan: on Free this returns the upgrade prompt. Staff (admin or greeter) of the organization only.",
    request: z.object({
      orgId: z.number().int().positive().default(1), eventId: z.number().int().positive(),
      name: z.string().min(1).max(120), email: z.string().email().max(200), phone: z.string().max(40).optional(),
      appUrl: z.string().max(500).default(""),
      ...requesterArgs,
    }),
    response: z.object({ id: z.number(), status: z.enum(["pending", "approved", "waitlisted"]), code: z.string().nullable(), entryCode: z.string().nullable(), autoApproved: z.boolean(), heldForReview: z.boolean(), confirmationSubject: z.string(), confirmationBody: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const isStaff = (await isAuthorizedAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail)) || (await isAuthorizedGatekeeper(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail));
      if (!isStaff) throw new Error("Only this organization's administrators and greeters can register a walk-in.");
      await assertPaidAllowed(ctx, args.orgId, "Walk-in registration at the door");
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      if ((ev as { walkInRegistration?: number }).walkInRegistration !== 1) throw new Error(`Walk-in registration is off for “${ev.title}” — the organizer can turn on “Accept walk-ins” in the event's Advanced options.`);
      if ((ev.status ?? "published") !== "published") throw new Error("This event isn't open for registration.");
      if (ev.registrationEnabled === 0) throw new Error("Registration isn't enabled for this event.");
      const org = await getOrgRow(ctx, args.orgId);
      const orgName = org?.name ?? "Organization";
      const mod = await moderateTexts(ctx, [args.name, args.email]);
      const db = ctx.db<typeof schema>();
      const phone = args.phone?.trim();
      const enc = await encryptFields(ctx, [args.name.trim(), args.email.trim().toLowerCase(), phone ? phone : null, null, null, JSON.stringify([]), null]);
      const hash = await emailIndex(ctx, args.email);
      // Attendee flag for this organization: blacklisted people are
      // refused at the door too, with the same plain message (the
      // flag is never named); alert-flagged walk-ins skip the
      // auto-confirm shortcuts and go to the approvers.
      const attendeeFlag = await getAttendeeFlag(ctx, args.orgId, hash);
      if (attendeeFlag?.flagType === "blacklist") throw new Error(BLACKLIST_REFUSAL);
      const flagAlert = attendeeFlag?.flagType === "alert";
      // Who is registering them: the signed-in staff member at the door.
      let staffName = args.requestedByEmail ?? "Door staff";
      const callerEmail = (args.requestedByEmail ?? "").toLowerCase();
      const adminRows = await db.select({ displayName: schema.authorizedAdmins.displayName, email: schema.authorizedAdmins.email, googleId: schema.authorizedAdmins.googleId }).from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, args.orgId));
      const adminMatch = adminRows.find((r) => (callerEmail && r.email.toLowerCase() === callerEmail) || (args.requestedByGoogleId && r.googleId === args.requestedByGoogleId));
      if (adminMatch?.displayName) staffName = adminMatch.displayName;
      else {
        const gkRows = await db.select({ displayName: schema.authorizedGatekeepers.displayName, email: schema.authorizedGatekeepers.email, googleId: schema.authorizedGatekeepers.googleId }).from(schema.authorizedGatekeepers).where(eq(schema.authorizedGatekeepers.orgId, args.orgId));
        const gkMatch = gkRows.find((r) => (callerEmail && r.email.toLowerCase() === callerEmail) || (args.requestedByGoogleId && r.googleId === args.requestedByGoogleId));
        if (gkMatch?.displayName) staffName = gkMatch.displayName;
      }
      const result = await db.insert(schema.registrations).values({
        eventId: args.eventId,
        name: enc[0]!, email: enc[1]!, emailHash: hash, phone: enc[2] ?? null, piiEncrypted: 1,
        proximityOptIn: 0, contactEmail: null, contactEmailHash: null,
        googleId: null, authProvider: "manual",
        registeredByName: staffName, registeredByEmail: args.requestedByEmail ?? null, registeredByGoogleId: args.requestedByGoogleId ?? null,
        notifyChannel: "email", status: "pending",
        faithAffiliation: null, hearAbout: null, securityListOptIn: null, customAnswers: enc[5] ?? "[]",
        held: mod.flagged ? 1 : 0, heldReason: mod.flagged ? mod.reason : "",
      }).returning({ id: schema.registrations.id });
      const inserted = result[0];
      if (!inserted) throw new Error("registerWalkIn: insert returned no rows");
      const appLink = args.appUrl.trim();
      const detailLines = [`${ev.title}`, `${ev.date} · ${ev.timeText}`, ev.locationType === "virtual" ? (ev.virtualLink ? `Online — ${ev.virtualLink}` : "Online event") : ev.location];
      const compose = (statusLine: string) => ({
        confirmationSubject: `${statusLine} — ${ev.title} at ${orgName}`,
        confirmationBody: [`Hello ${args.name.trim()},`, ``, `You were registered at the door for:`, ``, ...detailLines, ``, statusLine, ...(appLink ? [``, `See your registration and pass in Approved Guest: ${appLink}`] : []), ``, orgName].join("\n"),
      });
      if (mod.flagged) { ctx.invalidateQueries(); return { id: inserted.id, status: "pending" as const, code: null, entryCode: null, autoApproved: false, heldForReview: true, ...compose("Your walk-in registration is being reviewed by the event team — they'll confirm it shortly.") }; }
      if (await eventIsFull(ctx, ev)) {
        await db.update(schema.registrations).set({ status: "waitlisted" }).where(eq(schema.registrations.id, inserted.id));
        ctx.invalidateQueries();
        return { id: inserted.id, status: "waitlisted" as const, code: null, entryCode: null, autoApproved: false, heldForReview: false, ...compose(`${ev.title} is at capacity right now, so you're on the waitlist — if a spot opens, you'll be offered it by email.`) };
      }
      const frozen = freezeState(org).frozen;
      const trusted = !flagAlert && (await isTrustedParticipant(ctx, ev.orgId, hash, null));
      if ((ev.autoApprove === 1 && !flagAlert) || trusted) {
        if (frozen) {
          await db.update(schema.registrations).set({ decidedVia: FROZEN_HOLD_VIA }).where(eq(schema.registrations.id, inserted.id));
          ctx.invalidateQueries();
          return { id: inserted.id, status: "pending" as const, code: null, entryCode: null, autoApproved: false, heldForReview: false, ...compose("Your walk-in registration is in — confirmation is briefly held and will be completed by the event team.") };
        }
        const regRows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, inserted.id)).limit(1);
        const { code, entryCode } = await applyApprovalDecision(ctx, regRows[0]!, "approved", ev.autoApprove === 1 ? "Walk-in at the door — auto-approved event" : "Walk-in at the door — trusted participant");
        ctx.invalidateQueries();
        return { id: inserted.id, status: "approved" as const, code, entryCode, autoApproved: true, heldForReview: false, ...compose(`You're confirmed — welcome in! Your pass code is ${code ?? ""}${entryCode ? ` and your entry code is ${entryCode}` : ""}. Show the code at the door, or open your pass in the app.`) };
      }
      await createApprovalRequests(ctx, inserted.id, ev);
      ctx.invalidateQueries();
      return { id: inserted.id, status: "pending" as const, code: null, entryCode: null, autoApproved: false, heldForReview: false, ...compose("Your walk-in registration is in — it's Tentative while an approver confirms it. Watch your email: once approved, your pass will be sent to this address.") };
    },
  }),

  /* ---------- Admin: registrations within one organization ---------- */

  listRegistrations: defineAction({
    description: "Lists one organization's registrations with event details, newest first — decrypted for display. Admin or gatekeeper of that organization only (gatekeepers use it for the door guest list; reports and exports stay admin-only). Registrations from other organizations are never included.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ registrations: z.array(registrationShape) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireStaff(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
        .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
        .where(eq(schema.events.orgId, args.orgId))
        .orderBy(desc(schema.registrations.id));
      const plain = await decryptRegs(ctx, rows.map((r) => r.reg));
      const orgName = await getOrgName(ctx, args.orgId);
      const groupNames = groupNamesFor(rows.map((r) => r.reg), plain);
      const verified = await verifiedHashSet(ctx, rows.map((r) => r.reg.emailHash).filter((h): h is string => !!h));
      const HELD_PLAIN: PlainReg = { name: "(held for moderation review)", email: "", phone: null, faithAffiliation: null, hearAbout: null, customAnswers: [], contactEmail: null };
      const attachMap = await attachmentsByEvent(ctx, args.orgId);
      // Attendee flags are attached for ADMINISTRATORS only — a
      // gatekeeper's door list never carries flag status.
      const isAdmin = await isAuthorizedAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const flags = isAdmin ? await attendeeFlagMap(ctx, args.orgId) : new Map<string, AttendeeFlagRow>();
      return { registrations: rows.map(({ reg, ev }) => { const f = reg.emailHash ? flags.get(reg.emailHash) : undefined; return toReg(reg, ev, orgName, reg.held === 1 ? HELD_PLAIN : plain.get(reg.id)!, reg.held === 1 ? [] : groupNames.get(reg.id) ?? [], !!reg.emailHash && verified.has(reg.emailHash), attachMap.get(reg.eventId) ?? [], f ? { flagType: f.flagType, reason: f.reason } : null); }) };
    },
  }),

  listModerationQueue: defineAction({
    description: "Admin-only moderation queue: registrations held because their name, email, or answers were flagged by content moderation. Held items never reach approvers, notifications, reports, or exports; an admin releases one into the normal flow or rejects it here.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ items: z.array(z.object({ id: z.number(), eventId: z.number(), eventTitle: z.string(), eventDate: z.string(), name: z.string(), email: z.string(), phone: z.string().nullable(), faithAffiliation: z.string().nullable(), hearAbout: z.string().nullable(), customAnswers: z.array(answerShape), heldReason: z.string(), createdAt: z.string() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
        .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
        .where(and(eq(schema.events.orgId, args.orgId), eq(schema.registrations.held, 1)))
        .orderBy(desc(schema.registrations.id));
      const plain = await decryptRegs(ctx, rows.map((r) => r.reg));
      return { items: rows.map(({ reg, ev }) => { const pl = plain.get(reg.id)!; return { id: reg.id, eventId: ev.id, eventTitle: ev.title, eventDate: ev.date, name: pl.name, email: pl.email, phone: pl.phone, faithAffiliation: pl.faithAffiliation, hearAbout: pl.hearAbout, customAnswers: pl.customAnswers, heldReason: reg.heldReason ?? "", createdAt: reg.createdAt.toISOString() }; }) };
    },
  }),

  resolveModeration: defineAction({
    description: "Admin-only: release a held registration into the normal flow (trusted participants are auto-approved; everyone else goes to the event's approvers) or reject it (marked denied, no pass).",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), decision: z.enum(["release", "reject"]), ...identityArgs }),
    response: z.object({ id: z.number(), status: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.id)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      const ev = await getEventRow(ctx, reg.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That registration belongs to a different organization.");
      if (reg.held !== 1) throw new Error("That registration is not held for moderation.");
      if (args.decision === "reject") {
        await db.update(schema.registrations).set({ held: 0, status: "denied", code: null, entryCode: null, decidedVia: "Rejected in moderation review", decidedAt: new Date() }).where(eq(schema.registrations.id, reg.id));
        ctx.invalidateQueries();
        return { id: reg.id, status: "denied" };
      }
      await db.update(schema.registrations).set({ held: 0, heldReason: "" }).where(eq(schema.registrations.id, reg.id));
      if (reg.status === "approved" || reg.status === "checked_in") {
        // Already confirmed before the hold (e.g. held by a blacklist
        // flag): releasing the hold simply restores the existing pass —
        // no new approver step, no new code.
        ctx.invalidateQueries();
        return { id: reg.id, status: reg.status };
      }
      if (await isFreePlanOrg(ctx, ev.orgId)) {
        // Free plan: a released registration is simply an RSVP —
        // confirmed with no approval step and no pass.
        await confirmFreeRsvp(ctx, reg.id);
        ctx.invalidateQueries();
        return { id: reg.id, status: "approved" };
      }
      const trusted = await isTrustedParticipant(ctx, ev.orgId, reg.emailHash ?? "", reg.googleId);
      if (trusted && freezeState(await getOrgRow(ctx, ev.orgId)).frozen) {
        // Frozen account: the auto-approval is held for the repair batch.
        await db.update(schema.registrations).set({ decidedVia: FROZEN_HOLD_VIA }).where(eq(schema.registrations.id, reg.id));
        ctx.invalidateQueries();
        return { id: reg.id, status: "pending" };
      }
      if (trusted) {
        const fresh = (await db.select().from(schema.registrations).where(eq(schema.registrations.id, reg.id)).limit(1))[0]!;
        await applyApprovalDecision(ctx, fresh, "approved", "Trusted participant — auto-approved");
        ctx.invalidateQueries();
        return { id: reg.id, status: "approved" };
      }
      await createApprovalRequests(ctx, reg.id, ev);
      ctx.invalidateQueries();
      return { id: reg.id, status: "pending" };
    },
  }),

  setApproval: defineAction({
    description: "Approves or denies a pending registration. Approval issues the attendee's unique pass code. Admin of the registration's organization only. Approvals are a paid-plan feature — on the Free plan registrations are plain RSVPs with no approval step, so this returns the freemium upgrade prompt.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), decision: z.enum(["approved", "denied"]), ...identityArgs }),
    response: z.object({ id: z.number(), status: z.enum(["approved", "denied"]), code: z.string().nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertPaidAllowed(ctx, args.orgId, "Approvals");
      await assertSensitiveAuth(ctx, args.adminGoogleId, args.adminEmail, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.id)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      if (reg.held === 1) throw new Error("That registration is held for moderation review — release or reject it from the moderation queue first.");
      if (args.decision === "approved" && freezeState(await getOrgRow(ctx, args.orgId)).frozen) throw new Error("This account is frozen — a payment failed and the 1-week grace window has passed, so approvals are paused (registration stays open). Once the owner repairs the payment, approvals resume and any held auto-approvals are processed automatically.");
      const ev = await getEventRow(ctx, reg.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That registration belongs to a different organization.");
      if (args.decision === "approved" && ev.capacity !== null && ev.capacity !== undefined && reg.status !== "approved" && reg.status !== "checked_in") {
        const taken = await eventSeatsTaken(ctx, ev.id, reg.id);
        if (taken >= ev.capacity) throw new Error(`“${ev.title}” is full (${ev.capacity} confirmed) — confirming this registration would overbook it. Raise the capacity, or leave them tentative; if a confirmed spot opens, waitlisted attendees are offered it first.`);
      }
      const { code } = await applyApprovalDecision(ctx, reg, args.decision, "Admin review");
      if (args.decision === "denied") await promoteWaitlist(ctx, reg.eventId);
      ctx.invalidateQueries();
      return { id: args.id, status: args.decision, code };
    },
  }),

  listApprovalRequests: defineAction({
    description: "Lists the approval-request emails for one organization's registrations — one per approver, each with its tokenized links. Admin of that organization only: the tokens are live credentials.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({
      requests: z.array(z.object({
        id: z.number(), registrationId: z.number(), approverEmail: z.string(), token: z.string(),
        createdAt: z.string(), expiresAt: z.string(), usedAt: z.string().nullable(), decision: z.enum(["approved", "denied"]).nullable(),
        attendeeName: z.string(), attendeeEmail: z.string(), attendeePhone: z.string().nullable(),
        attendeeContactEmail: z.string().nullable(), registeredByName: z.string().nullable(), registeredByEmail: z.string().nullable(),
        faithAffiliation: z.string().nullable(), hearAbout: z.string().nullable(), securityListOptIn: z.boolean().nullable(),
        customAnswers: z.array(answerShape),
        eventTitle: z.string(), eventDate: z.string(), eventTimeText: z.string(), eventLocation: z.string(),
        registrationStatus: statusEnum,
        // Attendee flag marking for the approver (admin-facing only —
        // this action is admin-gated; the emailed approval links and
        // the attendee never see flag status).
        attendeeFlagType: z.enum(["blacklist", "alert"]).nullable(),
        attendeeFlagReason: z.string(),
      })),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ req: schema.approvalRequests, reg: schema.registrations, ev: schema.events })
        .from(schema.approvalRequests)
        .innerJoin(schema.registrations, eq(schema.approvalRequests.registrationId, schema.registrations.id))
        .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
        .where(eq(schema.events.orgId, args.orgId))
        .orderBy(desc(schema.approvalRequests.id));
      const plain = await decryptRegs(ctx, rows.map((r) => r.reg));
      const flags = await attendeeFlagMap(ctx, args.orgId);
      return {
        requests: rows.map(({ req, reg, ev }) => {
          const p = plain.get(reg.id)!;
          const f = reg.emailHash ? flags.get(reg.emailHash) : undefined;
          return {
            id: req.id, registrationId: reg.id, approverEmail: req.approverEmail, token: req.token,
            createdAt: req.createdAt.toISOString(), expiresAt: req.expiresAt.toISOString(),
            usedAt: req.usedAt ? req.usedAt.toISOString() : null,
            decision: (req.decision as "approved" | "denied" | null) ?? null,
            attendeeName: p.name, attendeeEmail: p.email, attendeePhone: p.phone,
            attendeeContactEmail: p.contactEmail, registeredByName: reg.registeredByName ?? null, registeredByEmail: reg.registeredByEmail ?? null,
            faithAffiliation: p.faithAffiliation, hearAbout: p.hearAbout,
            securityListOptIn: reg.securityListOptIn === "yes" ? true : reg.securityListOptIn === "no" ? false : null,
            customAnswers: p.customAnswers,
            eventTitle: ev.title, eventDate: ev.date, eventTimeText: ev.timeText, eventLocation: ev.location,
            registrationStatus: reg.status as z.infer<typeof statusEnum>,
            attendeeFlagType: f?.flagType ?? null,
            attendeeFlagReason: f?.reason ?? "",
          };
        }),
      };
    },
  }),

  resendApprovalRequests: defineAction({
    description: "Re-sends the approval-request emails for a pending registration: fresh tokens are issued to the event's approvers and the links in earlier emails stop working. Admin of the registration's organization only.",
    request: z.object({ registrationId: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ approverEmails: z.array(z.string()) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertPaidAllowed(ctx, args.orgId, "Approval emails");
      const db = ctx.db<typeof schema>();
      const regRows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.registrationId)).limit(1);
      const reg = regRows[0];
      if (!reg) throw new Error("Registration not found.");
      if (reg.status !== "pending") throw new Error("This registration has already been decided — approval emails only go out while it's pending.");
      const ev = await getEventRow(ctx, reg.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That registration belongs to a different organization.");
      const approverEmails = await createApprovalRequests(ctx, reg.id, ev);
      ctx.invalidateQueries();
      return { approverEmails };
    },
  }),

  decideByEmailToken: defineAction({
    description: "Approves or denies a registration from an approval-request email link. The token in the link is the credential — no sign-in is needed. First decision wins: if the registration was already decided, the current outcome is returned instead of changing anything.",
    request: z.object({ token: z.string().min(8).max(200), decision: z.enum(["approved", "denied"]) }),
    response: z.object({
      outcome: z.enum(["approved", "denied", "already_decided", "invalid", "expired", "event_full", "account_frozen"]),
      attendeeName: z.string().nullable(), eventTitle: z.string().nullable(), eventDate: z.string().nullable(), eventTimeText: z.string().nullable(),
      status: statusEnum.nullable(), code: z.string().nullable(), approverEmail: z.string().nullable(),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ outcome: "approved" | "denied" | "already_decided" | "invalid" | "expired" | "event_full" | "account_frozen"; attendeeName: string | null; eventTitle: string | null; eventDate: string | null; eventTimeText: string | null; status: z.infer<typeof statusEnum> | null; code: string | null; approverEmail: string | null }> {
      const db = ctx.db<typeof schema>();
      const empty = { attendeeName: null, eventTitle: null, eventDate: null, eventTimeText: null, status: null, code: null, approverEmail: null };
      const reqRows = await db.select().from(schema.approvalRequests).where(eq(schema.approvalRequests.token, args.token.trim())).limit(1);
      const req = reqRows[0];
      if (!req) return { outcome: "invalid", ...empty };
      const joined = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations).innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id)).where(eq(schema.registrations.id, req.registrationId)).limit(1);
      const hit = joined[0];
      if (!hit) return { outcome: "invalid", ...empty };
      const { reg, ev } = hit;
      const plain = await decryptRegs(ctx, [reg]);
      const p = plain.get(reg.id)!;
      const base = { attendeeName: p.name, eventTitle: ev.title, eventDate: ev.date, eventTimeText: ev.timeText, status: reg.status as z.infer<typeof statusEnum>, code: reg.code, approverEmail: req.approverEmail };
      if (req.usedAt || reg.status !== "pending") return { outcome: "already_decided", ...base };
      if (req.expiresAt.getTime() < Date.now()) return { outcome: "expired", ...base };
      if (args.decision === "approved" && freezeState(await getOrgRow(ctx, ev.orgId)).frozen) return { outcome: "account_frozen", ...base };
      if (args.decision === "approved" && ev.capacity !== null && ev.capacity !== undefined && (await eventSeatsTaken(ctx, ev.id, reg.id)) >= ev.capacity) return { outcome: "event_full", ...base };
      await db.update(schema.approvalRequests).set({ usedAt: new Date(), decision: args.decision }).where(eq(schema.approvalRequests.id, req.id));
      const { code } = await applyApprovalDecision(ctx, reg, args.decision, `Email link · ${req.approverEmail}`);
      ctx.invalidateQueries();
      return { outcome: args.decision, ...base, status: args.decision, code };
    },
  }),

  revokeAttendance: defineAction({
    description: "Revokes an approved or checked-in registration. Clears its pass code so the old code no longer verifies at check-in. Admin of the registration's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ id: z.number(), status: z.literal("revoked") }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ id: number; status: "revoked" }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertSensitiveAuth(ctx, args.adminGoogleId, args.adminEmail, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.id)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      const ev = await getEventRow(ctx, reg.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That registration belongs to a different organization.");
      await db.update(schema.registrations).set({ status: "revoked", prevStatus: reg.status, code: null, entryCode: null, checkedInAt: null, decidedAt: new Date(), decidedVia: "Admin review" }).where(eq(schema.registrations.id, args.id));
      await markApprovalRequestsUsed(ctx, args.id);
      await promoteWaitlist(ctx, reg.eventId);
      ctx.invalidateQueries();
      return { id: args.id, status: "revoked" };
    },
  }),

  updateRegistration: defineAction({
    description: "Edits an attendee's name, email, and phone on a registration (stored encrypted; the email blind index is refreshed). Admin of the registration's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), name: z.string().min(1).max(120), email: z.string().email().max(200), phone: z.string().max(40).nullable().optional(), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.id)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      const ev = await getEventRow(ctx, reg.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That registration belongs to a different organization.");
      const phone = args.phone?.trim();
      const enc = await encryptFields(ctx, [args.name.trim(), args.email.trim().toLowerCase(), phone ? phone : null]);
      const hash = await emailIndex(ctx, args.email);
      await db.update(schema.registrations).set({ name: enc[0]!, email: enc[1]!, emailHash: hash, phone: enc[2] ?? null, piiEncrypted: 1 }).where(eq(schema.registrations.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  deleteRegistration: defineAction({
    description: "Removes a registration entirely. Admin of the registration's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.id)).limit(1);
      const reg = rows[0];
      if (reg) {
        const ev = await getEventRow(ctx, reg.eventId);
        if (!ev || ev.orgId !== args.orgId) throw new Error("That registration belongs to a different organization.");
      }
      await db.delete(schema.approvalRequests).where(eq(schema.approvalRequests.registrationId, args.id));
      await db.delete(schema.registrations).where(eq(schema.registrations.id, args.id));
      if (reg) await promoteWaitlist(ctx, reg.eventId);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  cancelMyRegistration: defineAction({
    description: "An attendee cancels their OWN registration — whether confirmed, tentative, checked in, or waitlisted. Identity is verified the same way as the other attendee self-service actions (the registration's Google ID, or its email via the blind index — no admin involved). The seat is released (the waitlist is promoted), the pass code is cleared, the previous status is remembered in prev_status so the cancellation can be undone, and the cancellation is recorded as 'Cancelled by attendee'.",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional() }),
    response: z.object({ ok: z.literal(true), previousStatus: statusEnum }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; previousStatus: z.infer<typeof statusEnum> }> {
      const db = ctx.db<typeof schema>();
      const reg = (await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.registrationId)))[0];
      if (!reg) throw new Error("Registration not found.");
      let verified = !!(args.googleId && reg.googleId && reg.googleId === args.googleId);
      if (!verified && args.email) { const hash = await emailIndex(ctx, args.email); verified = reg.emailHash === hash || reg.contactEmailHash === hash; }
      if (!verified) throw new Error("That sign-in doesn't match this registration — sign in with the account or email used to register.");
      if (!["pending", "approved", "checked_in", "waitlisted"].includes(reg.status)) throw new Error("This registration can't be cancelled — it's already closed.");
      const prev = reg.status as z.infer<typeof statusEnum>;
      await db.update(schema.registrations).set({ status: "cancelled", prevStatus: prev, code: null, entryCode: null, checkedInAt: null, waitlistOfferedAt: null, waitlistExpiresAt: null, decidedAt: new Date(), decidedVia: "Cancelled by attendee" }).where(eq(schema.registrations.id, reg.id));
      await markApprovalRequestsUsed(ctx, reg.id);
      await promoteWaitlist(ctx, reg.eventId);
      ctx.invalidateQueries();
      return { ok: true, previousStatus: prev };
    },
  }),

  restoreMyRegistration: defineAction({
    description: "Undoes an attendee's own cancellation (or an admin revocation/cancellation) while undo is offered: restores the status remembered in prev_status. A confirmed seat is only restored when the event still has room — otherwise the registration returns to the waitlist rather than overbooking. Identity verified like cancelMyRegistration. A restored approval gets a fresh pass code (the old one was cleared).",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional(), ...identityArgs }),
    response: z.object({ ok: z.literal(true), status: statusEnum }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const reg = (await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.registrationId)))[0];
      if (!reg) throw new Error("Registration not found.");
      // Attendee self-restore (their identity) or an admin of the org.
      let verified = !!(args.googleId && reg.googleId && reg.googleId === args.googleId);
      if (!verified && args.email) { const hash = await emailIndex(ctx, args.email); verified = reg.emailHash === hash || reg.contactEmailHash === hash; }
      const ev = await getEventRow(ctx, reg.eventId);
      if (!verified && ev) verified = await isAuthorizedAdmin(ctx, ev.orgId, args.adminGoogleId, args.adminEmail);
      if (!verified) throw new Error("That sign-in doesn't match this registration.");
      if (reg.status !== "cancelled" && reg.status !== "revoked") throw new Error("This registration isn't cancelled — there's nothing to undo.");
      // A REVOKED pass was an organizer decision — only an admin can
      // undo that. Attendees can only undo their own cancellation.
      if (reg.status === "revoked" && !(ev && (await isAuthorizedAdmin(ctx, ev.orgId, args.adminGoogleId, args.adminEmail)))) throw new Error("This pass was cancelled by the organizer — only they can restore it. Contact the organizer if that was a mistake.");
      if (!reg.prevStatus) throw new Error("This cancellation can't be undone automatically — contact the organizer.");
      if (!ev) throw new Error("That event no longer exists.");
      let target = reg.prevStatus as z.infer<typeof statusEnum>;
      if ((target === "approved" || target === "checked_in") && ev.capacity !== null && ev.capacity !== undefined) {
        const taken = await eventSeatsTaken(ctx, ev.id, reg.id);
        if (taken >= ev.capacity) target = "waitlisted";
      }
      if (target === "checked_in") target = "approved";
      let code: string | null = null;
      let entryCode: string | null = null;
      if (target === "approved") {
        if (reg.codeSharing === "shared" && reg.groupId) {
          const sibs = await db.select({ code: schema.registrations.code }).from(schema.registrations).where(eq(schema.registrations.groupId, reg.groupId));
          code = sibs.find((s) => s.code)?.code ?? null;
        }
        const org = await getOrgRow(ctx, ev.orgId);
        for (let attempt = 0; attempt < 5 && !code; attempt++) {
          const candidate = makeCode(org?.codePrefix ?? "EVT");
          const clash = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.code, candidate)).limit(1);
          if (clash.length === 0) code = candidate;
        }
        // Restoring the pass on an entry-code event restores an entry
        // code too (a fresh one — the old one was cleared on cancel).
        if ((ev as { produceEntryCode?: number }).produceEntryCode === 1) entryCode = await issueEntryCode(ctx, reg);
      }
      await db.update(schema.registrations).set({ status: target, code, entryCode, prevStatus: null, checkedInAt: null, decidedVia: "Cancellation undone" }).where(eq(schema.registrations.id, reg.id));
      ctx.invalidateQueries();
      return { ok: true as const, status: target };
    },
  }),

  restoreRegistrationSnapshot: defineAction({
    description: "Admin undo for a DELETED registration: re-creates the registration from the snapshot the admin UI captured just before deleting (same id, event, status, and pass code; PII is re-encrypted on the way in). If a row with that id exists again, it is restored in place instead. Admin of the event's organization only.",
    request: z.object({
      snapshot: z.object({
        id: z.number().int().positive(), eventId: z.number().int().positive(), name: z.string().min(1).max(120), email: z.string().email().max(200), phone: z.string().max(40).nullable(),
        status: statusEnum, code: z.string().max(40).nullable(), notifyChannel: z.enum(["email", "text", "both"]).default("email"),
        groupId: z.string().max(100).nullable().default(null), codeSharing: z.string().max(20).default("individual"),
      }),
      orgId: z.number().int().positive(), ...identityArgs,
    }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const s = args.snapshot;
      const ev = await getEventRow(ctx, s.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event belongs to a different organization.");
      const db = ctx.db<typeof schema>();
      const enc = await encryptFields(ctx, [s.name, s.email.toLowerCase(), s.phone]);
      const hash = await emailIndex(ctx, s.email);
      const existing = (await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.id, s.id)))[0];
      const values = { name: enc[0]!, email: enc[1]!, emailHash: hash, phone: enc[2] ?? null, piiEncrypted: 1, status: s.status, code: s.code, notifyChannel: s.notifyChannel, groupId: s.groupId, codeSharing: s.codeSharing, decidedVia: "Restored by admin undo" };
      if (existing) await db.update(schema.registrations).set(values).where(eq(schema.registrations.id, s.id));
      else await db.insert(schema.registrations).values({ id: s.id, eventId: s.eventId, ...values });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  updateOrgFeatures: defineAction({
    description: "Sets the advanced features an organization has switched on (progressive disclosure): the keys chosen in onboarding or later in Admin → More options. Core features always work regardless; this list only controls which advanced surfaces the organization sees. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), features: z.array(z.string().max(40)).max(30), ...identityArgs }),
    response: z.object({ ok: z.literal(true), features: z.array(z.string()) }),
    async handler(ctx, args): Promise<{ ok: true; features: string[] }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const clean = [...new Set(args.features.map((f) => f.trim()).filter(Boolean))];
      await db.update(schema.organizations).set({ features: JSON.stringify(clean) }).where(eq(schema.organizations.id, args.orgId));
      ctx.invalidateQueries();
      return { ok: true, features: clean };
    },
  }),

  spellcheckEventText: defineAction({
    description: "Pre-publish sanity check for spelling: reviews an event's title, description, and location (plus the organization name when given) with a model and returns likely misspellings with suggested corrections. It only reports — the admin applies a fix explicitly (the publish review offers one-tap fixes that call updateEvent). Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), title: z.string().max(200), description: z.string().max(1000).default(""), location: z.string().max(200).default(""), orgName: z.string().max(200).default(""), ...identityArgs }),
    response: z.object({ issues: z.array(z.object({ field: z.enum(["title", "description", "location", "orgName"]), original: z.string(), suggestion: z.string(), context: z.string() })), available: z.boolean() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      try {
        const out = await ctx.inference.complete(
          [
            `You are a careful proofreader for an event-registration app. Check ONLY for genuine misspellings (wrong letters, typos, missing/extra letters) in these short texts. Ignore: proper names of people, unusual-but-plausible place or organization names, stylistic choices, capitalization, punctuation, and grammar. When in doubt, report nothing — false alarms are worse than a miss.`,
            `Organization name: "${args.orgName}"`,
            `Event title: "${args.title}"`,
            `Event description: "${args.description}"`,
            `Event location: "${args.location}"`,
            `For each likely misspelling: the field, the misspelled word or phrase exactly as written (original), the corrected spelling (suggestion), and a few words of surrounding context.`,
          ].join("\n"),
          { schema: z.object({ issues: z.array(z.object({ field: z.enum(["title", "description", "location", "orgName"]), original: z.string(), suggestion: z.string(), context: z.string() })) }) },
        );
        return { issues: out.issues.filter((i) => i.original.trim() && i.suggestion.trim() && i.original !== i.suggestion).slice(0, 8), available: true };
      } catch {
        return { issues: [], available: false };
      }
    },
  }),

  listMyEventNotices: defineAction({
    description: "An attendee's event cancellation notices for one organization: every notice created when an event they registered for was cancelled or deleted — the mode (announcement with the organizer's message, or quiet/plain), the event snapshot, and whether the event was deleted. Matched by the registration's Google ID or the email blind index, including notices whose registration was deleted with the event. Drives the cancellation cards (and calendar-cancellation downloads) in My Events.",
    request: z.object({ orgId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional() }),
    response: z.object({ notices: z.array(z.object({ id: z.number(), eventId: z.number(), eventTitle: z.string(), eventDate: z.string(), mode: z.enum(["announcement", "quiet"]), message: z.string(), eventDeleted: z.boolean(), createdAt: z.string() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const regIds = new Set<number>();
      if (args.googleId) {
        const regs = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(eq(schema.registrations.googleId, args.googleId));
        for (const r of regs) regIds.add(r.id);
      }
      let hash: string | null = null;
      if (args.email) hash = await emailIndex(ctx, args.email);
      if (regIds.size === 0 && !hash) return { notices: [] };
      const rows = await db.select().from(schema.eventNotices).where(eq(schema.eventNotices.orgId, args.orgId)).orderBy(desc(schema.eventNotices.id));
      const mine = rows.filter((n) => (n.registrationId !== null && regIds.has(n.registrationId)) || (hash !== null && n.emailHash === hash));
      return { notices: mine.slice(0, 20).map((n) => ({ id: n.id, eventId: n.eventId, eventTitle: n.eventTitle, eventDate: n.eventDate, mode: (n.mode ?? "quiet") as "announcement" | "quiet", message: n.message ?? "", eventDeleted: n.eventDeleted === 1, createdAt: n.createdAt ? n.createdAt.toISOString() : "" })) };
    },
  }),

  /* ---------- Attendee lookups (scoped to one organization) ---------- */

  lookupByEmail: defineAction({
    description: "Finds an attendee's registrations by email within one organization, so they can see status and pass. Matched through the encrypted email blind index — the address itself is never stored in the clear.",
    request: z.object({ email: z.string().email().max(200), orgId: z.number().int().positive().default(1) }),
    response: z.object({ registrations: z.array(registrationShape) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const hash = await emailIndex(ctx, args.email);
      const rows = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
        .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
        .where(and(or(eq(schema.registrations.emailHash, hash), eq(schema.registrations.contactEmailHash, hash)), eq(schema.events.orgId, args.orgId), isNull(schema.events.deletedAt)))
        .orderBy(desc(schema.registrations.id));
      // Rows written before the blind index existed are migrated on read;
      // re-run the lookup once if the first pass found nothing but legacy
      // rows for this org were just migrated.
      if (rows.length === 0) {
        const legacy = await db.select({ reg: schema.registrations }).from(schema.registrations)
          .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
          .where(and(eq(schema.events.orgId, args.orgId), eq(schema.registrations.piiEncrypted, 0)));
        if (legacy.length > 0) {
          await migratePlaintextRegs(ctx, legacy.map((r) => r.reg));
          const retry = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
            .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
            .where(and(or(eq(schema.registrations.emailHash, hash), eq(schema.registrations.contactEmailHash, hash)), eq(schema.events.orgId, args.orgId), isNull(schema.events.deletedAt)))
            .orderBy(desc(schema.registrations.id));
          const plain = await decryptRegs(ctx, retry.map((r) => r.reg));
          const orgName = await getOrgName(ctx, args.orgId);
          const groupNames = groupNamesFor(retry.map((r) => r.reg), plain);
          const verified = await verifiedHashSet(ctx, retry.map((r) => r.reg.emailHash).filter((h): h is string => !!h));
          const attachMap = await attachmentsByEvent(ctx, args.orgId);
          return { registrations: retry.map(({ reg, ev }) => toReg(reg, ev, orgName, plain.get(reg.id)!, groupNames.get(reg.id) ?? [], !!reg.emailHash && verified.has(reg.emailHash), attachMap.get(reg.eventId) ?? [])) };
        }
        return { registrations: [] };
      }
      const plain = await decryptRegs(ctx, rows.map((r) => r.reg));
      const orgName = await getOrgName(ctx, args.orgId);
      const groupNames = groupNamesFor(rows.map((r) => r.reg), plain);
      const verified = await verifiedHashSet(ctx, rows.map((r) => r.reg.emailHash).filter((h): h is string => !!h));
      const attachMap = await attachmentsByEvent(ctx, args.orgId);
      return { registrations: rows.map(({ reg, ev }) => toReg(reg, ev, orgName, plain.get(reg.id)!, groupNames.get(reg.id) ?? [], !!reg.emailHash && verified.has(reg.emailHash), attachMap.get(reg.eventId) ?? [])) };
    },
  }),

  lookupMyRegistrations: defineAction({
    description: "Finds registrations for a Google-signed-in user by Google ID or email within one organization, so they see their events and QR passes after login.",
    request: z.object({ googleId: z.string().max(200).optional(), email: z.string().max(200).optional(), orgId: z.number().int().positive().default(1) }),
    response: z.object({ registrations: z.array(registrationShape) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const gid = args.googleId?.trim();
      const em = args.email?.trim().toLowerCase();
      if (!gid && !em) return { registrations: [] };
      const hash = em ? await emailIndex(ctx, em) : null;
      const idCond = gid && hash ? or(eq(schema.registrations.googleId, gid), eq(schema.registrations.emailHash, hash), eq(schema.registrations.contactEmailHash, hash)) : gid ? eq(schema.registrations.googleId, gid) : or(eq(schema.registrations.emailHash, hash!), eq(schema.registrations.contactEmailHash, hash!));
      const rows = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
        .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
        .where(and(idCond, eq(schema.events.orgId, args.orgId), isNull(schema.events.deletedAt)))
        .orderBy(desc(schema.registrations.id));
      const plain = await decryptRegs(ctx, rows.map((r) => r.reg));
      const orgName = await getOrgName(ctx, args.orgId);
      const groupNames = groupNamesFor(rows.map((r) => r.reg), plain);
      const verified = await verifiedHashSet(ctx, rows.map((r) => r.reg.emailHash).filter((h): h is string => !!h));
      const attachMap = await attachmentsByEvent(ctx, args.orgId);
      return { registrations: rows.map(({ reg, ev }) => toReg(reg, ev, orgName, plain.get(reg.id)!, groupNames.get(reg.id) ?? [], !!reg.emailHash && verified.has(reg.emailHash), attachMap.get(reg.eventId) ?? [])) };
    },
  }),


  /* ---------- Event attachments ----------
     Admins attach files (agenda, handout, map…) to an event. Only
     CONFIRMED registrants of that event can see or open them —
     enforced here on every access, never just hidden in the UI. */

  addEventAttachment: defineAction({
    description: "Attaches a file to an event (agenda, handout, map…). The file is stored as an owned blob; only confirmed registrants of the event will be able to see or open it. Admin of the event's organization only. Files up to about 5 MB.",
    request: z.object({ eventId: z.number().int().positive(), orgId: z.number().int().positive().default(1), name: z.string().min(1).max(200), contentType: z.string().min(1).max(120), dataBase64: z.string().min(10).max(7_200_000), ...identityArgs }),
    response: z.object({ id: z.number(), name: z.string(), contentType: z.string(), sizeBytes: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const raw = args.dataBase64.includes(",") ? (args.dataBase64.split(",")[1] ?? "") : args.dataBase64;
      let bytes: Uint8Array;
      try { const bin = atob(raw); bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); } catch { throw new Error("That file could not be read."); }
      if (bytes.length < 1) throw new Error("That file looks empty.");
      if (bytes.length > 5_000_000) throw new Error("Please keep attachments under about 5 MB.");
      const key = `attachments/${args.eventId}-${makeApprovalToken().slice(4, 20)}`;
      await ctx.blobs.put(key, bytes, { contentType: args.contentType });
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.eventAttachments).values({ orgId: args.orgId, eventId: args.eventId, name: args.name.trim(), blobKey: key, contentType: args.contentType, sizeBytes: bytes.length }).returning({ id: schema.eventAttachments.id });
      const row = inserted[0];
      if (!row) throw new Error("Couldn't save the attachment.");
      ctx.invalidateQueries();
      return { id: row.id, name: args.name.trim(), contentType: args.contentType, sizeBytes: bytes.length };
    },
  }),

  listEventAttachments: defineAction({
    description: "Lists an event's attachments WITH open links, for the admin attachment manager. Admin of the event's organization only — attendee access goes through getAttachmentUrl, which checks confirmation.",
    request: z.object({ eventId: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ attachments: z.array(z.object({ id: z.number(), name: z.string(), contentType: z.string(), sizeBytes: z.number(), url: z.string(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventAttachments).where(eq(schema.eventAttachments.eventId, args.eventId)).orderBy(asc(schema.eventAttachments.id));
      const out = [];
      for (const r of rows) out.push({ id: r.id, name: r.name, contentType: r.contentType, sizeBytes: r.sizeBytes, url: await ctx.blobs.getUrl(r.blobKey), createdAt: r.createdAt.toISOString() });
      return { attachments: out };
    },
  }),

  deleteEventAttachment: defineAction({
    description: "Removes a file attached to an event. Confirmed registrants immediately lose access to it. Admin of the event's organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventAttachments).where(eq(schema.eventAttachments.id, args.id)).limit(1);
      const row = rows[0];
      if (!row || row.orgId !== args.orgId) throw new Error("Attachment not found in this organization.");
      await db.delete(schema.eventAttachments).where(eq(schema.eventAttachments.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getAttachmentUrl: defineAction({
    description: "Returns the open/download link for one event attachment — ONLY when the requester is allowed: a staff member (admin/greeter/registrant) of the organization, or a CONFIRMED registrant of that event (status approved or checked in), identified by the registration's Google ID or its email blind index (their own address or the group contact's). Tentative, waitlisted, and not-approved registrants are refused, as is everyone else.",
    request: z.object({ attachmentId: z.number().int().positive(), registrationId: z.number().int().positive().optional(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional(), requestedByGoogleId: z.string().max(200).optional(), requestedByEmail: z.string().email().max(200).optional() }),
    response: z.object({ url: z.string(), name: z.string(), contentType: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventAttachments).where(eq(schema.eventAttachments.id, args.attachmentId)).limit(1);
      const att = rows[0];
      if (!att) throw new Error("That file no longer exists.");
      // Staff of the organization may open event files.
      if (args.requestedByGoogleId || args.requestedByEmail) {
        try { await requireStaff(ctx, att.orgId, args.requestedByGoogleId, args.requestedByEmail); return { url: await ctx.blobs.getUrl(att.blobKey), name: att.name, contentType: att.contentType }; } catch { /* not staff — fall through to the registrant check */ }
      }
      // Confirmed registrants of THIS event only.
      const regs = await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, att.eventId));
      const hash = args.email ? await emailIndex(ctx, args.email) : null;
      const mine = regs.filter((r) => (r.status === "approved" || r.status === "checked_in") && ((args.registrationId !== undefined && r.id === args.registrationId) || (args.googleId && r.googleId === args.googleId) || (hash && (r.emailHash === hash || r.contactEmailHash === hash))));
      const match = args.registrationId !== undefined ? mine.find((r) => r.id === args.registrationId) : mine[0];
      if (!match) throw new Error("Event files are for confirmed guests only — this registration isn't confirmed for that event (tentative, waitlisted, and not-approved registrations can't open event files).");
      if (args.registrationId !== undefined && match.id !== args.registrationId) throw new Error("That registration isn't confirmed for this event.");
      return { url: await ctx.blobs.getUrl(att.blobKey), name: att.name, contentType: att.contentType };
    },
  }),


  /* ---------- Virtual event attendee sync ----------
     For VIRTUAL events, the confirmed (approved / checked-in) list
     becomes the door list in the conferencing platform: one-click
     CSV exports in Zoom / Microsoft Teams / Webex import layouts,
     plus a direct Zoom API sync when the organization has connected
     its Zoom account. Google Meet has no pre-approval list, so Meet
     events show an explanatory note instead (client-side). */

  exportVirtualAttendees: defineAction({
    description: "Exports a VIRTUAL event's confirmed attendees (approved + checked in) as a CSV in the chosen platform's import layout — Zoom (Email Address, First Name, Last Name), Microsoft Teams (Name, Email Address), or Webex (First Name, Last Name, Email Address) — ready to import so the approved list becomes the platform's door list. Tentative, waitlisted, not-approved, and held registrations are never exported. Admin of the event's organization only.",
    request: z.object({ eventId: z.number().int().positive(), orgId: z.number().int().positive().default(1), platform: z.enum(["zoom", "teams", "webex"]), ...identityArgs }),
    response: z.object({ csv: z.string(), filename: z.string(), count: z.number(), platform: z.enum(["zoom", "teams", "webex"]) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      if ((ev.locationType ?? "physical") !== "virtual") throw new Error("Attendee sync is for virtual events — this event is set to a physical location. (For in-person events, the greeter check-in list is the door list.)");
      const db = ctx.db<typeof schema>();
      const regs = (await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, ev.id))).filter((r) => (r.status === "approved" || r.status === "checked_in") && r.held !== 1);
      const plain = await decryptRegs(ctx, regs);
      const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
      const split = (name: string) => { const parts = name.trim().split(/\s+/); return { first: parts[0] ?? "", last: parts.slice(1).join(" ") }; };
      const lines: string[] = [];
      if (args.platform === "zoom") { lines.push("Email Address,First Name,Last Name"); for (const r of regs) { const p = plain.get(r.id)!; const n = split(p.name); lines.push([esc(p.email), esc(n.first), esc(n.last)].join(",")); } }
      else if (args.platform === "teams") { lines.push("Name,Email Address"); for (const r of regs) { const p = plain.get(r.id)!; lines.push([esc(p.name), esc(p.email)].join(",")); } }
      else { lines.push("First Name,Last Name,Email Address"); for (const r of regs) { const p = plain.get(r.id)!; const n = split(p.name); lines.push([esc(n.first), esc(n.last), esc(p.email)].join(",")); } }
      const slug = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "event";
      return { csv: lines.join("\r\n") + "\r\n", filename: `${slug}-attendees-${args.platform}.csv`, count: regs.length, platform: args.platform };
    },
  }),

  getZoomConnection: defineAction({
    description: "Reports whether the organization has connected a Zoom account for direct attendee sync, and whether a live API token is stored (in this prototype the connection is recorded without a live token — connecting production Zoom OAuth credentials is the go-live step). Admin only.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ connected: z.boolean(), email: z.string().nullable(), hasLiveToken: z.boolean() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, `zoom_connection_${args.orgId}`)).limit(1);
      if (!rows[0]) return { connected: false, email: null, hasLiveToken: false };
      try { const parsed = JSON.parse(rows[0].value) as { email?: string; accessToken?: string }; return { connected: true, email: parsed.email ?? null, hasLiveToken: !!(parsed.accessToken && parsed.accessToken.length > 10) }; }
      catch { return { connected: false, email: null, hasLiveToken: false }; }
    },
  }),

  connectZoom: defineAction({
    description: "Connects the organization's Zoom account for direct attendee sync. In production this is where the Zoom OAuth redirect returns and the access token is stored; in this prototype the connection (account email) is recorded so the sync flow is wired end to end, and the sync reports honestly that no live token is stored yet — the CSV export remains the working path. Admin only.",
    request: z.object({ orgId: z.number().int().positive().default(1), email: z.string().email().max(200), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const value = JSON.stringify({ email: args.email.trim().toLowerCase(), connectedAt: new Date().toISOString(), accessToken: "" });
      await db.insert(schema.appSettings).values({ key: `zoom_connection_${args.orgId}`, value }).onConflictDoUpdate({ target: schema.appSettings.key, set: { value } });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  disconnectZoom: defineAction({
    description: "Disconnects the organization's Zoom account (removes the recorded connection and any stored token). Admin only.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.appSettings).where(eq(schema.appSettings.key, `zoom_connection_${args.orgId}`));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  syncZoomRegistrants: defineAction({
    description: "Direct Zoom sync: adds the event's confirmed attendees as registrants to the Zoom meeting in the event's join link (POST /meetings/{id}/registrants per attendee) so the approved list becomes Zoom's door list. Requires a connected Zoom account with a live token; without one it reports exactly what's missing (needs_connection / prototype) and sends nothing — the CSV export is the fallback. Admin only.",
    request: z.object({ eventId: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ status: z.enum(["synced", "needs_connection", "prototype", "no_meeting"]), confirmedCount: z.number(), synced: z.number(), failed: z.number(), message: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertAdvancedAllowed(ctx, args.orgId, "Virtual meeting sync");
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      if ((ev.locationType ?? "physical") !== "virtual") throw new Error("Zoom sync is for virtual events.");
      const meetingMatch = (ev.virtualLink ?? "").match(/zoom\.us\/(?:j|wc)\/(\d+)/);
      const db = ctx.db<typeof schema>();
      const regs = (await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, ev.id))).filter((r) => (r.status === "approved" || r.status === "checked_in") && r.held !== 1);
      if (!meetingMatch) return { status: "no_meeting" as const, confirmedCount: regs.length, synced: 0, failed: 0, message: "This event's join link doesn't look like a Zoom meeting link (zoom.us/j/…) — add the Zoom link to the event to use the direct sync, or use a CSV export." };
      const connRows = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, `zoom_connection_${args.orgId}`)).limit(1);
      if (!connRows[0]) return { status: "needs_connection" as const, confirmedCount: regs.length, synced: 0, failed: 0, message: "Zoom isn't connected for this organization yet. Connect the Zoom account first (or use the CSV export)." };
      let token = "";
      try { token = (JSON.parse(connRows[0].value) as { accessToken?: string }).accessToken ?? ""; } catch { token = ""; }
      if (!token) return { status: "prototype" as const, confirmedCount: regs.length, synced: 0, failed: 0, message: `Zoom is connected in prototype mode — no live OAuth token is stored, so none of the ${regs.length} confirmed attendee${regs.length === 1 ? "" : "s"} were sent. Connect live Zoom credentials to enable the direct sync, or use the Zoom CSV export (it carries the same list).` };
      const plain = await decryptRegs(ctx, regs);
      let synced = 0; let failed = 0;
      for (const r of regs) {
        const p = plain.get(r.id)!;
        const parts = p.name.trim().split(/\s+/);
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);
          try {
            const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingMatch[1]}/registrants`, { method: "POST", signal: controller.signal, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: p.email, first_name: parts[0] ?? "", last_name: parts.slice(1).join(" ") }) });
            if (res.ok) synced += 1; else failed += 1;
          } finally { clearTimeout(timer); }
        } catch { failed += 1; }
      }
      return { status: "synced" as const, confirmedCount: regs.length, synced, failed, message: `Zoom sync finished: ${synced} registrant${synced === 1 ? "" : "s"} added to the meeting, ${failed} failed.` };
    },
  }),

  /* ---------- Door check-in ---------- */

  verifyCode: defineAction({
    description: "Verifies a pass code at the door / greeter check, scoped to one organization — a code from another organization never verifies here. Revoked registrations have no code, so their old codes return not found. When the typed code matches no pass code, it is also tried as an ENTRY code — the short numeric code confirmed registrations receive only for events whose 'Produce entry code' setting is on (viaEntryCode reports which credential matched). Returns attendee name, email, phone and event, and checks in when confirmCheckIn is true. Location-bound check-in: for a physical event with a venue pin and the location check required, the greeter's device coordinates (deviceLat/deviceLng) must be within the event's radius or the check-in is refused (locationBlocked + a plain-language message); an administrator of the organization may pass locationOverride with their identity to override one check-in. Virtual events have no door check-in at all (isVirtual).",
    request: z.object({ code: z.string().min(1).max(40), orgId: z.number().int().positive().default(1), confirmCheckIn: z.boolean().default(false), deviceLat: z.number().min(-90).max(90).optional(), deviceLng: z.number().min(-180).max(180).optional(), locationOverride: z.boolean().default(false), ...requesterArgs }),
    response: z.object({
      found: z.boolean(), name: z.string().nullable(), email: z.string().nullable(), phone: z.string().nullable(), eventTitle: z.string().nullable(), eventDate: z.string().nullable(), eventTimeText: z.string().nullable(), eventLocation: z.string().nullable(),
      status: statusEnum.nullable(), checkedInAt: z.string().nullable(),
      sharedCode: z.boolean(),
      viaEntryCode: z.boolean(),
      groupMembers: z.array(z.object({ id: z.number(), name: z.string(), status: statusEnum, checkedInAt: z.string().nullable() })),
      isVirtual: z.boolean(),
      locationEnforced: z.boolean(),
      locationBlocked: z.boolean(),
      locationDistanceM: z.number().nullable(),
      locationRadiusM: z.number(),
      locationMessage: z.string().nullable(),
      locationOverridden: z.boolean(),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await assertPaidAllowed(ctx, args.orgId, "QR pass verification and door check-in");
      const db = ctx.db<typeof schema>();
      const normalized = args.code.trim().toUpperCase();
      let viaEntryCode = false;
      let rows = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
        .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
        .where(and(eq(schema.registrations.code, normalized), eq(schema.events.orgId, args.orgId), isNull(schema.events.deletedAt)));
      if (rows.length === 0) {
        // Entry code fallback: a confirmed registration's short numeric
        // entry code verifies exactly like its pass code — but only
        // for events whose "Produce entry code" setting is on.
        const byEntry = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
          .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
          .where(and(eq(schema.registrations.entryCode, normalized), eq(schema.events.orgId, args.orgId), eq(schema.events.produceEntryCode, 1), isNull(schema.events.deletedAt)));
        if (byEntry.length > 0) { rows = byEntry; viaEntryCode = true; }
      }
      const hit = rows[0];
      if (!hit) return { found: false, name: null, email: null, phone: null, eventTitle: null, eventDate: null, eventTimeText: null, eventLocation: null, status: null, checkedInAt: null, sharedCode: false, viaEntryCode: false, groupMembers: [], isVirtual: false, locationEnforced: false, locationBlocked: false, locationDistanceM: null, locationRadiusM: 300, locationMessage: null, locationOverridden: false };
      const ev0 = hit.ev;
      // Location gate for any check-in attempted through this code.
      const locEval = evaluateCheckinLocation(ev0, args.deviceLat, args.deviceLng);
      let overridden = false;
      if (!locEval.allowed && !locEval.isVirtual && args.locationOverride) {
        // Only an administrator of the organization can override.
        if (await isAuthorizedAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail)) overridden = true;
      }
      const locFields = {
        isVirtual: locEval.isVirtual,
        locationEnforced: locEval.enforced,
        locationBlocked: !locEval.allowed && !overridden,
        locationDistanceM: locEval.distanceM,
        locationRadiusM: locEval.radiusM,
        locationMessage: overridden ? "Location check overridden by an administrator for this check-in." : (!locEval.allowed ? locEval.message : null),
        locationOverridden: overridden,
      };
      const canCheckIn = locEval.allowed || overridden;
      const plain = await decryptRegs(ctx, rows.map((r) => r.reg));
      const groupMembers = rows.map(({ reg }) => ({ id: reg.id, name: plain.get(reg.id)?.name ?? "", status: reg.status as z.infer<typeof statusEnum>, checkedInAt: reg.checkedInAt ? reg.checkedInAt.toISOString() : null }));
      const isShared = rows.length > 1 || hit.reg.codeSharing === "shared";
      if (isShared) {
        // Shared group code: list everyone it covers; each person is
        // checked in individually via checkInById so attendance stays
        // per-person. confirmCheckIn does not check in the whole group.
        const { reg, ev } = hit;
        const p = plain.get(reg.id)!;
        return { found: true, name: p.name, email: p.email, phone: p.phone, eventTitle: ev.title, eventDate: ev.date, eventTimeText: ev.timeText, eventLocation: ev.location, status: reg.status as z.infer<typeof statusEnum>, checkedInAt: reg.checkedInAt ? reg.checkedInAt.toISOString() : null, sharedCode: true, viaEntryCode, groupMembers, ...locFields };
      }
      const { reg, ev } = hit;
      const p = plain.get(reg.id)!;
      let status = reg.status as z.infer<typeof statusEnum>;
      let checkedInAt = reg.checkedInAt;
      if (args.confirmCheckIn && reg.status === "approved" && canCheckIn) {
        checkedInAt = new Date();
        await db.update(schema.registrations).set({ status: "checked_in", checkedInAt }).where(eq(schema.registrations.id, reg.id));
        status = "checked_in";
        ctx.invalidateQueries();
      }
      return { found: true, name: p.name, email: p.email, phone: p.phone, eventTitle: ev.title, eventDate: ev.date, eventTimeText: ev.timeText, eventLocation: ev.location, status, checkedInAt: checkedInAt ? checkedInAt.toISOString() : null, sharedCode: false, viaEntryCode, groupMembers, ...locFields };
    },
  }),

  checkInById: defineAction({
    description: "Checks in an approved attendee by registration id (door staff tapping the guest list). Caller must be staff (admin or greeter) of the registration's organization. Location-bound: for a physical event with a venue pin and the location check required, the device coordinates must be within the event's radius — otherwise the check-in is refused with the location message; an administrator (not a greeter) may pass locationOverride to override that one check-in. Virtual events have no check-in.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), deviceLat: z.number().min(-90).max(90).optional(), deviceLng: z.number().min(-180).max(180).optional(), locationOverride: z.boolean().default(false), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.id)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      const ev = await getEventRow(ctx, reg.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That registration belongs to a different organization.");
      await assertPaidAllowed(ctx, args.orgId, "Door check-in");
      // Staff of the host org — OR a greeter/admin of a facility org
      // holding an active GREETER grant for this event (cross-org
      // hosting: the facility works the host's door for this event).
      const hostStaff = (await isAuthorizedAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail)) || (await isAuthorizedGatekeeper(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail));
      if (!hostStaff) {
        const grants = await db.select().from(schema.eventShares).where(and(eq(schema.eventShares.eventId, ev.id), eq(schema.eventShares.grantGreeter, 1), isNull(schema.eventShares.revokedAt)));
        let facilityOk = false;
        for (const g of grants) {
          if ((await isAuthorizedGatekeeper(ctx, g.facilityOrgId, args.requestedByGoogleId, args.requestedByEmail)) || (await isAuthorizedAdmin(ctx, g.facilityOrgId, args.requestedByGoogleId, args.requestedByEmail))) { facilityOk = true; break; }
        }
        if (!facilityOk) throw new Error("Only this organization's administrators and gatekeepers can do that — or a facility greeter the host granted this event to.");
      }
      if (reg.status !== "approved") throw new Error("Only an approved attendee can be checked in.");
      const locEval = evaluateCheckinLocation(ev, args.deviceLat, args.deviceLng);
      if (!locEval.allowed) {
        if (locEval.isVirtual) throw new Error(locEval.message ?? "This is a virtual event — there's no door check-in.");
        const isAdmin = await isAuthorizedAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
        if (!(args.locationOverride && isAdmin)) throw new Error(locEval.message ?? "Check-in is only available at the event location.");
      }
      await db.update(schema.registrations).set({ status: "checked_in", checkedInAt: new Date() }).where(eq(schema.registrations.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),



  respondToWaitlistOffer: defineAction({
    description: "Attendee responds to a waitlist spot offer. Accepting moves the registration into the normal approval flow (approvers are emailed) with the seat still held until the hold lapses; the QR pass is issued only when an approver confirms. Declining releases the seat to the next waitlisted person. Identity is verified by matching the registration's email (blind index) — no sign-in required.",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200), decision: z.enum(["accept", "decline"]) }),
    response: z.object({ outcome: z.enum(["accepted", "declined", "expired", "not_offered"]), status: statusEnum.nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.registrationId)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      const hash = await emailIndex(ctx, args.email);
      if (reg.emailHash !== hash && reg.contactEmailHash !== hash) throw new Error("That email doesn't match this registration.");
      if (reg.status !== "waitlisted" || !reg.waitlistExpiresAt) return { outcome: "not_offered" as const, status: reg.status as z.infer<typeof statusEnum> };
      if (reg.waitlistExpiresAt <= Date.now()) { await promoteWaitlist(ctx, reg.eventId); return { outcome: "expired" as const, status: "waitlisted" as const }; }
      const ev = await getEventRow(ctx, reg.eventId);
      if (!ev) throw new Error("That event no longer exists.");
      if (args.decision === "decline") {
        await db.update(schema.registrations).set({ status: "denied", decidedVia: "Waitlist spot declined by attendee", decidedAt: new Date(), waitlistOfferedAt: null, waitlistExpiresAt: null }).where(eq(schema.registrations.id, reg.id));
        await promoteWaitlist(ctx, reg.eventId);
        ctx.invalidateQueries();
        return { outcome: "declined" as const, status: "denied" as const };
      }
      // Accept: keep waitlistExpiresAt as the seat hold while approvers decide.
      await db.update(schema.registrations).set({ status: "pending", decidedVia: "Waitlist spot accepted — awaiting approval" }).where(eq(schema.registrations.id, reg.id));
      await createApprovalRequests(ctx, reg.id, ev);
      ctx.invalidateQueries();
      return { outcome: "accepted" as const, status: "pending" as const };
    },
  }),

  sendEventMessage: defineAction({
    description: "Attendee sends a message about an event to its administrators and registrars, from their registration / My Events. The message is stored on the per-registration thread (visible in the staff Messages inbox), and each admin/registrar receives a notification email whose Reply link carries a single-use token scoped to this thread. Identity is verified like reminder choices (registration Google ID or email blind index). The body is moderation-screened before it is stored.",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional(), body: z.string().min(1).max(2000) }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      const { reg, ev } = await threadForRegistration(ctx, args.registrationId);
      await assertAttendeeIdentity(ctx, reg, args.email, args.googleId);
      await assertFeatureEnabled(ctx, ev.orgId, "attendee_messaging");
      if (reg.held === 1) throw new Error("This registration is still being reviewed — messaging opens once it has been processed.");
      const body = args.body.trim();
      if (!body) throw new Error("Write a message first.");
      const mod = await moderateTexts(ctx, [body]);
      if (mod.flagged) throw new Error("That message couldn't be sent — it was flagged by content moderation. Please revise the wording and try again.");
      const plain = (await decryptRegs(ctx, [reg])).get(reg.id);
      const messageId = await appendEventMessage(ctx, reg, ev, true, plain?.name ?? "Attendee", body);
      await notifyOtherSide(ctx, reg, ev, messageId, true);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listMyEventMessages: defineAction({
    description: "The attendee's view of their event message thread: every message on their registration's thread (oldest first), plus the reply-notification emails addressed to them — each with its live reply token, so they can also reply straight from the email. Opening the thread marks the team's messages as read. Identity is verified like reminder choices.",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional() }),
    response: z.object({ messages: z.array(eventMessageShape), notifications: z.array(z.object({ token: z.string(), senderName: z.string(), body: z.string(), createdAt: z.string(), expiresAt: z.string(), usedAt: z.string().nullable() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const { reg } = await threadForRegistration(ctx, args.registrationId);
      await assertAttendeeIdentity(ctx, reg, args.email, args.googleId);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventMessages).where(eq(schema.eventMessages.registrationId, reg.id)).orderBy(asc(schema.eventMessages.id));
      await db.update(schema.eventMessages).set({ readAt: Date.now() }).where(and(eq(schema.eventMessages.registrationId, reg.id), eq(schema.eventMessages.fromAttendee, 0), isNull(schema.eventMessages.readAt)));
      const tokens = await db.select().from(schema.eventMessageTokens).where(and(eq(schema.eventMessageTokens.registrationId, reg.id), eq(schema.eventMessageTokens.side, "attendee"))).orderBy(desc(schema.eventMessageTokens.id)).limit(3);
      const notifications = [];
      for (const t of tokens) {
        const msgRows = await db.select().from(schema.eventMessages).where(eq(schema.eventMessages.id, t.messageId)).limit(1);
        const msg = msgRows[0];
        if (!msg) continue;
        notifications.push({ token: t.token, senderName: msg.senderName, body: msg.body, createdAt: new Date(t.createdAt).toISOString(), expiresAt: new Date(t.expiresAt).toISOString(), usedAt: t.usedAt ? new Date(t.usedAt).toISOString() : null });
      }
      return { messages: rows.map(toEventMessage), notifications };
    },
  }),

  listEventMessageThreads: defineAction({
    description: "Staff Messages inbox: every attendee message thread for the organization, one row per registration — event, attendee, last message, unread count. Administrators and registrars only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ threads: z.array(z.object({ registrationId: z.number(), eventId: z.number(), eventTitle: z.string(), eventDate: z.string(), attendeeName: z.string(), attendeeEmail: z.string(), messageCount: z.number(), unreadCount: z.number(), lastBody: z.string(), lastFromAttendee: z.boolean(), lastAt: z.string() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdminOrRegistrant(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const msgs = await db.select().from(schema.eventMessages).where(eq(schema.eventMessages.orgId, args.orgId)).orderBy(asc(schema.eventMessages.id));
      if (msgs.length === 0) return { threads: [] };
      const regIds = [...new Set(msgs.map((m) => m.registrationId))];
      const regs: RegRow[] = [];
      for (const id of regIds) {
        const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, id)).limit(1);
        if (rows[0]) regs.push(rows[0]);
      }
      const plain = await decryptRegs(ctx, regs);
      const evCache = new Map<number, EventRow | null>();
      const threads = [];
      for (const id of regIds) {
        const reg = regs.find((r) => r.id === id);
        if (!reg) continue;
        if (!evCache.has(reg.eventId)) evCache.set(reg.eventId, await getEventRow(ctx, reg.eventId));
        const ev = evCache.get(reg.eventId);
        const mine = msgs.filter((m) => m.registrationId === id);
        const last = mine[mine.length - 1];
        if (!last) continue;
        const p = plain.get(id);
        threads.push({ registrationId: id, eventId: reg.eventId, eventTitle: ev?.title ?? "Event", eventDate: ev?.date ?? "", attendeeName: p?.name ?? "", attendeeEmail: p?.email ?? "", messageCount: mine.length, unreadCount: mine.filter((m) => m.fromAttendee === 1 && !m.readAt).length, lastBody: last.body, lastFromAttendee: last.fromAttendee === 1, lastAt: new Date(last.createdAt).toISOString() });
      }
      threads.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
      return { threads };
    },
  }),

  getEventMessageThread: defineAction({
    description: "One thread in full for staff: all messages (oldest first) plus the notification emails sent to the team about it — each with its live reply token, so a reply can also be sent straight from the email. Opening the thread marks the attendee's messages as read. Administrators and registrars only.",
    request: z.object({ orgId: z.number().int().positive(), registrationId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ eventTitle: z.string(), attendeeName: z.string(), messages: z.array(eventMessageShape), notifications: z.array(z.object({ recipientEmail: z.string(), token: z.string(), body: z.string(), createdAt: z.string(), expiresAt: z.string(), usedAt: z.string().nullable() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdminOrRegistrant(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const { reg, ev } = await threadForRegistration(ctx, args.registrationId);
      if (ev.orgId !== args.orgId) throw new Error("That conversation belongs to a different organization.");
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventMessages).where(eq(schema.eventMessages.registrationId, reg.id)).orderBy(asc(schema.eventMessages.id));
      await db.update(schema.eventMessages).set({ readAt: Date.now() }).where(and(eq(schema.eventMessages.registrationId, reg.id), eq(schema.eventMessages.fromAttendee, 1), isNull(schema.eventMessages.readAt)));
      const plain = (await decryptRegs(ctx, [reg])).get(reg.id);
      const tokens = await db.select().from(schema.eventMessageTokens).where(and(eq(schema.eventMessageTokens.registrationId, reg.id), eq(schema.eventMessageTokens.side, "staff"))).orderBy(desc(schema.eventMessageTokens.id)).limit(6);
      const notifications = [];
      for (const t of tokens) {
        const msgRows = await db.select().from(schema.eventMessages).where(eq(schema.eventMessages.id, t.messageId)).limit(1);
        const msg = msgRows[0];
        if (!msg) continue;
        notifications.push({ recipientEmail: t.recipientEmail, token: t.token, body: msg.body, createdAt: new Date(t.createdAt).toISOString(), expiresAt: new Date(t.expiresAt).toISOString(), usedAt: t.usedAt ? new Date(t.usedAt).toISOString() : null });
      }
      ctx.invalidateQueries();
      return { eventTitle: ev.title, attendeeName: plain?.name ?? "", messages: rows.map(toEventMessage), notifications };
    },
  }),

  replyToEventMessage: defineAction({
    description: "A staff reply from inside the app (Messages inbox): appended to the attendee's thread, and the attendee receives a notification email with its own reply token so the conversation can continue by email or in the app. Administrators and registrars only. The body is moderation-screened before it is stored.",
    request: z.object({ orgId: z.number().int().positive(), registrationId: z.number().int().positive(), body: z.string().min(1).max(2000), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdminOrRegistrant(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const { reg, ev } = await threadForRegistration(ctx, args.registrationId);
      if (ev.orgId !== args.orgId) throw new Error("That conversation belongs to a different organization.");
      const body = args.body.trim();
      if (!body) throw new Error("Write a reply first.");
      const mod = await moderateTexts(ctx, [body]);
      if (mod.flagged) throw new Error("That reply couldn't be sent — it was flagged by content moderation. Please revise the wording and try again.");
      const senderName = await staffDisplayName(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const messageId = await appendEventMessage(ctx, reg, ev, false, senderName, body);
      await notifyOtherSide(ctx, reg, ev, messageId, false);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getEventMessageReplyInfo: defineAction({
    description: "Validates an event-message reply token from a notification email and returns what the reply page may show: the event, and the single message the notification was about. The token is scoped to one registration's thread, so nothing about any other attendee is ever returned.",
    request: z.object({ token: z.string().min(1).max(200) }),
    response: z.object({ outcome: z.enum(["ok", "invalid", "expired", "used"]), side: z.enum(["staff", "attendee"]).nullable(), orgName: z.string(), eventTitle: z.string(), eventDate: z.string(), aboutSender: z.string(), aboutBody: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const empty = { side: null, orgName: "", eventTitle: "", eventDate: "", aboutSender: "", aboutBody: "" };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventMessageTokens).where(eq(schema.eventMessageTokens.token, args.token.trim())).limit(1);
      const t = rows[0];
      if (!t) return { outcome: "invalid" as const, ...empty };
      if (t.usedAt) return { outcome: "used" as const, ...empty };
      if (t.expiresAt < Date.now()) return { outcome: "expired" as const, ...empty };
      const { ev } = await threadForRegistration(ctx, t.registrationId);
      const msgRows = await db.select().from(schema.eventMessages).where(eq(schema.eventMessages.id, t.messageId)).limit(1);
      const msg = msgRows[0];
      const orgName = await getOrgName(ctx, t.orgId);
      return { outcome: "ok" as const, side: t.side, orgName, eventTitle: ev.title, eventDate: ev.date, aboutSender: msg?.senderName ?? "", aboutBody: msg?.body ?? "" };
    },
  }),

  replyByEventMessageToken: defineAction({
    description: "Replies to an event message thread straight from a notification email: the token is the credential (no sign-in). Single-use; appends the reply to that one thread only, marks the token used, and issues the next notification (with a fresh token) to the other side, so the conversation can continue by email or in the app. The body is moderation-screened before it is stored.",
    request: z.object({ token: z.string().min(1).max(200), body: z.string().min(1).max(2000) }),
    response: z.object({ ok: z.literal(true), eventTitle: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; eventTitle: string }> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.eventMessageTokens).where(eq(schema.eventMessageTokens.token, args.token.trim())).limit(1);
      const t = rows[0];
      if (!t) throw new Error("That reply link isn't valid. Reply from the app instead.");
      if (t.usedAt) throw new Error("That reply link has already been used. Reply from the app, or use the link in the newest notification email.");
      if (t.expiresAt < Date.now()) throw new Error("That reply link has expired. Reply from the app instead.");
      const body = args.body.trim();
      if (!body) throw new Error("Write a reply first.");
      const mod = await moderateTexts(ctx, [body]);
      if (mod.flagged) throw new Error("That reply couldn't be sent — it was flagged by content moderation. Please revise the wording and try again.");
      const { reg, ev } = await threadForRegistration(ctx, t.registrationId);
      await db.update(schema.eventMessageTokens).set({ usedAt: Date.now() }).where(eq(schema.eventMessageTokens.id, t.id));
      let messageId: number;
      if (t.side === "staff") {
        const senderName = await staffDisplayName(ctx, t.orgId, undefined, t.recipientEmail);
        messageId = await appendEventMessage(ctx, reg, ev, false, senderName, body);
        await notifyOtherSide(ctx, reg, ev, messageId, false);
      } else {
        const plain = (await decryptRegs(ctx, [reg])).get(reg.id);
        messageId = await appendEventMessage(ctx, reg, ev, true, plain?.name ?? "Attendee", body);
        await notifyOtherSide(ctx, reg, ev, messageId, true);
      }
      ctx.invalidateQueries();
      return { ok: true, eventTitle: ev.title };
    },
  }),

  getWalletPass: defineAction({
    description: "Builds a wallet pass for one confirmed registration: the complete platform payload (Apple Wallet pass.json fields, a Google Wallet generic pass object, or a Samsung Wallet ticket payload) carrying the event details, the attendee name, and the pass code as the QR value, in the organization's colors. Delivery to a phone's wallet activates when the organization connects its wallet account (Apple pass certificate / Google Wallet issuer / Samsung partner) — the payload generated here is exactly what those services sign and deliver. Identity is verified like reminder choices; the registration must have an issued pass code.",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional(), platform: z.enum(["apple", "google", "samsung"]) }),
    response: z.object({ platform: z.enum(["apple", "google", "samsung"]), payload: z.string(), note: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const { reg, ev } = await threadForRegistration(ctx, args.registrationId);
      await assertAttendeeIdentity(ctx, reg, args.email, args.googleId);
      if (!reg.code || (reg.status !== "approved" && reg.status !== "checked_in")) throw new Error("Wallet passes are available once your pass has been issued (status Confirmed).");
      await assertFeatureEnabled(ctx, ev.orgId, "wallet_passes");
      const db = ctx.db<typeof schema>();
      const orgRows = await db.select().from(schema.organizations).where(eq(schema.organizations.id, ev.orgId)).limit(1);
      const org = orgRows[0];
      const orgName = org?.name ?? await getOrgName(ctx, ev.orgId);
      const plain = (await decryptRegs(ctx, [reg])).get(reg.id);
      const attendeeName = plain?.name ?? "";
      const rawHex = (org?.primaryColor ?? "#0b3d6e").replace("#", "");
      const hex = /^[0-9a-fA-F]{6}$/.test(rawHex) ? rawHex : "0b3d6e";
      const rgb = `rgb(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)})`;
      const codeNote = "Show this pass at the door. The QR code is optional — the text code works on its own; the greeter can type it in.";
      // Location relevance: for a physical event with a venue pin and
      // the arrival pop-up enabled, the SAME pin + event-time window
      // go into the wallet pass — Apple Wallet `locations` +
      // `relevantDate`, Google Wallet `locations` + `validTimeInterval`
      // — so the wallet itself surfaces the pass on the lock screen
      // when the attendee gets near the venue near the event time,
      // even with the app closed. No pin / virtual / pop-up off = no
      // location data in the pass at all.
      const geoOn = (ev as { geofenceEnabled?: number }).geofenceEnabled !== 0 && (ev.locationType ?? "physical") !== "virtual" && typeof ev.venueLat === "number" && typeof ev.venueLng === "number";
      const win = geoOn ? geofenceWindow(ev) : null;
      const relevantText = `You're near ${ev.title} — your pass is ready.`;
      let payload: unknown;
      if (args.platform === "apple") {
        payload = { formatVersion: 1, passTypeIdentifier: "pass.com.approvedguest.event", serialNumber: `registration-${reg.id}`, teamIdentifier: "TO-BE-CONNECTED", organizationName: orgName, description: ev.title, logoText: orgName, backgroundColor: rgb, foregroundColor: "rgb(255, 255, 255)", labelColor: "rgb(255, 255, 255)", ...(geoOn && win ? { locations: [{ latitude: ev.venueLat, longitude: ev.venueLng, relevantText }], relevantDate: win.start.toISOString() } : {}), barcodes: [{ format: "PKBarcodeFormatQR", message: reg.code, messageEncoding: "iso-8859-1", altText: reg.code }], eventTicket: { primaryFields: [{ key: "event", label: "EVENT", value: ev.title }], secondaryFields: [{ key: "date", label: "DATE", value: ev.date }, { key: "time", label: "TIME", value: ev.timeText }], auxiliaryFields: [{ key: "location", label: "LOCATION", value: ev.location }, { key: "guest", label: "GUEST", value: attendeeName }], backFields: [{ key: "code", label: "PASS CODE", value: reg.code }, { key: "note", label: "AT THE DOOR", value: codeNote }] } };
      } else if (args.platform === "google") {
        payload = { genericObjects: [{ id: `approvedguest.registration.${reg.id}`, classId: "approvedguest.event_pass", state: "ACTIVE", cardTitle: { defaultValue: { language: "en-US", value: orgName } }, header: { defaultValue: { language: "en-US", value: ev.title } }, subheader: { defaultValue: { language: "en-US", value: `${ev.date} · ${ev.timeText}` } }, textModulesData: [{ id: "guest", header: "GUEST", body: attendeeName }, { id: "location", header: "LOCATION", body: ev.location }, { id: "code", header: "PASS CODE", body: reg.code }], barcode: { type: "QR_CODE", value: reg.code, alternateText: reg.code }, hexBackgroundColor: `#${hex}`, ...(geoOn && win ? { locations: [{ latitude: ev.venueLat, longitude: ev.venueLng }], validTimeInterval: { start: { date: win.opensAt.toISOString() }, end: { date: win.closesAt.toISOString() } } } : {}) }] };
      } else {
        payload = { card: { type: "ticket", subType: "event", title: ev.title, providerName: orgName, startDate: ev.date, location: ev.location, holderName: attendeeName, barcode: { format: "QR", value: reg.code, altText: reg.code }, backgroundColor: `#${hex}`, notice: codeNote, ...(geoOn ? { locations: [{ latitude: ev.venueLat, longitude: ev.venueLng, name: ev.location }] } : {}) } };
      }
      const platformName = args.platform === "apple" ? "Apple Wallet" : args.platform === "google" ? "Google Wallet" : "Samsung Pay";
      return { platform: args.platform, payload: JSON.stringify(payload, null, 2), note: `This is the complete ${platformName} pass for this registration. One-tap delivery to ${platformName} activates when ${orgName} connects its ${platformName} account — the payload above is exactly what gets signed and delivered, with your event details and QR code on it.${geoOn ? ` It carries this event's venue location and date as the wallet's relevant location/date, so ${platformName} can surface the pass on your lock screen when you're near ${ev.location} near the event time.` : ""}` };
    },
  }),

  updateReminderChoices: defineAction({
    description: "Attendee updates their reminder choices on one registration — which reminders they want (1 day before, 3 hours before, 1 hour before; empty = the event's defaults) — delivered on the channel already saved with the registration. Shown on their pass. Identity is verified by the registration's Google ID or its email blind index (their own address or the group contact's).",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional(), choices: z.array(reminderChoiceEnum).max(3) }),
    response: z.object({ ok: z.literal(true), choices: z.array(reminderChoiceEnum) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; choices: Array<"1d" | "3h" | "1h"> }> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.registrationId)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      let ok = !!(args.googleId && reg.googleId && reg.googleId === args.googleId);
      if (!ok && args.email) { const hash = await emailIndex(ctx, args.email); ok = reg.emailHash === hash || reg.contactEmailHash === hash; }
      if (!ok) throw new Error("That sign-in or email doesn't match this registration.");
      const choices = [...new Set(args.choices)];
      await db.update(schema.registrations).set({ reminderChoices: JSON.stringify(choices) }).where(eq(schema.registrations.id, reg.id));
      ctx.invalidateQueries();
      return { ok: true, choices };
    },
  }),

  syncOfflineCheckIns: defineAction({
    description: "Syncs check-ins a greeter recorded OFFLINE back to the server. Each queued entry is applied with its original device timestamp. Outcomes per entry: applied (now checked in), already_checked_in (another device synced first — not a conflict), conflict (the registration's server state no longer allows check-in — e.g. the pass was cancelled/revoked while the greeter was offline, or it was never confirmed), not_found. Staff (admin or greeter) of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), entries: z.array(z.object({ registrationId: z.number().int().positive(), code: z.string().max(40).optional(), checkedInAt: z.string().max(40), lat: z.number().min(-90).max(90).nullable().optional(), lng: z.number().min(-180).max(180).nullable().optional() })).min(1).max(200), ...requesterArgs }),
    response: z.object({ results: z.array(z.object({ registrationId: z.number(), outcome: z.enum(["applied", "already_checked_in", "conflict", "not_found"]), message: z.string() })), applied: z.number(), conflicts: z.number() }),
    async handler(ctx, args) {
      await requireStaff(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertPaidAllowed(ctx, args.orgId, "Door check-in");
      const db = ctx.db<typeof schema>();
      const results: Array<{ registrationId: number; outcome: "applied" | "already_checked_in" | "conflict" | "not_found"; message: string }> = [];
      let applied = 0; let conflicts = 0;
      for (const entry of args.entries) {
        const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, entry.registrationId)).limit(1);
        const reg = rows[0];
        if (!reg) { results.push({ registrationId: entry.registrationId, outcome: "not_found", message: "This registration no longer exists on the server." }); conflicts += 1; continue; }
        const ev = await getEventRow(ctx, reg.eventId);
        if (!ev || ev.orgId !== args.orgId) { results.push({ registrationId: entry.registrationId, outcome: "not_found", message: "That registration belongs to a different organization." }); conflicts += 1; continue; }
        if (entry.code && reg.code && entry.code.trim().toUpperCase() !== reg.code) { results.push({ registrationId: entry.registrationId, outcome: "conflict", message: "The pass code changed since it was cached (the pass was reissued or revoked)." }); conflicts += 1; continue; }
        if (reg.status === "checked_in") { results.push({ registrationId: entry.registrationId, outcome: "already_checked_in", message: "Already checked in on the server — nothing to do." }); continue; }
        if ((ev.locationType ?? "physical") === "virtual") { results.push({ registrationId: entry.registrationId, outcome: "conflict", message: "This is a virtual event — there's no door check-in; confirmed attendees join online." }); conflicts += 1; continue; }
        // Location-bound check-in: when the offline entry carries the
        // device coordinates captured at the door and the event enforces
        // its venue radius, an out-of-radius check-in is a conflict for
        // an administrator to review. Entries with no recorded location
        // (no GPS fix at the door) are applied as before.
        if (typeof entry.lat === "number" && typeof entry.lng === "number") {
          const locEval = evaluateCheckinLocation(ev, entry.lat, entry.lng);
          if (locEval.enforced && !locEval.allowed) { results.push({ registrationId: entry.registrationId, outcome: "conflict", message: `Recorded ${locEval.distanceM?.toLocaleString() ?? ""} m from the venue — outside the ${locEval.radiusM.toLocaleString()} m check-in radius. An administrator can check this guest in from the Door screen with an override.` }); conflicts += 1; continue; }
        }
        if (reg.status === "approved") {
          const at = new Date(entry.checkedInAt);
          await db.update(schema.registrations).set({ status: "checked_in", checkedInAt: Number.isNaN(at.getTime()) ? new Date() : at }).where(eq(schema.registrations.id, reg.id));
          results.push({ registrationId: entry.registrationId, outcome: "applied", message: "Checked in." });
          applied += 1;
          continue;
        }
        const why = reg.status === "revoked" ? "This pass was cancelled while you were offline." : reg.status === "denied" ? "This registration was marked not approved while you were offline." : reg.status === "waitlisted" ? "This person is on the waitlist — they were never confirmed." : "This registration is still tentative (awaiting approval) — it can't be checked in.";
        results.push({ registrationId: entry.registrationId, outcome: "conflict", message: why });
        conflicts += 1;
      }
      if (applied > 0) ctx.invalidateQueries();
      return { results, applied, conflicts };
    },
  }),

  runEventReminders: defineAction({
    description: "The automatic attendee-reminder engine. For every organization: sends the day-before reminder for tomorrow's events, each event's optional second reminder (N days before), and the attendee-chosen 3-hours-before / 1-hour-before reminders for today's events — each attendee is reminded at the times THEY chose (registrations with no explicit choice get the event defaults), on their chosen channel (email / text / both), with the event details and their QR pass code. Every run is logged (event_reminder_runs dedupes, so no reminder is ever sent twice) and the composed messages are logged per event in attendee_messages, per the prototype mail posture. With an orgId + admin identity it runs for just that organization (the admin 'run reminders now' button); with no orgId it runs platform-wide (the hourly schedule).",
    request: z.object({ orgId: z.number().int().positive().optional(), ...requesterArgs }),
    response: z.object({ runs: z.array(z.object({ orgId: z.number(), orgName: z.string(), eventId: z.number(), eventTitle: z.string(), kind: z.string(), recipientCount: z.number(), byChannel: z.object({ email: z.number(), text: z.number(), both: z.number() }) })), totalRecipients: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      if (args.orgId) await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const now = new Date();
      const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const todayStr = ymd(now);
      const tomorrowStr = ymd(new Date(now.getTime() + 24 * 60 * 60 * 1000));
      const orgs = await db.select().from(schema.organizations).where(args.orgId ? eq(schema.organizations.id, args.orgId) : undefined).orderBy(asc(schema.organizations.id));
      const runs: Array<{ orgId: number; orgName: string; eventId: number; eventTitle: string; kind: string; recipientCount: number; byChannel: { email: number; text: number; both: number } }> = [];
      const startMinutes = (timeText: string): number | null => {
        const m = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!m) return null;
        let h = Number(m[1]) % 12; if (/PM/i.test(m[3] ?? "")) h += 12;
        return h * 60 + Number(m[2]);
      };
      for (const org of orgs) {
        const evs = await db.select().from(schema.events).where(eq(schema.events.orgId, org.id)).orderBy(asc(schema.events.date));
        for (const ev of evs) {
          if (ev.deletedAt) continue; // soft-deleted events get no reminders
          if ((ev.status ?? "published") !== "published" || ev.registrationEnabled === 0 || ev.date < todayStr) continue;
          const prior = await db.select({ kind: schema.eventReminderRuns.kind }).from(schema.eventReminderRuns).where(eq(schema.eventReminderRuns.eventId, ev.id));
          const doneKinds = new Set(prior.map((r) => r.kind));
          const regs = (await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, ev.id))).filter((r) => r.status === "approved" && r.held !== 1);
          if (regs.length === 0) continue;
          const plain = await decryptRegs(ctx, regs);
          type KindDef = { kind: "day_before" | "second" | "three_hours" | "one_hour"; label: string; wants: (choices: Array<"1d" | "3h" | "1h">) => boolean };
          const kinds: KindDef[] = [];
          if (ev.date === tomorrowStr && ev.reminderDayBefore !== 0 && !doneKinds.has("day_before")) kinds.push({ kind: "day_before", label: "tomorrow", wants: (c) => c.length === 0 || c.includes("1d") });
          if (ev.reminderSecondDays) {
            const target = ymd(new Date(now.getTime() + ev.reminderSecondDays * 24 * 60 * 60 * 1000));
            if (ev.date === target && !doneKinds.has("second")) kinds.push({ kind: "second", label: `in ${ev.reminderSecondDays} days`, wants: (c) => c.length === 0 });
          }
          if (ev.date === todayStr) {
            const sm = startMinutes(ev.timeText);
            if (sm !== null) {
              const start = new Date(`${ev.date}T${String(Math.floor(sm / 60)).padStart(2, "0")}:${String(sm % 60).padStart(2, "0")}:00`);
              const mins = (start.getTime() - now.getTime()) / 60000;
              if (mins > 60 && mins <= 180 && !doneKinds.has("three_hours")) kinds.push({ kind: "three_hours", label: "in about 3 hours", wants: (c) => c.includes("3h") });
              if (mins > 0 && mins <= 60 && !doneKinds.has("one_hour")) kinds.push({ kind: "one_hour", label: "in about 1 hour", wants: (c) => c.includes("1h") });
            }
          }
          for (const k of kinds) {
            const targets = regs.filter((r) => k.wants(parseReminderChoices(r.reminderChoices)));
            if (targets.length === 0) continue;
            const byChannel = { email: 0, text: 0, both: 0 };
            for (const r of targets) byChannel[(r.notifyChannel ?? "email") as "email" | "text" | "both"] += 1;
            const subject = `Reminder: ${ev.title} is ${k.label} — ${ev.date} · ${ev.timeText}`;
            const sample = targets[0] ? plain.get(targets[0].id) : null;
            const body = `Hi — a reminder that ${ev.title} is ${k.label}: ${ev.date} at ${ev.timeText}, ${ev.location}. ${targets.length} confirmed attendee${targets.length === 1 ? "" : "s"} received this reminder on their chosen channel (email / text / both), each with their own QR pass code and pass attached (example: ${sample?.name ?? "attendee"} · pass ${targets[0]?.code ?? "—"}). See you there!`;
            await db.insert(schema.eventReminderRuns).values({ orgId: org.id, eventId: ev.id, kind: k.kind, recipientCount: targets.length });
            await db.insert(schema.attendeeMessages).values({ orgId: org.id, eventId: ev.id, senderName: "Automatic reminder", senderEmail: "", audience: "approved", template: "reminder", subject, body, recipientCount: targets.length });
            runs.push({ orgId: org.id, orgName: org.name, eventId: ev.id, eventTitle: ev.title, kind: k.kind, recipientCount: targets.length, byChannel });
          }
        }
      }
      if (runs.length > 0) ctx.invalidateQueries();
      return { runs, totalRecipients: runs.reduce((a, r) => a + r.recipientCount, 0) };
    },
  }),

  emailReportNow: defineAction({
    description: "Emails the compiled attendance/registration report for one event (or the whole organization) to chosen administrators. Recipients are validated server-side: reports go ONLY to registered administrators/owners of the organization — never to attendees or other roles. The email is composed and logged, per the prototype mail posture. Admin only.",
    request: z.object({ orgId: z.number().int().positive().default(1), eventId: z.number().int().positive().nullable().default(null), recipientEmails: z.array(z.string().email().max(200)).min(1).max(30), ...requesterArgs }),
    response: z.object({ delivery: z.object({ recipients: z.array(z.string()), subject: z.string(), body: z.string() }) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const recipients = await validateAdminRecipients(ctx, args.orgId, args.recipientEmails);
      const { subject, body } = await compileReportText(ctx, args.orgId, args.eventId, false);
      const db = ctx.db<typeof schema>();
      await db.insert(schema.reportDeliveries).values({ orgId: args.orgId, eventId: args.eventId, kind: "manual", recipients: JSON.stringify(recipients), subject });
      ctx.invalidateQueries();
      return { delivery: { recipients, subject, body } };
    },
  }),

  createReportSchedule: defineAction({
    description: "Creates a scheduled report update: daily, weekly, or a set number of days before the event, emailed to the chosen administrators (validated — admins only). Every event schedule also gets a final update automatically the day after the event with final registration and attendance numbers. Admin only.",
    request: z.object({ orgId: z.number().int().positive().default(1), eventId: z.number().int().positive().nullable().default(null), cadence: z.enum(["daily", "weekly", "days_before"]), daysBefore: z.number().int().min(1).max(60).nullable().default(null), recipientEmails: z.array(z.string().email().max(200)).min(1).max(30), ...requesterArgs }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      if (args.cadence === "days_before") {
        if (!args.eventId) throw new Error("The days-before cadence needs a specific event.");
        if (!args.daysBefore) throw new Error("Say how many days before the event the update should go out.");
      }
      const recipients = await validateAdminRecipients(ctx, args.orgId, args.recipientEmails);
      const db = ctx.db<typeof schema>();
      const result = await db.insert(schema.reportSchedules).values({ orgId: args.orgId, eventId: args.eventId, cadence: args.cadence, daysBefore: args.cadence === "days_before" ? args.daysBefore : null, recipients: JSON.stringify(recipients), active: 1 }).returning({ id: schema.reportSchedules.id });
      const inserted = result[0];
      if (!inserted) throw new Error("createReportSchedule: insert returned no rows");
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  listReportSchedules: defineAction({
    description: "Lists an organization's report schedules (cadence, event, recipients, active, last sent) and recent report deliveries. Admin only.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({
      schedules: z.array(z.object({ id: z.number(), eventId: z.number().nullable(), eventTitle: z.string().nullable(), cadence: z.string(), daysBefore: z.number().nullable(), recipients: z.array(z.string()), active: z.boolean(), lastSentAt: z.string().nullable(), finalSent: z.boolean() })),
      deliveries: z.array(z.object({ id: z.number(), kind: z.string(), recipients: z.array(z.string()), subject: z.string(), createdAt: z.string() })),
    }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.reportSchedules).where(eq(schema.reportSchedules.orgId, args.orgId)).orderBy(asc(schema.reportSchedules.id));
      const evs = await db.select({ id: schema.events.id, title: schema.events.title }).from(schema.events).where(eq(schema.events.orgId, args.orgId));
      const titleById = new Map(evs.map((e) => [e.id, e.title]));
      const deliveries = await db.select().from(schema.reportDeliveries).where(eq(schema.reportDeliveries.orgId, args.orgId)).orderBy(desc(schema.reportDeliveries.id));
      return {
        schedules: rows.map((r) => ({ id: r.id, eventId: r.eventId ?? null, eventTitle: r.eventId ? (titleById.get(r.eventId) ?? null) : null, cadence: r.cadence, daysBefore: r.daysBefore ?? null, recipients: parseApprovalEmails(r.recipients), active: r.active === 1, lastSentAt: r.lastSentAt ? new Date(r.lastSentAt).toISOString() : null, finalSent: r.finalSent === 1 })),
        deliveries: deliveries.slice(0, 10).map((d) => ({ id: d.id, kind: d.kind, recipients: parseApprovalEmails(d.recipients), subject: d.subject, createdAt: new Date(d.createdAt).toISOString() })),
      };
    },
  }),

  setReportScheduleActive: defineAction({
    description: "Turns a report schedule on or off. Admin only.",
    request: z.object({ orgId: z.number().int().positive().default(1), id: z.number().int().positive(), active: z.boolean(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.update(schema.reportSchedules).set({ active: args.active ? 1 : 0 }).where(eq(schema.reportSchedules.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  deleteReportSchedule: defineAction({
    description: "Deletes a report schedule. Admin only.",
    request: z.object({ orgId: z.number().int().positive().default(1), id: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.reportSchedules).where(eq(schema.reportSchedules.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  runReportSchedules: defineAction({
    description: "Scheduler entry point (runs daily): sends every due report update across all organizations — daily schedules once a day, weekly once a week, the days-before milestone on its day, and the final report the day after each event — composing and logging each delivery to the schedule's chosen administrators.",
    request: z.object({}),
    response: z.object({ sent: z.number() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const today = dateKeyOf(new Date());
      const rows = await db.select().from(schema.reportSchedules).where(eq(schema.reportSchedules.active, 1));
      let sent = 0;
      for (const sch of rows) {
        const recipients = parseApprovalEmails(sch.recipients);
        if (recipients.length === 0) continue;
        const ev = sch.eventId ? await getEventRow(ctx, sch.eventId) : null;
        if (sch.eventId && !ev) continue;
        const lastKey = sch.lastSentAt ? dateKeyOf(new Date(sch.lastSentAt)) : null;
        let due = false; let kind: "scheduled" | "final" = "scheduled";
        if (ev && sch.finalSent !== 1 && addDaysKey(ev.date, 1) === today) { due = true; kind = "final"; }
        else if (sch.cadence === "daily" && lastKey !== today && (!ev || ev.date >= today)) due = true;
        else if (sch.cadence === "weekly" && (!lastKey || addDaysKey(lastKey, 7) <= today) && (!ev || ev.date >= today)) due = true;
        else if (sch.cadence === "days_before" && ev && sch.daysBefore && sch.milestoneSent !== 1 && addDaysKey(ev.date, -sch.daysBefore) === today) due = true;
        if (!due) continue;
        const { subject } = await compileReportText(ctx, sch.orgId, sch.eventId, kind === "final");
        await db.insert(schema.reportDeliveries).values({ orgId: sch.orgId, eventId: sch.eventId, scheduleId: sch.id, kind, recipients: JSON.stringify(recipients), subject });
        await db.update(schema.reportSchedules).set({ lastSentAt: new Date(), ...(sch.cadence === "days_before" ? { milestoneSent: 1 } : {}), ...(kind === "final" ? { finalSent: 1 } : {}) }).where(eq(schema.reportSchedules.id, sch.id));
        sent += 1;
      }
      if (sent > 0) ctx.invalidateQueries();
      return { sent };
    },
  }),

  /* ---------- Admin reports & export (admin only) ----------
     Reports are built from the check-in data gatekeepers record at the
     door. Gatekeepers never see reports or exports — they only check
     people in. Every report is scoped to the admin's own organization. */

  attendanceReport: defineAction({
    description: "Admin-only attendance report for one event of the admin's organization, built from door check-in data: who checked in (with times), whose approved passes went unused, and the pending / not-approved / revoked lists, with counts.",
    request: z.object({ orgId: z.number().int().positive().default(1), eventId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({
      eventTitle: z.string(), eventDate: z.string(), eventTimeText: z.string(),
      counts: z.object({ total: z.number(), checkedIn: z.number(), approvedNotCheckedIn: z.number(), pending: z.number(), denied: z.number(), revoked: z.number() }),
      checkedIn: z.array(z.object({ name: z.string(), email: z.string(), checkedInAt: z.string().nullable() })),
      unusedPasses: z.array(z.object({ name: z.string(), email: z.string(), code: z.string().nullable() })),
      pending: z.array(z.object({ name: z.string(), email: z.string() })),
      denied: z.array(z.object({ name: z.string(), email: z.string() })),
      revoked: z.array(z.object({ name: z.string(), email: z.string() })),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      await assertAdvancedAllowed(ctx, args.orgId, "Reports & exports");
      const db = ctx.db<typeof schema>();
      const allRegs = await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, ev.id)).orderBy(asc(schema.registrations.id));
      const regs = allRegs.filter((r) => r.held !== 1); // held (moderation) rows never appear in reports
      const plain = await decryptRegs(ctx, regs);
      const pick = (r: RegRow) => ({ name: plain.get(r.id)!.name, email: plain.get(r.id)!.email });
      const checkedIn = regs.filter((r) => r.status === "checked_in");
      const unused = regs.filter((r) => r.status === "approved");
      const pending = regs.filter((r) => r.status === "pending");
      const denied = regs.filter((r) => r.status === "denied");
      const revoked = regs.filter((r) => r.status === "revoked");
      return {
        eventTitle: ev.title, eventDate: ev.date, eventTimeText: ev.timeText,
        counts: { total: regs.length, checkedIn: checkedIn.length, approvedNotCheckedIn: unused.length, pending: pending.length, denied: denied.length, revoked: revoked.length },
        checkedIn: checkedIn.map((r) => ({ ...pick(r), checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null })),
        unusedPasses: unused.map((r) => ({ ...pick(r), code: r.code })),
        pending: pending.map(pick), denied: denied.map(pick), revoked: revoked.map(pick),
      };
    },
  }),

  personHistory: defineAction({
    description: "Admin-only cross-event participant history within the admin's own organization: look up a person by email (exact, via the blind index) or by name (partial match) and see every event they registered for, with status and check-in times. Never returns people from other organizations.",
    request: z.object({ orgId: z.number().int().positive().default(1), query: z.string().min(2).max(200), ...requesterArgs }),
    response: z.object({
      people: z.array(z.object({
        name: z.string(), email: z.string(), phone: z.string().nullable(),
        history: z.array(z.object({ eventTitle: z.string(), eventDate: z.string(), status: statusEnum, checkedInAt: z.string().nullable() })),
      })),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      await assertAdvancedAllowed(ctx, args.orgId, "Reports & exports");
      const db = ctx.db<typeof schema>();
      const q = args.query.trim();
      let rows: Array<{ reg: RegRow; ev: EventRow }>;
      if (q.includes("@")) {
        const hash = await emailIndex(ctx, q);
        rows = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
          .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
          .where(and(eq(schema.registrations.emailHash, hash), eq(schema.events.orgId, args.orgId), eq(schema.registrations.held, 0)))
          .orderBy(desc(schema.events.date));
      } else {
        const all = await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations)
          .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
          .where(eq(schema.events.orgId, args.orgId))
          .orderBy(desc(schema.events.date));
        const plainAll = await decryptRegs(ctx, all.map((r) => r.reg));
        const needle = q.toLowerCase();
        rows = all.filter(({ reg }) => reg.held !== 1 && (plainAll.get(reg.id)?.name ?? "").toLowerCase().includes(needle));
      }
      const plain = await decryptRegs(ctx, rows.map((r) => r.reg));
      const byEmail = new Map<string, { name: string; email: string; phone: string | null; history: Array<{ eventTitle: string; eventDate: string; status: z.infer<typeof statusEnum>; checkedInAt: string | null }> }>();
      for (const { reg, ev } of rows) {
        const p = plain.get(reg.id)!;
        const key = p.email.toLowerCase();
        const entry = byEmail.get(key) ?? { name: p.name, email: p.email, phone: p.phone, history: [] };
        entry.history.push({ eventTitle: ev.title, eventDate: ev.date, status: reg.status as z.infer<typeof statusEnum>, checkedInAt: reg.checkedInAt ? reg.checkedInAt.toISOString() : null });
        byEmail.set(key, entry);
      }
      return { people: [...byEmail.values()] };
    },
  }),

  exportContactsCsv: defineAction({
    description: "Admin-only CSV export of contact information — name, email, phone, status, event, and every registration-question answer — for one event of the admin's organization, or across all of its events when eventId is omitted. The client downloads it as a .csv file for mailing-list use.",
    request: z.object({ orgId: z.number().int().positive().default(1), eventId: z.number().int().positive().optional(), statuses: z.array(statusEnum).optional(), ...requesterArgs }),
    response: z.object({ csv: z.string(), filename: z.string(), rowCount: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      await assertAdvancedAllowed(ctx, args.orgId, "Reports & exports");
      const db = ctx.db<typeof schema>();
      let targetEvent: EventRow | null = null;
      if (args.eventId) {
        targetEvent = await getEventRow(ctx, args.eventId);
        if (!targetEvent || targetEvent.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      }
      const rows = targetEvent
        ? (await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations).innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id)).where(eq(schema.registrations.eventId, targetEvent.id)).orderBy(asc(schema.events.date), asc(schema.registrations.id)))
        : (await db.select({ reg: schema.registrations, ev: schema.events }).from(schema.registrations).innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id)).where(eq(schema.events.orgId, args.orgId)).orderBy(asc(schema.events.date), asc(schema.registrations.id)));
      const visibleRows = rows.filter(({ reg }) => reg.held !== 1); // held (moderation) rows are never exported
      const filtered = args.statuses && args.statuses.length > 0 ? visibleRows.filter(({ reg }) => (args.statuses as string[]).includes(reg.status)) : visibleRows;
      const plain = await decryptRegs(ctx, filtered.map((r) => r.reg));
      // Question columns: every question label that appears in any answer,
      // in first-seen order, so the CSV stays readable for mailing tools.
      const labels: string[] = [];
      for (const { reg } of filtered) {
        for (const a of plain.get(reg.id)?.customAnswers ?? []) if (!labels.includes(a.label)) labels.push(a.label);
      }
      const esc = (v: string): string => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
      const header = ["Name", "Email", "Phone", "Status", "Event", "Event date", "Pass code", "Checked in at", ...labels];
      const lines: string[] = [header.map(esc).join(",")];
      for (const { reg, ev } of filtered) {
        const p = plain.get(reg.id)!;
        const byLabel = new Map(p.customAnswers.map((a) => [a.label, a.answer]));
        lines.push([
          p.name, p.email, p.phone ?? "", reg.status, ev.title, ev.date, reg.code ?? "",
          reg.checkedInAt ? reg.checkedInAt.toISOString() : "",
          ...labels.map((l) => byLabel.get(l) ?? ""),
        ].map(esc).join(","));
      }
      const org = await getOrgRow(ctx, args.orgId);
      const slug = (org?.name ?? "organization").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "organization";
      const filename = targetEvent ? `${slug}-contacts-event-${targetEvent.id}.csv` : `${slug}-contacts-all-events.csv`;
      return { csv: lines.join("\r\n"), filename, rowCount: filtered.length };
    },
  }),

  /* ---------- Trusted participants (admin-managed) ---------- */

  listTrustedParticipants: defineAction({
    description: "Lists one organization's trusted participants (emails decrypted for display). Trusted people are auto-approved when they register — no approver step. Audit details (who granted trusted status, by login email and login ID) are returned only when includeAudit is set — they are hidden by default and switched on per user in the admin UI. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive().default(1), includeAudit: z.boolean().default(false), ...requesterArgs }),
    response: z.object({ trusted: z.array(z.object({ id: z.number(), email: z.string(), googleId: z.string(), displayName: z.string(), createdAt: z.string(), addedByEmail: z.string().nullable(), addedByLoginId: z.string().nullable() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.trustedParticipants).where(eq(schema.trustedParticipants.orgId, args.orgId)).orderBy(asc(schema.trustedParticipants.id));
      const dec = await decryptFields(ctx, rows.map((r) => r.email));
      return { trusted: rows.map((r, i) => ({ id: r.id, email: dec[i] ?? "", googleId: r.googleId, displayName: r.displayName, createdAt: r.createdAt.toISOString(), addedByEmail: args.includeAudit ? (r.addedByEmail || null) : null, addedByLoginId: args.includeAudit ? (r.addedByLoginId || null) : null })) };
    },
  }),

  addTrustedParticipant: defineAction({
    description: "Marks a participant as trusted for one organization, by email and optionally Google ID. Future registrations from that email (or Google ID) are auto-approved with the pass issued immediately. Admin of the organization only. The email is stored encrypted with a blind index for matching. Trusted guests are a paid-plan feature — on Free this returns the freemium upgrade prompt.",
    request: z.object({ orgId: z.number().int().positive().default(1), email: z.string().email().max(200), googleId: z.string().max(200).default(""), displayName: z.string().max(120).default(""), ...requesterArgs }),
    response: z.object({ id: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertPaidAllowed(ctx, args.orgId, "Trusted guests");
      const db = ctx.db<typeof schema>();
      const hash = await emailIndex(ctx, args.email);
      const existing = await db.select({ id: schema.trustedParticipants.id }).from(schema.trustedParticipants)
        .where(and(eq(schema.trustedParticipants.orgId, args.orgId), eq(schema.trustedParticipants.emailHash, hash))).limit(1);
      if (existing.length > 0) throw new Error("That email is already on this organization's trusted list.");
      const enc = await encryptFields(ctx, [args.email.trim().toLowerCase()]);
      const result = await db.insert(schema.trustedParticipants).values({
        orgId: args.orgId, email: enc[0]!, emailHash: hash, googleId: args.googleId.trim(), displayName: args.displayName.trim(),
        addedByEmail: args.requestedByEmail ?? "", addedByLoginId: args.requestedByGoogleId ?? "",
      }).returning({ id: schema.trustedParticipants.id });
      const inserted = result[0];
      if (!inserted) throw new Error("Could not add the trusted participant.");
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  removeTrustedParticipant: defineAction({
    description: "Removes a participant from one organization's trusted list. Their future registrations go back to normal approver review; registrations already auto-approved keep their passes. Admin of the organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.trustedParticipants).where(and(eq(schema.trustedParticipants.id, args.id), eq(schema.trustedParticipants.orgId, args.orgId)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  /* ---------- Attendee flags (blacklist / alert, admin-managed) ---------- */

  listAttendeeFlags: defineAction({
    description: "Lists one organization's attendee flags (blacklist and alert) with the flag audit history — who flagged whom, when, and why, including edits and removals. Emails are decrypted for display. Admin of the organization only; flag data is never exposed on any attendee-facing surface.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({
      flags: z.array(z.object({ id: z.number(), email: z.string(), displayName: z.string(), flagType: z.enum(["blacklist", "alert"]), reason: z.string(), flaggedByEmail: z.string(), createdAt: z.string(), updatedAt: z.string() })),
      history: z.array(z.object({ id: z.number(), email: z.string(), displayName: z.string(), flagType: z.enum(["blacklist", "alert"]), action: z.enum(["flagged", "updated", "removed"]), reason: z.string(), actorEmail: z.string(), createdAt: z.string() })),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.attendeeFlags).where(eq(schema.attendeeFlags.orgId, args.orgId)).orderBy(desc(schema.attendeeFlags.id));
      const dec = await decryptFields(ctx, rows.map((r) => r.email));
      const hist = await db.select().from(schema.attendeeFlagHistory).where(eq(schema.attendeeFlagHistory.orgId, args.orgId)).orderBy(desc(schema.attendeeFlagHistory.id)).limit(100);
      const histDec = await decryptFields(ctx, hist.map((r) => r.email));
      return {
        flags: rows.map((r, i) => ({ id: r.id, email: dec[i] ?? "", displayName: r.displayName, flagType: r.flagType, reason: r.reason, flaggedByEmail: r.flaggedByEmail, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })),
        history: hist.map((r, i) => ({ id: r.id, email: histDec[i] ?? "", displayName: r.displayName, flagType: r.flagType, action: r.action, reason: r.reason, actorEmail: r.actorEmail, createdAt: r.createdAt.toISOString() })),
      };
    },
  }),

  setAttendeeFlag: defineAction({
    description: "Flags an attendee for one organization, or edits their existing flag: 'blacklist' refuses their registrations with a plain message and holds their existing registrations for review; 'alert' marks them for extra review — their registrations always go through the approver queue. A reason is required and every change is written to the flag audit history with the acting admin. Downgrading or replacing a blacklist releases the holds that flag created. Admin of the organization only. The email is stored encrypted with a blind index for matching.",
    request: z.object({ orgId: z.number().int().positive().default(1), email: z.string().email().max(200), displayName: z.string().max(120).default(""), flagType: z.enum(["blacklist", "alert"]), reason: z.string().min(1).max(500), ...identityArgs }),
    response: z.object({ id: z.number(), flagType: z.enum(["blacklist", "alert"]), heldCount: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const email = args.email.trim().toLowerCase();
      const reason = args.reason.trim();
      const hash = await emailIndex(ctx, email);
      const existing = await getAttendeeFlag(ctx, args.orgId, hash);
      const actorEmail = args.adminEmail ?? "";
      const actorLoginId = args.adminGoogleId ?? "";
      let flagId: number;
      let heldCount = 0;
      if (existing) {
        await db.update(schema.attendeeFlags).set({
          flagType: args.flagType, reason,
          displayName: args.displayName.trim() || existing.displayName,
          flaggedByEmail: actorEmail, flaggedByLoginId: actorLoginId, updatedAt: new Date(),
        }).where(eq(schema.attendeeFlags.id, existing.id));
        flagId = existing.id;
        await db.insert(schema.attendeeFlagHistory).values({
          orgId: args.orgId, flagId, email: existing.email, emailHash: hash,
          displayName: args.displayName.trim() || existing.displayName,
          flagType: args.flagType, action: "updated", reason, actorEmail, actorLoginId,
        });
        if (existing.flagType === "blacklist" && args.flagType !== "blacklist") await releaseFlagHolds(ctx, args.orgId, hash);
      } else {
        const enc = await encryptFields(ctx, [email]);
        const result = await db.insert(schema.attendeeFlags).values({
          orgId: args.orgId, email: enc[0]!, emailHash: hash, displayName: args.displayName.trim(),
          flagType: args.flagType, reason, flaggedByEmail: actorEmail, flaggedByLoginId: actorLoginId,
        }).returning({ id: schema.attendeeFlags.id });
        const inserted = result[0];
        if (!inserted) throw new Error("Could not save the flag.");
        flagId = inserted.id;
        await db.insert(schema.attendeeFlagHistory).values({
          orgId: args.orgId, flagId, email: enc[0]!, emailHash: hash,
          displayName: args.displayName.trim(),
          flagType: args.flagType, action: "flagged", reason, actorEmail, actorLoginId,
        });
      }
      if (args.flagType === "blacklist") heldCount = await holdRegistrationsForBlacklist(ctx, args.orgId, hash, reason);
      ctx.invalidateQueries();
      return { id: flagId, flagType: args.flagType, heldCount };
    },
  }),

  removeAttendeeFlag: defineAction({
    description: "Removes an attendee's flag for one organization. The removal is recorded in the flag audit history (with the flag's last type and reason). If the flag was a blacklist, the holds it placed on the person's registrations are released back to their normal flow. Future registrations are treated normally again. Admin of the organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.attendeeFlags).where(and(eq(schema.attendeeFlags.id, args.id), eq(schema.attendeeFlags.orgId, args.orgId))).limit(1);
      const flag = rows[0];
      if (!flag) throw new Error("That flag no longer exists.");
      await db.insert(schema.attendeeFlagHistory).values({
        orgId: args.orgId, flagId: flag.id, email: flag.email, emailHash: flag.emailHash,
        displayName: flag.displayName, flagType: flag.flagType, action: "removed", reason: flag.reason,
        actorEmail: args.adminEmail ?? "", actorLoginId: args.adminGoogleId ?? "",
      });
      await db.delete(schema.attendeeFlags).where(eq(schema.attendeeFlags.id, flag.id));
      if (flag.flagType === "blacklist") await releaseFlagHolds(ctx, args.orgId, flag.emailHash);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  /* ---------- New-event notifications (admin's choice, never automatic) ---------- */

  sendEventNotification: defineAction({
    description: "Sends (in this prototype: composes and logs) a new-event notification for one of the admin's organization events, to the audience the admin chose: trusted participants, the mailing/distribution list (people who opted in via a mailing/distribution-list question or the legacy Security Committee list opt-in), or both. Recipients are resolved from the organization's own encrypted data only. Admin only; the send is recorded in the notification log.",
    request: z.object({
      orgId: z.number().int().positive().default(1), eventId: z.number().int().positive(),
      audience: z.enum(["trusted", "mailing_list", "both", "subscribers"]),
      registrationUrl: z.string().max(500).default(""),
      ...requesterArgs,
    }),
    response: z.object({
      recipientCount: z.number(),
      recipients: z.array(z.object({ email: z.string(), channel: z.enum(["email", "text", "both"]), phone: z.string().nullable() })),
      subject: z.string(), body: z.string(), smsBody: z.string(),
      audience: z.enum(["trusted", "mailing_list", "both", "subscribers"]),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const org = await getOrgRow(ctx, args.orgId);
      const orgName = org?.name ?? "Organization";
      const db = ctx.db<typeof schema>();
      type Recipient = { email: string; channel: "email" | "text" | "both"; phone: string | null };
      const byEmail = new Map<string, Recipient>();
      const addRecipient = (em: string, channel: "email" | "text" | "both", phone: string | null) => {
        const k = em.trim().toLowerCase();
        if (!k.includes("@") || byEmail.has(k)) return;
        // Texting needs a number; without one the person gets email.
        const effective = channel !== "email" && !phone ? "email" as const : channel;
        byEmail.set(k, { email: em.trim(), channel: effective, phone });
      };
      if (args.audience === "trusted" || args.audience === "both") {
        const rows = await db.select().from(schema.trustedParticipants).where(eq(schema.trustedParticipants.orgId, args.orgId));
        const dec = await decryptFields(ctx, rows.map((r) => r.email));
        for (const em of dec) if (em) addRecipient(em, "email", null);
      }
      if (args.audience === "subscribers") {
        const rows = await db.select().from(schema.orgSubscriptions).where(eq(schema.orgSubscriptions.orgId, args.orgId));
        const dec = await decryptFields(ctx, rows.map((r) => r.email));
        for (const em of dec) if (em) addRecipient(em, "email", null);
      }
      if (args.audience === "mailing_list" || args.audience === "both") {
        const rows = await db.select({ reg: schema.registrations }).from(schema.registrations)
          .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
          .where(eq(schema.events.orgId, args.orgId));
        const visibleRows = rows.filter((r) => r.reg.held !== 1); // held (moderation) rows get no notifications
        const plain = await decryptRegs(ctx, visibleRows.map((r) => r.reg));
        for (const { reg } of visibleRows) {
          const p = plain.get(reg.id);
          if (!p) continue;
          const optedIn = reg.securityListOptIn === "yes" || p.customAnswers.some((a) => /mailing|distribution/i.test(a.label) && a.answer === "Yes");
          if (optedIn) addRecipient(p.email, (reg.notifyChannel ?? "email") as "email" | "text" | "both", p.phone);
        }
      }
      const recipients = [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
      const subject = `New event: ${ev.title} — ${orgName}`;
      const link = args.registrationUrl.trim();
      const body = [
        `Hello,`,
        ``,
        `${orgName} has a new event open for registration:`,
        ``,
        `${ev.title}`,
        `${ev.date} · ${ev.timeText}`,
        `${ev.location}`,
        ev.description ? `` : null,
        ev.description || null,
        ``,
        link ? `Register here: ${link}` : `Register on ${orgName}'s registration page.`,
        `Choose the event, add each attendee's name and email, and submit — an administrator reviews every registration, and approved attendees receive a QR pass by email.`,
        ``,
        org?.tagline ? `${org.tagline}` : null,
        orgName,
      ].filter((l): l is string => l !== null).join("\n");
      const smsBody = `${orgName}: New event — ${ev.title}, ${ev.date} · ${ev.timeText} at ${ev.location}.${link ? ` Register: ${link}` : ""}`;
      await db.insert(schema.eventNotifications).values({ orgId: args.orgId, eventId: ev.id, audience: args.audience, recipientCount: recipients.length, subject });
      ctx.invalidateQueries();
      return { recipientCount: recipients.length, recipients, subject, body, smsBody, audience: args.audience };
    },
  }),

  sendEventInvite: defineAction({
    description: "Emails an invitation for one event to the email addresses the organizer enters — part of the basics on EVERY plan, including Free (create the event, send the invite, collect RSVPs, know who's coming). Each invite email carries a calendar invite file (.ics, METHOD:REQUEST) built from the event's date, time, location, and description, so the event lands on the recipient's calendar even before they RSVP. Prototype mail posture: the invite is composed and logged (notification log, audience 'invite'), and the composed email plus the exact .ics are returned so the organizer can preview them and download the calendar file. Admin of the organization only.",
    request: z.object({
      orgId: z.number().int().positive().default(1), eventId: z.number().int().positive(),
      emails: z.array(z.string().email().max(200)).min(1).max(100),
      message: z.string().max(1000).default(""),
      registrationUrl: z.string().max(500).default(""),
      ...requesterArgs,
    }),
    response: z.object({
      recipientCount: z.number(), recipients: z.array(z.string()),
      subject: z.string(), body: z.string(), ics: z.string(), icsFilename: z.string(),
    }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const org = await getOrgRow(ctx, args.orgId);
      const orgName = org?.name ?? "Organization";
      const note = args.message.trim();
      if (note) {
        const mod = await moderateTexts(ctx, [note]);
        if (mod.flagged) throw new Error("That note couldn't be sent — it was flagged by content moderation. Please revise the wording and try again.");
      }
      const recipients = [...new Set(args.emails.map((e) => e.trim().toLowerCase()))];
      // Calendar invite (.ics): same construction as the public
      // calendar feed — timed when the time text parses, all-day
      // otherwise — as a REQUEST so mail clients offer Accept.
      const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
      const p2 = (n: number) => String(n).padStart(2, "0");
      const stamp = (d: Date) => `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`;
      const matches = [...ev.timeText.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
      const toHM = (m: RegExpMatchArray): [number, number] => { let h = Number(m[1] ?? "0") % 12; if ((m[3] ?? "").toUpperCase() === "PM") h += 12; return [h, Number(m[2] ?? "0")]; };
      const day = ev.date.replace(/-/g, "");
      const link = args.registrationUrl.trim();
      const icsLines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Approved Guest//Event Invite//EN", "CALSCALE:GREGORIAN", "METHOD:REQUEST", "BEGIN:VEVENT", `UID:event-${ev.id}@approvedguest`, `DTSTAMP:${stamp(new Date())}`];
      if (matches[0]) { const [sh, sm] = toHM(matches[0]); icsLines.push(`DTSTART:${day}T${p2(sh)}${p2(sm)}00`); let endH = sh + 2; let endM = sm; if (matches[1]) { [endH, endM] = toHM(matches[1]); } icsLines.push(`DTEND:${day}T${p2(endH % 24)}${p2(endM)}00`); }
      else { const start = new Date(`${ev.date}T00:00:00`); const end = new Date(start.getTime() + 24 * 60 * 60 * 1000); const ymd = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`; icsLines.push(`DTSTART;VALUE=DATE:${ymd(start)}`, `DTEND;VALUE=DATE:${ymd(end)}`); }
      const icsDesc = [ev.description, `Time: ${ev.timeText}`, link ? `RSVP: ${link}` : `RSVP with ${orgName} in Approved Guest.`].filter(Boolean).join("\n");
      icsLines.push(`SUMMARY:${esc(ev.title)}`, `LOCATION:${esc(ev.locationType === "virtual" && ev.virtualLink ? ev.virtualLink : ev.location)}`, `DESCRIPTION:${esc(icsDesc)}`, "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
      const ics = `${icsLines.join("\r\n")}\r\n`;
      const onFree = (org?.plan ?? "trial") === "trial";
      const subject = `You're invited: ${ev.title} — ${orgName}`;
      const body = [
        `Hello,`,
        ``,
        `${orgName} invites you to:`,
        ``,
        `${ev.title}`,
        `${ev.date} · ${ev.timeText}`,
        ev.locationType === "virtual" ? (ev.virtualLink ? `Online — join link: ${ev.virtualLink}` : `Online event`) : ev.location,
        ev.description ? `` : null,
        ev.description || null,
        note ? `` : null,
        note || null,
        ``,
        `A calendar invite is attached to this email — accept it and ${ev.title} is on your calendar.`,
        link ? `Please RSVP here so the organizer knows you're coming: ${link}` : `Please RSVP on ${orgName}'s registration page so the organizer knows you're coming.`,
        onFree
          ? `RSVP takes a moment — you're confirmed as soon as you submit, and the organizer's list shows who's coming. There's no pass to bring; just come along.`
          : `An organizer reviews each RSVP; confirmed guests receive their pass by email.`,
        ``,
        org?.tagline ? `${org.tagline}` : null,
        orgName,
      ].filter((l): l is string => l !== null).join("\n");
      const db = ctx.db<typeof schema>();
      await db.insert(schema.eventNotifications).values({ orgId: args.orgId, eventId: ev.id, audience: "invite", recipientCount: recipients.length, subject });
      ctx.invalidateQueries();
      return { recipientCount: recipients.length, recipients, subject, body, ics, icsFilename: `${ev.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-invite.ics` };
    },
  }),

  listEventNotifications: defineAction({
    description: "Lists the new-event notifications an organization's admins have chosen to send (audience, recipient count, subject, when). Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ notifications: z.array(z.object({ id: z.number(), eventId: z.number(), eventTitle: z.string(), audience: z.enum(["trusted", "mailing_list", "both", "subscribers", "invite"]), recipientCount: z.number(), subject: z.string(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ n: schema.eventNotifications, ev: schema.events }).from(schema.eventNotifications)
        .innerJoin(schema.events, eq(schema.eventNotifications.eventId, schema.events.id))
        .where(eq(schema.eventNotifications.orgId, args.orgId))
        .orderBy(desc(schema.eventNotifications.id));
      return { notifications: rows.map(({ n, ev }) => ({ id: n.id, eventId: n.eventId, eventTitle: ev.title, audience: n.audience as "trusted" | "mailing_list" | "both" | "subscribers", recipientCount: n.recipientCount, subject: n.subject, createdAt: n.createdAt.toISOString() })) };
    },
  }),

  /* ---------- Roles within an organization ---------- */

  checkAdminAccess: defineAction({
    description: "Checks a Google ID / email against one organization's role model: administrator, gatekeeper, registrant, or attendee. Roles never carry across organizations.",
    request: z.object({ googleId: z.string().max(200).optional(), email: z.string().max(200).optional(), orgId: z.number().int().positive().default(1) }),
    response: z.object({ isAdmin: z.boolean(), isGatekeeper: z.boolean(), isRegistrant: z.boolean(), isOwner: z.boolean(), canManageUsers: z.boolean(), role: z.enum(["owner", "admin", "gatekeeper", "registrant", "attendee"]) }),
    async handler(ctx, args) {
      // Roles are independent: one person can be a gatekeeper AND a
      // registrant, an admin AND a gatekeeper, and so on. `role` is only
      // the primary label (owner > admin > gatekeeper > registrant).
      const isOwner = await isAuthorizedOwner(ctx, args.orgId, args.googleId, args.email);
      const isAdmin = await isAuthorizedAdmin(ctx, args.orgId, args.googleId, args.email);
      const isGatekeeper = await isAuthorizedGatekeeper(ctx, args.orgId, args.googleId, args.email);
      const isRegistrant = await isAuthorizedRegistrant(ctx, args.orgId, args.googleId, args.email);
      const manage = await canManageUsers(ctx, args.orgId, args.googleId, args.email);
      return { isAdmin, isGatekeeper, isRegistrant, isOwner, canManageUsers: manage, role: isOwner ? ("owner" as const) : isAdmin ? ("admin" as const) : isGatekeeper ? ("gatekeeper" as const) : isRegistrant ? ("registrant" as const) : ("attendee" as const) };
    },
  }),

  listAuthorizedAdmins: defineAction({
    description: "Lists one organization's authorized administrators (Google IDs), including each admin's user-administration grant (canManageUsers — set by the owner). That organization's data only.",
    request: z.object({ orgId: z.number().int().positive().default(1) }),
    response: z.object({ admins: z.array(adminShape.extend({ canManageUsers: z.boolean() })) }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, args.orgId)).orderBy(asc(schema.authorizedAdmins.id));
      return { admins: rows.map((r) => ({ id: r.id, orgId: r.orgId, googleId: r.googleId, email: r.email, displayName: r.displayName, createdAt: r.createdAt.toISOString(), canManageUsers: r.canManageUsers === 1 })) };
    },
  }),

  setAdminUserAdmin: defineAction({
    description: "Owner only: grants or revokes one administrator's user-administration rights for the organization. The owner holds user administration by default; an admin can manage members, roles, invites, and removals only while this grant is on for them. Ownership itself is never affected.",
    request: z.object({ orgId: z.number().int().positive(), adminId: z.number().int().positive(), canManageUsers: z.boolean(), ...identityArgs }),
    response: z.object({ ok: z.literal(true), canManageUsers: z.boolean() }),
    async handler(ctx, args): Promise<{ ok: true; canManageUsers: boolean }> {
      await requireOwner(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      const row = (await db.select().from(schema.authorizedAdmins).where(and(eq(schema.authorizedAdmins.id, args.adminId), eq(schema.authorizedAdmins.orgId, args.orgId))))[0];
      if (!row) throw new Error("That administrator isn't on this organization's list.");
      await db.update(schema.authorizedAdmins).set({ canManageUsers: args.canManageUsers ? 1 : 0 }).where(eq(schema.authorizedAdmins.id, args.adminId));
      ctx.invalidateQueries();
      return { ok: true, canManageUsers: args.canManageUsers };
    },
  }),

  listAuthorizedGatekeepers: defineAction({
    description: "Lists one organization's authorized gatekeepers (door code-check only, no admin access).",
    request: z.object({ orgId: z.number().int().positive().default(1) }),
    response: z.object({ gatekeepers: z.array(adminShape) }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.authorizedGatekeepers).where(eq(schema.authorizedGatekeepers.orgId, args.orgId)).orderBy(asc(schema.authorizedGatekeepers.id));
      return { gatekeepers: rows.map((r) => ({ id: r.id, orgId: r.orgId, googleId: r.googleId, email: r.email, displayName: r.displayName, createdAt: r.createdAt.toISOString() })) };
    },
  }),

  addAuthorizedAdmin: defineAction({
    description: "Adds a Google ID to one organization's administrators list. Only an existing authorized admin of that same organization can add another.",
    request: z.object({ orgId: z.number().int().positive().default(1), googleId: z.string().min(1).max(200), email: z.string().email().max(200), displayName: z.string().min(1).max(120), ...requesterArgs }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await assertSeatAvailable(ctx, args.orgId, "admin");
      assertStaffDomainAllowed(await getOrgRow(ctx, args.orgId), "admin", args.email);
      const result = await db.insert(schema.authorizedAdmins).values({ orgId: args.orgId, googleId: args.googleId.trim(), email: args.email.trim().toLowerCase(), displayName: args.displayName.trim() }).returning({ id: schema.authorizedAdmins.id });
      const inserted = result[0];
      if (!inserted) throw new Error("Could not add administrator.");
      await logMembershipChange(ctx, args.orgId, "admin", "added", { email: args.email.trim().toLowerCase(), name: args.displayName.trim(), loginId: args.googleId.trim() }, { email: args.requestedByEmail, loginId: args.requestedByGoogleId });
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  removeAuthorizedAdmin: defineAction({
    description: "Removes a Google ID from one organization's administrators list. Cannot remove the organization's last remaining admin.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const targetRows = await db.select().from(schema.authorizedAdmins).where(and(eq(schema.authorizedAdmins.id, args.id), eq(schema.authorizedAdmins.orgId, args.orgId))).limit(1);
      const target = targetRows[0];
      if (target && (await isAuthorizedOwner(ctx, args.orgId, target.googleId, target.email)) && !(await isAuthorizedOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail))) {
        throw new Error("That person is an owner of this organization — only another owner can remove an owner from the administrators list.");
      }
      const all = await db.select({ id: schema.authorizedAdmins.id }).from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, args.orgId));
      if (all.length <= 1) throw new Error("You can't remove the organization's last authorized administrator.");
      await db.delete(schema.authorizedAdmins).where(and(eq(schema.authorizedAdmins.id, args.id), eq(schema.authorizedAdmins.orgId, args.orgId)));
      if (target) await logMembershipChange(ctx, args.orgId, "admin", "removed", { email: target.email, name: target.displayName, loginId: target.googleId }, { email: args.requestedByEmail, loginId: args.requestedByGoogleId });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  addAuthorizedGatekeeper: defineAction({
    description: "Adds a Google ID to one organization's gatekeepers list. Only an authorized administrator of that organization can add gatekeepers.",
    request: z.object({ orgId: z.number().int().positive().default(1), googleId: z.string().min(1).max(200), email: z.string().email().max(200), displayName: z.string().min(1).max(120), ...requesterArgs }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await assertSeatAvailable(ctx, args.orgId, "gatekeeper");
      assertStaffDomainAllowed(await getOrgRow(ctx, args.orgId), "gatekeeper", args.email);
      const result = await db.insert(schema.authorizedGatekeepers).values({ orgId: args.orgId, googleId: args.googleId.trim(), email: args.email.trim().toLowerCase(), displayName: args.displayName.trim() }).returning({ id: schema.authorizedGatekeepers.id });
      const inserted = result[0];
      if (!inserted) throw new Error("Could not add greeter.");
      await logMembershipChange(ctx, args.orgId, "gatekeeper", "added", { email: args.email.trim().toLowerCase(), name: args.displayName.trim(), loginId: args.googleId.trim() }, { email: args.requestedByEmail, loginId: args.requestedByGoogleId });
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  removeAuthorizedGatekeeper: defineAction({
    description: "Removes a Google ID from one organization's gatekeepers list. Admin of that organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const target = (await db.select().from(schema.authorizedGatekeepers).where(and(eq(schema.authorizedGatekeepers.id, args.id), eq(schema.authorizedGatekeepers.orgId, args.orgId))).limit(1))[0];
      await db.delete(schema.authorizedGatekeepers).where(and(eq(schema.authorizedGatekeepers.id, args.id), eq(schema.authorizedGatekeepers.orgId, args.orgId)));
      if (target) await logMembershipChange(ctx, args.orgId, "gatekeeper", "removed", { email: target.email, name: target.displayName, loginId: target.googleId }, { email: args.requestedByEmail, loginId: args.requestedByGoogleId });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),


  listAuthorizedRegistrants: defineAction({
    description: "Lists one organization's authorized registrants — people who may register others on their behalf (no admin or door access).",
    request: z.object({ orgId: z.number().int().positive().default(1) }),
    response: z.object({ registrants: z.array(adminShape) }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.authorizedRegistrants).where(eq(schema.authorizedRegistrants.orgId, args.orgId)).orderBy(asc(schema.authorizedRegistrants.id));
      return { registrants: rows.map((r) => ({ id: r.id, orgId: r.orgId, googleId: r.googleId, email: r.email, displayName: r.displayName, createdAt: r.createdAt.toISOString() })) };
    },
  }),

  addAuthorizedRegistrant: defineAction({
    description: "Adds a Google ID to one organization's registrants list. Only an authorized administrator of that organization can add registrants.",
    request: z.object({ orgId: z.number().int().positive().default(1), googleId: z.string().min(1).max(200), email: z.string().email().max(200), displayName: z.string().min(1).max(120), ...requesterArgs }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await assertSeatAvailable(ctx, args.orgId, "registrant");
      assertStaffDomainAllowed(await getOrgRow(ctx, args.orgId), "registrant", args.email);
      const result = await db.insert(schema.authorizedRegistrants).values({ orgId: args.orgId, googleId: args.googleId.trim(), email: args.email.trim().toLowerCase(), displayName: args.displayName.trim() }).returning({ id: schema.authorizedRegistrants.id });
      const inserted = result[0];
      if (!inserted) throw new Error("Could not add registrant.");
      await logMembershipChange(ctx, args.orgId, "registrant", "added", { email: args.email.trim().toLowerCase(), name: args.displayName.trim(), loginId: args.googleId.trim() }, { email: args.requestedByEmail, loginId: args.requestedByGoogleId });
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  removeAuthorizedRegistrant: defineAction({
    description: "Removes a Google ID from one organization's registrants list. Admin of that organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const target = (await db.select().from(schema.authorizedRegistrants).where(and(eq(schema.authorizedRegistrants.id, args.id), eq(schema.authorizedRegistrants.orgId, args.orgId))).limit(1))[0];
      await db.delete(schema.authorizedRegistrants).where(and(eq(schema.authorizedRegistrants.id, args.id), eq(schema.authorizedRegistrants.orgId, args.orgId)));
      if (target) await logMembershipChange(ctx, args.orgId, "registrant", "removed", { email: target.email, name: target.displayName, loginId: target.googleId }, { email: args.requestedByEmail, loginId: args.requestedByGoogleId });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  /* ---------- Google connection ---------- */

  getGoogleConfig: defineAction({
    description: "Returns the Google OAuth 2.0 Web client ID configured for Sign in with Google, or null when Google sign-in has not been connected yet. The client ID is a public identifier (it ships in the page), not a secret.",
    request: z.object({}),
    response: z.object({ clientId: z.string().nullable() }),
    async handler(ctx) {
      return { clientId: await getSetting(ctx, GOOGLE_CLIENT_ID_KEY) };
    },
  }),

  getAppDownloadLinks: defineAction({
    description: "Returns the configured Approved Guest app download links (App Store and Google Play) used when a website registrant says Yes to the arrival pop-up and is told they need the app. Both are public store URLs, not secrets; null means that store's link has not been configured yet.",
    request: z.object({}),
    response: z.object({ appStoreUrl: z.string().nullable(), googlePlayUrl: z.string().nullable() }),
    async handler(ctx) {
      return { appStoreUrl: await getSetting(ctx, APP_STORE_URL_KEY), googlePlayUrl: await getSetting(ctx, GOOGLE_PLAY_URL_KEY) };
    },
  }),

  setAppDownloadLinks: defineAction({
    description: "Saves the Approved Guest app download links (App Store / Google Play) shown to website registrants who say Yes to the arrival pop-up. Admin of the given organization only. An empty string clears that store's link.",
    request: z.object({ appStoreUrl: z.string().max(500), googlePlayUrl: z.string().max(500), orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const check = (raw: string, label: string): string => {
        const v = raw.trim();
        if (!v) return "";
        let u: URL;
        try { u = new URL(v); } catch { throw new Error(`That doesn't look like a ${label} link — paste the full address, starting with https://`); }
        if (u.protocol !== "https:") throw new Error(`The ${label} link must start with https://`);
        return v;
      };
      await setSetting(ctx, APP_STORE_URL_KEY, check(args.appStoreUrl, "App Store"));
      await setSetting(ctx, GOOGLE_PLAY_URL_KEY, check(args.googlePlayUrl, "Google Play"));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  setGoogleClientId: defineAction({
    description: "Saves the Google OAuth 2.0 Web client ID used by Sign in with Google. Admin of the given organization only.",
    request: z.object({ clientId: z.string().min(1).max(300), orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const clientId = args.clientId.trim();
      if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
        throw new Error("That doesn't look like a Google OAuth client ID — it should end in .apps.googleusercontent.com. Copy it exactly from Google Cloud Console → APIs & Services → Credentials.");
      }
      await setSetting(ctx, GOOGLE_CLIENT_ID_KEY, clientId);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  verifyGoogleCredential: defineAction({
    description: "Verifies a Google Identity Services ID token (JWT) server-side — RS256 signature against Google's public keys plus iss/aud/exp/email_verified checks — and returns the verified Google ID (sub), email, and name. Also anchors admin/gatekeeper entries to the real Google ID when their email matches a placeholder entry (e.g. an onboarding invite).",
    request: z.object({ credential: z.string().min(10).max(8192) }),
    response: z.object({ googleId: z.string(), email: z.string(), name: z.string(), sessionToken: z.string(), sessionFreshUntil: z.string(), sessionMethod: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const clientId = await getSetting(ctx, GOOGLE_CLIENT_ID_KEY);
      if (!clientId) throw new Error("Google sign-in is not connected yet. An administrator needs to add the Google OAuth client ID first.");
      const claims = await verifyGoogleToken(args.credential.trim(), clientId);
      await reconcileRoleGoogleIds(ctx, claims.sub, claims.email);
      await markEmailVerified(ctx, claims.email);
      ctx.invalidateQueries();
      return { googleId: claims.sub, email: claims.email, name: claims.name, ...(await mintAuthSession(ctx, claims.sub, claims.email, "google")) };
    },
  }),

  /* ---------- Sign in with Apple (connection + verification) ---------- */

  getAppleConfig: defineAction({
    description: "Returns the Apple Services ID configured for Sign in with Apple, or null when Apple sign-in has not been connected yet. The Services ID is a public identifier, not a secret.",
    request: z.object({}),
    response: z.object({ clientId: z.string().nullable() }),
    async handler(ctx) {
      return { clientId: await getSetting(ctx, APPLE_CLIENT_ID_KEY) };
    },
  }),

  setAppleClientId: defineAction({
    description: "Saves the Apple Services ID used by Sign in with Apple. Admin of the given organization only.",
    request: z.object({ clientId: z.string().min(1).max(300), orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const clientId = args.clientId.trim();
      if (!/^[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z0-9.-]+$/.test(clientId) || !clientId.includes(".")) {
        throw new Error("That doesn't look like an Apple Services ID — it's a reverse-domain identifier like com.example.eventapp, from Apple Developer → Certificates, Identifiers & Profiles → Services IDs.");
      }
      await setSetting(ctx, APPLE_CLIENT_ID_KEY, clientId);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  verifyAppleCredential: defineAction({
    description: "Verifies a Sign in with Apple ID token server-side (RS256 against Apple's public keys, iss/aud/exp) and returns the unified identity: id 'apple:<sub>', email, and name (Apple only shares the name on first authorization, so the client passes it when present). The identity links to the same attendee/admin/gatekeeper records as Google or email sign-in, matched by email and role lists. Also marks the email verified and anchors placeholder role entries to the Apple ID.",
    request: z.object({ idToken: z.string().min(10).max(8192), name: z.string().max(120).optional() }),
    response: z.object({ googleId: z.string(), email: z.string(), name: z.string(), sessionToken: z.string(), sessionFreshUntil: z.string(), sessionMethod: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const clientId = await getSetting(ctx, APPLE_CLIENT_ID_KEY);
      if (!clientId) throw new Error("Sign in with Apple is not connected yet. An administrator needs to add the Apple Services ID first.");
      const claims = await verifyAppleToken(args.idToken.trim(), clientId);
      const identityId = `apple:${claims.sub}`;
      await reconcileRoleGoogleIds(ctx, identityId, claims.email);
      await markEmailVerified(ctx, claims.email);
      ctx.invalidateQueries();
      return { googleId: identityId, email: claims.email, name: args.name?.trim() || claims.email, ...(await mintAuthSession(ctx, identityId, claims.email, "apple")) };
    },
  }),

  /* ---------- Email sign-in (6-digit code) ---------- */

  requestEmailSignInCode: defineAction({
    description: "Starts email sign-in: generates a 6-digit code for the address (only its hash is stored, 30-minute expiry) and returns the sign-in email exactly as it would be sent, so the prototype can show it. In production this email is delivered to the address; entering the code proves control of it. Requesting a new code replaces the previous one.",
    request: z.object({ email: z.string().email().max(200) }),
    response: z.object({ sent: z.literal(true), preview: z.object({ to: z.string(), subject: z.string(), body: z.string() }) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ sent: true; preview: { to: string; subject: string; body: string } }> {
      const em = args.email.trim().toLowerCase();
      const hash = await emailIndex(ctx, em);
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = await sha256Hex(`${em}:${code}`);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.emailSigninCodes).where(eq(schema.emailSigninCodes.emailHash, hash));
      const now = Date.now();
      await db.insert(schema.emailSigninCodes).values({ emailHash: hash, codeHash, expiresAt: now + 30 * 60 * 1000, createdAt: now });
      return {
        sent: true,
        preview: {
          to: em,
          subject: "Your sign-in code",
          body: `Hello,\n\nYour sign-in code is ${code}.\n\nEnter it in the app within 30 minutes to finish signing in. If the confirmation hiccups (a lost connection, say), just enter the SAME code again — it will still work. If you didn't request this code, you can ignore this email — nobody can sign in without it.`,
        },
      };
    },
  }),

  verifyEmailSignInCode: defineAction({
    description: "Completes email sign-in: checks the 6-digit code (30-minute expiry), then returns the unified identity 'email:<address>' with the name the person entered. The address is marked verified (the code proved control of it) and placeholder role entries are anchored to the identity. Failure-proof by design: the code is consumed (used_at) only AFTER every completion step has succeeded, so a failed attempt never burns it; and a code consumed within the last 15 minutes REPLAYS — re-entering the same code after a lost response, a timeout, or a double submit mints a fresh session for the same identity instead of erroring. Wrong-code and expired errors are distinct and leave state untouched or cleaned up respectively.",
    request: z.object({ email: z.string().email().max(200), code: z.string().min(4).max(10), name: z.string().min(1).max(120) }),
    response: z.object({ googleId: z.string(), email: z.string(), name: z.string(), sessionToken: z.string(), sessionFreshUntil: z.string(), sessionMethod: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const em = args.email.trim().toLowerCase();
      const hash = await emailIndex(ctx, em);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.emailSigninCodes).where(eq(schema.emailSigninCodes.emailHash, hash)).orderBy(desc(schema.emailSigninCodes.id)).limit(1);
      const row = rows[0];
      if (!row) throw new Error("No sign-in code is on file for that email — tap “Email me a sign-in code” to get a new one.");
      const codeHash = await sha256Hex(`${em}:${args.code.trim()}`);
      if (codeHash !== row.codeHash) throw new Error("That code doesn't match the one we sent — check for a typo and try again. Your code stays valid.");
      const identityId = `email:${em}`;
      const completeSignIn = async () => {
        // Every fallible step runs BEFORE the code is consumed, so a
        // failure anywhere leaves the code good for another try.
        await reconcileRoleGoogleIds(ctx, identityId, em);
        await markEmailVerified(ctx, em);
        const session = await mintAuthSession(ctx, identityId, em, "email");
        return { googleId: identityId, email: em, name: args.name.trim(), ...session };
      };
      const REPLAY_WINDOW_MS = 15 * 60 * 1000;
      if (row.usedAt) {
        // Already consumed by an earlier attempt whose result never
        // reached the person (lost response, double submit, reload).
        // Within the replay window, the same code simply completes
        // the same sign-in again — a fresh session, same identity.
        if (Date.now() - row.usedAt <= REPLAY_WINDOW_MS) {
          const out = await completeSignIn();
          ctx.invalidateQueries();
          return out;
        }
        throw new Error("That code was already used to sign in — if you're not signed in now, request a new code.");
      }
      if (row.expiresAt <= Date.now()) { await db.delete(schema.emailSigninCodes).where(eq(schema.emailSigninCodes.id, row.id)); throw new Error("That code has expired — codes are good for 30 minutes. Request a new one."); }
      const out = await completeSignIn();
      // Consume LAST, once the sign-in has fully succeeded.
      await db.update(schema.emailSigninCodes).set({ usedAt: Date.now() }).where(eq(schema.emailSigninCodes.id, row.id));
      ctx.invalidateQueries();
      return out;
    },
  }),

  /* ---------- Email verification (magic link) ---------- */

  requestEmailVerification: defineAction({
    description: "Sends (or re-sends) the verification magic link for an email address, unless it is already verified — verified addresses never need re-validation. Returns the token so the client can render the exact email; the link itself is the credential.",
    request: z.object({ email: z.string().email().max(200) }),
    response: z.object({ alreadyVerified: z.boolean(), request: z.object({ email: z.string(), token: z.string(), expiresAt: z.string() }).nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const request = await ensureVerificationRequest(ctx, args.email);
      ctx.invalidateQueries();
      return { alreadyVerified: request === null, request };
    },
  }),

  verifyEmailToken: defineAction({
    description: "Verifies an email address from a magic-link token. Once verified, the address is recorded as verified and future registrations with it skip re-validation.",
    request: z.object({ token: z.string().min(8).max(200) }),
    response: z.object({ outcome: z.enum(["verified", "already_verified", "expired", "invalid"]), email: z.string().nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.emailVerifications).where(eq(schema.emailVerifications.token, args.token)).limit(1);
      const row = rows[0];
      if (!row) return { outcome: "invalid" as const, email: null };
      const plain = await decryptFields(ctx, [row.email]);
      const email = plain[0] ?? null;
      if (row.verifiedAt) return { outcome: "already_verified" as const, email };
      if (!row.tokenExpiresAt || row.tokenExpiresAt <= Date.now()) return { outcome: "expired" as const, email };
      await db.update(schema.emailVerifications).set({ verifiedAt: new Date(), token: null, tokenExpiresAt: null }).where(eq(schema.emailVerifications.id, row.id));
      ctx.invalidateQueries();
      return { outcome: "verified" as const, email };
    },
  }),

  checkEmailsVerified: defineAction({
    description: "Reports, for each given email address, whether it has been verified (magic link or a provider sign-in). Used by the registration form to show verification status live.",
    request: z.object({ emails: z.array(z.string().email().max(200)).max(12) }),
    response: z.object({ results: z.array(z.object({ email: z.string(), verified: z.boolean() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const hashes = new Map<string, string>();
      for (const em of args.emails) hashes.set(em.trim().toLowerCase(), await emailIndex(ctx, em));
      const verified = await verifiedHashSet(ctx, [...hashes.values()]);
      return { results: args.emails.map((em) => { const k = em.trim().toLowerCase(); return { email: k, verified: verified.has(hashes.get(k)!) }; }) };
    },
  }),

  /* ---------- Subscription & onboarding progress ---------- */

  updateSubscription: defineAction({
    description: "Chooses or changes an organization's subscription plan and optionally saves a payment card's last 4 digits and brand (the full card number is never sent to or stored by the app; Stripe billing runs in prototype/test-mode shape until live Stripe keys are connected). The Free plan is permanent and feature-limited — nothing is ever charged on Free, and there is no event limit and no clock. Upgrading from Free to a paid plan (Starter $29/mo, Growth $59/mo, Unlimited $99/mo) STARTS the subscription: with a card on file the plan activates and the first monthly invoice is recorded as paid; without a card the plan is chosen but stays pending (status trialing, invoice due) until the owner adds the card — still no charge. OWNER of the organization only — billing belongs to the owners, not day-to-day admins.",
    request: z.object({ orgId: z.number().int().positive(), plan: z.enum(["trial", "starter", "community", "pro"]), cardLast4: z.string().regex(/^\d{4}$/).optional(), cardBrand: z.string().max(30).optional(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const org = await getOrgRow(ctx, args.orgId);
      const patch: Partial<OrgRow> = { plan: args.plan };
      if (args.cardLast4) { patch.cardLast4 = args.cardLast4; patch.cardBrand = args.cardBrand ?? "Card"; }
      const hasCard = !!(patch.cardLast4 ?? org?.cardLast4);
      const leavingTrial = !!org && org.plan === "trial" && args.plan !== "trial";
      if (org && args.plan !== "trial" && (org.subscriptionStatus === "canceled" || leavingTrial)) {
        // Starting (or restarting) the subscription requires the card;
        // without one it stays pending — never charged, never expiring.
        patch.subscriptionStatus = hasCard ? "active" : "trialing";
      }
      await db.update(schema.organizations).set(patch).where(eq(schema.organizations.id, args.orgId));
      const prices: Record<string, number> = PLAN_PRICES_CENTS;
      const names: Record<string, string> = PLAN_DISPLAY_NAMES;
      if (org && args.plan !== org.plan && args.plan !== "trial" && prices[args.plan]) {
        const started = (patch.subscriptionStatus ?? org.subscriptionStatus) === "active";
        await db.insert(schema.billingInvoices).values({ orgId: args.orgId, description: `${names[args.plan]} plan — monthly${leavingTrial ? " (subscription starts now — nothing was charged while you were on the Free plan)" : ""}`, amountCents: prices[args.plan]!, status: started ? "paid" : "due" });
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getBilling: defineAction({
    description: "Returns an organization's billing overview for its OWNER: plan, subscription status, card on file (last 4 + brand only), whether live Stripe is connected, the invoice history, and the registration events used across all time (freeEventsUsed / freeEventsTotal are legacy reporting fields from the retired 2-free-events model — the Free plan itself has no event balance, no end date, and no charge). Owners only — administrators cannot see or change billing.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({
      plan: z.string(), subscriptionStatus: z.string(), trialEndsAt: z.string().nullable(),
      cardLast4: z.string().nullable(), cardBrand: z.string().nullable(), stripeConnected: z.boolean(),
      freeEventsUsed: z.number(), freeEventsTotal: z.number(),
      cancelledAt: z.string().nullable(), endsAt: z.string().nullable(), purgeAfter: z.string().nullable(), daysUntilDeletion: z.number().nullable(),
      reminders: z.array(z.object({ kind: z.string(), detail: z.string(), createdAt: z.string() })),
      invoices: z.array(z.object({ id: z.number(), description: z.string(), amountCents: z.number(), status: z.string(), createdAt: z.string() })),
    }),
    async handler(ctx, args) {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail, { allowEnded: true });
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      const db = ctx.db<typeof schema>();
      const invoices = await db.select().from(schema.billingInvoices).where(eq(schema.billingInvoices.orgId, args.orgId)).orderBy(desc(schema.billingInvoices.id));
      const reminders = await db.select().from(schema.subscriptionReminderLog).where(eq(schema.subscriptionReminderLog.orgId, args.orgId)).orderBy(asc(schema.subscriptionReminderLog.id));
      return {
        plan: org.plan, subscriptionStatus: org.subscriptionStatus,
        trialEndsAt: org.trialEndsAt ? new Date(org.trialEndsAt).toISOString() : null,
        cardLast4: org.cardLast4 ?? null, cardBrand: org.cardBrand ?? null,
        stripeConnected: !!org.stripeCustomerId,
        freeEventsUsed: await trialRegistrationEventsUsed(ctx, args.orgId), freeEventsTotal: FREE_TRIAL_EVENTS + (org.trialBonusEvents ?? 0),
        cancelledAt: org.cancelledAt ? new Date(org.cancelledAt).toISOString() : null,
        endsAt: org.accessEndsAt ? new Date(org.accessEndsAt).toISOString() : null,
        purgeAfter: org.purgeAfter ? new Date(org.purgeAfter).toISOString() : null,
        daysUntilDeletion: org.purgeAfter ? Math.max(0, Math.ceil((new Date(org.purgeAfter).getTime() - Date.now()) / 86400000)) : null,
        reminders: reminders.map((r) => ({ kind: r.kind, detail: r.detail, createdAt: new Date(r.createdAt).toISOString() })),
        invoices: invoices.slice(0, 24).map((i) => ({ id: i.id, description: i.description, amountCents: i.amountCents, status: i.status, createdAt: new Date(i.createdAt).toISOString() })),
      };
    },
  }),

  addPaymentMethod: defineAction({
    description: "Saves or replaces the payment card on an organization's subscription — only the last 4 digits and brand are stored (in production this is where the Stripe PaymentMethod id returned by Stripe.js is attached to the Stripe customer). If the owner already chose a paid plan that was waiting for a card, adding the card STARTS the subscription (status active, first invoice marked paid). No card is ever needed — or charged — while the organization is on the Free plan. OWNER only.",
    request: z.object({ orgId: z.number().int().positive(), cardLast4: z.string().regex(/^\d{4}$/), cardBrand: z.string().max(30), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const org = await getOrgRow(ctx, args.orgId);
      const patch: Partial<OrgRow> = { cardLast4: args.cardLast4, cardBrand: args.cardBrand };
      const startsNow = !!org && org.plan !== "trial" && org.subscriptionStatus === "trialing";
      if (startsNow) patch.subscriptionStatus = "active";
      // A fresh working card also REPAIRS a failed payment: the failure
      // is cleared, the account unfreezes, and held auto-approvals are
      // processed in a batch (processHeldApprovals below).
      const repairsFailure = !!org?.paymentFailedAt;
      if (repairsFailure) { patch.paymentFailedAt = null; patch.subscriptionStatus = "active"; }
      await db.update(schema.organizations).set(patch).where(eq(schema.organizations.id, args.orgId));
      if (startsNow || repairsFailure) {
        const due = await db.select().from(schema.billingInvoices).where(eq(schema.billingInvoices.orgId, args.orgId)).orderBy(desc(schema.billingInvoices.id));
        const firstDue = due.find((i) => i.status === "due");
        if (firstDue) await db.update(schema.billingInvoices).set({ status: "paid" }).where(eq(schema.billingInvoices.id, firstDue.id));
      }
      if (repairsFailure) await processHeldApprovals(ctx, args.orgId);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  cancelSubscription: defineAction({
    description: "Cancels an organization's subscription and starts the end-of-life timeline, which is returned so the owner sees it plainly BEFORE and AFTER confirming: administration continues until the end of the current paid period (endsAt — for the Free plan, which has no paid period, today); after that date the organization can no longer be administered (its events stay visible to attendees) and a 30-day cooling-off window runs, during which the owner can sign in ONLY to reactivate; when the window closes (purgeAfter) ALL of the organization's data is permanently deleted. Data export is offered at cancellation time and throughout the paid period — never during cooling-off. The cancellation and both dates are recorded on the invoice history. OWNER only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true), endsAt: z.string(), purgeAfter: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; endsAt: string; purgeAfter: string }> {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      if (org.subscriptionStatus === "canceled" && org.accessEndsAt) return { ok: true, endsAt: new Date(org.accessEndsAt).toISOString(), purgeAfter: org.purgeAfter ? new Date(org.purgeAfter).toISOString() : new Date(new Date(org.accessEndsAt).getTime() + 30 * 86400000).toISOString() };
      const now = Date.now();
      // End of the current period: one month after the most recent
      // invoice (the same renewal math as the billing overview). A
      // trial organization has no paid period — its access ends today.
      let endsAt = now;
      if (org.plan !== "trial") {
        const invoices = await db.select({ createdAt: schema.billingInvoices.createdAt }).from(schema.billingInvoices).where(eq(schema.billingInvoices.orgId, args.orgId)).orderBy(desc(schema.billingInvoices.id));
        const first = invoices.find((i) => i.createdAt);
        if (first) { const d = new Date(first.createdAt); d.setMonth(d.getMonth() + 1); if (d.getTime() > now) endsAt = d.getTime(); }
      }
      const purgeAfter = endsAt + 30 * 86400000;
      await db.update(schema.organizations).set({ subscriptionStatus: "canceled", cancelledAt: new Date(now), accessEndsAt: new Date(endsAt), purgeAfter: new Date(purgeAfter), purgeReminders: "" }).where(eq(schema.organizations.id, args.orgId));
      await db.insert(schema.billingInvoices).values({ orgId: args.orgId, description: `Subscription canceled by the owner — no further charges. Administration continues until ${new Date(endsAt).toLocaleDateString("en-US")}; all organization data is deleted on ${new Date(purgeAfter).toLocaleDateString("en-US")} unless the subscription is reactivated first.`, amountCents: 0, status: "void" });
      ctx.invalidateQueries();
      return { ok: true, endsAt: new Date(endsAt).toISOString(), purgeAfter: new Date(purgeAfter).toISOString() };
    },
  }),

  reactivateSubscription: defineAction({
    description: "Reactivates a canceled subscription — available to the OWNER both before the end date (undoing the cancellation) and during the 30-day cooling-off window after it. Reactivation restores full administration immediately and keeps ALL of the organization's data — nothing is lost, and the deletion timeline is cleared. With a card on file the plan returns to active; without one it returns to trialing until a card is added.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true), subscriptionStatus: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; subscriptionStatus: string }> {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail, { allowEnded: true });
      const db = ctx.db<typeof schema>();
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      if (org.subscriptionStatus !== "canceled") throw new Error("This subscription isn't canceled — there's nothing to reactivate.");
      if (orgLifecycle(org) === "purge_due") throw new Error("The 30-day reactivation window has closed and this organization's data has been scheduled for deletion — it can no longer be reactivated.");
      const status = org.plan === "trial" ? "trialing" : org.cardLast4 ? "active" : "trialing";
      await db.update(schema.organizations).set({ subscriptionStatus: status, cancelledAt: null, accessEndsAt: null, purgeAfter: null, purgeReminders: "" }).where(eq(schema.organizations.id, args.orgId));
      await db.insert(schema.billingInvoices).values({ orgId: args.orgId, description: "Subscription reactivated by the owner — full administration restored, all data retained", amountCents: 0, status: "paid" });
      ctx.invalidateQueries();
      return { ok: true, subscriptionStatus: status };
    },
  }),

  exportOrganizationData: defineAction({
    description: "A complete data export for the OWNER: the organization, every event, every registration (decrypted names, emails, phones, statuses, pass codes, and question answers), attendee groups and members, the trusted list, team role lists, announcements, invoices, and the membership audit log — one JSON file. Offered at cancellation time and any time while the subscription is current or in its paid period; it is NOT available during the post-end cooling-off window or after deletion (the requireOwner cooling-off guard enforces that).",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ filename: z.string(), json: z.string(), counts: z.object({ events: z.number(), registrations: z.number(), groups: z.number() }) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      const evs = await db.select().from(schema.events).where(eq(schema.events.orgId, args.orgId)).orderBy(asc(schema.events.id));
      const eventIds = evs.map((e) => e.id);
      const regs = eventIds.length ? await db.select().from(schema.registrations).where(inArray(schema.registrations.eventId, eventIds)).orderBy(asc(schema.registrations.id)) : [];
      const plain = await decryptRegs(ctx, regs);
      const groups = await db.select().from(schema.attendeeGroups).where(eq(schema.attendeeGroups.orgId, args.orgId));
      const members = groups.length ? await db.select().from(schema.attendeeGroupMembers).where(inArray(schema.attendeeGroupMembers.groupId, groups.map((g) => g.id))) : [];
      const memberDec = await decryptFields(ctx, members.map((m) => m.email));
      const memberPlain = new Map(members.map((m, i) => [m.email, memberDec[i] ?? ""] as const));
      const trusted = await db.select().from(schema.trustedParticipants).where(eq(schema.trustedParticipants.orgId, args.orgId));
      const trustedDec = await decryptFields(ctx, trusted.map((t) => t.email));
      const trustedPlain = new Map(trusted.map((t, i) => [t.email, trustedDec[i] ?? ""] as const));
      const owners = await db.select().from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, args.orgId));
      const admins = await db.select().from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, args.orgId));
      const gatekeepers = await db.select().from(schema.authorizedGatekeepers).where(eq(schema.authorizedGatekeepers.orgId, args.orgId));
      const registrants = await db.select().from(schema.authorizedRegistrants).where(eq(schema.authorizedRegistrants.orgId, args.orgId));
      const announcements = await db.select().from(schema.orgAnnouncements).where(eq(schema.orgAnnouncements.orgId, args.orgId)).orderBy(asc(schema.orgAnnouncements.id));
      const invoices = await db.select().from(schema.billingInvoices).where(eq(schema.billingInvoices.orgId, args.orgId)).orderBy(asc(schema.billingInvoices.id));
      const audit = await db.select().from(schema.orgMembershipAudit).where(eq(schema.orgMembershipAudit.orgId, args.orgId)).orderBy(asc(schema.orgMembershipAudit.id));
      const dump = {
        exportedAt: new Date().toISOString(),
        organization: { id: org.id, name: org.name, plan: org.plan, subscriptionStatus: org.subscriptionStatus, ownerEmail: org.ownerEmail, primaryColor: org.primaryColor, features: toOrg(org).features },
        team: {
          owners: owners.map((o) => ({ name: o.displayName, email: o.email })),
          administrators: admins.map((a) => ({ name: a.displayName, email: a.email })),
          greeters: gatekeepers.map((g) => ({ name: g.displayName, email: g.email })),
          registrants: registrants.map((r) => ({ name: r.displayName, email: r.email })),
        },
        events: evs.map((e) => { const t = toEvent(e); return { id: t.id, title: t.title, date: t.date, time: t.timeText, location: t.location, description: t.description, status: t.status, visibility: t.visibility, locationType: t.locationType, capacity: t.capacity }; }),
        registrations: regs.map((r) => { const p = plain.get(r.id); return { id: r.id, eventId: r.eventId, name: p?.name ?? "", email: p?.email ?? "", phone: p?.phone ?? "", status: r.status, code: r.code, channel: r.notifyChannel, registeredBy: r.registeredByEmail || null, answers: p?.customAnswers ?? [], createdAt: new Date(r.createdAt).toISOString() }; }),
        groups: groups.map((g) => ({ id: g.id, name: g.name, members: members.filter((m) => m.groupId === g.id).map((m) => memberPlain.get(m.email) ?? "") })),
        trustedParticipants: trusted.map((t, i) => trustedPlain.get(t.email) ?? `member ${i + 1}`),
        announcements: announcements.map((a) => ({ subject: a.subject, body: a.body, audience: a.audience, recipients: a.recipientCount, createdAt: new Date(a.createdAt).toISOString() })),
        invoices: invoices.map((i) => ({ description: i.description, amountCents: i.amountCents, status: i.status, createdAt: new Date(i.createdAt).toISOString() })),
        membershipAudit: audit.map((a) => ({ member: a.memberEmail, role: a.role, action: a.action, by: a.actorEmail, at: new Date(a.createdAt).toISOString() })),
      };
      const filename = `${org.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-data-export.json`;
      return { filename, json: JSON.stringify(dump, null, 2), counts: { events: evs.length, registrations: regs.length, groups: groups.length } };
    },
  }),

  runSubscriptionLifecycle: defineAction({
    description: "Scheduled end-of-life runner for canceled subscriptions (no arguments; run daily). For organizations whose subscription has ENDED and are inside the 30-day cooling-off window it emails the owner two reminders — one two weeks after the end date, one a week before the deletion date — each stating the days remaining until deletion, that reactivating keeps ALL their data, and (honestly, per the cooling-off rule) that export is available again once reactivated since export is not offered during cooling-off. Reminders are composed and logged (prototype mail posture) and recorded so they never send twice. When the window closes it permanently deletes ALL of the organization's data (purgeOrganization). Returns counts for monitoring.",
    request: z.object({}),
    response: z.object({ remindersSent: z.number(), purged: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx): Promise<{ remindersSent: number; purged: number }> {
      const db = ctx.db<typeof schema>();
      const now = Date.now();
      const DAY = 86400000;
      const canceled = await db.select().from(schema.organizations).where(eq(schema.organizations.subscriptionStatus, "canceled"));
      let remindersSent = 0;
      let purged = 0;
      for (const org of canceled) {
        if (!org.accessEndsAt || !org.purgeAfter) continue;
        const ends = new Date(org.accessEndsAt).getTime();
        const purge = new Date(org.purgeAfter).getTime();
        if (now >= purge) { await purgeOrganization(ctx, org.id); purged += 1; continue; }
        if (now < ends) continue; // still in the paid period — administration continues
        const sent = new Set((org.purgeReminders ?? "").split(",").map((x) => x.trim()).filter(Boolean));
        const daysLeft = Math.max(0, Math.ceil((purge - now) / DAY));
        const owners = await db.select().from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, org.id));
        const ownerEmails = [...new Set([org.ownerEmail, ...owners.map((o) => o.email)].filter(Boolean))];
        const stages: Array<{ key: string; kind: string; due: boolean }> = [
          { key: "2wk", kind: "two_weeks", due: now >= ends + 14 * DAY && !sent.has("2wk") },
          { key: "1wk", kind: "final_week", due: now >= purge - 7 * DAY && !sent.has("1wk") },
        ];
        for (const st of stages) {
          if (!st.due) continue;
          const detail = `Reminder emailed to ${ownerEmails.join(", ") || "the owner"}: “Your Approved Guest subscription for ${org.name} ended on ${new Date(ends).toLocaleDateString("en-US")}. Your data will be permanently deleted in ${daysLeft} day${daysLeft === 1 ? "" : "s"} (on ${new Date(purge).toLocaleDateString("en-US")}). Reactivate any time before then to restore full administration and keep ALL of your data — nothing is lost. Data export isn't available during this cooling-off window, but the moment you reactivate you can export everything again.”`;
          await db.insert(schema.subscriptionReminderLog).values({ orgId: org.id, kind: st.kind, detail, createdAt: now });
          sent.add(st.key);
          remindersSent += 1;
        }
        if (sent.size > 0) await db.update(schema.organizations).set({ purgeReminders: [...sent].join(",") }).where(eq(schema.organizations.id, org.id));
      }
      if (remindersSent > 0 || purged > 0) ctx.invalidateQueries();
      return { remindersSent, purged };
    },
  }),

getBillingOverview: defineAction({
    description: "Read-only billing summary for ADMINISTRATORS: current plan, subscription status, renewal date (paid plans), and ONLY the last 4 digits of the card on file. The Free plan is permanent and feature-limited — no end date, no event balance, no card. Admins can see billing but cannot change anything — every billing change (plan, payment method, cancellation) is owner-only, and no invoice details or full payment data are exposed here. (freeEventsUsed/freeEventsTotal are legacy reporting fields from the retired 2-free-events model.)",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ plan: z.string(), subscriptionStatus: z.string(), renewalDate: z.string().nullable(), cardLast4: z.string().nullable(), freeEventsUsed: z.number(), freeEventsTotal: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      let renewalDate: string | null = null;
      if (org.subscriptionStatus === "active") {
        const db = ctx.db<typeof schema>();
        const last = await db.select({ createdAt: schema.billingInvoices.createdAt }).from(schema.billingInvoices).where(eq(schema.billingInvoices.orgId, args.orgId)).orderBy(desc(schema.billingInvoices.id));
        const first = last.find((i) => i.createdAt);
        if (first) { const d = new Date(first.createdAt); d.setMonth(d.getMonth() + 1); renewalDate = d.toISOString(); }
      }
      return { plan: org.plan, subscriptionStatus: org.subscriptionStatus, renewalDate, cardLast4: org.cardLast4 ?? null, freeEventsUsed: await trialRegistrationEventsUsed(ctx, args.orgId), freeEventsTotal: FREE_TRIAL_EVENTS + (org.trialBonusEvents ?? 0) };
    },
  }),

  saveOnboardingStep: defineAction({
    description: "Saves an organization's setup-wizard progress (the next step to complete, or 99 when finished) so the owner can leave and resume later. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), step: z.number().int().min(0).max(99), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.update(schema.organizations).set({ onboardingStep: args.step }).where(eq(schema.organizations.id, args.orgId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  addSampleEvent: defineAction({
    description: "Adds the preloaded sample event to an organization (once) so the team can try a test registration end to end before going live. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), ...identityArgs }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const org = await getOrgRow(ctx, args.orgId);
      const id = await insertSampleEvent(ctx, args.orgId, org?.name ?? "Your organization");
      ctx.invalidateQueries();
      return { id };
    },
  }),

  /* ---------- Calendar import ---------- */

  setOrgCalendarUrl: defineAction({
    description: "Saves an organization's events-calendar URL (an iCal feed or events page) for calendar import. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), url: z.string().max(500), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.update(schema.organizations).set({ calendarUrl: args.url.trim() }).where(eq(schema.organizations.id, args.orgId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  importCalendarCandidates: defineAction({
    description: "Fetches an events calendar (iCal feed or events page) and returns import candidates for the admin to preview and pick from — used both in Admin Review and in the setup wizard's calendar-import step. ALL upcoming events come back (nothing is filtered out for lacking a registration mention; that is reported per event as mentionsRegistration), carrying everything the feed provides: title, date, time, location, description, image URL, the event's own page URL, organizer, categories, source status and UID. Events already in the organization are flagged alreadyExists, and repeats within the feed itself are flagged duplicateInFeed (the AI validation step reviews them before anything is imported). Admin of the organization only. Importing itself happens through createEvent for the events the admin picks.",
    request: z.object({ orgId: z.number().int().positive(), url: z.string().min(4).max(500), ...requesterArgs }),
    response: z.object({
      sourceKind: z.string(), totalFound: z.number(), skippedPast: z.number(), skippedNoRegistration: z.number(),
      candidates: z.array(z.object({
        title: z.string(), date: z.string(), timeText: z.string(), location: z.string(), description: z.string(),
        imageUrl: z.string(), sourceUrl: z.string(), organizer: z.string(), categories: z.array(z.string()),
        uid: z.string(), feedStatus: z.string(),
        alreadyExists: z.boolean(), duplicateInFeed: z.boolean(), mentionsRegistration: z.boolean(),
      })),
    }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertAdvancedAllowed(ctx, args.orgId, "Calendar & spreadsheet imports");
      const { events: found, sourceKind } = await fetchCalendarEvents(args.url.trim());
      const today = new Date().toISOString().slice(0, 10);
      const db = ctx.db<typeof schema>();
      const existing = await db.select({ title: schema.events.title, date: schema.events.date }).from(schema.events).where(eq(schema.events.orgId, args.orgId));
      const existingKeys = new Set(existing.map((e) => `${e.title.trim().toLowerCase()}|${e.date}`));
      let skippedPast = 0;
      let skippedNoRegistration = 0;
      const seen = new Set<string>();
      type Cand = { title: string; date: string; timeText: string; location: string; description: string; imageUrl: string; sourceUrl: string; organizer: string; categories: string[]; uid: string; feedStatus: string; alreadyExists: boolean; duplicateInFeed: boolean; mentionsRegistration: boolean };
      const candidates: Cand[] = [];
      for (const e of found) {
        if (e.date < today) { skippedPast++; continue; }
        const reg = mentionsRegistration(e);
        if (!reg) skippedNoRegistration++;
        const key = `${e.title.trim().toLowerCase()}|${e.date}`;
        const duplicateInFeed = seen.has(key);
        seen.add(key);
        candidates.push({ ...e, alreadyExists: existingKeys.has(key), duplicateInFeed, mentionsRegistration: reg });
      }
      candidates.sort((a, b) => a.date.localeCompare(b.date));
      return { sourceKind, totalFound: found.length, skippedPast, skippedNoRegistration, candidates };
    },
  }),

  validateCalendarImport: defineAction({
    description: "AI validation of calendar-import candidates BEFORE anything is imported. Reviews the events the admin is about to import against the organization's existing events and its usual patterns, and returns one issue per problem found — missing time or location, dates that look wrong or conflict with another event, duplicates (within the import or against existing events), unclear or placeholder titles, cancelled-in-feed events, and fields that break the organization's usual pattern — each with a plain-language explanation and a concrete suggested fix the admin can accept, edit, or skip in the preview. Deterministic checks always run; a model review adds pattern/judgment findings when reachable, and if the model is unavailable the deterministic findings stand on their own. Admin of the organization only.",
    request: z.object({
      orgId: z.number().int().positive(),
      candidates: z.array(z.object({
        title: z.string().max(300), date: z.string().max(20), timeText: z.string().max(120), location: z.string().max(300),
        description: z.string().max(2000), imageUrl: z.string().max(1000).default(""), sourceUrl: z.string().max(1000).default(""),
        organizer: z.string().max(200).default(""), categories: z.array(z.string().max(80)).max(8).default([]),
        feedStatus: z.string().max(40).default(""), alreadyExists: z.boolean().default(false), duplicateInFeed: z.boolean().default(false),
      })).min(1).max(60),
      ...requesterArgs,
    }),
    response: z.object({
      aiReviewed: z.boolean(),
      summary: z.string(),
      issues: z.array(z.object({
        candidateIndex: z.number(), field: z.enum(["title", "date", "timeText", "location", "description", "event"]),
        severity: z.enum(["error", "warning", "info"]), code: z.string(), message: z.string(), suggestionText: z.string(),
        suggestedFix: z.object({ title: z.string().nullable(), date: z.string().nullable(), timeText: z.string().nullable(), location: z.string().nullable(), description: z.string().nullable() }),
      })),
    }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const org = await getOrgRow(ctx, args.orgId);
      const db = ctx.db<typeof schema>();
      const existing = await db.select({ title: schema.events.title, date: schema.events.date, timeText: schema.events.timeText, location: schema.events.location }).from(schema.events).where(eq(schema.events.orgId, args.orgId));
      type Issue = { candidateIndex: number; field: "title" | "date" | "timeText" | "location" | "description" | "event"; severity: "error" | "warning" | "info"; code: string; message: string; suggestionText: string; suggestedFix: { title: string | null; date: string | null; timeText: string | null; location: string | null; description: string | null } };
      const noFix = { title: null, date: null, timeText: null, location: null, description: null };
      const issues: Issue[] = [];
      const today = new Date().toISOString().slice(0, 10);
      const inTwoYears = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      // The organization's usual pattern, from its existing events.
      const locCounts = new Map<string, number>();
      for (const e of existing) if (e.location.trim()) locCounts.set(e.location.trim(), (locCounts.get(e.location.trim()) ?? 0) + 1);
      const usualLocation = [...locCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      const seenInImport = new Map<string, number>();
      args.candidates.forEach((c, i) => {
        const key = `${c.title.trim().toLowerCase()}|${c.date}`;
        if (c.alreadyExists) issues.push({ candidateIndex: i, field: "event", severity: "warning", code: "already_exists", message: `“${c.title}” on ${c.date} is already in ${org?.name ?? "your organization"}'s events.`, suggestionText: "Skip this one — importing it again would create a duplicate.", suggestedFix: { ...noFix } });
        if (c.duplicateInFeed || (seenInImport.has(key) && !c.alreadyExists)) issues.push({ candidateIndex: i, field: "event", severity: "warning", code: "duplicate_in_import", message: `This looks like a repeat of “${c.title}” (${c.date}) appearing earlier in the same feed.`, suggestionText: "Skip this copy and keep the first one.", suggestedFix: { ...noFix } });
        if (!seenInImport.has(key)) seenInImport.set(key, i);
        if (/CANCEL/i.test(c.feedStatus)) issues.push({ candidateIndex: i, field: "event", severity: "error", code: "cancelled_in_feed", message: `The feed marks “${c.title}” as cancelled.`, suggestionText: "Skip it — cancelled events shouldn't be imported as open events.", suggestedFix: { ...noFix } });
        if (!c.timeText.trim() || /^all day$/i.test(c.timeText.trim())) issues.push({ candidateIndex: i, field: "timeText", severity: "warning", code: "missing_time", message: `“${c.title}” has no start time in the feed — it would import as an all-day event.`, suggestionText: usualLocation ? "Add the start time before importing, or keep it all-day if that's right." : "Add the start time before importing, or keep it all-day if that's right.", suggestedFix: { ...noFix } });
        if (!c.location.trim()) issues.push({ candidateIndex: i, field: "location", severity: "warning", code: "missing_location", message: `“${c.title}” has no location in the feed.`, suggestionText: usualLocation ? `Your events usually meet at “${usualLocation}” — use that if this event is there too.` : "Add where it takes place before importing.", suggestedFix: usualLocation ? { ...noFix, location: usualLocation } : { ...noFix } });
        if (!c.description.trim()) issues.push({ candidateIndex: i, field: "description", severity: "info", code: "missing_description", message: `“${c.title}” has no description in the feed — attendees will see only the title, date, and place.`, suggestionText: "Add a sentence or two so attendees know what to expect.", suggestedFix: { ...noFix } });
        if (c.title.trim().length < 4 || /^(untitled|tbd|tba|event|test|placeholder|new event)/i.test(c.title.trim())) issues.push({ candidateIndex: i, field: "title", severity: "warning", code: "unclear_title", message: `The title “${c.title}” is unclear or looks like a placeholder.`, suggestionText: "Rename it to what attendees would recognize before importing.", suggestedFix: { ...noFix } });
        if (c.date < today) issues.push({ candidateIndex: i, field: "date", severity: "error", code: "past_date", message: `“${c.title}” is dated ${c.date}, which is in the past.`, suggestionText: "Check the date — if the feed year is wrong, fix it; otherwise skip this event.", suggestedFix: { ...noFix } });
        else if (c.date > inTwoYears) issues.push({ candidateIndex: i, field: "date", severity: "warning", code: "far_future_date", message: `“${c.title}” is dated ${c.date}, more than two years out — that often means a wrong year in the feed.`, suggestionText: "Double-check the year before importing.", suggestedFix: { ...noFix } });
        // Same date + same start time as a different event = a possible clash.
        const clash = existing.find((e) => e.date === c.date && e.timeText === c.timeText && e.title.trim().toLowerCase() !== c.title.trim().toLowerCase());
        if (clash && c.timeText && !/^all day$/i.test(c.timeText)) issues.push({ candidateIndex: i, field: "date", severity: "info", code: "time_conflict", message: `“${c.title}” starts at the same time as your existing “${clash.title}” on ${c.date} (${c.timeText}).`, suggestionText: "That's fine if they're in different rooms — otherwise check for a double-booking.", suggestedFix: { ...noFix } });
      });
      // Model review: pattern fit and judgment calls deterministic
      // checks can't make. Event data only — no attendee PII is sent.
      // Skipped when the month's AI cap is used up (AI paused).
      let aiReviewed = false;
      const aiCap = await aiCapState(ctx, org ?? null);
      if (aiCap.paused) {
        issues.push({ candidateIndex: 0, field: "event", severity: "info", code: "ai_cap_reached", message: `The AI review is paused — this month's AI allowance (${aiCap.used} of ${aiCap.cap} actions) is used up. The basic checks above still ran.`, suggestionText: "Import now with the basic checks, or wait until next month / upgrade for the full AI review.", suggestedFix: { ...noFix } });
      }
      try {
        if (aiCap.paused) throw new Error("ai-paused");
        const existingSummary = existing.length > 0
          ? existing.slice(0, 25).map((e) => `“${e.title}” · ${e.date} · ${e.timeText} · ${e.location}`).join("\n")
          : "(the organization has no events yet, so there is no established pattern — judge each import on its own completeness and clarity)";
        const candSummary = args.candidates.map((c, i) => `#${i}: “${c.title}” · ${c.date} · ${c.timeText || "(no time)"} · ${c.location || "(no location)"} · desc: ${c.description ? `${c.description.slice(0, 160)}…` : "(none)"}${c.organizer ? ` · organizer: ${c.organizer}` : ""}${c.categories.length ? ` · categories: ${c.categories.join(", ")}` : ""}`).join("\n");
        const review = await ctx.inference.complete(
          [
            `You are reviewing events that "${org?.name ?? "an organization"}" is about to import from its old calendar into its new registration system. Nothing has been imported yet; an administrator will see your findings and can accept your suggested fix, edit the event themselves, or skip the event.`,
            ``,
            `The organization's existing events (its usual pattern — typical locations, times of day, title style):`,
            existingSummary,
            ``,
            `Events proposed for import:`,
            candSummary,
            ``,
            `Flag genuine discrepancies only — do not repeat a finding for an event that looks fine. Look for: dates that look wrong (wrong year, a weekday event dated on an unusual day versus its pattern, an end implied before its start), titles that are unclear, duplicated in meaning, or inconsistent with the organization's title style, locations that conflict with the usual venue without explanation, times that clash between two imported events at the same place, and anything else that doesn't match the pattern. For each finding give the candidate's index, which field it concerns, a severity (error = would import wrong, warning = probably needs a fix, info = worth a glance), a short plain-language message, a suggestionText saying what to do, and — when you can name the corrected value — a suggestedFix with that field filled in (dates as YYYY-MM-DD, times like "6:30 PM" or "6:30 PM – 8:00 PM"); leave suggestedFix fields null when the administrator has to supply the value.`,
          ].join("\n"),
          {
            schema: z.object({
              issues: z.array(z.object({
                candidateIndex: z.number().int().min(0),
                field: z.enum(["title", "date", "timeText", "location", "description", "event"]),
                severity: z.enum(["error", "warning", "info"]),
                code: z.string(),
                message: z.string(),
                suggestionText: z.string(),
                suggestedFix: z.object({ title: z.string().nullable(), date: z.string().nullable(), timeText: z.string().nullable(), location: z.string().nullable(), description: z.string().nullable() }),
              })).max(40),
            }),
          },
        );
        aiReviewed = true;
        await bumpAiUsage(ctx, args.orgId); // one AI action used (monthly cap)
        const have = new Set(issues.map((x) => `${x.candidateIndex}|${x.field}|${x.code}`));
        for (const ri of review.issues) {
          if (ri.candidateIndex >= args.candidates.length) continue;
          const k = `${ri.candidateIndex}|${ri.field}|${ri.code}`;
          if (have.has(k)) continue;
          have.add(k);
          issues.push(ri);
        }
      } catch { /* model unavailable — deterministic findings stand */ }
      issues.sort((a, b) => a.candidateIndex - b.candidateIndex || (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : b.severity === "error" ? 1 : a.severity === "warning" ? -1 : 1));
      const summary = issues.length === 0
        ? `All ${args.candidates.length} events look clean — nothing needs clarifying before import.`
        : `${issues.length} thing${issues.length === 1 ? "" : "s"} to review across ${new Set(issues.map((i) => i.candidateIndex)).size} event${new Set(issues.map((i) => i.candidateIndex)).size === 1 ? "" : "s"} before importing${aiReviewed ? "" : " (basic checks only — the AI review was unavailable just now)"}.`;
      return { aiReviewed, summary, issues };
    },
  }),


  listMembershipAudit: defineAction({
    description: "Lists one organization's membership audit log — every addition to and removal from its owners, administrators, greeters, and registrants lists (which is also the role-change history: each entry names the role), with when it happened and who did it (login email and login ID), and whether it came from a direct admin action, an accepted invitation, or onboarding. Owners and administrators of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ entries: z.array(z.object({ id: z.number(), memberEmail: z.string(), memberName: z.string(), memberLoginId: z.string(), role: z.string(), action: z.string(), source: z.string(), actorEmail: z.string(), actorLoginId: z.string(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orgMembershipAudit).where(eq(schema.orgMembershipAudit.orgId, args.orgId)).orderBy(desc(schema.orgMembershipAudit.id)).limit(300);
      return { entries: rows.map((r) => ({ id: r.id, memberEmail: r.memberEmail, memberName: r.memberName, memberLoginId: r.memberLoginId, role: r.role, action: r.action, source: r.source, actorEmail: r.actorEmail, actorLoginId: r.actorLoginId, createdAt: new Date(r.createdAt).toISOString() })) };
    },
  }),

  updateStaffDomainSettings: defineAction({
    description: "Configures one organization's optional staff email-domain restriction: when on, owner/administrator/registrant accounts are honored only for allowed email domains, and greeters too when includeGreeters is on. Attendees are never affected. Turning it on requires at least one domain and requires the acting admin's own email domain to be on the list, so an admin can't lock themselves (or the owners) out by accident. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), enabled: z.boolean(), domains: z.array(z.string().max(120)).max(20).default([]), includeGreeters: z.boolean().default(true), ...identityArgs }),
    response: z.object({ ok: z.literal(true), staffDomainRestriction: z.boolean(), staffAllowedDomains: z.array(z.string()), staffDomainIncludeGreeters: z.boolean() }),
    async handler(ctx, args): Promise<{ ok: true; staffDomainRestriction: boolean; staffAllowedDomains: string[]; staffDomainIncludeGreeters: boolean }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertAdvancedAllowed(ctx, args.orgId, "Staff email-domain restriction");
      const domains = [...new Set(args.domains.map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter((d) => d.includes(".")))];
      if (args.enabled) {
        if (domains.length === 0) throw new Error("Add at least one allowed email domain (like cbict.org) before turning the restriction on.");
        const mine = emailDomainOf(args.adminEmail ?? "");
        if (!domains.includes(mine)) throw new Error(`Your own sign-in address uses @${mine || "?"} — add that domain to the list first, so you don't lock yourself out of staff access.`);
      }
      const db = ctx.db<typeof schema>();
      await db.update(schema.organizations).set({ staffDomainRestriction: args.enabled ? 1 : 0, staffAllowedDomains: domains.join(","), staffDomainIncludeGreeters: args.includeGreeters ? 1 : 0 }).where(eq(schema.organizations.id, args.orgId));
      ctx.invalidateQueries();
      return { ok: true, staffDomainRestriction: args.enabled, staffAllowedDomains: domains, staffDomainIncludeGreeters: args.includeGreeters };
    },
  }),

  askForHelp: defineAction({
    description: "The in-app AI help (Gate) answering a 'how do I…' question step by step. The model must rate its own confidence: a confident answer is returned directly; anything else is NOT guessed at — the question becomes a support ticket carrying who asked, the screen they were on, and what they already tried, and the asker is told plainly that it has been passed to the support team.",
    request: z.object({ orgId: z.number().int().positive().nullable().default(null), email: z.string().email().max(200), name: z.string().max(120).default(""), loginId: z.string().max(200).default(""), question: z.string().min(3).max(2000), screen: z.string().max(300).default(""), tried: z.string().max(2000).default(""), channel: z.enum(["email", "text", "both"]).default("email") }),
    response: z.object({ escalated: z.boolean(), answer: z.string().nullable(), ticketId: z.number().nullable(), message: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ escalated: boolean; answer: string | null; ticketId: number | null; message: string }> {
      let answer: string | null = null;
      try {
        const out = await ctx.inference.complete(
          [
            `You are Gate, the friendly help assistant inside Approved Guest, an event registration and check-in app for organizations. Answer "how do I…" questions with short, numbered steps using the app's real features only: organizations with branding; events (published/draft/hidden, physical or virtual with a join link); step-by-step registration with attendee terms; approvals (Tentative → Confirmed, QR pass at confirmation); trusted participants (auto-approval); greeters with location-bound door check-in and offline mode; capacity + waitlists; attendee groups and announcements on each attendee's chosen channel; subscriptions to an organization for new-event alerts; event search by keyword/location/date; cross-organization event sharing with role grants; reports and CSV exports; the setup wizard (guided or Expert mode) with a feature picker; plans and billing; the platform console is for the Approved Guest team only.`,
            `Rate your confidence honestly from 0 to 1. If the question is outside these features, ambiguous, about a specific account's private data, billing disputes, or anything you are not sure of, set canAnswer=false and confidence low — a human will take it instead. Never invent features, buttons, or policies.`,
            `Question: "${args.question.replace(/"/g, "'")}"`,
            args.screen ? `The asker is on: ${args.screen}` : "",
            args.tried ? `They already tried: ${args.tried}` : "",
          ].filter(Boolean).join("\n"),
          { schema: z.object({ answer: z.string(), confidence: z.number(), canAnswer: z.boolean() }) },
        );
        if (out.canAnswer && out.confidence >= 0.75 && out.answer.trim()) answer = out.answer.trim();
      } catch { /* the model is unavailable — escalate rather than guess */ }
      if (answer) return { escalated: false, answer, ticketId: null, message: "" };
      const db = ctx.db<typeof schema>();
      const now = Date.now();
      const t = await db.insert(schema.supportTickets).values({ orgId: args.orgId ?? null, askerEmail: args.email.trim().toLowerCase(), askerName: args.name.trim(), askerLoginId: args.loginId.trim(), question: args.question.trim(), contextScreen: args.screen.trim(), contextTried: args.tried.trim(), channel: args.channel, status: "open", createdAt: now, updatedAt: now }).returning({ id: schema.supportTickets.id });
      const ticket = t[0];
      if (!ticket) throw new Error("Could not pass your question to support — please try again.");
      await db.insert(schema.supportMessages).values({ ticketId: ticket.id, sender: "user", body: args.question.trim(), byEmail: args.email.trim().toLowerCase(), deliveredVia: "", createdAt: now });
      ctx.invalidateQueries();
      const channelText = args.channel === "text" ? "by text" : args.channel === "both" ? "by email and text" : "by email";
      return { escalated: true, answer: null, ticketId: ticket.id, message: `I couldn't answer that with confidence, so I won't guess. I've passed your question to our support team — with who you are, the screen you were on (${args.screen || "not specified"}), and what you already tried — so you won't have to repeat yourself. They'll reply right here in the app and ${channelText}. Your support conversation is below.` };
    },
  }),

  listMySupportTickets: defineAction({
    description: "Lists the asker's own support conversations (tickets created when AI help escalated), with the full message thread — support replies appear here in the app. Matched by asker email or login ID.",
    request: z.object({ email: z.string().max(200).default(""), loginId: z.string().max(200).default("") }),
    response: z.object({ tickets: z.array(supportTicketShape) }),
    async handler(ctx, args): Promise<{ tickets: Array<z.infer<typeof supportTicketShape>> }> {
      const em = args.email.trim().toLowerCase();
      if (!em && !args.loginId.trim()) return { tickets: [] };
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.supportTickets).orderBy(desc(schema.supportTickets.id)).limit(50);
      const mine = rows.filter((t) => (em && t.askerEmail === em) || (args.loginId.trim() && t.askerLoginId === args.loginId.trim()));
      return { tickets: await buildSupportTickets(ctx, mine) };
    },
  }),

  replyToSupportTicket: defineAction({
    description: "The asker adds a reply to their own support conversation. The ticket reopens so the support team sees it as needing attention.",
    request: z.object({ ticketId: z.number().int().positive(), email: z.string().max(200).default(""), loginId: z.string().max(200).default(""), body: z.string().min(1).max(4000) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const t = (await db.select().from(schema.supportTickets).where(eq(schema.supportTickets.id, args.ticketId)).limit(1))[0];
      if (!t) throw new Error("That support conversation no longer exists.");
      const em = args.email.trim().toLowerCase();
      if (!((em && t.askerEmail === em) || (args.loginId.trim() && t.askerLoginId === args.loginId.trim()))) throw new Error("That support conversation belongs to a different account.");
      const now = Date.now();
      await db.insert(schema.supportMessages).values({ ticketId: t.id, sender: "user", body: args.body.trim(), byEmail: em, deliveredVia: "", createdAt: now });
      await db.update(schema.supportTickets).set({ status: "open", updatedAt: now }).where(eq(schema.supportTickets.id, t.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listSupportTickets: defineAction({
    description: "The support team's inbox: every support ticket (from AI-help escalations), newest activity first, with the asker, their screen context, what they tried, and the full thread. Platform owner only — this is the Approved Guest support console, not an organization view.",
    request: z.object({ ...requesterArgs }),
    response: z.object({ tickets: z.array(supportTicketShape) }),
    async handler(ctx, args): Promise<{ tickets: Array<z.infer<typeof supportTicketShape>> }> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.supportTickets).orderBy(desc(schema.supportTickets.updatedAt)).limit(100);
      return { tickets: await buildSupportTickets(ctx, rows) };
    },
  }),

  supportReply: defineAction({
    description: "The support team replies to a ticket from the platform console. The reply reaches the asker in the app (their support conversations) and on their preferred channel — the channel is recorded on the message as deliveredVia (prototype posture: composed, logged, and shown in-app). The ticket is marked answered; support can also close it. Platform owner only.",
    request: z.object({ ticketId: z.number().int().positive(), body: z.string().min(1).max(4000), close: z.boolean().default(false), ...requesterArgs }),
    response: z.object({ ok: z.literal(true), deliveredVia: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; deliveredVia: string }> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const t = (await db.select().from(schema.supportTickets).where(eq(schema.supportTickets.id, args.ticketId)).limit(1))[0];
      if (!t) throw new Error("That support ticket no longer exists.");
      const now = Date.now();
      await db.insert(schema.supportMessages).values({ ticketId: t.id, sender: "support", body: args.body.trim(), byEmail: args.requestedByEmail ?? "", deliveredVia: t.channel, createdAt: now });
      await db.update(schema.supportTickets).set({ status: args.close ? "closed" : "answered", updatedAt: now }).where(eq(schema.supportTickets.id, t.id));
      ctx.invalidateQueries();
      return { ok: true, deliveredVia: t.channel };
    },
  }),

  supportLookupById: defineAction({
    description: "SUPPORT CONSOLE ONLY (platform owner): look up any entity by its stable ID — organization, event, registration, group, or message — and get its details plus clickable related entities (an organization's events, an event's organization and registrations, a registration's event/organization/pass, a group's organization and members, a message's event/registration/organization) so support can traverse relationships while troubleshooting. Organization admins and attendees never see this. Platform owner only.",
    request: z.object({ kind: z.enum(["organization", "event", "registration", "group", "message"]), id: z.number().int().positive(), ...requesterArgs }),
    response: supportLookupShape,
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<z.infer<typeof supportLookupShape>> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      return supportLookup(ctx, args.kind, args.id);
    },
  }),

  supportLookupAttendee: defineAction({
    description: "SUPPORT CONSOLE ONLY (platform owner): find a person by email across ALL organizations — every registration (with event and organization links), the groups they belong to, and the organizations that trust them — for troubleshooting. Platform owner only.",
    request: z.object({ email: z.string().email().max(200), ...requesterArgs }),
    response: z.object({ found: z.boolean(), name: z.string(), email: z.string(), registrations: z.array(z.object({ id: z.number(), eventId: z.number(), eventTitle: z.string(), orgId: z.number(), orgName: z.string(), status: z.string(), code: z.string().nullable() })), groups: z.array(z.object({ id: z.number(), name: z.string(), orgId: z.number(), orgName: z.string() })), trustedIn: z.array(z.object({ orgId: z.number(), orgName: z.string() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const em = args.email.trim().toLowerCase();
      const hash = await emailIndex(ctx, em);
      const regs = await db.select().from(schema.registrations).where(eq(schema.registrations.emailHash, hash)).orderBy(desc(schema.registrations.id)).limit(100);
      const decNames = await decryptFields(ctx, regs.map((r) => r.name));
      const orgName = new Map<number, string>();
      const orgOf = async (orgId: number): Promise<string> => { if (!orgName.has(orgId)) { const o = await getOrgRow(ctx, orgId); orgName.set(orgId, o?.name ?? `Organization ${orgId}`); } return orgName.get(orgId)!; };
      const registrations = [];
      for (let i = 0; i < regs.length; i++) {
        const r = regs[i]!;
        const ev = await getEventRow(ctx, r.eventId);
        registrations.push({ id: r.id, eventId: r.eventId, eventTitle: ev?.title ?? "(event removed)", orgId: ev?.orgId ?? 0, orgName: ev ? await orgOf(ev.orgId) : "", status: r.status, code: r.code ?? null });
      }
      const memberRows = await db.select().from(schema.attendeeGroupMembers).where(eq(schema.attendeeGroupMembers.emailHash, hash));
      const groups = [];
      for (const m of memberRows) { const g = (await db.select().from(schema.attendeeGroups).where(eq(schema.attendeeGroups.id, m.groupId)).limit(1))[0]; if (g) groups.push({ id: g.id, name: g.name, orgId: g.orgId, orgName: await orgOf(g.orgId) }); }
      const trustedRows = await db.select().from(schema.trustedParticipants).where(eq(schema.trustedParticipants.emailHash, hash));
      const trustedIn = [];
      for (const t of trustedRows) trustedIn.push({ orgId: t.orgId, orgName: await orgOf(t.orgId) });
      return { found: regs.length > 0 || groups.length > 0 || trustedIn.length > 0, name: decNames.find((n) => !!n) ?? "", email: em, registrations, groups, trustedIn };
    },
  }),

  getEventStats: defineAction({
    description: "Registration statistics for one event: totals by status (tentative = pending, confirmed = approved + checked in, waitlisted, cancelled = denied/revoked/cancelled) and a per-day series — daily new registrations broken down by their current status, plus the cumulative total — so the organization can see volume, peaks, and valleys over time. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ eventTitle: z.string(), totals: z.object({ tentative: z.number(), confirmed: z.number(), waitlisted: z.number(), cancelled: z.number(), total: z.number() }), days: z.array(z.object({ date: z.string(), tentative: z.number(), confirmed: z.number(), waitlisted: z.number(), cancelled: z.number(), total: z.number(), cumulative: z.number() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      await assertAdvancedAllowed(ctx, args.orgId, "Reports & exports");
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const db = ctx.db<typeof schema>();
      const regs = await db.select({ status: schema.registrations.status, createdAt: schema.registrations.createdAt }).from(schema.registrations).where(eq(schema.registrations.eventId, args.eventId));
      const bucket = (s: string): "tentative" | "confirmed" | "waitlisted" | "cancelled" => s === "pending" ? "tentative" : s === "approved" || s === "checked_in" ? "confirmed" : s === "waitlisted" ? "waitlisted" : "cancelled";
      const totals = { tentative: 0, confirmed: 0, waitlisted: 0, cancelled: 0, total: regs.length };
      const perDay = new Map<string, { tentative: number; confirmed: number; waitlisted: number; cancelled: number; total: number }>();
      for (const r of regs) {
        const b = bucket(r.status);
        totals[b] += 1;
        const day = r.createdAt.toISOString().slice(0, 10);
        const d = perDay.get(day) ?? { tentative: 0, confirmed: 0, waitlisted: 0, cancelled: 0, total: 0 };
        d[b] += 1; d.total += 1;
        perDay.set(day, d);
      }
      const dayKeys = [...perDay.keys()].sort();
      const days: Array<{ date: string; tentative: number; confirmed: number; waitlisted: number; cancelled: number; total: number; cumulative: number }> = [];
      if (dayKeys.length > 0) {
        const start = new Date(`${dayKeys[0]}T00:00:00Z`);
        const today = new Date();
        const endCap = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        let cursor = new Date(Math.max(start.getTime(), endCap.getTime() - 119 * 86400000));
        let cumulative = 0;
        // Registrations before the visible window still count toward the cumulative total.
        for (const k of dayKeys) if (k < cursor.toISOString().slice(0, 10)) cumulative += perDay.get(k)!.total;
        while (cursor <= endCap) {
          const key = cursor.toISOString().slice(0, 10);
          const d = perDay.get(key) ?? { tentative: 0, confirmed: 0, waitlisted: 0, cancelled: 0, total: 0 };
          cumulative += d.total;
          days.push({ date: key, ...d, cumulative });
          cursor = new Date(cursor.getTime() + 86400000);
        }
      }
      return { eventTitle: ev.title, totals, days };
    },
  }),

  updateEventAlertSettings: defineAction({
    description: "Sets one event's attendance alerts: on/off, the nearly-full threshold (percent of capacity), the low-attendance rule (fewer than N registered when the event is D days away), and the alert channel (email, text, or both). Alerts go to the organization's owners and administrators. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), enabled: z.boolean(), fullPct: z.number().int().min(10).max(100).default(80), lowCount: z.number().int().min(0).max(100000).default(10), lowDays: z.number().int().min(0).max(60).default(3), channel: z.enum(["email", "text", "both"]).default("email"), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertAdvancedAllowed(ctx, args.orgId, "Attendance alerts");
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      const db = ctx.db<typeof schema>();
      await db.update(schema.events).set({ alertsEnabled: args.enabled ? 1 : 0, alertFullPct: args.fullPct, alertLowCount: args.lowCount, alertLowDays: args.lowDays, alertChannel: args.channel }).where(eq(schema.events.id, args.eventId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listAttendanceAlerts: defineAction({
    description: "Lists the attendance alerts already fired for one event (nearly full / low attendance), newest first. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ alerts: z.array(z.object({ id: z.number(), kind: z.string(), detail: z.string(), channel: z.string(), recipientCount: z.number(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.attendanceAlertsLog).where(eq(schema.attendanceAlertsLog.eventId, args.eventId)).orderBy(desc(schema.attendanceAlertsLog.id)).limit(20);
      return { alerts: rows.map((r) => ({ id: r.id, kind: r.kind, detail: r.detail, channel: r.channel, recipientCount: r.recipientCount, createdAt: new Date(r.createdAt).toISOString() })) };
    },
  }),

  runAttendanceAlerts: defineAction({
    description: "Scheduled evaluation of per-event attendance alerts (also runnable by an admin from the event's alert settings): for every published event with alerts on, fires the nearly-full alert when registrations reach the event's percent-of-capacity threshold, and the low-attendance alert when fewer than the event's minimum are registered inside its days-out window. Each alert fires once per threshold state (dedupe key), goes to the organization's owners and administrators on the event's chosen channel, and is logged (prototype posture: composed and logged in-app with exact recipients counted).",
    request: z.object({}),
    response: z.object({ fired: z.number() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const now = new Date();
      const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const evs = await db.select().from(schema.events).where(and(eq(schema.events.status, "published"), isNull(schema.events.deletedAt)));
      let fired = 0;
      for (const ev of evs) {
        if (ev.alertsEnabled === 0) continue;
        const daysOut = Math.round((Date.parse(`${ev.date}T00:00:00Z`) - todayStart) / 86400000);
        if (daysOut < 0) continue;
        const regs = await db.select({ status: schema.registrations.status }).from(schema.registrations).where(eq(schema.registrations.eventId, ev.id));
        const taken = regs.filter((r) => r.status === "approved" || r.status === "checked_in").length;
        const existing = await db.select({ dedupeKey: schema.attendanceAlertsLog.dedupeKey }).from(schema.attendanceAlertsLog).where(eq(schema.attendanceAlertsLog.eventId, ev.id));
        const seen = new Set(existing.map((r) => r.dedupeKey));
        const fire = async (kind: string, dedupeKey: string, detail: string) => {
          if (seen.has(dedupeKey)) return;
          const admins = await db.select({ email: schema.authorizedAdmins.email }).from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.orgId, ev.orgId));
          const owners = await db.select({ email: schema.organizationOwners.email }).from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, ev.orgId));
          const recipients = new Set([...admins, ...owners].map((r) => r.email.toLowerCase()).filter((e) => e.includes("@")));
          await db.insert(schema.attendanceAlertsLog).values({ orgId: ev.orgId, eventId: ev.id, kind, detail, channel: ev.alertChannel ?? "email", recipientCount: recipients.size, dedupeKey, createdAt: Date.now() });
          fired += 1;
        };
        if (ev.capacity && ev.capacity > 0 && taken * 100 >= ev.capacity * (ev.alertFullPct ?? 80)) {
          await fire("nearly_full", `full:${ev.alertFullPct ?? 80}`, `“${ev.title}” is ${Math.round((taken / ev.capacity) * 100)}% full — ${taken} of ${ev.capacity} seats taken (alert threshold ${ev.alertFullPct ?? 80}%).`);
        }
        if (daysOut <= (ev.alertLowDays ?? 3) && taken < (ev.alertLowCount ?? 10)) {
          await fire("low_attendance", `low:${ev.alertLowCount ?? 10}:${ev.alertLowDays ?? 3}`, `“${ev.title}” has only ${taken} confirmed registration${taken === 1 ? "" : "s"} with ${daysOut} day${daysOut === 1 ? "" : "s"} to go (alert threshold: fewer than ${ev.alertLowCount ?? 10} at ${ev.alertLowDays ?? 3} days out).`);
        }
      }
      if (fired > 0) ctx.invalidateQueries();
      return { fired };
    },
  }),

  listOwners: defineAction({
    description: "Lists one organization's owners — the people who created it / own its subscription. Owners manage billing and ownership; there can be several.",
    request: z.object({ orgId: z.number().int().positive().default(1) }),
    response: z.object({ owners: z.array(adminShape) }),
    async handler(ctx, args) {
      await ensureSeedOwners(ctx, args.orgId);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, args.orgId)).orderBy(asc(schema.organizationOwners.id));
      return { owners: rows.map((r) => ({ id: r.id, orgId: r.orgId, googleId: r.googleId, email: r.email, displayName: r.displayName, createdAt: r.createdAt.toISOString() })) };
    },
  }),

  removeOwner: defineAction({
    description: "Removes an owner from an organization. OWNER only, and the last remaining owner cannot be removed. The person keeps any other roles they hold (admin, gatekeeper, registrant) — remove those separately if needed.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const all = await db.select({ id: schema.organizationOwners.id }).from(schema.organizationOwners).where(eq(schema.organizationOwners.orgId, args.orgId));
      if (all.length <= 1) throw new Error("You can't remove the organization's last owner.");
      const target = (await db.select().from(schema.organizationOwners).where(and(eq(schema.organizationOwners.id, args.id), eq(schema.organizationOwners.orgId, args.orgId))).limit(1))[0];
      await db.delete(schema.organizationOwners).where(and(eq(schema.organizationOwners.id, args.id), eq(schema.organizationOwners.orgId, args.orgId)));
      if (target) await logMembershipChange(ctx, args.orgId, "owner", "removed", { email: target.email, name: target.displayName, loginId: target.googleId }, { email: args.requestedByEmail, loginId: args.requestedByGoogleId });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),


  onboardingGuide: defineAction({
    description: "The AI mascot guide inside the onboarding wizard. Answers a new organization's setup questions in plain language and produces DRAFTS only — an event description, registration questions for an event type, or an attendee message — that the person reviews and inserts themselves; it never creates or changes anything. Works before the organization exists (setup spans that moment), so it requires only a signed-in identity. Only the wizard context the person typed (organization name, first-event details, question labels) is sent to the model — no approver emails, no attendee data.",
    request: z.object({
      mode: z.enum(["ask", "draft_description", "draft_questions", "draft_message"]),
      question: z.string().max(1000).default(""),
      context: z.object({
        stepLabel: z.string().max(80).default(""),
        orgName: z.string().max(200).default(""),
        orgTagline: z.string().max(200).default(""),
        eventTitle: z.string().max(200).default(""),
        eventDate: z.string().max(20).default(""),
        eventTimeText: z.string().max(100).default(""),
        eventLocation: z.string().max(200).default(""),
        eventVirtual: z.boolean().default(false),
        questionLabels: z.array(z.string().max(300)).max(20).default([]),
      }),
      ...requesterArgs,
    }),
    response: z.object({
      answer: z.string(),
      draft: z.string().nullable(),
      suggestedQuestions: z.array(z.object({ label: z.string(), type: z.enum(["text", "choice", "yesno", "radio", "checkboxes"]), options: z.array(z.string()), required: z.boolean() })).nullable(),
    }),
    async handler(ctx, args) {
      if (!args.requestedByGoogleId && !args.requestedByEmail) throw new Error("Sign in first, then ask the guide.");
      const c = args.context;
      const ctxLines = [
        c.orgName ? `Organization: "${c.orgName}"${c.orgTagline ? ` — ${c.orgTagline}` : ""}` : "Organization: (not named yet)",
        c.eventTitle ? `First event so far: "${c.eventTitle}" · ${c.eventDate || "(no date)"} · ${c.eventTimeText || "(no time)"} · ${c.eventVirtual ? "virtual (online)" : c.eventLocation || "(no location yet)"}` : "First event: (not started)",
        c.questionLabels.length ? `Registration questions so far: ${c.questionLabels.map((q) => `"${q}"`).join(", ")}` : "Registration questions: (none yet)",
        `They are on the setup step: ${c.stepLabel || "Organization"}.`,
      ].join("\n");
      const howItWorks = [
        `Approved Guest setup has one screen per thing, in this order: Organization (name, tagline, pass-code prefix) → Plan (the Free plan is permanent — one user, the owner; create events, send the notice, collect RSVPs, see who's coming; no QR passes, approvals, or door check-in. Paid plans — Starter $29/mo, Growth $59/mo, Unlimited $99/mo — unlock passes, approvals, greeters, reports, and more; only registration-enabled events count toward a paid plan's monthly allowance, calendar-only listings never count) → Branding (logo, colors, fonts, or pull them from the organization's website) → First event (title, date, time, place or virtual link, optional deadline/contact; or import their existing calendar) → Registration questions (type the question, pick radio buttons / checkboxes / dropdown / free text / yes-no, type the options; templates give a head start) → Approvers (paid plans: each new registration emails them Approve / Not approved links — deciding from the email needs no sign-in) → Greeters & trusted (paid plans: greeters check guests in at the door with QR or text code; for in-person events check-in is location-bound — the greeter's phone must be at the venue; virtual events have no greeter, confirmed guests get a Join the meeting button; trusted participants are auto-approved instantly) → Invite team (paid plans: admins by email invitation; the creator is the owner and keeps billing).`,
        `Registrations start Tentative and become Confirmed when an approver accepts — the QR pass (with its text code, which works on its own) is issued at confirmation. Attendees never need an account: Google, Apple, or just an email. Attendees can search events by keyword, location, and date on the home page, and subscribe to an organization to be notified when it posts new events.`,
        `An Expert mode toggle at the top of setup shows every field on one screen for people who want to go fast; switching modes never loses what's typed. Progress saves after every step, and setup can be resumed later.`,
      ].join("\n");
      try {
        const out = await ctx.inference.complete(
          [
            `You are Gate, the friendly AI guide mascot inside the Approved Guest setup wizard. You speak in plain, warm language, briefly — two to four short sentences unless a draft is requested. You ADVISE AND DRAFT ONLY: you never claim to have changed, saved, or sent anything, and you remind them they'll confirm before anything is created.`,
            ``,
            `How Approved Guest works:\n${howItWorks}`,
            ``,
            `Where they are:\n${ctxLines}`,
            ``,
            args.mode === "ask" ? `Their question: "${args.question.replace(/"/g, "'")}"\nAnswer it in "answer", in plain language, grounded in how the app works above. If the question is really a request for a draft, still answer helpfully and put the draft text in "draft".` : "",
            args.mode === "draft_description" ? `Write a warm, ready-to-publish description (2–4 sentences) for their first event in "draft", and in "answer" say in one line what you drafted and that nothing is inserted until they tap Insert. If the event details are too thin, still draft from what is given and note what they could add.` : "",
            args.mode === "draft_questions" ? `Suggest 3–5 registration questions suited to this organization and event in "suggestedQuestions" (mix types sensibly: choice/radio for pick-one, checkboxes for pick-any, yesno for yes/no, text for free-form; options only for choice/radio/checkboxes). In "answer", explain in one or two lines why these fit. They will pick which to add — nothing is added automatically.` : "",
            args.mode === "draft_message" ? `Draft a short, friendly message the organization could send its attendees about the first event (a welcome / save-the-date note) in "draft" — subject line first, then the body. In "answer", note in one line that it's a draft they can edit and send later from Admin → Messages.` : "",
          ].filter(Boolean).join("\n"),
          {
            schema: z.object({
              answer: z.string(),
              draft: z.string().nullable(),
              suggestedQuestions: z.array(z.object({ label: z.string(), type: z.enum(["text", "choice", "yesno", "radio", "checkboxes"]), options: z.array(z.string()), required: z.boolean() })).nullable(),
            }),
          },
        );
        return { answer: out.answer, draft: out.draft, suggestedQuestions: out.suggestedQuestions };
      } catch {
        // The guide never hard-fails: a plain fallback keeps setup moving.
        if (args.mode === "ask") return { answer: "I couldn't reach my full brain just now, but here's the short version: each setup screen does one thing and saves as you go — organization details, plan, branding, your first event, the questions guests answer, who approves registrations, greeters and trusted folks, and team invites. Nothing is final until you confirm it, and you can switch to Expert mode at the top any time to see everything at once.", draft: null, suggestedQuestions: null };
        return { answer: "I couldn't draft that just now — my drafting service is briefly unreachable. You can type it yourself for now, or try me again in a moment; nothing you entered is affected.", draft: null, suggestedQuestions: null };
      }
    },
  }),

  adminAssistant: defineAction({
    description: "The built-in AI assistant for administrators. The admin speaks or types naturally; the assistant interprets the request with a model and answers from the organization's own data — event searches, people lookups (including one person's registrations across all events), counts/comparisons/trends computed server-side, and chart data — or returns a PROPOSED action (an event draft or a written description) that changes nothing until the admin confirms it. Attendee data is never sent to the model; all matching and counting happens in code. Admin of the organization only.",
    request: z.object({
      orgId: z.number().int().positive().default(1),
      message: z.string().min(1).max(2000),
      ...requesterArgs,
    }),
    response: z.object({
      reply: z.string(),
      proposal: z.object({
        kind: z.enum(["none", "create_event", "describe_event"]),
        title: z.string().nullable(), date: z.string().nullable(), timeText: z.string().nullable(),
        location: z.string().nullable(), description: z.string().nullable(),
      }),
      people: z.array(z.object({ name: z.string(), email: z.string(), eventTitle: z.string(), status: z.string() })),
      foundEvents: z.array(z.object({ title: z.string(), date: z.string(), timeText: z.string(), location: z.string(), status: z.string() })),
      stats: z.array(z.string()),
      chart: z.object({ type: z.enum(["bar", "line", "pie"]), title: z.string(), points: z.array(z.object({ label: z.string(), value: z.number() })) }).nullable(),
    }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertFeatureEnabled(ctx, args.orgId, "ai_assistant");
      await assertAdvancedAllowed(ctx, args.orgId, "The AI assistant");
      const org = await getOrgRow(ctx, args.orgId);
      // Plan gating: the AI assistant is a Growth/Unlimited feature — it
      // is NOT part of the Starter plan. Starter calls get the locked
      // reply (valid response shape, no assistant work performed).
      if ((org?.plan ?? "trial") === "starter") {
        return { reply: "🔒 The AI assistant isn't included in the Starter plan — it's part of Growth ($59/mo) and Unlimited ($99/mo). An owner can upgrade under Subscription & billing.", proposal: { kind: "none" as const, title: null, date: null, timeText: null, location: null, description: null }, people: [], foundEvents: [], stats: [], chart: null };
      }
      const aiState = await aiCapState(ctx, org ?? null);
      if (aiState.paused) {
        return { reply: `⏸ AI features are paused for ${org?.name ?? "this organization"} — all ${aiState.cap} AI actions for this month are used (${aiState.used} of ${aiState.cap}). They resume next month, or an owner can upgrade the plan for a higher cap.`, proposal: { kind: "none" as const, title: null, date: null, timeText: null, location: null, description: null }, people: [], foundEvents: [], stats: [], chart: null };
      }
      const orgName = org?.name ?? "the organization";
      const db = ctx.db<typeof schema>();
      const evRows = await db.select({ id: schema.events.id, title: schema.events.title, date: schema.events.date, timeText: schema.events.timeText, location: schema.events.location, status: schema.events.status }).from(schema.events).where(eq(schema.events.orgId, args.orgId)).orderBy(asc(schema.events.date));
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
      const intent = await ctx.inference.complete(
        [
          `You are the built-in assistant for the administrators of "${orgName}" inside the Approved Guest event registration app. Today is ${weekday}, ${todayStr}.`,
          `The organization's events are: ${evRows.length ? evRows.map((e) => `"${e.title}" (${e.date})`).join(", ") : "(none yet)"}.`,
          `The administrator said: "${args.message.replace(/"/g, "'")}"`,
          ``,
          `Decide exactly one action kind:`,
          `- "create_event": the admin wants a new event drafted. Resolve relative dates ("next Thursday", "tomorrow") against today. Fill title, date as YYYY-MM-DD, timeText as a friendly time like "6:30 PM" (a range like "6:15 PM – 7:30 PM" when they give two times), and location when stated; null for anything not stated. A lead-in detail ("pizza at 6:15" before a 6:30 start) goes into timeText and a short note in description.`,
          `- "describe_event": the admin wants a description written or improved. Put the event's title in title and the finished, warm, ready-to-publish description (2-4 sentences) in description.`,
          `- "find_registrations": the admin asks about people at an event (who registered, who hasn't checked in, who is pending). Set eventQuery to the event title referenced (copy it exactly from the events list when it matches) and peopleFilter: "not_checked_in", "checked_in", "pending", "approved", "denied", or "any". If they ask who registered MORE THAN ONCE for the same event ("registered twice", "duplicates"), set repeatOnly to true. No event named means all events.`,
          `- "person_lookup": the admin asks about ONE specific person by name or email ("find Maria", "what is John Smith registered for", "has a@b.com checked in anywhere"). Put the name or email in personQuery. The app returns every registration of theirs across all events with its status.`,
          `- "find_events": the admin asks about the events themselves ("find all events in December", "list our trainings"). Set month to "YYYY-MM" when they name a month, eventQuery to title words, or both; both null lists everything.`,
          `- "analyze": the admin asks a numbers question — how many, totals, comparisons across events, trends, attendance. Pick metric: "registrations_by_event", "checkins_by_event", "attendance_rate_by_event" (percent checked in of those approved), "registrations_over_time" (registrations per month, from when people signed up), or "status_totals" (counts by registration status). Set eventQuery to narrow to matching events, or null for the whole organization. Pick chartType "bar", "line", or "pie" whenever the answer would read better as a chart — always when they ask for a chart/graph/visual, and proactively for comparisons and trends (bar for per-event comparisons, line for over-time, pie for status_totals); use "none" only for a single simple number.`,
          `- "none": anything else — answer helpfully and briefly in reply.`,
          `HOW-TO GUIDE — when the admin asks how to do something ("how do I…", "where is…", "help"), use kind "none" and answer in reply with short numbered steps from this guide. The admin area has one screen per job: Events (add/edit/duplicate/repeat events; capacity, deadline, contact, files, virtual links), Calendar (import events from a calendar URL or spreadsheet; embed code that puts this calendar on the organization's own website), Registrations (approve = confirm and issue the QR pass; Not approved; register someone on their behalf; flagged registrations wait in the moderation queue), People (invite owners/admins/greeters/registrants; plan seat usage; trusted participants are auto-approved instantly), Reports (attendance and unused passes, CSV exports, scheduled report emails to admins, final update the day after the event), Messages (message an event's attendees; automatic reminders run hourly), Settings (branding and logo, registration questions — type the question, pick radio buttons / checkboxes / dropdown / free text, reuse past questions from the library — subscription & billing, sign-in connections). Registration statuses: Tentative = submitted, awaiting approval; Confirmed = approved, QR pass issued; Waitlisted = the event is full and a spot is offered automatically when one frees; Not approved; Cancelled. Attendees pick their own reminder times (1 day / 3 hours / 1 hour before) and channel (email/text/both) when registering.`,
          `In reply, write a short, friendly message. For create_event, summarize the draft and make clear nothing is created until the admin confirms it. For lookups, searches, and analyze, say what you looked up; the app shows the actual people, events, numbers, and chart itself, so never invent names or numbers in reply.`,
        ].join("\n"),
        {
          schema: z.object({
            reply: z.string(),
            action: z.object({
              kind: z.enum(["none", "create_event", "describe_event", "find_registrations", "find_events", "person_lookup", "analyze"]),
              title: z.string().nullable(),
              date: z.string().nullable(),
              timeText: z.string().nullable(),
              location: z.string().nullable(),
              description: z.string().nullable(),
              eventQuery: z.string().nullable(),
              personQuery: z.string().nullable(),
              peopleFilter: z.enum(["any", "not_checked_in", "checked_in", "pending", "approved", "denied"]).nullable(),
              month: z.string().nullable(),
              repeatOnly: z.boolean().nullable(),
              metric: z.enum(["registrations_by_event", "checkins_by_event", "attendance_rate_by_event", "registrations_over_time", "status_totals"]).nullable(),
              chartType: z.enum(["bar", "line", "pie", "none"]).nullable(),
            }),
          }),
        },
      );
      const act = intent.action;
      const people: Array<{ name: string; email: string; eventTitle: string; status: string }> = [];
      const foundEvents: Array<{ title: string; date: string; timeText: string; location: string; status: string }> = [];
      const stats: string[] = [];
      let chart: { type: "bar" | "line" | "pie"; title: string; points: Array<{ label: string; value: number }> } | null = null;
      const matchEvents = (limit: number) => {
        const q = (act.eventQuery ?? "").trim().toLowerCase();
        const month = (act.month ?? "").trim();
        return evRows.filter((e) => (!q || e.title.toLowerCase().includes(q) || q.includes(e.title.toLowerCase())) && (!/^\d{4}-\d{2}$/.test(month) || e.date.startsWith(month))).slice(0, limit);
      };
      if (act.kind === "find_events") {
        for (const ev of matchEvents(30)) foundEvents.push({ title: ev.title, date: ev.date, timeText: ev.timeText, location: ev.location, status: ev.status ?? "published" });
      }
      if (act.kind === "find_registrations") {
        const filter = act.peopleFilter ?? "any";
        for (const ev of matchEvents(10)) {
          const regs = (await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, ev.id))).filter((r) => r.held !== 1);
          const plain = await decryptRegs(ctx, regs);
          if (act.repeatOnly) {
            const byEmail = new Map<string, { name: string; email: string; count: number }>();
            for (const reg of regs) {
              if (reg.status === "revoked" || reg.status === "denied" || !reg.emailHash) continue;
              const p = plain.get(reg.id);
              if (!p) continue;
              const cur = byEmail.get(reg.emailHash) ?? { name: p.name, email: p.email, count: 0 };
              cur.count += 1;
              byEmail.set(reg.emailHash, cur);
            }
            for (const entry of byEmail.values()) if (entry.count >= 2) people.push({ name: entry.name, email: entry.email, eventTitle: ev.title, status: `registered ${entry.count} times` });
            continue;
          }
          for (const reg of regs) {
            const p = plain.get(reg.id);
            if (!p) continue;
            const st = reg.status;
            const keep = filter === "any" ? st !== "revoked"
              : filter === "not_checked_in" ? st === "approved"
              : filter === "checked_in" ? st === "checked_in"
              : st === filter;
            if (keep) people.push({ name: p.name, email: p.email, eventTitle: ev.title, status: st });
          }
        }
        people.sort((a, b) => a.eventTitle.localeCompare(b.eventTitle) || a.name.localeCompare(b.name));
      }
      if (act.kind === "person_lookup") {
        const needleText = (act.personQuery ?? "").trim().toLowerCase();
        if (needleText) {
          const hits: Array<{ name: string; email: string; eventTitle: string; status: string; date: string }> = [];
          for (const ev of evRows) {
            const regs = (await db.select().from(schema.registrations).where(eq(schema.registrations.eventId, ev.id))).filter((r) => r.held !== 1);
            if (regs.length === 0) continue;
            const plain = await decryptRegs(ctx, regs);
            for (const reg of regs) {
              const p = plain.get(reg.id);
              if (!p) continue;
              if (p.name.toLowerCase().includes(needleText) || p.email.toLowerCase().includes(needleText)) {
                hits.push({ name: p.name, email: p.email, eventTitle: `${ev.title} · ${ev.date}`, status: reg.status, date: ev.date });
              }
            }
          }
          hits.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
          for (const h of hits.slice(0, 30)) people.push({ name: h.name, email: h.email, eventTitle: h.eventTitle, status: h.status });
          if (hits.length > 0) {
            const checkedInCount = hits.filter((h) => h.status === "checked_in").length;
            stats.push(`${hits[0]!.name} (${hits[0]!.email}): ${hits.length} registration${hits.length === 1 ? "" : "s"} across ${new Set(hits.map((h) => h.eventTitle)).size} event(s) · ${checkedInCount} checked in`);
          }
        }
      }
      if (act.kind === "analyze") {
        const metric = act.metric ?? "status_totals";
        const scope = metric === "registrations_over_time" ? evRows : matchEvents(50);
        const perEvent: Array<{ title: string; date: string; pending: number; approved: number; checkedIn: number; denied: number; total: number }> = [];
        const monthBuckets = new Map<string, number>();
        let totals = { pending: 0, approved: 0, checkedIn: 0, denied: 0, total: 0 };
        for (const ev of scope) {
          const regs = await db.select({ status: schema.registrations.status, createdAt: schema.registrations.createdAt, held: schema.registrations.held }).from(schema.registrations).where(eq(schema.registrations.eventId, ev.id));
          const row = { title: ev.title, date: ev.date, pending: 0, approved: 0, checkedIn: 0, denied: 0, total: 0 };
          for (const r of regs) {
            if (r.status === "revoked" || r.held === 1) continue;
            row.total += 1; totals.total += 1;
            if (r.status === "pending") { row.pending += 1; totals.pending += 1; }
            else if (r.status === "approved") { row.approved += 1; totals.approved += 1; }
            else if (r.status === "checked_in") { row.checkedIn += 1; totals.checkedIn += 1; }
            else if (r.status === "denied") { row.denied += 1; totals.denied += 1; }
            const d = r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt as unknown as string);
            if (!Number.isNaN(d.getTime())) { const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1); }
          }
          perEvent.push(row);
        }
        const scopeLabel = act.eventQuery && metric !== "registrations_over_time" ? `for “${scope.map((e) => e.title).join(", ") || act.eventQuery}”` : `across all ${scope.length} event${scope.length === 1 ? "" : "s"}`;
        stats.push(`Scope: ${scopeLabel}`);
        stats.push(`Registrations: ${totals.total} total · ✓ ${totals.checkedIn} checked in · ${totals.approved} approved, not checked in · ${totals.pending} awaiting approval${totals.denied > 0 ? ` · ${totals.denied} not approved` : ""}`);
        let points: Array<{ label: string; value: number }> = [];
        let chartTitle = "";
        if (metric === "registrations_by_event") { points = perEvent.filter((r) => r.total > 0).map((r) => ({ label: r.title, value: r.total })); chartTitle = "Registrations by event"; }
        else if (metric === "checkins_by_event") { points = perEvent.filter((r) => r.checkedIn > 0).map((r) => ({ label: r.title, value: r.checkedIn })); chartTitle = "Check-ins by event"; }
        else if (metric === "attendance_rate_by_event") { points = perEvent.filter((r) => r.approved + r.checkedIn > 0).map((r) => ({ label: r.title, value: Math.round((r.checkedIn / (r.approved + r.checkedIn)) * 100) })); chartTitle = "Attendance rate by event (%)"; }
        else if (metric === "registrations_over_time") { points = [...monthBuckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => { const [y = "?", m = "1"] = k.split("-"); return { label: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }), value: v }; }); chartTitle = "Registrations per month"; }
        else { points = [{ label: "Checked in", value: totals.checkedIn }, { label: "Approved", value: totals.approved }, { label: "Pending", value: totals.pending }, { label: "Not approved", value: totals.denied }].filter((pt) => pt.value > 0); chartTitle = "Registrations by status"; }
        const wanted = act.chartType && act.chartType !== "none" ? act.chartType : (metric === "registrations_over_time" ? "line" : metric === "status_totals" ? "pie" : "bar");
        if (points.length > 0) chart = { type: wanted, title: chartTitle, points: points.slice(0, 12) };
      }
      const proposal = act.kind === "create_event" || act.kind === "describe_event"
        ? { kind: act.kind, title: act.title, date: act.date, timeText: act.timeText, location: act.location, description: act.description }
        : { kind: "none" as const, title: null, date: null, timeText: null, location: null, description: null };
      await bumpAiUsage(ctx, args.orgId); // one AI action used (monthly cap)
      return { reply: intent.reply, proposal, people: people.slice(0, 30), foundEvents, stats, chart };
    },
  }),

  /* ---------- Role invites ---------- */

  getPlanUsage: defineAction({
    description: "Admin-visible plan usage. For paid plans: how many registration-enabled events are dated this month versus the plan's monthly registration-event allowance. For the Free plan there is no allowance and no balance — Free is permanent and feature-limited with unlimited basic events; freeEventsUsed/freeEventsTotal are legacy reporting fields from the retired 2-free-events model. Plain calendar listings (registration off), cancelled events, and the sample event never count.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ plan: z.string(), monthKey: z.string(), monthLabel: z.string(), registrationEventsUsed: z.number(), registrationEventAllowance: z.number().nullable(), freeEventsUsed: z.number(), freeEventsTotal: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const org = await getOrgRow(ctx, args.orgId);
      const plan = org?.plan ?? "trial";
      const monthKey = currentMonthKey();
      const used = await registrationEventsInMonth(ctx, args.orgId, monthKey);
      const allowance = org?.comped === 1 ? null : (org?.allowanceOverride ?? EVENT_ALLOWANCE[plan] ?? null);
      return { plan, monthKey, monthLabel: monthLabelOf(monthKey), registrationEventsUsed: used, registrationEventAllowance: allowance, freeEventsUsed: await trialRegistrationEventsUsed(ctx, args.orgId), freeEventsTotal: FREE_TRIAL_EVENTS + (org?.trialBonusEvents ?? 0) };
    },
  }),

  getSeatUsage: defineAction({
    description: "Admin-only team seat usage for the organization's plan: how many owner, administrator, registrar, and greeter seats are used (members plus pending invitations) versus the plan's limits. Free: exactly one user — 1 owner (whose single administrator seat is that same owner), 0 registrars, 0 greeters. Starter: 2 admins, 2 registrars, 4 greeters (owners unlimited). Growth and Unlimited: unlimited.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({
      plan: z.string(),
      limits: z.object({ admin: z.number().nullable(), registrant: z.number().nullable(), gatekeeper: z.number().nullable() }),
      members: z.object({ admin: z.number(), registrant: z.number(), gatekeeper: z.number() }),
      pending: z.object({ admin: z.number(), registrant: z.number(), gatekeeper: z.number() }),
      used: z.object({ admin: z.number(), registrant: z.number(), gatekeeper: z.number() }),
      owners: z.object({ members: z.number(), pending: z.number(), used: z.number(), limit: z.number().nullable() }),
    }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const org = await getOrgRow(ctx, args.orgId);
      const plan = org?.plan ?? "trial";
      const counts = await seatUsageCounts(ctx, args.orgId);
      const own = await trialOwnerUsage(ctx, args.orgId);
      return { plan, limits: seatLimitsForPlan(plan), members: counts.members, pending: counts.pending, used: counts.used, owners: { members: own.owners, pending: own.pendingInvites, used: own.used, limit: plan === "trial" ? TRIAL_OWNER_LIMIT : null } };
    },
  }),

  /* ---------- AI usage & payment health ---------- */

  getAiUsage: defineAction({
    description: "Returns this organization's AI usage for the current month against its plan's AI cap (used, cap, paused). AI features pause when the cap is reached until next month or an upgrade. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ used: z.number(), cap: z.number().nullable(), monthLabel: z.string(), paused: z.boolean(), percent: z.number().nullable() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const org = await getOrgRow(ctx, args.orgId);
      const st = await aiCapState(ctx, org ?? null);
      return { used: st.used, cap: st.cap, monthLabel: monthLabelOf(currentMonthKey()), paused: st.paused, percent: st.cap !== null && st.cap > 0 ? Math.min(100, Math.round((st.used / st.cap) * 100)) : st.cap === 0 ? 100 : null };
    },
  }),

  getBillingAlert: defineAction({
    description: "Returns the payment-failure state the client shows to the owner and admins on sign-in: whether a payment failed, when the 1-week grace window ends, and whether the account is now frozen (approvals paused; registration still open; nothing is ever deleted). Admin/owner of the organization only.",
    request: z.object({ orgId: z.number().int().positive().default(1), ...requesterArgs }),
    response: z.object({ failedAt: z.string().nullable(), graceEndsAt: z.string().nullable(), frozen: z.boolean(), pastDue: z.boolean(), ownerEmail: z.string() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const org = await getOrgRow(ctx, args.orgId);
      const fz = freezeState(org ?? null);
      return { ...fz, ownerEmail: org?.ownerEmail ?? "" };
    },
  }),

  simulatePaymentFailure: defineAction({
    description: "Records a failed subscription payment (the prototype's stand-in for a Stripe payment_failed webhook): the owner is alerted (the alert is returned and shown to the owner and admins on sign-in; in production this is also emailed), a due invoice is recorded, and the 1-week grace window starts — after it, the account freezes until repaired. OWNER only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true), failedAt: z.string(), graceEndsAt: z.string(), ownerEmail: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; failedAt: string; graceEndsAt: string; ownerEmail: string }> {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      const failedAt = org.paymentFailedAt ?? new Date();
      if (!org.paymentFailedAt) {
        await db.update(schema.organizations).set({ paymentFailedAt: failedAt, subscriptionStatus: "past_due" }).where(eq(schema.organizations.id, args.orgId));
        await db.insert(schema.billingInvoices).values({ orgId: args.orgId, description: "Monthly subscription — payment FAILED (card declined). Owner alerted; 1-week grace window before the account freezes.", amountCents: PLAN_PRICES_CENTS[org.plan] ?? 0, status: "due" });
      }
      ctx.invalidateQueries();
      const fz = freezeState({ ...org, paymentFailedAt: failedAt });
      return { ok: true, failedAt: fz.failedAt ?? failedAt.toISOString(), graceEndsAt: fz.graceEndsAt ?? "", ownerEmail: org.ownerEmail };
    },
  }),

  repairPayment: defineAction({
    description: "Repairs a failed payment (the owner confirms the card works / a successful retry): clears the failure, marks the failed invoice paid, unfreezes the account, and processes every held auto-approval in one batch — returning how many were confirmed and how many were skipped because their event is now full. OWNER only.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true), processed: z.number(), skipped: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; processed: number; skipped: number }> {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      await db.update(schema.organizations).set({ paymentFailedAt: null, subscriptionStatus: org.plan === "trial" ? "trialing" : "active" }).where(eq(schema.organizations.id, args.orgId));
      const due = await db.select().from(schema.billingInvoices).where(eq(schema.billingInvoices.orgId, args.orgId));
      for (const inv of due) if (inv.status === "due") await db.update(schema.billingInvoices).set({ status: "paid" }).where(eq(schema.billingInvoices.id, inv.id));
      const batch = await processHeldApprovals(ctx, args.orgId);
      ctx.invalidateQueries();
      return { ok: true, processed: batch.processed, skipped: batch.skipped };
    },
  }),



  getTerms: defineAction({
    description: "The current Terms of Service and attendee terms text (single server-side source, presented in onboarding, Settings, and registration), the terms version, and — when an orgId is given — the recorded acceptance for that organization (who accepted, when, which version).",
    request: z.object({ orgId: z.number().int().positive().optional() }),
    response: z.object({ version: z.string(), terms: z.string(), attendeeTerms: z.string(), privacyNotice: z.string(), acceptance: z.object({ email: z.string(), acceptedAt: z.string(), version: z.string() }).nullable() }),
    async handler(ctx, args) {
      let acceptance: { email: string; acceptedAt: string; version: string } | null = null;
      if (args.orgId) {
        const raw = await getSetting(ctx, `tos_acceptance_${args.orgId}`);
        if (raw) { try { const p = JSON.parse(raw) as { email?: string; at?: string; version?: string }; if (p.email && p.at) acceptance = { email: p.email, acceptedAt: p.at, version: p.version ?? "" }; } catch { /* no recorded acceptance */ } }
      }
      return { version: TERMS_VERSION, terms: TERMS_OF_SERVICE, attendeeTerms: ATTENDEE_TERMS, privacyNotice: PRIVACY_NOTICE, acceptance };
    },
  }),

  /* ---------- Service health & resilience ---------- */

  getHealth: defineAction({
    description: "PUBLIC health endpoint for external monitors and the host: reports whether the app and its database are up and how long the probe took, and records the check so the platform console status view can show uptime and response times. Also reports whether maintenance mode is currently showing for visitors.",
    request: z.object({}),
    response: z.object({ status: z.enum(["ok", "down"]), app: z.boolean(), database: z.boolean(), responseMs: z.number(), checkedAt: z.string(), maintenance: z.boolean() }),
    async handler(ctx) {
      const probe = await runHealthProbe(ctx);
      await recordHealthCheck(ctx, probe, "health endpoint");
      const m = await maintenanceState(ctx);
      return { status: probe.ok ? "ok" as const : "down" as const, app: true, database: probe.dbOk, responseMs: probe.responseMs, checkedAt: new Date().toISOString(), maintenance: m.maintenance };
    },
  }),

  getServiceStatus: defineAction({
    description: "PUBLIC, lightweight: whether visitors should see the friendly maintenance screen right now (manual maintenance mode set by the platform owner, or an open outage incident), plus the message to show. The app polls this and swaps in Gate, the mascot, with a reassuring note instead of an error page.",
    request: z.object({}),
    response: z.object({ maintenance: z.boolean(), manual: z.boolean(), message: z.string(), since: z.string().nullable() }),
    async handler(ctx) {
      const m = await maintenanceState(ctx);
      return { maintenance: m.maintenance, manual: m.manual, message: m.message, since: m.since };
    },
  }),

  runHealthMonitor: defineAction({
    description: "The resilience monitor (run on a schedule and callable by the platform owner): probes the app and database, records the check, and enforces the outage policy. Down for more than 5 minutes opens an outage incident: an automatic restart is requested and recorded, maintenance mode switches on for visitors, and a text alert goes to the platform owner's configured phone (Twilio settings live in the platform console — nothing is hard-coded). A later successful probe closes the incident, turns maintenance off, records the recovery, and texts that the service is back. Three consecutive slow checks (over the console's threshold) open a 'slow' incident with the same alerting.",
    request: z.object({}),
    response: z.object({ ok: z.boolean(), status: z.string(), incidentOpened: z.boolean(), incidentClosed: z.boolean(), smsSent: z.boolean() }),
    privileged: [privileged.sendSms],
    async handler(ctx) {
      const probe = await runHealthProbe(ctx);
      await recordHealthCheck(ctx, probe, "monitor");
      const db = ctx.db<typeof schema>();
      const cfg = await healthAlertConfig(ctx);
      const now = Date.now();
      const recent = await db.select().from(schema.healthChecks).orderBy(desc(schema.healthChecks.id)).limit(30);
      const openOutage = (await db.select().from(schema.serviceIncidents).where(and(eq(schema.serviceIncidents.kind, "outage"), isNull(schema.serviceIncidents.endedAt))).limit(1))[0];
      const openSlow = (await db.select().from(schema.serviceIncidents).where(and(eq(schema.serviceIncidents.kind, "slow"), isNull(schema.serviceIncidents.endedAt))).limit(1))[0];
      let incidentOpened = false; let incidentClosed = false; let smsSent = false;
      // Consecutive failures, newest first.
      let failCount = 0; let earliestFail = now;
      for (const c of recent) { if (c.ok === 1) break; failCount += 1; earliestFail = c.checkedAt; }
      if (!probe.ok && failCount >= 2 && now - earliestFail >= 5 * 60 * 1000 && !openOutage) {
        const sms = await maybeSendHealthSms(ctx, "Approved Guest alert: the service has been down for over 5 minutes. An automatic restart has been requested and visitors are seeing the maintenance screen. Details are in the platform console status view.");
        await db.insert(schema.serviceIncidents).values({ kind: "outage", startedAt: earliestFail, detail: `Service down for more than 5 minutes (${failCount} consecutive failed checks). Automatic restart requested at detection; maintenance mode is on for visitors until a check passes.`, restartRequestedAt: now, smsSent: sms.sent ? 1 : 0, smsError: sms.error ?? "" });
        incidentOpened = true; smsSent = sms.sent;
      }
      if (probe.ok && openOutage) {
        await db.update(schema.serviceIncidents).set({ endedAt: now }).where(eq(schema.serviceIncidents.id, openOutage.id));
        const sms = await maybeSendHealthSms(ctx, "Approved Guest: the service is back up. The outage and restart are recorded in the platform console status view.");
        incidentClosed = true; smsSent = smsSent || sms.sent;
      }
      // Slowness: three consecutive checks over the threshold.
      let slowCount = 0;
      for (const c of recent) { if (c.responseMs > cfg.slowMs && c.ok === 1) slowCount += 1; else break; }
      if (probe.ok && slowCount >= 3 && !openSlow) {
        const sms = await maybeSendHealthSms(ctx, `Approved Guest alert: the service is responding slowly (over ${cfg.slowMs} ms on the last ${slowCount} checks). Details are in the platform console status view.`);
        await db.insert(schema.serviceIncidents).values({ kind: "slow", startedAt: now, detail: `Responses over the ${cfg.slowMs} ms threshold on ${slowCount} consecutive checks (latest ${probe.responseMs} ms).`, restartRequestedAt: null, smsSent: sms.sent ? 1 : 0, smsError: sms.error ?? "" });
        incidentOpened = true; smsSent = smsSent || sms.sent;
      }
      if (probe.ok && probe.responseMs <= cfg.slowMs && openSlow) {
        await db.update(schema.serviceIncidents).set({ endedAt: now }).where(eq(schema.serviceIncidents.id, openSlow.id));
        incidentClosed = true;
      }
      return { ok: probe.ok, status: probe.ok ? (probe.responseMs > cfg.slowMs ? "slow" : "ok") : "down", incidentOpened, incidentClosed, smsSent };
    },
  }),

  getPlatformHealth: defineAction({
    description: "PLATFORM OWNER ONLY. The console status view data: recent health checks, uptime percentage, average and p95 response times, the incident log (outages, slow periods, recorded restart requests, whether the alert text was sent), the current maintenance state, and the alert configuration — with the Twilio auth token reported only as set/not-set, never its value.",
    request: z.object({ ...requesterArgs }),
    response: z.object({
      checks: z.array(z.object({ checkedAt: z.string(), ok: z.boolean(), responseMs: z.number(), note: z.string() })),
      uptimePct: z.number(), avgMs: z.number(), p95Ms: z.number(), totalChecks: z.number(),
      incidents: z.array(z.object({ id: z.number(), kind: z.string(), startedAt: z.string(), endedAt: z.string().nullable(), detail: z.string(), restartRequestedAt: z.string().nullable(), smsSent: z.boolean(), smsError: z.string() })),
      config: z.object({ alertsEnabled: z.boolean(), phone: z.string(), twilioFrom: z.string(), twilioSidMasked: z.string(), tokenSet: z.boolean(), slowMs: z.number() }),
      maintenance: z.object({ active: z.boolean(), manual: z.boolean(), message: z.string() }),
    }),
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.healthChecks).orderBy(desc(schema.healthChecks.id)).limit(200);
      const total = rows.length;
      const okCount = rows.filter((r) => r.ok === 1).length;
      const times = rows.map((r) => r.responseMs).sort((a, b) => a - b);
      const avg = total ? Math.round(times.reduce((a, b) => a + b, 0) / total) : 0;
      const p95 = total ? (times[Math.min(total - 1, Math.floor(total * 0.95))] ?? 0) : 0;
      const incidents = await db.select().from(schema.serviceIncidents).orderBy(desc(schema.serviceIncidents.id)).limit(20);
      const cfg = await healthAlertConfig(ctx);
      const m = await maintenanceState(ctx);
      return {
        checks: rows.slice(0, 60).map((r) => ({ checkedAt: new Date(r.checkedAt).toISOString(), ok: r.ok === 1, responseMs: r.responseMs, note: r.note })),
        uptimePct: total ? Math.round((okCount / total) * 1000) / 10 : 100,
        avgMs: avg, p95Ms: p95, totalChecks: total,
        incidents: incidents.map((i) => ({ id: i.id, kind: i.kind, startedAt: new Date(i.startedAt).toISOString(), endedAt: i.endedAt ? new Date(i.endedAt).toISOString() : null, detail: i.detail, restartRequestedAt: i.restartRequestedAt ? new Date(i.restartRequestedAt).toISOString() : null, smsSent: i.smsSent === 1, smsError: i.smsError })),
        config: { alertsEnabled: cfg.enabled, phone: cfg.phone, twilioFrom: cfg.twilioFrom, twilioSidMasked: cfg.twilioSid ? `••••${cfg.twilioSid.slice(-4)}` : "", tokenSet: cfg.twilioToken.length > 0, slowMs: cfg.slowMs },
        maintenance: { active: m.maintenance, manual: m.manual, message: m.message },
      };
    },
  }),

  updateHealthAlertConfig: defineAction({
    description: "PLATFORM OWNER ONLY. Saves the downtime text-alert configuration in the platform console: the owner's phone number, the Twilio account SID, sending number, and auth token, the slow-response threshold, and whether alerts are on. Nothing is hard-coded — with no configuration saved, no texts are sent. The auth token is stored only from this console form and is never returned to the client (the status view reports set/not-set and the SID's last 4). Leaving the token blank keeps the saved one.",
    request: z.object({ alertsEnabled: z.boolean().optional(), phone: z.string().max(40).optional(), twilioSid: z.string().max(200).optional(), twilioFrom: z.string().max(40).optional(), twilioToken: z.string().max(200).optional(), slowMs: z.number().int().min(200).max(60000).optional(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      if (args.alertsEnabled !== undefined) await setSetting(ctx, "health_alerts_enabled", args.alertsEnabled ? "1" : "0");
      if (args.phone !== undefined) await setSetting(ctx, "health_alert_phone", args.phone.trim());
      if (args.twilioSid !== undefined) await setSetting(ctx, "health_twilio_sid", args.twilioSid.trim());
      if (args.twilioFrom !== undefined) await setSetting(ctx, "health_twilio_from", args.twilioFrom.trim());
      if (args.twilioToken !== undefined && args.twilioToken.trim()) await setSetting(ctx, "health_twilio_token", args.twilioToken.trim());
      if (args.slowMs !== undefined) await setSetting(ctx, "health_slow_ms", String(args.slowMs));
      return { ok: true };
    },
  }),

  sendHealthTestSms: defineAction({
    description: "PLATFORM OWNER ONLY. Sends one test text to the configured alert phone using the saved Twilio configuration, so the owner can confirm alerts work before relying on them.",
    request: z.object({ ...requesterArgs }),
    response: z.object({ sent: z.boolean(), error: z.string().nullable() }),
    privileged: [privileged.sendSms],
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      return await maybeSendHealthSms(ctx, "Approved Guest health alerts: this is a test text. Downtime and slow-service alerts will arrive at this number.");
    },
  }),

  setMaintenanceMode: defineAction({
    description: "PLATFORM OWNER ONLY. Manually switches the visitor-facing maintenance screen on or off, with an optional message. (Outage incidents switch it on automatically and off on recovery; this is the manual override.) While on, visitors see Gate, the mascot, with a reassuring 'down for maintenance, back shortly' message instead of the app.",
    request: z.object({ enabled: z.boolean(), message: z.string().max(300).default(""), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      await setSetting(ctx, "maintenance_mode", args.enabled ? "1" : "0");
      if (args.message) await setSetting(ctx, "maintenance_message", args.message.trim());
      return { ok: true };
    },
  }),

  /* ---------- Beta program ---------- */

  getBetaState: defineAction({
    description: "An organization's beta state: whether it opted in, whether it is effectively enrolled (the platform owner's per-organization override wins over the org's own choice), which features are currently designated beta (visible in full only to enrolled organizations — everyone sees that they exist), and which former beta features have graduated to general release.",
    request: z.object({ orgId: z.number().int().positive() }),
    response: z.object({ optedIn: z.boolean(), enrolled: z.boolean(), override: z.enum(["none", "in", "out"]), betaFeatures: z.array(z.object({ key: z.string(), label: z.string() })), releasedKeys: z.array(z.string()) }),
    async handler(ctx, args) {
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      const defs = await betaFeatureDefs(ctx);
      const overrideRaw = await getSetting(ctx, `beta_override_${args.orgId}`);
      const override: "none" | "in" | "out" = overrideRaw === "in" ? "in" : overrideRaw === "out" ? "out" : "none";
      return {
        optedIn: org.betaOptIn === 1,
        enrolled: await orgBetaEnrolled(ctx, org),
        override,
        betaFeatures: defs.filter((d) => d.status === "beta").map((d) => ({ key: d.key, label: d.label })),
        releasedKeys: defs.filter((d) => d.status === "released").map((d) => d.key),
      };
    },
  }),

  setOrgBetaOptIn: defineAction({
    description: "An organization opts in to or out of the beta program at any time (owner/admin). Opted-in organizations see features the platform owner has designated beta, each labeled 'Beta'. A platform-owner enrollment override, when set, takes precedence and is reported back so the admin understands why.",
    request: z.object({ orgId: z.number().int().positive(), optedIn: z.boolean(), ...identityArgs }),
    response: z.object({ ok: z.literal(true), enrolled: z.boolean() }),
    async handler(ctx, args): Promise<{ ok: true; enrolled: boolean }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      const db = ctx.db<typeof schema>();
      await db.update(schema.organizations).set({ betaOptIn: args.optedIn ? 1 : 0 }).where(eq(schema.organizations.id, args.orgId));
      const org = await getOrgRow(ctx, args.orgId);
      ctx.invalidateQueries();
      return { ok: true, enrolled: org ? await orgBetaEnrolled(ctx, org) : args.optedIn };
    },
  }),

  getBetaAdmin: defineAction({
    description: "PLATFORM OWNER ONLY. Beta program administration: every feature designation (key, label, beta or graduated/released), and every organization with its own opt-in choice, the owner's override when set, and its effective enrollment.",
    request: z.object({ ...requesterArgs }),
    response: z.object({
      features: z.array(z.object({ key: z.string(), label: z.string(), status: z.enum(["beta", "released"]) })),
      orgs: z.array(z.object({ orgId: z.number(), name: z.string(), optedIn: z.boolean(), override: z.enum(["none", "in", "out"]), enrolled: z.boolean() })),
    }),
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const defs = await betaFeatureDefs(ctx);
      const orgs = await db.select().from(schema.organizations).orderBy(asc(schema.organizations.id));
      const out = [];
      for (const o of orgs) {
        const overrideRaw = await getSetting(ctx, `beta_override_${o.id}`);
        out.push({ orgId: o.id, name: o.name, optedIn: o.betaOptIn === 1, override: (overrideRaw === "in" || overrideRaw === "out" ? overrideRaw : "none") as "none" | "in" | "out", enrolled: await orgBetaEnrolled(ctx, o) });
      }
      return { features: defs, orgs: out };
    },
  }),

  setBetaFeature: defineAction({
    description: "PLATFORM OWNER ONLY. Designates a feature as beta (only beta-enrolled organizations see it, labeled 'Beta'), graduates it to general release ('released' — everyone sees it and the Beta label comes off), or removes the designation entirely ('off' — the feature returns to being generally available as a standard feature).",
    request: z.object({ key: z.string().min(1).max(60), label: z.string().min(1).max(120), status: z.enum(["beta", "released", "off"]), ...requesterArgs }),
    response: z.object({ ok: z.literal(true), features: z.array(z.object({ key: z.string(), label: z.string(), status: z.enum(["beta", "released"]) })) }),
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      let defs = await betaFeatureDefs(ctx);
      defs = defs.filter((d) => d.key !== args.key);
      if (args.status !== "off") defs.push({ key: args.key, label: args.label, status: args.status });
      await setSetting(ctx, "beta_features", JSON.stringify(defs));
      ctx.invalidateQueries();
      return { ok: true as const, features: defs };
    },
  }),

  setOrgBetaEnrollment: defineAction({
    description: "PLATFORM OWNER ONLY. Controls beta enrollment for one organization regardless of the organization's own opt-in choice: 'in' enrolls it, 'out' excludes it, 'none' hands the choice back to the organization.",
    request: z.object({ orgId: z.number().int().positive(), override: z.enum(["none", "in", "out"]), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      await setSetting(ctx, `beta_override_${args.orgId}`, args.override);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  /* ---------- Release notes ("What's new") ---------- */

  listReleaseNotes: defineAction({
    description: "The published release notes, newest first: each version's title and its new features, enhancements, and fixes as written by the platform owner when the version was published. Read by everyone from the app's What's new section.",
    request: z.object({}),
    response: z.object({ notes: z.array(z.object({ id: z.number(), version: z.string(), title: z.string(), features: z.string(), enhancements: z.string(), fixes: z.string(), publishedAt: z.string() })) }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.releaseNotes).orderBy(desc(schema.releaseNotes.id)).limit(100);
      return { notes: rows.map((r) => ({ id: r.id, version: r.version, title: r.title, features: r.features, enhancements: r.enhancements, fixes: r.fixes, publishedAt: new Date(r.publishedAt).toISOString() })) };
    },
  }),

  publishReleaseNote: defineAction({
    description: "PLATFORM OWNER ONLY. Publishes one release-notes entry (version, title, and the new features / enhancements / fixes — one item per line each) to the app's What's new history.",
    request: z.object({ version: z.string().min(1).max(40), title: z.string().min(1).max(200), features: z.string().max(4000).default(""), enhancements: z.string().max(4000).default(""), fixes: z.string().max(4000).default(""), ...requesterArgs }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.releaseNotes).values({ version: args.version.trim(), title: args.title.trim(), features: args.features.trim(), enhancements: args.enhancements.trim(), fixes: args.fixes.trim(), publishedAt: Date.now(), createdBy: args.requestedByEmail ?? "" }).returning({ id: schema.releaseNotes.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]!.id };
    },
  }),

  deleteReleaseNote: defineAction({
    description: "PLATFORM OWNER ONLY. Removes one release-notes entry from the What's new history.",
    request: z.object({ id: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.releaseNotes).where(eq(schema.releaseNotes.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  /* ---------- Platform console (platform owner only) ---------- */

  checkPlatformOwner: defineAction({
    description: "Reports whether the signed-in identity is a PLATFORM owner (runs the Approved Guest product itself — separate from any organization's owners/admins). The client renders the Platform Console tab only when this is true; every console action re-checks server-side.",
    request: z.object({ ...requesterArgs }),
    response: z.object({ isPlatformOwner: z.boolean() }),
    async handler(ctx, args) {
      return { isPlatformOwner: await isPlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail) };
    },
  }),

  getPlatformConsole: defineAction({
    description: "PLATFORM OWNER ONLY. The customer list for the whole product: every organization with its plan, billing status (including comped / billing-paused flags), lifetime revenue (paid invoices net of credits) and outstanding due amount, events used vs allowance (all-time registration-event count for Free orgs — Free is unlimited in events; this month's usage vs the monthly allowance for paid plans), team seats (owners/admins/registrars/greeters, members + pending invites), attendee count, and registration counts. Organization admins and owners cannot see this — it spans all customers.",
    request: z.object({ ...requesterArgs }),
    response: z.object({
      totals: z.object({ organizations: z.number(), revenueCents: z.number(), dueCents: z.number(), registrations: z.number(), attendees: z.number() }),
      customers: z.array(z.object({
        orgId: z.number(), name: z.string(), plan: z.string(), subscriptionStatus: z.string(),
        comped: z.boolean(), billingPaused: z.boolean(), allowanceOverride: z.number().nullable(), trialBonusEvents: z.number(),
        cardLast4: z.string().nullable(), createdAt: z.string(), onboardingStep: z.number(),
        revenueCents: z.number(), dueCents: z.number(), invoiceCount: z.number(),
        eventsUsed: z.number(), eventsAllowance: z.number().nullable(), eventsLabel: z.string(),
        seats: z.object({ owners: z.number(), admins: z.number(), registrants: z.number(), greeters: z.number() }),
        attendees: z.number(), registrations: z.number(), checkedIn: z.number(),
      })),
    }),
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const orgs = await db.select().from(schema.organizations).orderBy(asc(schema.organizations.id));
      const monthKey = currentMonthKey();
      const customers = [];
      let totRevenue = 0; let totDue = 0; let totRegs = 0; let totAtt = 0;
      for (const org of orgs) {
        const invoices = await db.select().from(schema.billingInvoices).where(eq(schema.billingInvoices.orgId, org.id));
        const revenueCents = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.amountCents, 0);
        const dueCents = invoices.filter((i) => i.status === "due").reduce((a, i) => a + i.amountCents, 0);
        const seatCounts = await seatUsageCounts(ctx, org.id);
        const owners = await trialOwnerUsage(ctx, org.id);
        const evs = await db.select({ id: schema.events.id }).from(schema.events).where(eq(schema.events.orgId, org.id));
        let registrations = 0; let checkedIn = 0; const attendeeEmails = new Set<string>();
        for (const ev of evs) {
          const regs = await db.select({ status: schema.registrations.status, emailHash: schema.registrations.emailHash, held: schema.registrations.held }).from(schema.registrations).where(eq(schema.registrations.eventId, ev.id));
          for (const r of regs) {
            if (r.held === 1 || r.status === "revoked") continue;
            registrations += 1;
            if (r.status === "checked_in") checkedIn += 1;
            if (r.emailHash) attendeeEmails.add(r.emailHash);
          }
        }
        const isTrialPlan = org.plan === "trial";
        const eventsUsed = isTrialPlan ? await trialRegistrationEventsUsed(ctx, org.id) : await registrationEventsInMonth(ctx, org.id, monthKey);
        const eventsAllowance = org.comped === 1 ? null : isTrialPlan ? null : (org.allowanceOverride ?? EVENT_ALLOWANCE[org.plan] ?? null);
        const eventsLabel = org.comped === 1 ? "Comped — unmetered" : isTrialPlan ? `${eventsUsed} registration events all-time (Free plan — unlimited, feature-limited)` : eventsAllowance === null ? `${eventsUsed} registration events this month (unlimited)` : `${eventsUsed} of ${eventsAllowance} registration events this month`;
        totRevenue += revenueCents; totDue += dueCents; totRegs += registrations; totAtt += attendeeEmails.size;
        customers.push({
          orgId: org.id, name: org.name, plan: org.plan, subscriptionStatus: org.subscriptionStatus,
          comped: org.comped === 1, billingPaused: org.billingPaused === 1, allowanceOverride: org.allowanceOverride ?? null, trialBonusEvents: org.trialBonusEvents ?? 0,
          cardLast4: org.cardLast4 ?? null, createdAt: new Date(org.createdAt).toISOString(), onboardingStep: org.onboardingStep,
          revenueCents, dueCents, invoiceCount: invoices.length,
          eventsUsed, eventsAllowance, eventsLabel,
          seats: { owners: owners.used, admins: seatCounts.used.admin, registrants: seatCounts.used.registrant, greeters: seatCounts.used.gatekeeper },
          attendees: attendeeEmails.size, registrations, checkedIn,
        });
      }
      return { totals: { organizations: orgs.length, revenueCents: totRevenue, dueCents: totDue, registrations: totRegs, attendees: totAtt }, customers };
    },
  }),

  /* ---------- Feature carousel promotions (platform owner) ----------
     Promotion is NOT a feature flag: flags decide whether a feature
     works; this list decides which paid features the slim carousel at
     the bottom of the screen highlights to organizations whose plan
     doesn't include them, in what order, and which are hidden entirely.
     Stored in app_settings so the platform owner can change it any
     time without redeploying. */
  getCarouselPromotions: defineAction({
    description: "Returns the platform owner's feature-carousel promotion list: which paid features the upgrade carousel highlights, in order, and which are hidden. Applies to every organization; the carousel itself only shows features the viewer's own plan doesn't already include.",
    request: z.object({ ...requesterArgs }),
    response: z.object({ features: z.array(z.object({ key: z.string(), visible: z.boolean() })) }),
    async handler(ctx) {
      const raw = await getSetting(ctx, "carousel_promotions");
      let saved: { key: string; visible: boolean }[] = [];
      if (raw) { try { const parsed = JSON.parse(raw) as { key?: unknown; visible?: unknown }[]; if (Array.isArray(parsed)) saved = parsed.filter((f) => typeof f?.key === "string" && CAROUSEL_FEATURE_KEYS.includes(f.key as string)).map((f) => ({ key: f.key as string, visible: f.visible !== false })); } catch { saved = []; } }
      const seen = new Set(saved.map((f) => f.key));
      const features = [...saved, ...CAROUSEL_FEATURE_KEYS.filter((k) => !seen.has(k)).map((key) => ({ key, visible: true }))];
      return { features };
    },
  }),

  setCarouselPromotions: defineAction({
    description: "Platform owner only: saves which paid features the upgrade carousel promotes, in what order, and which are hidden entirely. Separate from the feature flags — this changes promotion only, never whether a feature works. Takes effect immediately, no redeploy.",
    request: z.object({ features: z.array(z.object({ key: z.string(), visible: z.boolean() })).max(20), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requirePlatformOwner(ctx, args.adminGoogleId, args.adminEmail);
      const clean = args.features.filter((f) => CAROUSEL_FEATURE_KEYS.includes(f.key));
      const seen = new Set<string>();
      const deduped = clean.filter((f) => (seen.has(f.key) ? false : (seen.add(f.key), true)));
      await setSetting(ctx, "carousel_promotions", JSON.stringify(deduped));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  platformAdjust: defineAction({
    description: "PLATFORM OWNER ONLY. Applies one account-management adjustment to a customer organization, with a REQUIRED reason, and writes it to the audit log (platform_adjustments) with the actor. Kinds: comp (free membership — no metering, seat limits, or charges), uncomp, plan_change (with plan), allowance_change (monthly registration-event allowance override; null clears it), extend_trial (LEGACY — the Free plan is no longer event-limited, so this only adjusts the retained trialBonusEvents reporting field), extend_billing (record a billing extension for a paid org), pause_billing / resume_billing, credit (amountCents — recorded as a negative paid invoice line so revenue nets correctly). Nothing here is visible to the organization's own admins beyond its normal billing view.",
    request: z.object({
      orgId: z.number().int().positive(),
      kind: z.enum(["comp", "uncomp", "plan_change", "allowance_change", "extend_trial", "extend_billing", "pause_billing", "resume_billing", "credit"]),
      plan: z.enum(["trial", "starter", "community", "pro"]).optional(),
      allowance: z.number().int().min(0).max(10000).nullable().optional(),
      extraFreeEvents: z.number().int().min(1).max(100).optional(),
      amountCents: z.number().int().positive().max(100000000).optional(),
      reason: z.string().min(3).max(500),
      ...requesterArgs,
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const org = await getOrgRow(ctx, args.orgId);
      if (!org) throw new Error("That organization no longer exists.");
      const db = ctx.db<typeof schema>();
      const actor = args.requestedByEmail ?? "";
      const planNames: Record<string, string> = PLAN_DISPLAY_NAMES;
      switch (args.kind) {
        case "comp":
          await db.update(schema.organizations).set({ comped: 1 }).where(eq(schema.organizations.id, args.orgId));
          await logPlatformAdjustment(ctx, args.orgId, "comp", `Membership comped — ${org.name} is now free (no metering, seat limits, or charges)`, args.reason, actor);
          break;
        case "uncomp":
          await db.update(schema.organizations).set({ comped: 0 }).where(eq(schema.organizations.id, args.orgId));
          await logPlatformAdjustment(ctx, args.orgId, "uncomp", `Comp removed — ${org.name} returns to normal ${planNames[org.plan] ?? org.plan} billing and limits`, args.reason, actor);
          break;
        case "plan_change": {
          if (!args.plan) throw new Error("Choose the new plan.");
          if (args.plan === org.plan) throw new Error(`That organization is already on the ${planNames[org.plan]} plan.`);
          const patch: Partial<OrgRow> = { plan: args.plan };
          if (org.plan === "trial" && args.plan !== "trial") patch.subscriptionStatus = org.cardLast4 ? "active" : "trialing";
          if (args.plan === "trial") patch.subscriptionStatus = "trialing";
          await db.update(schema.organizations).set(patch).where(eq(schema.organizations.id, args.orgId));
          await logPlatformAdjustment(ctx, args.orgId, "plan_change", `Plan changed from ${planNames[org.plan] ?? org.plan} to ${planNames[args.plan]}${args.plan !== "trial" && !org.cardLast4 ? " (no card on file — subscription starts when the owner adds one)" : ""}`, args.reason, actor);
          break;
        }
        case "allowance_change":
          await db.update(schema.organizations).set({ allowanceOverride: args.allowance ?? null }).where(eq(schema.organizations.id, args.orgId));
          await logPlatformAdjustment(ctx, args.orgId, "allowance_change", args.allowance === null || args.allowance === undefined ? `Monthly registration-event allowance override cleared (back to the ${planNames[org.plan] ?? org.plan} plan allowance)` : `Monthly registration-event allowance set to ${args.allowance} (plan default: ${EVENT_ALLOWANCE[org.plan] ?? "unlimited"})`, args.reason, actor);
          break;
        case "extend_trial": {
          // Legacy adjustment kept for audit-log compatibility: the
          // Free plan is permanent and unlimited in events, so this
          // no longer changes what the organization can do — it only
          // updates the retained trialBonusEvents reporting field.
          const extra = args.extraFreeEvents ?? 1;
          const before = FREE_TRIAL_EVENTS + (org.trialBonusEvents ?? 0);
          await db.update(schema.organizations).set({ trialBonusEvents: (org.trialBonusEvents ?? 0) + extra }).where(eq(schema.organizations.id, args.orgId));
          await logPlatformAdjustment(ctx, args.orgId, "extend_trial", `Legacy free-events extension recorded (+${extra}, reporting total now ${before + extra}) — the Free plan is unlimited in events, so this changes no limits`, args.reason, actor);
          break;
        }
        case "extend_billing":
          await logPlatformAdjustment(ctx, args.orgId, "extend_billing", `Billing extended for ${org.name} (recorded by the platform owner; no charge was made)`, args.reason, actor);
          break;
        case "pause_billing":
          await db.update(schema.organizations).set({ billingPaused: 1 }).where(eq(schema.organizations.id, args.orgId));
          await logPlatformAdjustment(ctx, args.orgId, "pause_billing", `Billing paused for ${org.name} — no charges while paused; the organization keeps full use`, args.reason, actor);
          break;
        case "resume_billing":
          await db.update(schema.organizations).set({ billingPaused: 0 }).where(eq(schema.organizations.id, args.orgId));
          await logPlatformAdjustment(ctx, args.orgId, "resume_billing", `Billing resumed for ${org.name}`, args.reason, actor);
          break;
        case "credit": {
          if (!args.amountCents) throw new Error("Enter the credit amount.");
          await db.insert(schema.billingInvoices).values({ orgId: args.orgId, description: `Account credit — ${args.reason.trim().slice(0, 120)}`, amountCents: -args.amountCents, status: "paid" });
          await logPlatformAdjustment(ctx, args.orgId, "credit", `Credit of $${(args.amountCents / 100).toFixed(2)} issued to ${org.name}`, args.reason, actor, args.amountCents);
          break;
        }
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getPlatformAuditLog: defineAction({
    description: "PLATFORM OWNER ONLY. The audit log of every platform adjustment ever made — newest first, optionally for one organization: what was done, the recorded reason, who did it, and when.",
    request: z.object({ orgId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(200).default(100), ...requesterArgs }),
    response: z.object({ entries: z.array(z.object({ id: z.number(), orgId: z.number(), orgName: z.string(), kind: z.string(), details: z.string(), amountCents: z.number().nullable(), reason: z.string(), actorEmail: z.string(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.platformAdjustments).orderBy(desc(schema.platformAdjustments.id));
      const orgs = await db.select({ id: schema.organizations.id, name: schema.organizations.name }).from(schema.organizations);
      const names = new Map(orgs.map((o) => [o.id, o.name]));
      return { entries: rows.filter((r) => !args.orgId || r.orgId === args.orgId).slice(0, args.limit).map((r) => ({ id: r.id, orgId: r.orgId, orgName: names.get(r.orgId) ?? `Organization ${r.orgId}`, kind: r.kind, details: r.details, amountCents: r.amountCents ?? null, reason: r.reason, actorEmail: r.actorEmail, createdAt: new Date(r.createdAt).toISOString() })) };
    },
  }),

  createRoleInvite: defineAction({
    description: "Invites someone to a role (administrator, gatekeeper, or registrant) in one organization by first name, last name, and email. Creates the invitation and returns it with its token link; the role is only assigned when the person accepts by creating their account. Admin of the organization only.",
    request: z.object({ orgId: z.number().int().positive(), firstName: z.string().min(1).max(80), lastName: z.string().max(80).default(""), email: z.string().email().max(200), roles: z.array(z.enum(["admin", "gatekeeper", "registrant", "owner"])).min(1).max(4), ...requesterArgs }),
    response: z.object({ invite: z.object({ id: z.number(), roles: z.array(z.enum(["admin", "gatekeeper", "registrant", "owner"])), firstName: z.string(), lastName: z.string(), email: z.string(), token: z.string(), expiresAt: z.string() }) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      // Only an owner can invite a new owner.
      if (args.roles.includes("owner")) { await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail); await assertTrialOwnerAvailable(ctx, args.orgId); }
      // Per-plan seat limits (trial: 1 admin, no registrars, 2 greeters; Starter: 2/2/4).
      for (const r of args.roles) if (r === "admin" || r === "registrant" || r === "gatekeeper") await assertSeatAvailable(ctx, args.orgId, r);
      // Staff email-domain restriction: don't invite staff addresses the org's rule would block anyway.
      { const org = await getOrgRow(ctx, args.orgId); for (const r of args.roles) assertStaffDomainAllowed(org, r as StaffRole, args.email); }
      const row = await insertRoleInvite(ctx, args.orgId, args.roles as RoleName[], args.firstName, args.lastName, args.email);
      ctx.invalidateQueries();
      return { invite: { id: row.id, roles: inviteRoles(row), firstName: row.firstName, lastName: row.lastName, email: row.email, token: row.token, expiresAt: row.expiresAt.toISOString() } };
    },
  }),

  listRoleInvites: defineAction({
    description: "Lists one organization's outstanding (not yet accepted) role invitations. Admin only — the tokens are live credentials.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ invites: z.array(z.object({ id: z.number(), roles: z.array(z.enum(["admin", "gatekeeper", "registrant", "owner"])), firstName: z.string(), lastName: z.string(), email: z.string(), token: z.string(), expiresAt: z.string(), createdAt: z.string() })) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.roleInvites).where(eq(schema.roleInvites.orgId, args.orgId)).orderBy(desc(schema.roleInvites.id));
      return { invites: rows.filter((r) => !r.acceptedAt).map((r) => ({ id: r.id, roles: inviteRoles(r), firstName: r.firstName, lastName: r.lastName, email: r.email, token: r.token, expiresAt: r.expiresAt.toISOString(), createdAt: r.createdAt.toISOString() })) };
    },
  }),

  revokeRoleInvite: defineAction({
    description: "Cancels an outstanding role invitation. Admin of the organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      await db.delete(schema.roleInvites).where(and(eq(schema.roleInvites.id, args.id), eq(schema.roleInvites.orgId, args.orgId)));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  resendRoleInvite: defineAction({
    description: "Re-issues a role invitation with a fresh token and a new 14-day expiry; the old link stops working. Admin of the organization only.",
    request: z.object({ id: z.number().int().positive(), orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ token: z.string(), expiresAt: z.string() }),
    async handler(ctx, args) {
      await requireUserAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const token = `inv-${makeApprovalToken().slice(4)}`;
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
      await db.update(schema.roleInvites).set({ token, expiresAt }).where(and(eq(schema.roleInvites.id, args.id), eq(schema.roleInvites.orgId, args.orgId)));
      ctx.invalidateQueries();
      return { token, expiresAt: expiresAt.toISOString() };
    },
  }),

  getRoleInvite: defineAction({
    description: "Looks up a role invitation by its token for the acceptance page: which organization, which role, and who it was sent to. The token is the credential.",
    request: z.object({ token: z.string().min(8).max(200) }),
    response: z.object({ status: z.enum(["pending", "accepted", "expired", "invalid"]), orgId: z.number().nullable(), orgName: z.string().nullable(), roles: z.array(z.enum(["admin", "gatekeeper", "registrant", "owner"])), firstName: z.string().nullable(), lastName: z.string().nullable(), email: z.string().nullable() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.roleInvites).where(eq(schema.roleInvites.token, args.token)).limit(1);
      const invite = rows[0];
      if (!invite) return { status: "invalid" as const, orgId: null, orgName: null, roles: [], firstName: null, lastName: null, email: null };
      const org = await getOrgRow(ctx, invite.orgId);
      const base = { orgId: invite.orgId, orgName: org?.name ?? null, roles: inviteRoles(invite), firstName: invite.firstName, lastName: invite.lastName, email: invite.email };
      if (invite.acceptedAt) return { status: "accepted" as const, ...base };
      if (invite.expiresAt.getTime() <= Date.now()) return { status: "expired" as const, ...base };
      return { status: "pending" as const, ...base };
    },
  }),

  acceptRoleInvite: defineAction({
    description: "Accepts a role invitation with an existing signed-in identity (Google, Apple, email code, or password). The signed-in email must match the invited address; accepting creates the role assignment bound to that identity.",
    request: z.object({ token: z.string().min(8).max(200), googleId: z.string().min(1).max(200), email: z.string().email().max(200), name: z.string().min(1).max(120) }),
    response: z.object({ orgId: z.number(), roles: z.array(z.enum(["admin", "gatekeeper", "registrant", "owner"])) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const invite = await loadInvite(ctx, args.token);
      if (args.email.trim().toLowerCase() !== invite.email.toLowerCase()) {
        throw new Error(`This invitation was sent to ${invite.email}. Sign in with that address to accept it.`);
      }
      const displayName = `${invite.firstName} ${invite.lastName}`.trim() || args.name.trim();
      await grantRoleFromInvite(ctx, invite, args.googleId.trim(), displayName);
      await markEmailVerified(ctx, invite.email);
      ctx.invalidateQueries();
      return { orgId: invite.orgId, roles: inviteRoles(invite) };
    },
  }),

  acceptRoleInviteWithPassword: defineAction({
    description: "Accepts a role invitation by creating a password account for the invited email address, then assigns the role to that account's identity (email:<address> — the same identity email-code sign-in produces). Returns the new identity so the client can sign the person in.",
    request: z.object({ token: z.string().min(8).max(200), password: z.string().min(8).max(200) }),
    response: z.object({ googleId: z.string(), email: z.string(), name: z.string(), orgId: z.number(), roles: z.array(z.enum(["admin", "gatekeeper", "registrant", "owner"])) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const invite = await loadInvite(ctx, args.token);
      const em = invite.email.toLowerCase();
      const hash = await emailIndex(ctx, em);
      const db = ctx.db<typeof schema>();
      const existing = await db.select({ id: schema.passwordAccounts.id }).from(schema.passwordAccounts).where(eq(schema.passwordAccounts.emailHash, hash)).limit(1);
      if (existing[0]) throw new Error("An account with a password already exists for this email — sign in with that password (or Google/Apple) and then accept the invitation.");
      const displayName = `${invite.firstName} ${invite.lastName}`.trim() || em;
      const enc = await encryptFields(ctx, [em]);
      await db.insert(schema.passwordAccounts).values({ email: enc[0]!, emailHash: hash, name: displayName, passwordHash: await hashPassword(args.password) });
      const identityId = `email:${em}`;
      await grantRoleFromInvite(ctx, invite, identityId, displayName);
      await markEmailVerified(ctx, em);
      ctx.invalidateQueries();
      return { googleId: identityId, email: em, name: displayName, orgId: invite.orgId, roles: inviteRoles(invite) };
    },
  }),

  /* ---------- Arrival pop-up (geofence) settings & attendee opt-in ---------- */

  updateEventGeofenceSettings: defineAction({
    description: "Sets an event's arrival pop-up (geofence) settings: on/off, the DEFAULT radius in meters around the venue pin (attendees can pick their own radius — 100/250/500/1000 m — in their Preferences, which overrides this default for them), and the event-time window (minutes before the start it opens, minutes after it closes). The same pin/window feed the wallet passes' relevant location. Physical events only. Admin of the event's organization only; a sensitive (door-mode) setting, so a fresh session is required when the account has one.",
    request: z.object({ orgId: z.number().int().positive(), eventId: z.number().int().positive(), geofenceEnabled: z.boolean(), geofenceRadiusM: z.number().int().min(50).max(5000), geofenceBeforeMins: z.number().int().min(15).max(1440), geofenceAfterMins: z.number().int().min(15).max(1440), ...identityArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.orgId, args.adminGoogleId, args.adminEmail);
      await assertSensitiveAuth(ctx, args.adminGoogleId, args.adminEmail, args.sessionToken);
      const ev = await getEventRow(ctx, args.eventId);
      if (!ev || ev.orgId !== args.orgId) throw new Error("That event doesn't belong to this organization.");
      if ((ev.locationType ?? "physical") === "virtual") throw new Error("Virtual events have no venue to arrive at — the arrival pop-up is for in-person events.");
      const db = ctx.db<typeof schema>();
      await db.update(schema.events).set({ geofenceEnabled: args.geofenceEnabled ? 1 : 0, geofenceRadiusM: args.geofenceRadiusM, geofenceBeforeMins: args.geofenceBeforeMins, geofenceAfterMins: args.geofenceAfterMins }).where(eq(schema.events.id, args.eventId));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  setProximityPreference: defineAction({
    description: "Attendee turns the arrival pop-up on or off for ONE confirmed registration — the choice offered at the moment the pass is issued, in plain language, and always optional (the pass works identically either way). radiusM optionally sets the attendee's own notification radius for this registration (100/250/500/1000 meters, or null for the event's default radius); omitting it leaves the stored radius unchanged. Identity is verified by the registration's Google ID or its email blind index (their own address or the group contact's), like reminder choices.",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional(), enabled: z.boolean(), radiusM: z.number().int().nullable().optional() }),
    response: z.object({ ok: z.literal(true), enabled: z.boolean(), radiusM: z.number().nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true; enabled: boolean; radiusM: number | null }> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.registrationId)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      let ok = !!(args.googleId && reg.googleId && reg.googleId === args.googleId);
      if (!ok && args.email) { const hash = await emailIndex(ctx, args.email); ok = reg.emailHash === hash || reg.contactEmailHash === hash; }
      if (!ok) throw new Error("That sign-in or email doesn't match this registration.");
      const ev = await getEventRow(ctx, reg.eventId);
      if (args.enabled && ev) await assertFeatureEnabled(ctx, ev.orgId, "arrival_popup");
      const radiusM = args.radiusM !== undefined ? normalizeAttendeeRadius(args.radiusM) : ((reg as { proximityRadiusM?: number | null }).proximityRadiusM ?? null);
      await db.update(schema.registrations).set({ proximityOptIn: args.enabled ? 1 : 0, ...(args.radiusM !== undefined ? { proximityRadiusM: radiusM } : {}) }).where(eq(schema.registrations.id, reg.id));
      // Changing the switch here is also the attendee's latest answer
      // to the arrival question — it becomes the standing default for
      // their future registrations with this organization.
      if (ev && reg.emailHash) await upsertArrivalDefaultByHash(ctx, ev.orgId, reg.emailHash, reg.email, "", args.enabled, args.radiusM);
      ctx.invalidateQueries();
      return { ok: true, enabled: args.enabled, radiusM };
    },
  }),

  recordProximityArrival: defineAction({
    description: "The attendee's device reports its position near an event; the server is the authority: it re-checks that the registration is confirmed, the event's arrival pop-up is on, the venue pin exists, NOW is inside the event-time window, and the device is within the effective radius — the attendee's own chosen radius for this registration (or their standing Preferences radius) when they set one, otherwise the event's admin-set default radius. Only then (and at most once per 30 minutes per registration) it records the arrival and answers shouldShow=true — the client pops the QR pass up. The returned radiusM is the effective radius used. Location coordinates are used for this one check and never stored.",
    request: z.object({ registrationId: z.number().int().positive(), email: z.string().email().max(200).optional(), googleId: z.string().max(200).optional(), deviceLat: z.number().min(-90).max(90), deviceLng: z.number().min(-180).max(180) }),
    response: z.object({ shouldShow: z.boolean(), reason: z.enum(["in_range", "not_confirmed", "disabled", "no_venue", "outside_window", "too_far", "already_shown"]), distanceM: z.number().nullable(), radiusM: z.number() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.registrations).where(eq(schema.registrations.id, args.registrationId)).limit(1);
      const reg = rows[0];
      if (!reg) throw new Error("Registration not found.");
      let ok = !!(args.googleId && reg.googleId && reg.googleId === args.googleId);
      if (!ok && args.email) { const hash = await emailIndex(ctx, args.email); ok = reg.emailHash === hash || reg.contactEmailHash === hash; }
      if (!ok) throw new Error("That sign-in or email doesn't match this registration.");
      const ev = await getEventRow(ctx, reg.eventId);
      // Effective radius: the attendee's own radius for this
      // registration wins; then their standing Preferences radius;
      // then the event's admin-set default.
      const standing = ev && reg.emailHash ? await arrivalAnswerFor(ctx, ev.orgId, reg.emailHash) : null;
      const radiusM = normalizeAttendeeRadius((reg as { proximityRadiusM?: number | null }).proximityRadiusM) ?? standing?.radiusM ?? ((ev as { geofenceRadiusM?: number } | null)?.geofenceRadiusM ?? 400);
      if (!ev) return { shouldShow: false, reason: "disabled" as const, distanceM: null, radiusM };
      if (!(await resolveFeatureEnabled(ctx, ev.orgId, "arrival_popup"))) return { shouldShow: false, reason: "disabled" as const, distanceM: null, radiusM };
      if (reg.status !== "approved" && reg.status !== "checked_in") return { shouldShow: false, reason: "not_confirmed" as const, distanceM: null, radiusM };
      if ((ev as { geofenceEnabled?: number }).geofenceEnabled === 0 || (ev.locationType ?? "physical") === "virtual") return { shouldShow: false, reason: "disabled" as const, distanceM: null, radiusM };
      if (typeof ev.venueLat !== "number" || typeof ev.venueLng !== "number") return { shouldShow: false, reason: "no_venue" as const, distanceM: null, radiusM };
      const win = geofenceWindow(ev);
      const now = new Date();
      if (now < win.opensAt || now > win.closesAt) return { shouldShow: false, reason: "outside_window" as const, distanceM: null, radiusM };
      const distanceM = haversineMeters(args.deviceLat, args.deviceLng, ev.venueLat, ev.venueLng);
      if (distanceM > radiusM) return { shouldShow: false, reason: "too_far" as const, distanceM, radiusM };
      const last = (reg as { proximityNotifiedAt?: number | null }).proximityNotifiedAt ?? null;
      if (last && Date.now() - last < 30 * 60 * 1000) return { shouldShow: false, reason: "already_shown" as const, distanceM, radiusM };
      await db.update(schema.registrations).set({ proximityNotifiedAt: Date.now() }).where(eq(schema.registrations.id, reg.id));
      ctx.invalidateQueries();
      return { shouldShow: true, reason: "in_range" as const, distanceM, radiusM };
    },
  }),

  /* ---------- Passkeys (WebAuthn) ----------
     A passkey is tied to the person's EMAIL in Approved Guest and to
     the unified identity that email already signs in as — no Google
     or Microsoft account is involved at any point. The credential
     lives wherever the person chooses: iCloud Keychain (Face ID /
     Touch ID), Windows Hello, an Android phone, a password manager
     (1Password, Bitwarden, Dashlane…), or a hardware security key
     (YubiKey…). Cross-device sign-in (scan a QR code with the phone
     that holds the passkey) is the platform's hybrid transport: it
     works because credentials are registered as discoverable
     (resident) credentials and sign-in allows an empty allow-list.
     The server stores ONLY the public key (SPKI), the credential id,
     and a signature counter — no password, no shared secret.
     Bootstrap rule: creating a passkey requires an already-verified
     session (Google / Apple / email code / password sign-in mints
     one), so nobody can attach a passkey to an address they haven't
     proven they control. The email magic link / code stays as the
     fallback for anyone who can't or won't use a passkey. */

  beginPasskeyRegistration: defineAction({
    description: "Starts passkey setup for a signed-in account: requires a valid verified session for that same identity/email (proof the person controls the account), then returns the WebAuthn creation options — a server-generated single-use challenge (5 minutes), the relying-party id the client passes in, and a stable per-account user handle derived from the identity (never the raw email). The passkey will be tied to this account's email and unified identity, whatever provider the person originally signed in with — or none: an email-code sign-in is enough.",
    request: z.object({ email: z.string().email().max(200), googleId: z.string().max(200), sessionToken: z.string().min(10).max(200), rpId: z.string().min(1).max(253), label: z.string().max(80).default("") }),
    response: z.object({ challengeId: z.string(), challenge: z.string(), rpId: z.string(), userId: z.string(), userName: z.string(), userDisplayName: z.string(), excludeCredentialIds: z.array(z.string()) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await assertFeatureEnabled(ctx, null, "passkeys");
      const em = args.email.trim().toLowerCase();
      const check = await checkAuthSession(ctx, args.googleId, em, args.sessionToken);
      if (!check.valid) throw new Error("Passkey setup needs a verified sign-in first: sign in with Google, Apple, your email code, or your password, then add the passkey to that account. That way a passkey can only ever be attached to an account the person has proven is theirs.");
      const db = ctx.db<typeof schema>();
      const hash = await emailIndex(ctx, em);
      const existing = await db.select({ credentialId: schema.passkeyCredentials.credentialId, identityId: schema.passkeyCredentials.identityId, emailHash: schema.passkeyCredentials.emailHash }).from(schema.passkeyCredentials);
      const mine = existing.filter((r) => r.identityId === args.googleId || r.emailHash === hash);
      const challengeId = randomB64url(18);
      const challenge = randomB64url(32);
      const now = Date.now();
      await db.insert(schema.passkeyChallenges).values({ id: challengeId, challenge, purpose: "register", emailHash: hash, identityId: args.googleId, rpId: args.rpId, expiresAt: now + 5 * 60 * 1000, createdAt: now });
      const userId = b64urlEncode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(args.googleId))));
      return { challengeId, challenge, rpId: args.rpId, userId, userName: em, userDisplayName: em, excludeCredentialIds: mine.map((r) => r.credentialId) };
    },
  }),

  finishPasskeyRegistration: defineAction({
    description: "Completes passkey setup: verifies the creation response against the stored challenge (type webauthn.create, matching challenge, attestation 'none'), then stores ONLY the public key — the SPKI the browser exposes via getPublicKey(), or the COSE key parsed out of the attestation object when that's all the browser offers — plus the credential id, transports, and the person's label for the device. No private key, password, or secret is ever received or stored.",
    request: z.object({ challengeId: z.string().min(8).max(200), credentialId: z.string().min(8).max(500), clientDataJSON: z.string().min(10).max(8000), attestationObject: z.string().max(20000).optional(), publicKeySpki: z.string().max(2000).optional(), publicKeyAlgorithm: z.number().int().default(-7), transports: z.array(z.string().max(30)).max(6).default([]), label: z.string().max(80).default("") }),
    response: z.object({ id: z.number(), label: z.string(), createdAt: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.passkeyChallenges).where(eq(schema.passkeyChallenges.id, args.challengeId)).limit(1);
      const ch = rows[0];
      if (!ch || ch.purpose !== "register" || ch.usedAt || ch.expiresAt <= Date.now() || !ch.identityId || !ch.emailHash) throw new Error("That passkey setup expired — start again from Sign-in & security.");
      await verifyPasskeyAttestation(args.attestationObject, args.clientDataJSON, ch.challenge);
      let spki = args.publicKeySpki ?? "";
      if (!spki && args.attestationObject) spki = extractSpkiFromAttestation(args.attestationObject);
      if (!spki) throw new Error("That browser didn't share the passkey's public key, so the passkey can't be stored safely. Try a current version of Safari, Chrome, or Edge.");
      const dupe = await db.select({ id: schema.passkeyCredentials.id }).from(schema.passkeyCredentials).where(eq(schema.passkeyCredentials.credentialId, args.credentialId)).limit(1);
      if (dupe[0]) throw new Error("That passkey is already set up for an account.");
      await db.update(schema.passkeyChallenges).set({ usedAt: Date.now() }).where(eq(schema.passkeyChallenges.id, ch.id));
      // The account email: recovered from the identity when it's an
      // email identity, else from any verified record for the hash —
      // simplest reliable source is the session's account email,
      // carried by re-deriving from identity or prior accounts.
      let email = ch.identityId.startsWith("email:") ? ch.identityId.slice(6) : "";
      if (!email) {
        const accts = await db.select().from(schema.passwordAccounts).where(eq(schema.passwordAccounts.emailHash, ch.emailHash)).limit(1);
        if (accts[0]) { const dec = await decryptFields(ctx, [accts[0].email]); email = dec[0] ?? ""; }
      }
      if (!email) {
        const vers = await db.select().from(schema.emailVerifications).where(eq(schema.emailVerifications.emailHash, ch.emailHash)).limit(1);
        if (vers[0]) { const dec = await decryptFields(ctx, [vers[0].email]); email = dec[0] ?? ""; }
      }
      if (!email) throw new Error("Couldn't tell which account this passkey belongs to — sign in again and retry.");
      const enc = await encryptFields(ctx, [email]);
      const inserted = await db.insert(schema.passkeyCredentials).values({ credentialId: args.credentialId, identityId: ch.identityId, email: enc[0]!, emailHash: ch.emailHash, publicKeySpki: spki, publicKeyAlgorithm: args.publicKeyAlgorithm, counter: 0, transports: JSON.stringify(args.transports), label: args.label.trim(), createdAt: Date.now() }).returning({ id: schema.passkeyCredentials.id });
      const row = inserted[0];
      if (!row) throw new Error("Couldn't save the passkey.");
      ctx.invalidateQueries();
      return { id: row.id, label: args.label.trim(), createdAt: new Date().toISOString() };
    },
  }),

  beginPasskeyAuthentication: defineAction({
    description: "Starts passkey sign-in: returns a fresh single-use challenge and the credential ids registered for the given email (empty when no email is given or none match — the sign-in then proceeds as a discoverable-credential ceremony, which is what makes cross-device QR sign-in from a phone work: the browser offers the person's synced passkeys and the 'use a different device' QR option itself). No account is needed beyond the email the passkey is tied to — no Google or Microsoft account anywhere in this flow.",
    request: z.object({ email: z.string().email().max(200).optional(), rpId: z.string().min(1).max(253) }),
    response: z.object({ challengeId: z.string(), challenge: z.string(), rpId: z.string(), allowCredentialIds: z.array(z.string()) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      await assertFeatureEnabled(ctx, null, "passkeys");
      const db = ctx.db<typeof schema>();
      let allow: string[] = [];
      let hash: string | null = null;
      if (args.email) { hash = await emailIndex(ctx, args.email.trim().toLowerCase()); const rows = await db.select({ credentialId: schema.passkeyCredentials.credentialId, emailHash: schema.passkeyCredentials.emailHash }).from(schema.passkeyCredentials).where(eq(schema.passkeyCredentials.emailHash, hash)); allow = rows.map((r) => r.credentialId); }
      const challengeId = randomB64url(18);
      const challenge = randomB64url(32);
      const now = Date.now();
      await db.insert(schema.passkeyChallenges).values({ id: challengeId, challenge, purpose: "auth", emailHash: hash, rpId: args.rpId, expiresAt: now + 5 * 60 * 1000, createdAt: now });
      return { challengeId, challenge, rpId: args.rpId, allowCredentialIds: allow };
    },
  }),

  finishPasskeyAuthentication: defineAction({
    description: "Completes passkey sign-in: looks the credential up by id, verifies the assertion signature with the stored PUBLIC key (ECDSA P-256 over authenticatorData + SHA-256 of clientDataJSON, with the server challenge checked inside clientDataJSON), updates the signature counter and last-used time, then returns the account's unified identity and mints a fresh auth session. Also serves re-authentication: the same ceremony refreshes session freshness for sensitive actions.",
    request: z.object({ challengeId: z.string().min(8).max(200), credentialId: z.string().min(8).max(500), authenticatorData: z.string().min(10).max(4000), clientDataJSON: z.string().min(10).max(8000), signature: z.string().min(10).max(4000) }),
    response: z.object({ googleId: z.string(), email: z.string(), name: z.string(), sessionToken: z.string(), sessionFreshUntil: z.string(), sessionMethod: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const chRows = await db.select().from(schema.passkeyChallenges).where(eq(schema.passkeyChallenges.id, args.challengeId)).limit(1);
      const ch = chRows[0];
      if (!ch || ch.purpose !== "auth" || ch.usedAt || ch.expiresAt <= Date.now()) throw new Error("That passkey sign-in expired — start again.");
      const credRows = await db.select().from(schema.passkeyCredentials).where(eq(schema.passkeyCredentials.credentialId, args.credentialId)).limit(1);
      const cred = credRows[0];
      if (!cred) throw new Error("That passkey isn't registered here. Sign in with your email code first, then add the passkey from Sign-in & security.");
      if (ch.emailHash && ch.emailHash !== cred.emailHash) throw new Error("That passkey belongs to a different email address.");
      const { counter } = await verifyPasskeyAssertion(cred.publicKeySpki, args.authenticatorData, args.clientDataJSON, args.signature, ch.challenge);
      await db.update(schema.passkeyChallenges).set({ usedAt: Date.now() }).where(eq(schema.passkeyChallenges.id, ch.id));
      const dec = await decryptFields(ctx, [cred.email]);
      const email = (dec[0] ?? "").trim().toLowerCase();
      if (!email) throw new Error("That passkey's account couldn't be read.");
      await db.update(schema.passkeyCredentials).set({ counter, lastUsedAt: Date.now() }).where(eq(schema.passkeyCredentials.id, cred.id));
      await reconcileRoleGoogleIds(ctx, cred.identityId, email);
      await markEmailVerified(ctx, email);
      let name = "";
      const accts = await db.select().from(schema.passwordAccounts).where(eq(schema.passwordAccounts.emailHash, cred.emailHash)).limit(1);
      if (accts[0]?.name) name = accts[0].name;
      if (!name) { const owners = await db.select().from(schema.organizationOwners).where(eq(schema.organizationOwners.email, email)).limit(1); if (owners[0]) name = owners[0].displayName; }
      if (!name) { const admins = await db.select().from(schema.authorizedAdmins).where(eq(schema.authorizedAdmins.email, email)).limit(1); if (admins[0]) name = admins[0].displayName; }
      ctx.invalidateQueries();
      return { googleId: cred.identityId, email, name: name || email, ...(await mintAuthSession(ctx, cred.identityId, email, "passkey")) };
    },
  }),

  listPasskeys: defineAction({
    description: "Lists the passkeys on one account (device label, when added, when last used, transports, and a short public-key fingerprint) — never any key material beyond that fingerprint. Matched by the account's identity or email blind index, the same identity checks as the rest of the app.",
    request: z.object({ email: z.string().email().max(200), googleId: z.string().max(200).optional() }),
    response: z.object({ passkeys: z.array(z.object({ id: z.number(), label: z.string(), createdAt: z.string(), lastUsedAt: z.string().nullable(), transports: z.array(z.string()), fingerprint: z.string() })) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const hash = await emailIndex(ctx, args.email.trim().toLowerCase());
      const rows = await db.select().from(schema.passkeyCredentials);
      const mine = rows.filter((r) => r.emailHash === hash || (args.googleId && r.identityId === args.googleId));
      const out = [];
      for (const r of mine) { const fp = (await sha256Hex(r.publicKeySpki)).slice(0, 12); let transports: string[] = []; try { const v = JSON.parse(r.transports) as unknown; if (Array.isArray(v)) transports = v.filter((x): x is string => typeof x === "string"); } catch { transports = []; } out.push({ id: r.id, label: r.label, createdAt: new Date(r.createdAt).toISOString(), lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt).toISOString() : null, transports, fingerprint: fp }); }
      return { passkeys: out };
    },
  }),

  removePasskey: defineAction({
    description: "Removes one passkey from the account. A sensitive action: when the account has a live session it must be fresh (re-authenticate first if not). The email magic link / code remains as the fallback sign-in, so removing every passkey never locks the person out of their account.",
    request: z.object({ id: z.number().int().positive(), email: z.string().email().max(200), googleId: z.string().max(200).optional(), sessionToken: z.string().max(200).optional() }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await assertSensitiveAuth(ctx, args.googleId, args.email, args.sessionToken);
      const db = ctx.db<typeof schema>();
      const hash = await emailIndex(ctx, args.email.trim().toLowerCase());
      const rows = await db.select().from(schema.passkeyCredentials).where(eq(schema.passkeyCredentials.id, args.id)).limit(1);
      const row = rows[0];
      if (!row || (row.emailHash !== hash && row.identityId !== args.googleId)) throw new Error("That passkey doesn't belong to this account.");
      await db.delete(schema.passkeyCredentials).where(eq(schema.passkeyCredentials.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  checkAuthorization: defineAction({
    description: "The server's own word on who this signed-in person is FOR ONE ORGANIZATION: their roles (owner / administrator / greeter / registrar / attendee), whether they can manage users, whether they hold a passkey, whether this organization's passkey policy requires them to add one (per-role requirement, default off), and whether their auth session is valid and still fresh for sensitive actions. The client renders from this, but every action re-checks roles server-side regardless — nothing here is trusted from the client.",
    request: z.object({ orgId: z.number().int().positive(), googleId: z.string().max(200).optional(), email: z.string().max(200).optional(), sessionToken: z.string().max(200).optional() }),
    response: z.object({ isOwner: z.boolean(), isAdmin: z.boolean(), isGatekeeper: z.boolean(), isRegistrant: z.boolean(), canManageUsers: z.boolean(), roles: z.array(z.string()), hasPasskey: z.boolean(), passkeyRequired: z.boolean(), passkeyRequiredRoles: z.array(z.string()), sessionValid: z.boolean(), sessionFresh: z.boolean(), sessionMethod: z.string().nullable(), sessionFreshUntil: z.string().nullable() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const gid = args.googleId; const em = args.email;
      const isOwner = await isAuthorizedOwner(ctx, args.orgId, gid, em);
      const isAdmin = await isAuthorizedAdmin(ctx, args.orgId, gid, em);
      const isGatekeeper = await isAuthorizedGatekeeper(ctx, args.orgId, gid, em);
      const isRegistrant = await isAuthorizedRegistrant(ctx, args.orgId, gid, em);
      const roles: string[] = [];
      if (isOwner) roles.push("owner");
      if (isAdmin && !isOwner) roles.push("admin");
      if (isGatekeeper) roles.push("gatekeeper");
      if (isRegistrant) roles.push("registrant");
      const policy = await getPasskeyPolicy(ctx, args.orgId);
      const hasPasskey = await identityHasPasskey(ctx, gid, em);
      // Role MEMBERSHIP for the policy check uses the is* answers
      // directly (an owner also holds administrator rights in this
      // app, so an "admin" requirement covers owner-admins too);
      // the `roles` list above stays a display summary where owner
      // supersedes admin.
      const heldRoles: string[] = [];
      if (isOwner) heldRoles.push("owner");
      if (isAdmin || isOwner) heldRoles.push("admin");
      if (isGatekeeper) heldRoles.push("gatekeeper");
      if (isRegistrant) heldRoles.push("registrant");
      const requiredRoles = policy.requiredForStaff ? (policy.requiredRoles.length > 0 ? policy.requiredRoles : ["owner", "admin", "gatekeeper", "registrant"]) : [];
      const passkeyRequired = !hasPasskey && heldRoles.some((r) => requiredRoles.includes(r));
      const session = await checkAuthSession(ctx, gid, em, args.sessionToken);
      return { isOwner, isAdmin, isGatekeeper, isRegistrant, canManageUsers: await canManageUsers(ctx, args.orgId, gid, em), roles, hasPasskey, passkeyRequired, passkeyRequiredRoles: requiredRoles, sessionValid: session.valid, sessionFresh: session.fresh, sessionMethod: session.method, sessionFreshUntil: session.freshUntil };
    },
  }),

  getPasskeyPolicy: defineAction({
    description: "Returns one organization's passkey policy: whether passkeys are required for staff roles, and for which roles (empty list with requiredForStaff on = all staff roles). Default everywhere: passkeys offered to everyone, required for no one. Administrators and owners can read it.",
    request: z.object({ orgId: z.number().int().positive(), ...requesterArgs }),
    response: z.object({ requiredForStaff: z.boolean(), requiredRoles: z.array(z.string()) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      return getPasskeyPolicy(ctx, args.orgId);
    },
  }),

  setPasskeyPolicy: defineAction({
    description: "Sets one organization's passkey policy — whether passkeys are REQUIRED for staff roles and which roles that covers (owner / admin / gatekeeper / registrant; empty list with the requirement on = all staff roles). Default off: passkeys stay an option offered to every member. OWNER only, and a sensitive action (fresh session required when the account has one). Attendees are never affected — registration without any account keeps working regardless.",
    request: z.object({ orgId: z.number().int().positive(), requiredForStaff: z.boolean(), requiredRoles: z.array(z.enum(["owner", "admin", "gatekeeper", "registrant"])).max(4).default([]), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireOwner(ctx, args.orgId, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      await setSetting(ctx, `passkey_policy_${args.orgId}`, JSON.stringify({ requiredForStaff: args.requiredForStaff, requiredRoles: args.requiredRoles }));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  getFeatureAvailability: defineAction({
    description: "Resolves the platform owner's feature flags for one organization (or platform-wide when no organization is given): per-organization override, then the organization's plan tier, then the global switch, then the built-in default (on). The client uses this to hide disabled features entirely; the gated actions re-resolve server-side, so hiding is never the only enforcement.",
    request: z.object({ orgId: z.number().int().positive().optional() }),
    response: z.object({ features: z.record(z.string(), z.boolean()) }),
    async handler(ctx, args): Promise<{ features: Record<string, boolean> }> {
      const features: Record<string, boolean> = {};
      for (const f of FEATURE_FLAG_REGISTRY) features[f.key] = await resolveFeatureEnabled(ctx, args.orgId ?? null, f.key);
      return { features };
    },
  }),

  listFeatureFlags: defineAction({
    description: "PLATFORM OWNER ONLY. The feature-flag console: every registered feature with its global state, per-plan-tier states, per-organization overrides, which features are flagged off anywhere, and when each was last toggled and by whom. Changes take effect immediately — no redeploy.",
    request: z.object({ ...requesterArgs }),
    response: z.object({
      flags: z.array(z.object({
        key: z.string(), label: z.string(), description: z.string(),
        globalState: z.enum(["on", "off", "default"]), globalUpdatedAt: z.string().nullable(), globalUpdatedBy: z.string().nullable(),
        planStates: z.array(z.object({ plan: z.string(), state: z.enum(["on", "off", "inherit"]), updatedAt: z.string().nullable(), updatedBy: z.string().nullable() })),
        orgOverrides: z.array(z.object({ orgId: z.number(), orgName: z.string(), state: z.enum(["on", "off"]), updatedAt: z.string(), updatedBy: z.string() })),
        flaggedOff: z.boolean(), lastToggledAt: z.string().nullable(),
      })),
      plans: z.array(z.string()),
      orgOptions: z.array(z.object({ id: z.number(), name: z.string(), plan: z.string() })),
    }),
    async handler(ctx, args) {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      const db = ctx.db<typeof schema>();
      const globalMap = await readFlagLayer(ctx, "feature_flags_global");
      const planMaps: Record<string, FlagLayer> = {};
      for (const plan of FEATURE_FLAG_PLANS) planMaps[plan] = await readFlagLayer(ctx, `feature_flags_plan_${plan}`);
      const allOrgs = await db.select().from(schema.organizations).orderBy(asc(schema.organizations.id));
      const orgMaps: { orgId: number; orgName: string; map: FlagLayer }[] = [];
      for (const o of allOrgs) orgMaps.push({ orgId: o.id, orgName: o.name, map: await readFlagLayer(ctx, `feature_flags_org_${o.id}`) });
      const flags = FEATURE_FLAG_REGISTRY.map((f) => {
        const g = globalMap[f.key];
        const planStates = FEATURE_FLAG_PLANS.map((plan) => {
          const e = planMaps[plan]?.[f.key];
          return { plan, state: (e?.state ?? "inherit") as "on" | "off" | "inherit", updatedAt: e?.updatedAt || null, updatedBy: e?.updatedBy || null };
        });
        const orgOverrides = orgMaps.filter((om) => om.map[f.key]).map((om) => ({ orgId: om.orgId, orgName: om.orgName, state: om.map[f.key]!.state, updatedAt: om.map[f.key]!.updatedAt, updatedBy: om.map[f.key]!.updatedBy }));
        const flaggedOff = Boolean((g && g.state === "off") || planStates.some((p) => p.state === "off") || orgOverrides.some((o) => o.state === "off"));
        const stamps = [g?.updatedAt, ...planStates.map((p) => p.updatedAt), ...orgOverrides.map((o) => o.updatedAt)].filter((s): s is string => !!s).sort();
        return {
          key: f.key, label: f.label, description: f.description,
          globalState: (g ? g.state : "default") as "on" | "off" | "default",
          globalUpdatedAt: g?.updatedAt || null, globalUpdatedBy: g?.updatedBy || null,
          planStates, orgOverrides, flaggedOff,
          lastToggledAt: stamps.length > 0 ? stamps[stamps.length - 1]! : null,
        };
      });
      return { flags, plans: [...FEATURE_FLAG_PLANS], orgOptions: allOrgs.map((o) => ({ id: o.id, name: o.name, plan: o.plan })) };
    },
  }),

  setFeatureFlag: defineAction({
    description: "PLATFORM OWNER ONLY, and a sensitive action (fresh session required when the account has one). Sets one feature flag at one scope — global, one plan tier, or one organization — to on, off, or inherit (clear that layer so the next layer down applies). Takes effect immediately for every affected organization and attendee; disabled features disappear from their screens entirely and refuse server-side.",
    request: z.object({ scope: z.enum(["global", "plan", "org"]), plan: z.string().max(30).optional(), orgId: z.number().int().positive().optional(), key: z.string().max(60), state: z.enum(["on", "off", "inherit"]), ...requesterArgs }),
    response: z.object({ ok: z.literal(true) }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args): Promise<{ ok: true }> {
      await requirePlatformOwner(ctx, args.requestedByGoogleId, args.requestedByEmail);
      await assertSensitiveAuth(ctx, args.requestedByGoogleId, args.requestedByEmail, args.sessionToken);
      const def = FEATURE_FLAG_REGISTRY.find((f) => f.key === args.key);
      if (!def) throw new Error("Unknown feature flag.");
      let settingKey: string;
      if (args.scope === "global") settingKey = "feature_flags_global";
      else if (args.scope === "plan") {
        if (!args.plan || !(FEATURE_FLAG_PLANS as readonly string[]).includes(args.plan)) throw new Error("Pick a plan tier to set a plan-level flag.");
        settingKey = `feature_flags_plan_${args.plan}`;
      } else {
        if (!args.orgId || !(await getOrgRow(ctx, args.orgId))) throw new Error("Pick an organization to set an organization-level flag.");
        settingKey = `feature_flags_org_${args.orgId}`;
      }
      const map = await readFlagLayer(ctx, settingKey);
      if (args.state === "inherit") delete map[args.key];
      else map[args.key] = { state: args.state, updatedAt: new Date().toISOString(), updatedBy: (args.requestedByEmail ?? "").trim().toLowerCase() };
      await writeFlagLayer(ctx, settingKey, map);
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  signInWithPassword: defineAction({
    description: "Signs in with an email + password account (created through a role invitation). Returns the unified identity email:<address>.",
    request: z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) }),
    response: z.object({ googleId: z.string(), email: z.string(), name: z.string(), sessionToken: z.string(), sessionFreshUntil: z.string(), sessionMethod: z.string() }),
    privileged: PII_PRIVILEGED,
    async handler(ctx, args) {
      const em = args.email.trim().toLowerCase();
      const hash = await emailIndex(ctx, em);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.passwordAccounts).where(eq(schema.passwordAccounts.emailHash, hash)).limit(1);
      const account = rows[0];
      if (!account || !(await verifyPassword(args.password, account.passwordHash))) {
        throw new Error("Email or password not recognized. Password accounts are created by accepting a role invitation.");
      }
      const identityId = `email:${em}`;
      await reconcileRoleGoogleIds(ctx, identityId, em);
      return { googleId: identityId, email: em, name: account.name || em, ...(await mintAuthSession(ctx, identityId, em, "password")) };
    },
  }),
} satisfies ActionsModule;
