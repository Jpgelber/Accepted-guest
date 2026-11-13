import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/* ---------- Organizations (tenants) ----------
   Every organization is a fully separate tenant: its own branding, events,
   registrations, registration questions, and admin/gatekeeper lists. Rows
   in tenant tables carry org_id, and every action scopes its reads and
   writes by org — one organization can never see another's data.
   There is NO pre-loaded organization: every organization is created
   through the onboarding wizard, whose creator becomes its owner. */
export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  websiteUrl: text("website_url").notNull().default(""),
  logoUrl: text("logo_url").notNull().default(""), // image URL; empty = use the motif character
  logoBlobKey: text("logo_blob_key").notNull().default(""), // uploaded logo's blob key (logoUrl then holds its served URL)
  motif: text("motif").notNull().default("✦"), // decorative character shown when no logo image
  primaryColor: text("primary_color").notNull().default("#0b3d6e"),
  navColor: text("nav_color").notNull().default("#082e54"),
  accentColor: text("accent_color").notNull().default("#b5502a"),
  skyColor: text("sky_color").notNull().default("#7fb6d9"),
  bgColor: text("bg_color").notNull().default("#f4f1ea"),
  surfaceColor: text("surface_color").notNull().default("#fdfcf8"),
  textColor: text("text_color").notNull().default("#22303e"),
  fontSans: text("font_sans").notNull().default("Source Sans 3"),
  fontDisplay: text("font_display").notNull().default("Source Serif 4"),
  codePrefix: text("code_prefix").notNull().default("EVT"), // pass codes look like EVT-XXXXXX
  // Subscription (the app is offered as a subscription service): plan id,
  // status, trial end, and the last-4 of the card on file (never the full
  // card number). onboarding_step is the setup wizard's saved progress:
  // the next step to complete (0-based), or 99 when setup is finished.
  plan: text("plan").notNull().default("trial"),
  // Stripe billing (owner-administered): the Stripe customer/subscription
  // ids once the live Stripe adapter is connected. In this prototype the
  // billing flow runs in Stripe test-mode shape — cards are collected the
  // way Stripe.js would tokenize them, only last-4/brand are stored here,
  // and no live charge is made.
  stripeCustomerId: text("stripe_customer_id").notNull().default(""),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().default(""),
  subscriptionStatus: text("subscription_status").notNull().default("trialing"),
  // Platform-owner adjustments (see platform_adjustments audit log):
  // comped = free membership granted by the platform owner (no
  // metering, no seat limits, no charges); allowance_override replaces
  // the plan's monthly registration-event allowance when set;
  // trial_bonus_events is a legacy reporting field from the retired
  // 2-free-events model — the Free plan is no longer event-limited;
  // billing_paused = charges paused by the platform owner.
  comped: integer("comped").notNull().default(0),
  allowanceOverride: integer("allowance_override"),
  trialBonusEvents: integer("trial_bonus_events").notNull().default(0),
  billingPaused: integer("billing_paused").notNull().default(0),
  // Payment failure handling: when a charge fails, the failure time is
  // recorded; the account gets a 1-week grace window, after which it is
  // FROZEN (never deleted): registration stays open but no approvals —
  // including trusted auto-approvals — are processed until the owner
  // repairs the payment, when held approvals are processed in a batch.
  paymentFailedAt: integer("payment_failed_at", { mode: "timestamp_ms" }),
  // Subscription cancellation lifecycle: cancelled_at = when the owner
  // cancelled; access_ends_at = end of the paid period (administration
  // stops then; events stay visible to attendees); purge_after =
  // access_ends_at + 30 days (the cooling-off window — the owner can
  // log in ONLY to reactivate; after it, all org data is deleted).
  // purge_reminders tracks which deletion reminders were emailed
  // ("2wk" two weeks after the end, "1wk" one week before deletion).
  cancelledAt: integer("cancelled_at", { mode: "timestamp_ms" }),
  accessEndsAt: integer("access_ends_at", { mode: "timestamp_ms" }),
  purgeAfter: integer("purge_after", { mode: "timestamp_ms" }),
  purgeReminders: text("purge_reminders").notNull().default(""),
  trialEndsAt: integer("trial_ends_at", { mode: "timestamp_ms" }),
  cardLast4: text("card_last4"),
  cardBrand: text("card_brand"),
  onboardingStep: integer("onboarding_step").notNull().default(99),
  // Progressive disclosure: the advanced features the organization
  // chose during onboarding (JSON array of feature keys — questions,
  // approvers, greeters, team, branding, plan, reminders, messaging,
  // reports, ai, hosting, embeds, imports, zoom, registrar). Core
  // features (events, registration, approvals basics, passes, door
  // check-in) always work; advanced surfaces stay hidden until the
  // organization asks for them here or in Admin → More options. An
  // owner/admin can change this at any time.
  features: text("features").notNull().default("[]"),
  // Beta program: 1 when the organization has opted in to seeing
  // beta features. The platform owner designates which features are
  // beta (app_settings "beta_features": [{key,label,status}]) and
  // can override enrollment per organization (app_settings
  // "beta_override_<orgId>" = "in" | "out"). A feature that
  // graduates to "released" becomes generally available to everyone.
  betaOptIn: integer("beta_opt_in").notNull().default(0),
  // Optional advanced security: restrict STAFF roles (owner, admin,
  // registrant — and greeters too when staff_domain_include_greeters
  // is on) to accounts whose email domain is on the allowed list
  // (comma/space separated domains). Off by default. Attendees are
  // never affected — registration does not consult these fields.
  staffDomainRestriction: integer("staff_domain_restriction").notNull().default(0),
  // Send-as: the organization's default authorized sender
  // (org_senders.id, verified only); null = mail comes from
  // Approved Guest. Events can override with their own sender_id.
  defaultSenderId: integer("default_sender_id"),
  staffAllowedDomains: text("staff_allowed_domains").notNull().default(""),
  staffDomainIncludeGreeters: integer("staff_domain_include_greeters").notNull().default(1),
  calendarUrl: text("calendar_url").notNull().default(""), // iCal feed or events page for calendar import
  ownerGoogleId: text("owner_google_id").notNull().default(""),
  ownerEmail: text("owner_email").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .default(1)
    .references(() => organizations.id),
  title: text("title").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD, organization-local
  timeText: text("time_text").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull().default(""),
  // JSON array of email addresses that receive approval requests for this
  // event and can approve/deny from the email. Empty = fall back to the
  // authorized administrators' emails.
  approvalEmails: text("approval_emails").notNull().default("[]"),
  isSample: integer("is_sample").notNull().default(0), // 1 = the preloaded "try it out" sample event from onboarding
  // Event lifecycle: published (public, registerable), draft (admins
  // only, not yet public), cancelled (shown as cancelled, closed).
  status: text("status", { enum: ["published", "draft", "cancelled"] }).notNull().default("published"),
  // Visibility: public events appear on the public calendar, the
  // embed, the calendar feed, and attendee search. A HIDDEN event is
  // none of those — it does not display anywhere public and is not
  // searchable; the only way in is the event's direct URL, which the
  // organization sends to its invitees. Once reached through that
  // link, registration, approval, and check-in work exactly as usual.
  // Visibility: public = anyone can find and register; hidden = not
  // listed or searchable, direct URL only; private = only people who
  // have attended this organization before can find and register —
  // unless they hold the event's invite link (invite_token), which
  // acts as an invitation overriding the past-attendee rule and can
  // be revoked/regenerated by an admin at any time.
  visibility: text("visibility", { enum: ["public", "hidden", "private"] }).notNull().default("public"),
  inviteToken: text("invite_token"),
  // Send-as: the authorized sender address chosen for this event
  // (org_senders.id, must be verified); null = use the organization's
  // default sender, or Approved Guest when none is set.
  senderId: integer("sender_id"),
  // Per-event invitation template (CSV invitations and invite sends):
  // the organization writes the subject and message; event details
  // are inserted automatically through placeholders at send time.
  inviteSubject: text("invite_subject").notNull().default(""),
  inviteBody: text("invite_body").notNull().default(""),
  // Platform guidelines enforcement: when an event's title /
  // description / location amounts to something illegal, dangerous,
  // or otherwise against the platform guidelines, guideline_flag
  // names the guideline it violates and guideline_reason explains
  // why. A flagged event cannot be published — it is held as a draft
  // and listed in the admins' guideline review queue until the
  // content is fixed (re-screened on save) or an admin reviews it and
  // clears the flag. "" = not flagged.
  guidelineFlag: text("guideline_flag").notNull().default(""),
  guidelineReason: text("guideline_reason").notNull().default(""),
  // Attendance alerts (per event): alert the organization when the
  // event is nearly full (alert_full_pct of capacity) or poorly
  // attended as it approaches (fewer than alert_low_count registered
  // with alert_low_days days to go). Channel: email | text | both.
  alertsEnabled: integer("alerts_enabled").notNull().default(1),
  alertFullPct: integer("alert_full_pct").notNull().default(80),
  alertLowCount: integer("alert_low_count").notNull().default(10),
  alertLowDays: integer("alert_low_days").notNull().default(3),
  alertChannel: text("alert_channel").notNull().default("email"),
  // Per-event Auto approve: when on, registrations are confirmed
  // immediately (pass + calendar invite, no approver step). Trusted
  // participants behave the same on events where it is off.
  autoApprove: integer("auto_approve").notNull().default(0),
  // Produce entry code: when on, every confirmed registration for this
  // event also gets a short numeric ENTRY code (registrations.entry_code)
  // the attendee can quote / type at the door as an alternative to the
  // QR pass. Off (the default): no entry code is produced at all and
  // entry works by QR pass and greeter check-in exactly as before.
  produceEntryCode: integer("produce_entry_code").notNull().default(0),
  // Walk-in registration at the door: when on, a greeter (or admin) on
  // the check-in screen can register someone who showed up on site —
  // name, email, optional phone — created immediately and decided by
  // the event's normal rules (auto-approve / trusted → confirmed with
  // a pass; otherwise sent for approval). Off (the default): no
  // walk-in registration for this event.
  walkInRegistration: integer("walk_in_registration").notNull().default(0),
  // Recurring series: occurrences are individual event rows (each one
  // manageable on its own — edit, cancel, registrations) that share a
  // series_id when they belong to one repeating series. "" = one-off.
  seriesId: text("series_id").notNull().default(""),
  // Registration metering: only events with registration enabled count
  // toward the plan's monthly registration-event allowance. An event
  // with registration_enabled = 0 is a plain calendar listing — it
  // never counts and cannot be registered for.
  registrationEnabled: integer("registration_enabled").notNull().default(1),
  // Optional event-specific logo: overrides the organization logo on
  // this event's pages and passes when set.
  logoUrl: text("logo_url").notNull().default(""),
  logoBlobKey: text("logo_blob_key").notNull().default(""),
  // Capacity & waitlist: maximum headcount (null = no limit). When the
  // event is full, new registrations join the waitlist instead; when a
  // seat frees up the next waitlisted person gets a time-limited offer.
  capacity: integer("capacity"),
  // Standard event structure (every event, everywhere it appears):
  // location is physical (with a maps link) or virtual (with an
  // optional join link); an optional registration deadline closes
  // registration after that date; an optional event contact (name +
  // phone) is shown wherever the event is presented.
  locationType: text("location_type", { enum: ["physical", "virtual"] }).notNull().default("physical"),
  virtualLink: text("virtual_link").notNull().default(""),
  // Location-bound greeter check-in (physical events only): the venue's
  // coordinates and the radius (meters) a greeter's device must be
  // within to check anyone in. location_check = 'required' enforces it
  // whenever venue coordinates are set; 'off' disables it. Virtual
  // events have no greeter and no check-in at all — confirmed attendees
  // join through the event's virtual_link instead.
  venueLat: real("venue_lat"),
  venueLng: real("venue_lng"),
  checkinRadiusM: integer("checkin_radius_m").notNull().default(300),
  locationCheck: text("location_check", { enum: ["required", "off"] }).notNull().default("required"),
  // Attendee arrival pop-up (geofence): when enabled, a confirmed
  // attendee who opted in gets their QR pass popped up when their
  // phone comes within geofence_radius_m of the venue — but only
  // inside the event-time window (geofence_before_mins before the
  // start through geofence_after_mins after). The same pin, radius,
  // and window are written into wallet passes as the relevant
  // location/date (Apple Wallet locations + relevantDate, Google
  // Wallet locations + valid time interval) so the wallet itself
  // can surface the pass on the lock screen near the venue.
  geofenceEnabled: integer("geofence_enabled").notNull().default(1),
  geofenceRadiusM: integer("geofence_radius_m").notNull().default(400),
  geofenceBeforeMins: integer("geofence_before_mins").notNull().default(180),
  geofenceAfterMins: integer("geofence_after_mins").notNull().default(120),
  registrationDeadline: text("registration_deadline"), // YYYY-MM-DD, organization-local; null = no deadline
  contactName: text("contact_name").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  // Automatic reminders: a reminder the day before the event (on by
  // default) plus an optional second reminder N days before.
  reminderDayBefore: integer("reminder_day_before").notNull().default(1),
  reminderSecondDays: integer("reminder_second_days"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  // Soft delete: deleting an event stamps deleted_at (and deleted_by,
  // the admin/owner who deleted it) instead of removing the row. A
  // soft-deleted event is hidden from calendars, the calendar feed,
  // search, and registration, and its registrations stop verifying —
  // but the event, its questions, and its registrations are kept so an
  // admin/owner can restore them whole. Only after the 30-day
  // retention window (EVENT_DELETE_RETENTION_MS in actions.ts) is the
  // data permanently purged by the scheduled purge. null = live event.
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  deletedBy: text("deleted_by").notNull().default(""),
}, (t) => [uniqueIndex("events_title_date_idx").on(t.title, t.date)]);

