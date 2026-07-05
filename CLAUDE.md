# DigitalFlyer SA, WhatsApp Onboarding, Build Spec

Author, DigitalFlyer SA. Internal build document, not client facing.

Status, Phase 1 only, ready to build. Phase 2 is listed at the end as out of scope, do not build.

## 1. What This Project Is

Replace the Google Form intake for DigitalFlyer's Done For You membership with a WhatsApp native flow. A person messages the DigitalFlyer WhatsApp number, gets a menu, and can be guided through the same information the Google Form currently collects, one question at a time, in chat. This includes the RE:Biz Nomads fork (webpage plus community).

No separate form, no separate link. One conversation, start to finish, ending in a human building the page.

There is no budget for this build. The approach below is chosen specifically to avoid ongoing platform fees.

## 2. Tech Stack

- Source control, GitHub.
- Hosting and webhook endpoint, Vercel serverless functions.
- Database, auth, storage, edge functions, Supabase.
- WhatsApp integration, Meta's Cloud API, connected directly, no third party Business Solution Provider (BSP).
- Payments, Paystack, for the Pay Now option alongside EFT. See Step 5, Payment, below.

This default stack fits this project. There is no long running background job, no websocket, no heavy compute. Every interaction is, message arrives, look up or update state in Supabase, send a reply, or a payment webhook arrives, update a record. That is a normal request and response cycle, which is what Vercel serverless functions are built for.

### WhatsApp number status

A WhatsApp Business number is already verified on Meta Business Suite, display name "DigitalFlyer SA", currently +1 555-782-5154. This number will be swapped once testing is complete and a permanent number is ready. Do not hardcode the phone_number_id anywhere in the codebase, store it as an environment variable so swapping the number later is a config change, not a code change. Sprint 1 does not need to redo number verification, that step is already done.

### Meta API note, read before building

This project touches the WhatsApp Cloud API. Meta changes this API often, including pricing, message categories, and webhook behavior. Before building the WhatsApp integration, check the current Meta for Developers changelog at developers.facebook.com/documentation/business-messaging/whatsapp/changelog, and the webhook and get started docs, since details below may have shifted since this spec was written.

What is confirmed as of this spec being written:

- The on premise WhatsApp Business API was deprecated in October 2025. Cloud API is the only supported path.
- Cloud API access itself has no monthly fee. Meta charges per delivered message for business initiated template messages (marketing, utility, authentication).
- Messages you send in reply to a customer, inside the 24 hour window after they message you, are free service conversation messages, no template required. This project is fully customer initiated, so the large majority of this flow should fall inside that free window.
- Integration is webhook based. Meta POSTs a JSON payload to your endpoint on incoming messages, delivery status changes, and account status changes. Your endpoint must return a 200 quickly, or Meta retries delivery with decreasing frequency for up to 7 days, which can produce duplicate webhook notifications your handler needs to tolerate.
- Setup requires a Meta Business Portfolio, a Meta app with the WhatsApp product added, a verified business phone number, and a permanent system user access token (not the short lived token issued by default).

### Paystack API note, read before building

Payment provider APIs also change, check Paystack's current developer docs at paystack.com/docs before building the payment step. What is confirmed as of this spec being written:

- Initialize a transaction from your own server (never the frontend or WhatsApp side directly) against the Initialize Transaction endpoint. The response includes an authorization_url, this is the link sent to the user in WhatsApp for Pay Now.
- Paystack sends a charge.success webhook event to a webhook URL you configure, on successful payment. Verify the x-paystack-signature header (HMAC SHA512 using your secret key) before trusting any webhook payload, since the webhook URL is public.
- Webhook handlers must return a 200 quickly. Paystack retries failed webhook deliveries, every 3 minutes for the first 4 tries, then hourly for 72 hours in live mode.
- Use the Verify Transaction endpoint as a fallback check, not just the webhook, in case a webhook delivery is missed. Always confirm the amount on a verified transaction matches what was expected before treating a payment as valid.

## 3. Team Interface, Seeing and Responding to Messages

This is answered directly, since it decides how the build team works day to day.

Given the direct Cloud API connection (no BSP) chosen for this project to avoid ongoing fees, the team does not get a native Meta inbox for this number. Meta's own multi agent inbox (WhatsApp Manager, Business Suite) is built for the WhatsApp Business App, not for a number run purely through the Cloud API. There is a Meta feature called Coexistence that lets the Business App and Cloud API share one number, but as of this spec being written it requires onboarding through a Meta-approved BSP, which reintroduces the monthly fee this project is trying to avoid, and comes with its own limits (the Business App must be opened at least every 14 days or the API connection drops, some app features are disabled). Given the no-budget constraint already set for this project, that trade is not worth it.

The recommended approach instead, build a small internal inbox screen as part of the same Supabase and Vercel stack already being used. This is not a separate product, it is one page, a list of leads with their conversation state and any handoff_flags, and a reply box that calls the same Graph API send-message endpoint the bot already uses. This keeps the team's ability to see and respond to messages inside the same free stack, with no added monthly cost.

If the team later decides multi agent routing, SLAs, or a full team inbox is worth paying for, that is a Phase 2 or later decision, not part of this build. Revisit Meta's Coexistence and any BSP options at that point, since both change often, this section should be re-verified before that future decision is made.

## 4. Roles

- End user, a prospective or existing DigitalFlyer member messaging from their own WhatsApp number.
- Build team, Dewald or an agent, who receives handoff notifications, confirms payments, and builds pages. Internal role, accesses Supabase directly or through an internal dashboard, not through WhatsApp.
- System, the webhook handler and state machine, no human in this role.

There is no self serve login for end users in Phase 1. The user's only interface is WhatsApp itself.

## 5. Conversation Flow

### Step 1, entry and main menu

User messages the DigitalFlyer WhatsApp number from any source, ad, Facebook post, referral. Bot greets and presents a numbered menu.

1. What is DigitalFlyer and how does it help my business?
2. Pricing and what's included.
3. Get started, build my page for me.
4. Talk to a real person.

Option 1, short explainer covering professional webpage, eCommerce, WhatsApp integration, booking, Google Maps listing, marketplace presence. Re-offer the menu, option 3 highlighted.

Option 2, pricing summary.

- DigitalFlyer membership, R1,199 per year, roughly R100 per month.
- Done For You setup, R1,599 once off.
- RE:Biz Nomads, Founding Nomad R750 per year, first 100 only, locked rate. Nomad Standard R1,500 per year, or R500 per quarter instalment.

Re-offer the menu, option 3 highlighted.

Option 4, escalate to a human, Dewald or an agent. This is flagged in the backend as a manual handoff, it is not a bot fallback, it does not loop back into the menu.

### Step 2, the fork, only after they say yes

Once the user selects get started, present RE:Biz Nomads as the lead recommendation, not a neutral A or B choice. This is a deliberate default, not a dark pattern, the user still gets a clear, easy way to choose the plain webpage instead, nothing is pre-selected or hidden.

Suggested copy direction, "Great, let's get your page built. Most new members join as RE:Biz Nomads, same professional webpage, plus the people, a community of other business owners, a Deal Room, WhatsApp group, and monthly founder sessions. Founding Nomad pricing is locked for the first 100 members and [X] spots are left." Then offer, "Join RE:Biz Nomads" as the first, highlighted option, with "Just the webpage, DigitalFlyer only" offered clearly as the second option, same size, same visibility, not hidden or buried.

This fork appears only after the user has committed to building a page, never before. The community sell lands on someone who already said yes to the platform, not on a first time visitor still deciding. The real, already true scarcity of the Founding Nomad cap is the only urgency device used here, nothing fabricated.

If RE:Biz Nomads is selected, ask which tier, Founding Nomad (if slots remain), Nomad Standard, or the R500 per quarter instalment option.