/* ---------- Custom registration questions ----------
   Admins define the questions per organization (event_id null) and may
   override them per event. Types: text (free text), choice (single choice
   from options), yesno. legacy_key links the original fixed questions to
   their dedicated columns for backward compatibility. */
export const customQuestions = sqliteTable("custom_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id").references(() => events.id), // null = organization-wide default
  label: text("label").notNull(),
  helpText: text("help_text").notNull().default(""),
  type: text("type", { enum: ["text", "choice", "yesno", "radio", "checkboxes"] }).notNull(),
  options: text("options").notNull().default("[]"), // JSON array, for type=choice
  required: integer("required").notNull().default(1), // 1 = required, 0 = optional
  sortOrder: integer("sort_order").notNull().default(0),
  legacyKey: text("legacy_key").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const registrations = sqliteTable("registrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  // Personal data columns (name, email, phone, faith_affiliation,
  // hear_about, custom_answers) are stored AES-256-GCM-encrypted — see
  // server/src/privileged.ts; the key never lives in this database.
  // email_hash is an HMAC blind index of the normalized email so lookups
  // by email work without decrypting or storing the address in the clear.
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailHash: text("email_hash"),
  // Group linkage + pass sharing: all registrations from one group
  // submission share a group_id. With code_sharing = 'shared', approvals
  // issue ONE code for the whole group (stored on each approved member's
  // row); attendance and revocation still work per person.
  // How the attendee wants approvals, passes, and notifications:
  // email, text message (SMS), or both. SMS goes to the phone number.
  notifyChannel: text("notify_channel", { enum: ["email", "text", "both"] }).notNull().default("email"),
  // Attendee-chosen reminder times (JSON array of "1d" | "3h" | "1h"):
  // when the attendee wants their reminders, delivered on their
  // notify_channel. Empty array = the defaults (the event's day-before
  // reminder, plus the event's optional second reminder). Chosen at
  // registration; editable later from My Events / their pass.
  reminderChoices: text("reminder_choices").notNull().default("[]"),
  groupId: text("group_id"),
  codeSharing: text("code_sharing").notNull().default("individual"),
  // Group contact: when a group submission chooses "send everything to
  // me", every registration in the group carries the submitter's email
  // here — approval emails and QR passes for the whole group go to this
  // address, while each attendee keeps their own email, approval, and
  // pass code. Stored encrypted + blind-indexed like the email itself.
  contactEmail: text("contact_email"),
  contactEmailHash: text("contact_email_hash"),
  phone: text("phone"),
  piiEncrypted: integer("pii_encrypted").notNull().default(0),
  googleId: text("google_id"),
  authProvider: text("auth_provider", { enum: ["google", "apple", "email", "manual"] })
    .notNull()
    .default("manual"),
  status: text("status", {
    enum: ["pending", "approved", "denied", "checked_in", "revoked", "waitlisted", "cancelled"],
  })
    .notNull()
    .default("pending"),
  // Undo support: the status this registration held immediately
  // before a cancellation/revocation, so the action can be reversed
  // (attendee undoing their own cancellation; admin undo). Null when
  // nothing reversible has happened.
  prevStatus: text("prev_status"),
  // Waitlist offer: when a seat opens, the next waitlisted person is
  // offered it — offered_at / expires_at (epoch ms) mark the
  // time-limited hold. The hold counts toward capacity until it
  // expires or is declined; accepting moves the person to pending
  // (normal approval) with the seat still held for them.
  waitlistOfferedAt: integer("waitlist_offered_at"),
  waitlistExpiresAt: integer("waitlist_expires_at"),
  code: text("code"), // unique pass credential, issued on approval
  // Entry code: a short numeric code issued on approval ONLY when the
  // event's produce_entry_code is on. The attendee can give it at the
  // door instead of showing the QR pass; greeters verify it through the
  // same door check as a pass code. Null whenever the event doesn't
  // produce entry codes, and cleared with the pass code on
  // revoke / cancel / deny.
  entryCode: text("entry_code"),
  decidedVia: text("decided_via"), // e.g. "Admin review" or "Email link · approver@example.org"
  // Who submitted this registration on the attendee's behalf (a registrant
  // or admin using the register-on-behalf flow). Null = self-registration.
  registeredByName: text("registered_by_name"),
  registeredByEmail: text("registered_by_email"),
  registeredByGoogleId: text("registered_by_google_id"),
  // Legacy fixed-question columns (the original three fixed questions; kept for
  // backward compatibility — new answers also live in custom_answers).
  faithAffiliation: text("faith_affiliation"),
  hearAbout: text("hear_about"),
  securityListOptIn: text("security_list_opt_in", { enum: ["yes", "no"] }),
  // JSON array of { questionId, label, type, answer } snapshots for the
  // organization's custom questions (stored encrypted, like the rest).
  customAnswers: text("custom_answers").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  // Content moderation: a registration whose name/email/answers were
  // flagged is HELD (held=1) — it never reaches approvers, notifications,
  // reports, or exports until an admin releases it from the moderation
  // queue (or rejects it). held_reason is admin-facing only.
  held: integer("held").notNull().default(0),
  heldReason: text("held_reason").notNull().default(""),
  decidedAt: integer("decided_at", { mode: "timestamp_ms" }),
  checkedInAt: integer("checked_in_at", { mode: "timestamp_ms" }),
  // Arrival pop-up opt-in (per registration): 1 = the attendee said
  // yes at the moment they got their pass, after the plain-language
  // explanation. The pass works identically when this is 0 — location
  // is never required. proximity_notified_at (epoch ms) is the last
  // time the device reported entering the event's geofence, so the
  // pop-up fires once per arrival instead of repeatedly.
  proximityOptIn: integer("proximity_opt_in").notNull().default(0),
  proximityNotifiedAt: integer("proximity_notified_at"),
  // Attendee's own arrival-notification radius for THIS registration
  // (meters; one of 100 / 250 / 500 / 1000). Null = use the event's
  // default radius (events.geofence_radius_m). Set from the standing
  // Preferences choice at registration, changeable per registration.
  proximityRadiusM: integer("proximity_radius_m"),
});

// One row per approver per registration: the approval-request "email" sent
// when someone registers. The token is the credential carried by the
// Approve / Not approved links in that email — whoever holds a live token
// can decide that registration without signing in. First decision wins:
// deciding marks every token for the registration used.
export const approvalRequests = sqliteTable("approval_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  registrationId: integer("registration_id")
    .notNull()
    .references(() => registrations.id),
  approverEmail: text("approver_email").notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  decision: text("decision", { enum: ["approved", "denied"] }),
});

export const authorizedGatekeepers = sqliteTable("authorized_gatekeepers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .default(1)
    .references(() => organizations.id),
  googleId: text("google_id").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const authorizedAdmins = sqliteTable("authorized_admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .default(1)
    .references(() => organizations.id),
  googleId: text("google_id").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  // User administration: the owner holds it by default and can grant
  // it per administrator (1) — only then may that admin manage
  // members, roles, invites, and removals. Owners always hold it.
  canManageUsers: integer("can_manage_users").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Trusted participants ----------
   Admins mark participants as trusted for their organization (by email
   and/or Google ID). When a trusted person registers, the registration is
   approved automatically and the QR pass is issued immediately — no
   approver step. The email is stored encrypted like all attendee PII,
   with the HMAC blind index (email_hash) used for matching at
   registration time. */
export const trustedParticipants = sqliteTable("trusted_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  email: text("email").notNull(), // AES-256-GCM encrypted
  emailHash: text("email_hash").notNull(),
  googleId: text("google_id").notNull().default(""),
  displayName: text("display_name").notNull().default(""),
  // Audit: who granted trusted status (the acting admin's login
  // email and login ID); created_at is when. Surfaced only when
  // audit details are switched on (see listTrustedParticipants).
  addedByEmail: text("added_by_email").notNull().default(""),
  addedByLoginId: text("added_by_login_id").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Event notifications log ----------
   One row per new-event notification an admin chose to send: which
   audience (trusted participants, the mailing/distribution list, or
   both), how many recipients it resolved to, and the subject used.
   Recipient addresses themselves are not stored here (they're attendee
   PII, resolved from the encrypted sources at send time). */
export const eventNotifications = sqliteTable("event_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  audience: text("audience", { enum: ["trusted", "mailing_list", "both", "subscribers", "invite"] }).notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  subject: text("subject").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Registrants (registrars) ----------
   People authorized to register OTHERS on their behalf for one
   organization. A registrant's on-behalf registrations behave exactly
   like self-registrations (approval flow, trusted auto-approval, pass)
   and record who submitted them. Admins can also register on behalf. */
export const authorizedRegistrants = sqliteTable("authorized_registrants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .default(1)
    .references(() => organizations.id),
  googleId: text("google_id").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Report schedules & deliveries ----------
   Admins can email a compiled report on demand and schedule recurring
   report updates (daily, weekly, or N days before the event) to chosen
   administrators — never to attendees or other roles. The last update
   goes out automatically the day after the event with final numbers.
   Deliveries are composed and logged (the prototype mail posture);
   recipients are validated as administrators of the organization. */
export const reportSchedules = sqliteTable("report_schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id").references(() => events.id), // null = whole-organization summary
  cadence: text("cadence", { enum: ["daily", "weekly", "days_before"] }).notNull(),
  daysBefore: integer("days_before"),
  recipients: text("recipients").notNull().default("[]"), // JSON array of administrator emails
  active: integer("active").notNull().default(1),
  lastSentAt: integer("last_sent_at", { mode: "timestamp_ms" }),
  milestoneSent: integer("milestone_sent").notNull().default(0), // the days-before update went out
  finalSent: integer("final_sent").notNull().default(0), // the day-after final update went out
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const reportDeliveries = sqliteTable("report_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id").references(() => events.id),
  scheduleId: integer("schedule_id").references(() => reportSchedules.id),
  kind: text("kind", { enum: ["manual", "scheduled", "final"] }).notNull(),
  recipients: text("recipients").notNull().default("[]"),
  subject: text("subject").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Billing invoices ----------
   One row per invoice line in the owner's billing section: trial
   invoices ($0), plan charges at trial end / plan change, and voids on
   cancellation. Amounts mirror the plan prices shown in the app. */
export const billingInvoices = sqliteTable("billing_invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  description: text("description").notNull().default(""),
  amountCents: integer("amount_cents").notNull().default(0),
  status: text("status", { enum: ["trial", "paid", "due", "void"] }).notNull().default("paid"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Attendee messages ----------
   One row per message an admin or registrar sent to an event's
   registrants (all of them, or a subset by status). The message goes
   out on each attendee's chosen channel (email / text / both) — the log
   keeps the audience, template, subject, body, sender, and recipient
   count for the per-event history; recipient addresses are not stored
   here (attendee PII lives, encrypted, on the registrations). */
export const attendeeMessages = sqliteTable("attendee_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  senderName: text("sender_name").notNull().default(""),
  senderEmail: text("sender_email").notNull().default(""),
  audience: text("audience", { enum: ["all", "approved", "not_checked_in", "checked_in", "pending"] }).notNull(),
  template: text("template", { enum: ["custom", "reminder", "time_change", "thank_you"] }).notNull().default("custom"),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull().default(""),
  recipientCount: integer("recipient_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Event message threads (attendee ↔ event team) ----------
   One row per message in a per-registration conversation about one
   event: an attendee writes from My Events (or by replying to the
   notification email), and the event's administrators / registrars
   read and reply in the app or from their notification email. The
   thread is anchored to ONE registration, so a conversation only ever
   involves that attendee — no other attendee's information is exposed.
   from_attendee: 1 = attendee → team, 0 = team → attendee. read_at
   (epoch ms) is when the receiving side read the message. Bodies are
   screened by content moderation before they are stored. */
export const eventMessages = sqliteTable("event_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  registrationId: integer("registration_id")
    .notNull()
    .references(() => registrations.id),
  fromAttendee: integer("from_attendee").notNull().default(1),
  senderName: text("sender_name").notNull().default(""),
  body: text("body").notNull().default(""),
  readAt: integer("read_at"), // epoch ms
  createdAt: integer("created_at").notNull(), // epoch ms
});

/* ---------- Event message reply tokens ----------
   One row per notification email sent about a thread: the Reply link in
   that email carries the token, which is the credential for replying
   from email (no sign-in needed) — the same pattern as approval links.
   side = who the email was sent TO ('staff' = an admin/registrar,
   'attendee' = the attendee / group contact). A token is scoped to one
   registration's thread, is single-use, and expires in 7 days; using it
   appends the reply to that thread only and issues the next
   notification (with a fresh token) to the other side. */
export const eventMessageTokens = sqliteTable("event_message_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  registrationId: integer("registration_id")
    .notNull()
    .references(() => registrations.id),
  messageId: integer("message_id")
    .notNull()
    .references(() => eventMessages.id),
  side: text("side", { enum: ["staff", "attendee"] }).notNull(),
  recipientEmail: text("recipient_email").notNull().default(""),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at").notNull(), // epoch ms
  usedAt: integer("used_at"), // epoch ms
  createdAt: integer("created_at").notNull(), // epoch ms
});

/* ---------- Event reminder runs ----------
   One row per automatic reminder run for an event: which reminder
   (the day-before one, or the configurable second one N days out),
   when it ran, and how many attendees it reached. Doubles as the
   dedupe ledger — a reminder kind is sent to an event at most once.
   The composed messages themselves are logged in attendee_messages
   (template "reminder", sender "Automatic reminder"). */
export const eventReminderRuns = sqliteTable("event_reminder_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  kind: text("kind", { enum: ["day_before", "second", "three_hours", "one_hour"] }).notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Event attachments ----------
   Files an admin attaches to an event (agenda, handout, map…). The
   bytes live in blob storage (blob_key); this table is the index.
   Access rule: only CONFIRMED registrants of the event (status
   approved / checked_in) — plus the organization's staff — may list
   or open them. Tentative, waitlisted, and not-approved registrants
   never see the files or their links. */
export const eventAttachments = sqliteTable("event_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  name: text("name").notNull(),
  blobKey: text("blob_key").notNull(),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Organization subscriptions (attendee new-event alerts) ----------
   An attendee subscribes to ONE organization to be notified when it
   posts new events. No account or membership is needed — just an email
   address. The address is stored AES-256-GCM-encrypted like all
   attendee PII, with the HMAC blind index (email_hash) used for
   subscribe/unsubscribe lookups and de-duplication (unique per org).
   When a published event is posted, subscribers are notified
   automatically and the send is logged in event_notifications with
   audience 'subscribers'. */
export const orgSubscriptions = sqliteTable("org_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  email: text("email").notNull(), // AES-256-GCM encrypted
  emailHash: text("email_hash").notNull(),
  displayName: text("display_name").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (t) => [uniqueIndex("org_subscriptions_org_email_idx").on(t.orgId, t.emailHash)]);

/* ---------- Cross-organization event shares (hosting) ----------
   When one organization hosts an event at another organization's
   facility, the HOST organization shares that one event with the
   FACILITY organization. Event details (name, date, time, location,
   expected attendance) always come with the share; the host then
   grants specific rights per event: view the attendee list, view
   check-in status, act as APPROVER (facility admins review and
   approve/deny the host's registrations for this event), and act as
   GREETER (facility greeters check guests in at the door for this
   event). The facility acts strictly as an extension of the host for
   the granted roles, for this event only — it sees nothing else of
   the host's, and the event counts toward the HOST's plan allowance,
   never the facility's. The host can change the grants or revoke the
   share (revoked_at set) at any time. */
export const eventShares = sqliteTable("event_shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hostOrgId: integer("host_org_id")
    .notNull()
    .references(() => organizations.id),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  facilityOrgId: integer("facility_org_id")
    .notNull()
    .references(() => organizations.id),
  shareAttendees: integer("share_attendees").notNull().default(0), // facility can view the attendee list
  shareCheckins: integer("share_checkins").notNull().default(0), // facility can view check-in status
  grantApprover: integer("grant_approver").notNull().default(0), // facility admins can approve/deny for this event
  grantGreeter: integer("grant_greeter").notNull().default(0), // facility greeters can check in for this event
  createdByEmail: text("created_by_email").notNull().default(""),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (t) => [uniqueIndex("event_shares_host_event_facility_idx").on(t.hostOrgId, t.eventId, t.facilityOrgId)]);

/* ---------- Event cancellation notices ----------
   When an organization cancels or deletes an event, every registered
   attendee gets one of these: the cancellation notice (and the
   calendar-cancellation the client generates from it). The org
   chooses the mode: "announcement" carries the org's own message
   with the notice; "quiet" is the plain cancellation notice only.
   The row snapshots the event title/date and the attendee's email
   (encrypted + blind-indexed like all attendee PII) so the notice
   still reaches the attendee in My Events even when the event — and
   their registration — was deleted. Composed and logged in-app per
   the prototype mail posture. */
export const eventNotices = sqliteTable("event_notices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(),
  eventId: integer("event_id").notNull(),
  eventTitle: text("event_title").notNull().default(""),
  eventDate: text("event_date").notNull().default(""),
  registrationId: integer("registration_id"),
  email: text("email").notNull().default(""), // AES-256-GCM encrypted
  emailHash: text("email_hash"),
  mode: text("mode", { enum: ["announcement", "quiet"] }).notNull().default("quiet"),
  message: text("message").notNull().default(""),
  eventDeleted: integer("event_deleted").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/* ---------- Service health & incidents ----------
   Every health probe (the public getHealth endpoint and the
   scheduled monitor) records one row: whether the app and database
   answered and how long it took. The platform console status view
   reads these for uptime and response times. An incident opens when
   the service is down for more than 5 minutes (or persistently
   slow): opening one records the automatic restart request and
   switches on the visitor-facing maintenance mode until a probe
   succeeds again. */
export const healthChecks = sqliteTable("health_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkedAt: integer("checked_at").notNull(),
  ok: integer("ok").notNull().default(1),
  dbOk: integer("db_ok").notNull().default(1),
  responseMs: integer("response_ms").notNull().default(0),
  note: text("note").notNull().default(""),
});

/* ---------- Release notes ("What's new") ----------
   Written by the platform owner when publishing a version; read by
   everyone in the app. Each entry carries its new features,
   enhancements, and fixes as plain text (one item per line). */
export const releaseNotes = sqliteTable("release_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  version: text("version").notNull().default(""),
  title: text("title").notNull().default(""),
  features: text("features").notNull().default(""),
  enhancements: text("enhancements").notNull().default(""),
  fixes: text("fixes").notNull().default(""),
  publishedAt: integer("published_at").notNull(),
  createdBy: text("created_by").notNull().default(""),
});

/* ---------- Attendee groups, announcement opt-ins, announcements ----------
   Organizations group attendees (by event, interest, role — the
   group name is free-form) to target communications; a person can be
   in many groups. Announcement opt-ins are per organization and per
   attendee email: chosen at registration, changeable later by the
   attendee under Preferences, and NEVER overwritten by a later
   registration (first recorded choice stands until the attendee
   changes it). Announcements go out on each attendee's OWN chosen
   channel (their registration notifyChannel: email, text, or both)
   and are logged here. Emails are AES-256-GCM encrypted with the
   blind index for lookup, like all attendee PII. */
export const attendeeGroups = sqliteTable("attendee_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const attendeeGroupMembers = sqliteTable("attendee_group_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => attendeeGroups.id),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  email: text("email").notNull().default(""), // AES-256-GCM encrypted
  emailHash: text("email_hash"),
  displayName: text("display_name").notNull().default(""),
  // Audit: when this membership was created (created_at) and who
  // added it — the acting admin's login email and login ID. Surfaced
  // only when audit details are switched on (see getAnnouncementCenter).
  addedByEmail: text("added_by_email").notNull().default(""),
  addedByLoginId: text("added_by_login_id").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

/* ---------- Organization membership audit log ----------
   One row per membership change in an organization: a person added
   to or removed from the owners / administrators / greeters /
   registrants lists — which is also how role changes happen, since
   each role is its own list. Records when it happened and who did
   it (the acting admin's login email and login ID), plus the source
   (direct admin action, accepted invitation, or onboarding).
   Viewable by the organization's owners and admins only. Member
   emails/names are stored the same way the role lists store them. */
export const orgMembershipAudit = sqliteTable("org_membership_audit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  memberEmail: text("member_email").notNull().default(""),
  memberName: text("member_name").notNull().default(""),
  memberLoginId: text("member_login_id").notNull().default(""),
  role: text("role").notNull().default(""), // owner | admin | gatekeeper | registrant
  action: text("action").notNull().default(""), // added | removed
  source: text("source").notNull().default("direct"), // direct | invitation | onboarding
  actorEmail: text("actor_email").notNull().default(""),
  actorLoginId: text("actor_login_id").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

/* ---------- Support tickets (AI help escalation) ----------
   When the in-app AI help can't answer with high confidence, the
   question becomes a support ticket instead of a guess: the asker,
   the screen they were on, and what they already tried are captured
   with it. The support team (platform owner) replies from the
   platform console; replies reach the asker in the app and on their
   preferred channel (recorded on the ticket). */
export const supportTickets = sqliteTable("support_tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id"),
  askerEmail: text("asker_email").notNull().default(""),
  askerName: text("asker_name").notNull().default(""),
  askerLoginId: text("asker_login_id").notNull().default(""),
  question: text("question").notNull().default(""),
  contextScreen: text("context_screen").notNull().default(""),
  contextTried: text("context_tried").notNull().default(""),
  channel: text("channel", { enum: ["email", "text", "both"] }).notNull().default("email"),
  status: text("status", { enum: ["open", "answered", "closed"] }).notNull().default("open"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const supportMessages = sqliteTable("support_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id),
  sender: text("sender", { enum: ["user", "support"] }).notNull().default("user"),
  body: text("body").notNull().default(""),
  byEmail: text("by_email").notNull().default(""),
  deliveredVia: text("delivered_via").notNull().default(""), // for support replies: the asker's preferred channel the reply was sent on
  createdAt: integer("created_at").notNull(),
});

/* ---------- Attendance alerts log ----------
   One row per attendance alert fired for an event (nearly full /
   low attendance), with the dedupe key that prevents repeats for
   the same threshold state. */
export const attendanceAlertsLog = sqliteTable("attendance_alerts_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(),
  eventId: integer("event_id").notNull(),
  kind: text("kind").notNull().default(""), // nearly_full | low_attendance
  detail: text("detail").notNull().default(""),
  channel: text("channel").notNull().default("email"),
  recipientCount: integer("recipient_count").notNull().default(0),
  dedupeKey: text("dedupe_key").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

/* Deletion-reminder emails sent after a subscription ends: one two
   weeks after the end date, one a week before the deletion date.
   Each entry is the composed email (prototype mail posture: composed,
   logged, and shown to the owner in-app) with the days remaining,
   the reactivate-to-keep-everything message, and the export note. */
export const subscriptionReminderLog = sqliteTable("subscription_reminder_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(),
  kind: text("kind").notNull().default(""), // two_weeks | final_week
  detail: text("detail").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

/* CSV / list invitations for one event: one row per person invited.
   Email is AES-256-GCM encrypted with a blind index for matching
   against registrations (who already registered). subject/message
   snapshot the rendered invitation that went to this person, built
   from the event's invitation template with details inserted. */
export const eventInvitations = sqliteTable("event_invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""), // AES-256-GCM encrypted
  emailHash: text("email_hash"),
  phone: text("phone").notNull().default(""),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull().default(""),
  createdBy: text("created_by").notNull().default(""),
  fromLabel: text("from_label").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

/* Send-as sender addresses: a person at the organization (registrar,
   office manager, anyone) authorizes the app to send mail as them.
   Authorization is verified — the address starts "pending" and only
   becomes usable when the person confirms through the confirmation
   link sent to that address (or connects their mailbox). Until an
   org picks a verified sender, mail comes from Approved Guest, and
   every composed message is labeled with who it is from. */
export const orgSenders = sqliteTable("org_senders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(),
  email: text("email").notNull().default(""),
  displayName: text("display_name").notNull().default(""),
  status: text("status", { enum: ["pending", "verified"] }).notNull().default("pending"),
    token: text("token").notNull().default(""),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp_ms" }),
  createdBy: text("created_by").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
});

export const announcementOptins = sqliteTable("announcement_optins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  email: text("email").notNull().default(""), // AES-256-GCM encrypted
  emailHash: text("email_hash"),
  displayName: text("display_name").notNull().default(""),
  optedIn: integer("opted_in").notNull().default(1),
  updatedAt: integer("updated_at").notNull(),
});

/* The attendee's standing answer to the arrival pop-up question ("Do
   you want this confirmation to appear when you arrive?"), per
   organization and email — mirroring announcement_optins. Recorded
   when they answer at registration completion (or change it later via
   My Events / Preferences); the stored answer pre-fills the question
   on later registrations and is applied to new registrations as their
   proximity_opt_in starting value. No row = never answered = default
   NO, and no location permission is ever requested. */
export const arrivalPopupPreferences = sqliteTable("arrival_popup_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  email: text("email").notNull().default(""), // AES-256-GCM encrypted
  emailHash: text("email_hash"),
  displayName: text("display_name").notNull().default(""),
  enabled: integer("enabled").notNull().default(0),
  // Attendee's standing arrival-notification radius (meters; one of
  // 100 / 250 / 500 / 1000). Null = no personal choice — each event's
  // own default radius applies. Applied to new registrations as
  // their proximity_radius_m starting value.
  radiusM: integer("radius_m"),
  updatedAt: integer("updated_at").notNull(),
});

export const orgAnnouncements = sqliteTable("org_announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull().default(""),
  audience: text("audience").notNull().default(""),
  recipientCount: integer("recipient_count").notNull().default(0),
  byChannel: text("by_channel").notNull().default("{}"),
  createdAt: integer("created_at").notNull(),
  createdBy: text("created_by").notNull().default(""),
  fromLabel: text("from_label").notNull().default(""),
});

export const serviceIncidents = sqliteTable("service_incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["outage", "slow"] }).notNull().default("outage"),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
  detail: text("detail").notNull().default(""),
  restartRequestedAt: integer("restart_requested_at"),
  smsSent: integer("sms_sent").notNull().default(0),
  smsError: text("sms_error").notNull().default(""),
});

/* ---------- Platform owners & adjustment audit log ----------
   Platform owners run the PRODUCT (Approved Guest itself) — a role
   completely separate from organization owners/admins. Only a
   platform owner can see the platform console: every customer
   organization with its usage and finances, plus account-management
   adjustments (comps, plan/allowance changes, billing extensions and
   pauses, credits). Every adjustment records who did it, why (a
   required reason), and what changed, in platform_adjustments. */
export const platformOwners = sqliteTable("platform_owners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  googleId: text("google_id").notNull().default(""),
  email: text("email").notNull(),
  displayName: text("display_name").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const platformAdjustments = sqliteTable("platform_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  kind: text("kind", { enum: ["comp", "uncomp", "plan_change", "allowance_change", "extend_trial", "extend_billing", "pause_billing", "resume_billing", "credit"] }).notNull(),
  details: text("details").notNull().default(""), // human-readable summary of what changed
  amountCents: integer("amount_cents"), // for credits
  reason: text("reason").notNull(),
  actorEmail: text("actor_email").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Role invites ----------
   Role assignment (administrator / gatekeeper / registrant) happens by
   invitation only: an admin enters a name + email and picks the role,
   which creates an invite with a token link. Opening the link lets the
   person create their account — set a password, or sign in with Google
   or Apple — and THAT step binds their identity to the role. Nobody is
   added to a role by typing an ID directly. */
/* ---------- Organization owners ----------
   The owner is whoever created the organization (and owns its
   subscription/billing). There can be more than one owner. Owners have
   all administrator rights, plus the things admins cannot do: change
   billing/subscription, invite or remove other owners, and remove an
   owner from the administrators list. */
export const organizationOwners = sqliteTable("organization_owners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  googleId: text("google_id").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const roleInvites = sqliteTable("role_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  role: text("role", { enum: ["admin", "gatekeeper", "registrant", "owner"] }).notNull(),
  roles: text("roles").notNull().default("[]"), // JSON array of role names — an invite can grant several roles at once
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
  acceptedIdentity: text("accepted_identity"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Password accounts ----------
   Accounts created by setting a password (via a role invite). The
   email is stored AES-256-GCM encrypted with the blind index for
   lookup; the password is stored only as a PBKDF2-SHA256 hash with a
   per-account random salt. A password account's identity id is
   "email:<address>" — the same identity an email-code sign-in yields,
   so both methods link to the same person and roles. */
export const passwordAccounts = sqliteTable("password_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(), // AES-256-GCM encrypted
  emailHash: text("email_hash").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const captchaChallenges = sqliteTable("captcha_challenges", {
  id: text("id").primaryKey(),
  answer: text("answer").notNull(),
  expiresAt: integer("expires_at").notNull(), // epoch ms
  createdAt: integer("created_at").notNull(), // epoch ms
});

/* ---------- Email sign-in codes ----------
   One row per outstanding 6-digit email sign-in code, keyed by the HMAC
   blind index of the address; only the SHA-256 hash of the code is
   stored. Codes expire in 30 minutes. A code is consumed by MARKING
   used_at — and only AFTER every completion step of the sign-in has
   succeeded; a failed attempt never burns the code. A consumed code
   stays replayable for a short window (see verifyEmailSignInCode):
   re-entering the same code after a lost response or a double submit
   simply completes the same sign-in again instead of erroring. */
export const emailSigninCodes = sqliteTable("email_signin_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  emailHash: text("email_hash").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at").notNull(), // epoch ms
  createdAt: integer("created_at").notNull(), // epoch ms
  usedAt: integer("used_at"), // epoch ms; null until the sign-in completes
});

/* ---------- Email address verification ----------
   One row per email address that has been sent a verification (magic)
   link or verified. Verification is per ADDRESS, global across
   organizations: once an address is verified, future registrations with
   it skip re-validation. The address itself is stored AES-256-GCM
   encrypted like all attendee PII, keyed by the blind index. */
export const emailVerifications = sqliteTable("email_verifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(), // AES-256-GCM encrypted
  emailHash: text("email_hash").notNull().unique(),
  token: text("token"),
  tokenExpiresAt: integer("token_expires_at"), // epoch ms
  verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------- Passkeys (WebAuthn) ----------
   A passkey credential for one account. ONLY the public key is ever
   stored (the SPKI DER encoding, base64url) — the private key never
   leaves the person's device / platform keychain, and there is no
   password or shared secret in this table to steal. identity_id is
   the unified sign-in identity the credential signs in as (the same
   id a Google / Apple / email sign-in produces for that person —
   e.g. "email:<address>" or the Google sub), so a passkey added to
   an existing account signs straight into that account and its
   per-organization roles, which are always checked server-side.
   email is stored AES-256-GCM-encrypted with the blind index, like
   all account PII. */
export const passkeyCredentials = sqliteTable("passkey_credentials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  credentialId: text("credential_id").notNull().unique(), // base64url credential id from the authenticator
  identityId: text("identity_id").notNull(),
  email: text("email").notNull(), // AES-256-GCM encrypted
  emailHash: text("email_hash").notNull(),
  publicKeySpki: text("public_key_spki").notNull(), // base64url SPKI DER — PUBLIC key only
  publicKeyAlgorithm: integer("public_key_algorithm").notNull().default(-7), // COSE alg (-7 = ES256)
  counter: integer("counter").notNull().default(0),
  transports: text("transports").notNull().default("[]"), // JSON array
  label: text("label").notNull().default(""),
  createdAt: integer("created_at").notNull(), // epoch ms
  lastUsedAt: integer("last_used_at"), // epoch ms
});

/* One row per outstanding WebAuthn ceremony: the server-generated
   challenge (32 random bytes, base64url) is the thing the
   authenticator signs / attests over. Single-use, 5-minute expiry.
   purpose: "register" (creating a credential, bound to the account
   being extended) or "auth" (signing in / re-authenticating). */
export const passkeyChallenges = sqliteTable("passkey_challenges", {
  id: text("id").primaryKey(),
  challenge: text("challenge").notNull(),
  purpose: text("purpose", { enum: ["register", "auth"] }).notNull(),
  emailHash: text("email_hash"),
  identityId: text("identity_id"),
  rpId: text("rp_id").notNull().default(""),
  expiresAt: integer("expires_at").notNull(), // epoch ms
  createdAt: integer("created_at").notNull(), // epoch ms
  usedAt: integer("used_at"), // epoch ms
});

/* ---------- Auth sessions (freshness for sensitive actions) ----------
   Every VERIFIED sign-in (Google ID token, Apple ID token, email
   code, password, or passkey assertion — each verified server-side)
   mints one session: only the SHA-256 hash of the token is stored.
   A session is FRESH for 10 minutes (fresh_until) and valid for 12
   hours. Sensitive actions (approvals, revocations, exports,
   billing, user administration, door-mode settings) require a fresh
   session when the account has one: the server re-checks the token
   against the identity on every such call — client-side role or
   freshness claims are never trusted on their own. */
export const authSessions = sqliteTable("auth_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenHash: text("token_hash").notNull().unique(),
  identityId: text("identity_id").notNull(),
  email: text("email").notNull(), // AES-256-GCM encrypted
  emailHash: text("email_hash").notNull(),
  method: text("method", { enum: ["google", "apple", "email", "password", "passkey", "simulated"] }).notNull(),
  createdAt: integer("created_at").notNull(), // epoch ms
  freshUntil: integer("fresh_until").notNull(), // epoch ms
  expiresAt: integer("expires_at").notNull(), // epoch ms
  revokedAt: integer("revoked_at"), // epoch ms
});

/* ---------- Attendee flags (blacklist / alert) ----------
   An organization admin can flag any attendee FOR THAT ORGANIZATION
   ONLY, matched by email blind index (the same key trusted
   participants use). Two kinds:
   • "blacklist" — registration is refused outright with a plain
     message (the flag itself is never mentioned to the attendee),
     and the person's existing registrations in this organization are
     held for review (registrations.held) until an admin resolves
     them or the flag is removed / downgraded.
   • "alert" — the person is highlighted for extra review: their
     registrations always go through the approver queue (never
     auto-approved, even when trusted or on an auto-approve event)
     and are marked for admins in the attendee list and the approval
     queue.
   The email is stored AES-256-GCM encrypted like all attendee PII,
   with the HMAC blind index (email_hash) used for matching. The
   reason and the flagging admin are admin-facing only — flag status
   is never exposed on any attendee-facing surface. */
export const attendeeFlags = sqliteTable("attendee_flags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  email: text("email").notNull(), // AES-256-GCM encrypted
  emailHash: text("email_hash").notNull(),
  displayName: text("display_name").notNull().default(""),
  flagType: text("flag_type", { enum: ["blacklist", "alert"] }).notNull().default("alert"),
  reason: text("reason").notNull().default(""),
  // Audit: who set the current flag (the acting admin's login email
  // and login ID); created_at is when the flag was first set.
  flaggedByEmail: text("flagged_by_email").notNull().default(""),
  flaggedByLoginId: text("flagged_by_login_id").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* One row per flag change — the flag audit trail: who flagged (or
   edited / removed the flag on) whom, when, which kind, and why.
   Rows survive flag removal so the history stays complete after the
   flag itself is gone. Email stored encrypted, like attendee_flags. */
export const attendeeFlagHistory = sqliteTable("attendee_flag_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  flagId: integer("flag_id"), // the attendee_flags row, when it still exists
  email: text("email").notNull(), // AES-256-GCM encrypted
  emailHash: text("email_hash").notNull(),
  displayName: text("display_name").notNull().default(""),
  flagType: text("flag_type", { enum: ["blacklist", "alert"] }).notNull().default("alert"),
  action: text("action", { enum: ["flagged", "updated", "removed"] }).notNull().default("flagged"),
  reason: text("reason").notNull().default(""),
  actorEmail: text("actor_email").notNull().default(""),
  actorLoginId: text("actor_login_id").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