Founding Nomad slot tracking is automatic. Supabase holds a counter of Founding Nomad signups against the 100 slot cap. When a user reaches the tier question, the system checks the counter before offering that tier, and the live slots-remaining count used in the copy above comes from this same counter. If the cap is reached, the tier option is not shown, only Standard and the instalment option are offered.

### Step 3, guided intake

Business details only in this step, same fields as the Google Form, same order, one question per message. See section 6, Data Model, for the field list. DF username and password are not collected here, they move to Step 4.

This step is deliberately first, before registration and before payment. If the user drops off before registering or before paying, the business details captured here are enough to follow up with them directly. Nothing downstream of this step should block the record from being saved.

### Step 4, registration

Send the user a link to register on DigitalFlyer's own platform. Once they have registered and have an email and password, they reply in chat to confirm, and the system captures the DF username (email) and password.

DF username and password, this project intentionally collects both. The team needs to build the page directly on the user's own DF account, and only the user has access to it. This differs from a typical build recommendation, and is a deliberate, informed decision for this project, not an oversight, confirmed directly with the business owner. Handling is described under Data Model and Security below.

Open item, whether the DigitalFlyer registration platform can notify this system directly when registration completes (a callback or webhook), or whether the only signal available is the user typing their details back into chat. This spec assumes the chat reply is the only signal available, since no integration between the registration platform and this system is confirmed yet. If a callback becomes available later, this step can be automated further, that is a Phase 2 or later improvement, not required for this build.

### Step 5, payment

Two options are offered, EFT or Pay Now.

EFT, details sent in chat (Capitec Business). Reference is the business name. User sends proof of payment as an image or PDF in the same thread. Payment confirmation for EFT stays manual, the system's job is to route the proof of payment image to the build team, not to confirm payment itself. See section 3, Team Interface, and section 10, Confirmed Operational Decisions, for how this gets checked.

Pay Now, a Paystack payment link is generated and sent in chat once the user reaches this step. The user pays directly through that link. See the Paystack API note under Tech Stack for how the transaction is initialized and confirmed. When Paystack confirms payment (webhook, cross-checked against the Verify Transaction endpoint), payment_status is set to confirmed automatically, no manual step needed for this path. This is the one payment path in this project that can be fully automated without added cost, since it is a webhook call, not a monthly service.

Payment is the final step in the flow by design. Everything the team needs to follow up on a stalled or abandoned signup, business details and registration info, is already captured before this point.

### Step 6, confirmation and handoff

- Same day acknowledgement, WhatsApp and email.
- Page built and live within 24 hours of payment confirmation, this is a business side commitment, not something the system enforces.
- RE:Biz members additionally get the community introduction sequence, Facebook page intro, then WhatsApp community invite. Nobody joins silently, every member is personally introduced by the build team, this step is not automated in Phase 1.
- Last message in the onboarding flow is Facebook links to groups and pages to join and follow.

## 6. Data Model

Supabase tables, names are suggestions, adjust to fit existing conventions if any exist.

**leads**
- id
- whatsapp_number
- current_step (tracks where the user is in the flow, so the conversation can resume if they go quiet and come back)
- menu_selection
- fork_selection (DF only, or RE:Biz Nomads)
- tier_selection (Founding Nomad, Standard, quarterly instalment), RE:Biz only
- how_heard
- full_name
- business_name
- email
- province
- industry
- business_address (or "Online")
- business_description
- tagline
- products_services
- facebook_link
- instagram_link
- existing_website
- df_username
- df_password_encrypted, encrypted at rest, never logged in plain text, access restricted to the build team role only, purged from the record once the build team confirms the page is live and the password has been changed
- registration_confirmed (boolean), set once the user replies in chat confirming they have registered
- additional_notes
- payment_method (EFT, or Paystack Pay Now)
- payment_status (not_started, pending, confirmed)
- paystack_reference, the transaction reference returned by Paystack on initialization, used to verify and cross-check the webhook
- created_at, updated_at

**media_attachments**
- id
- lead_id (foreign key)
- type (logo, business image, proof of payment)
- storage_path (Supabase storage)
- uploaded_at

**founding_nomad_counter**
- single row or simple counter table
- slots_filled
- slots_total (100)

**handoff_flags**
- id
- lead_id (foreign key)
- reason (option 4 selected, bot could not answer, conversation stalled)
- created_at
- resolved (boolean)

## 7. Setup Checklist, Before Claude Code Starts

This is what needs to exist before Claude Code opens this project. None of this is something Claude Code should do for you, these are accounts, keys, and access that need a human logged in.

**1. GitHub**
- Create a new, private repository for this project. Private, since it will hold business logic and, indirectly through environment variables, access to production systems.
- Add whoever needs commit access, and give Claude Code access to this repository if it is working against it directly rather than a local clone.
- No need to pre-build folder structure or config, Claude Code will do that as part of Sprint 1.

**2. Supabase**
- Create a new Supabase project. Note the project URL, the anon key, and the service role key, the service role key is what the webhook backend uses, never expose it to any frontend or client-side code.
- Decide the project region, pick one close to where most users are, in this case likely a South Africa-adjacent or nearest supported region.
- No need to hand-build the schema, Claude Code builds the leads, media_attachments, founding_nomad_counter, and handoff_flags tables as part of Sprint 1, from section 6, Data Model, above.
- Create a storage bucket for media_attachments (logos, business images, proof of payment), private by default, not public.
- Decide who on the team gets a Supabase login with build-team-level access (this is the role that can see df_password_encrypted and other restricted fields).

**3. Vercel**
- Create a new Vercel project, linked to the GitHub repository above.
- Set up environment variables in the Vercel project settings, values come from Supabase, Meta, and Paystack setup below, see the consolidated list in step 6.
- Deploy once, even before any real logic exists, so there is a live HTTPS URL available. This matters because Meta's webhook configuration in step 4 needs a working URL to verify against, this is a genuine chicken-and-egg step, deploy a stub endpoint first, wire up Meta second.

**4. Meta, WhatsApp Cloud API**
- The business phone number is already verified (see WhatsApp number status under Tech Stack), so this step is about wiring the existing number to this codebase, not re-verifying it.
- In the Meta app associated with this WhatsApp Business Account, generate a permanent system user access token, not the short-lived token issued by default, since that expires quickly and would break the integration in production.
- Choose a webhook verify token, any string you control, this gets entered both in the Meta app's webhook configuration and as an environment variable, Meta uses it to confirm the webhook endpoint belongs to you.
- Once the Vercel stub endpoint from step 3 is live, configure the webhook URL in the Meta app dashboard and subscribe to the messages field at minimum.
- Re-check the current Meta for Developers changelog before doing this step, see the Meta API note under Tech Stack, this process can shift.

**5. Paystack**
- If not already done, get the test mode secret and public keys from the Paystack dashboard, live keys come later once testing is complete.
- Once the Vercel endpoint is live, add the webhook URL in the Paystack dashboard settings.
- Re-check the current Paystack docs before this step too, see the Paystack API note under Tech Stack.

**6. Environment variables, consolidated list**

These all need to exist in Vercel before Claude Code can run the project against real services, rather than local stubs.

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- META_WHATSAPP_TOKEN (the permanent system user token from step 4)
- META_PHONE_NUMBER_ID
- META_WEBHOOK_VERIFY_TOKEN
- META_APP_SECRET (used to verify incoming webhook payload signatures)
- PAYSTACK_SECRET_KEY
- PAYSTACK_PUBLIC_KEY
- ENCRYPTION_KEY (used to encrypt df_password_encrypted at rest, generate a fresh, random key for this, do not reuse a key from anywhere else)

**7. Before handing this to Claude Code**
- Confirm all of the above exists, GitHub repo, Supabase project and bucket, Vercel project deployed once with environment variables set, Meta webhook wired to the live Vercel URL, Paystack webhook wired to the same.
- Hand Claude Code this spec plus repository access. It should not need anything else to start Sprint 1.

## 8. Build Order, Sprints

**Sprint 1, foundation**
- Meta app, webhook subscription against the already-verified business number (see WhatsApp number status under Tech Stack, verification itself is already done).
- Vercel project, webhook endpoint that receives and logs incoming messages, responds with a 200.
- Supabase project, schema for leads, media_attachments, founding_nomad_counter, handoff_flags.
- Paystack account connected, test mode API keys in place.

**Sprint 2, menu and state machine**
- Greeting and main menu, options 1 to 4.
- State tracking so a user resuming a stalled conversation lands back where they left off.
- Option 4 handoff flag, written to handoff_flags, no bot fallback loop.

**Sprint 3, fork and guided intake**
- Fork logic, RE:Biz Nomads presented as the lead recommendation, DigitalFlyer only offered clearly alongside it, appearing only after get started is selected.
- Founding Nomad counter check before offering that tier, and before showing the live slots-remaining count in the fork copy.
- One question per message intake flow (business details only), writing each answer to the leads record as it comes in.

**Sprint 4, registration and internal inbox**
- Registration link message, chat-based capture of DF username and password once the user confirms they have registered.
- Encrypted storage for df_password_encrypted, access restricted to build team role, purge logic once the build team confirms the page is live and the password has been changed.
- Internal inbox screen (see section 3, Team Interface), list of leads plus a reply box using the same send-message endpoint.

**Sprint 5, media and payment**
- Image and PDF handling, download incoming media from WhatsApp, upload to Supabase storage, link to the correct lead record.
- EFT path, details message, proof of payment capture, payment_status set to pending, handoff notification to the build team.
- Pay Now path, Paystack transaction initialization, payment link sent in chat, webhook endpoint with signature verification, Verify Transaction cross-check, payment_status set to confirmed automatically on success.

**Sprint 6, confirmation and close out**
- Same day acknowledgement message.
- Final message with Facebook group and page links.
- Manual build team step to mark the page live once EFT payment is confirmed and the page is built. Not needed on the Pay Now path, where payment_status is already automated, only the page-live step there remains manual.

## 9. Out of Scope, Do Not Build

- Phase 2, automated renewal reminders, triggered before a member's annual or quarterly renewal date, reusing the payment step from Phase 1. Not urgent, scoped in the original brief, not part of this build.
- Any automated agent that builds the webpage itself. Phase 1 is entirely human built.
- Automated confirmation for the EFT path. EFT payment confirmation stays a manual step performed by the build team, only the Paystack Pay Now path is automated.
- Recurring or subscription billing through Paystack. This build covers a single once-off payment per signup, renewal billing is a Phase 2 item.
- Automated community introduction messages. The introduction sequence is personal and manual by design in Phase 1.
- Self serve DIY page building. Out of scope, this spec covers the Done For You path only.
- Any third party BSP (Twilio, 360dialog, WATI, Respond.io, or similar). This build connects to Meta's Cloud API directly.
- Multi tenant support, or support for any business other than DigitalFlyer SA and the RE:Biz Nomads fork.

## 10. Confirmed Operational Decisions

These were open questions in an earlier version of this spec, now confirmed.

- Payment confirmation turnaround, EFT proof of payment is checked hourly by the team through the internal inbox (section 3). Paystack Pay Now needs no manual check, the webhook plus Verify Transaction cross-check updates payment_status automatically, and Paystack also sends an automated confirmation email per transaction as a secondary record, outside this system.
- The Google Form is kept for now, running in parallel with this WhatsApp flow, for members who come through the old method. This build does not need to retire or migrate the form. If both paths are expected to land in the same Supabase leads table eventually, that mapping is a separate, explicit decision to make later, this spec does not merge them automatically.
