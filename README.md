# camioneroApp

A trip and expense tracker for long haul truck drivers who get paid across borders in more than one currency.

Live app: https://v0-camionero-app.vercel.app

## The problem this solves

My father drives trucks between Argentina and Chile. Every month he came up short and could not say where the money went. He was carrying cash advances in Argentine pesos, spending in Chilean pesos and US dollars along the route, and settling everything at the end of the trip from memory and a handful of receipts.

Once the numbers were written down, the real problem showed up. His employer was converting the foreign currency at a rate well above the official one when settling the advances, so part of the loss was not spending at all. It was the exchange rate.

So the app is not really an expense tracker. It is a per trip ledger that keeps each currency separate, so the conversion is something you can see and audit instead of something that happens to you.

## What it does

Each trip is a container for a list of records. A record can be a general description, an origin and destination leg, kilometers driven, an incoming payment, an intermediate stop, a fuel purchase, or a miscellaneous expense. Money records carry their own currency.

On top of that, each trip stores:

- Cash advances received, each one with its own currency and amount.
- The exchange rates used for that trip, entered by hand.
- A running balance per currency, and a converted total in Argentine pesos.
- A PDF report generated on the device, so the driver can hand over something printed at settlement time.
- Optional backup to Google Drive or Dropbox over OAuth.

Trips can be closed, archived, restored, and permanently deleted.

## Engineering decisions worth explaining

**Money is never summed across currencies before it is converted.** The totals are computed per currency first (`calcularTotalesPorMoneda`) and only then converted to a single base currency (`convertirAMonedaBase`). Collapsing everything into pesos on entry would have been simpler, and it would have destroyed the exact information the app exists to preserve: what was actually received and spent in each currency, independent of anyone's conversion.

**Exchange rates are stored per trip, not globally.** A rate entered today should not silently rewrite a trip that closed three months ago. Freezing the rate inside the trip makes past reports reproducible, which matters when the whole point is disputing a settlement.

**Rates are entered by hand instead of pulled from an API.** This looks like a shortcut and it is a deliberate one. The rate that matters is not the official published rate, it is the rate the employer actually used and the rate available on the road, and neither of those comes from an endpoint. The user has the real number. The app should let them type it.

**No database and no authentication.** There is exactly one user on exactly one device. Adding accounts, a server, and a hosted database would have meant credentials to remember, an internet connection in places where there is none, and infrastructure to maintain, all to solve a multi user problem that does not exist here. Data lives in `localStorage` and durability is handled by the cloud backup instead.

**The backup runs over OAuth against Google Drive and Dropbox.** The authorization flow is handled server side in Next.js server actions (`app/actions/backup-actions.ts`) so the client secrets never reach the browser. The callbacks live in `app/api/auth/callback/[provider]/route.ts`.

**Data shape changes are migrated on read.** Cash advances started as a single number and later became an array of amounts with currencies. Rather than break existing trips, the trip loader detects the old shape and upgrades it in place. It is a small thing, but a stored format that already had real data in it could not simply be replaced.

**The interface is built for a phone in a truck cab.** Single column, constrained width, large touch targets, minimal typing. It is not a dashboard, and it was never meant to be viewed on a desktop.

## Stack

Next.js 15 with the App Router, React 19, TypeScript in strict mode, Tailwind CSS, Radix primitives via shadcn/ui, jsPDF for report generation, and Vercel for deployment. Google Drive API and Dropbox API for backup.

## Project layout

```
app/
  page.tsx                        trip list, archive and restore
  nuevo-viaje/                    trip creation
  viaje/[id]/                     trip detail, records, balances, PDF export
  backup/                         cloud backup configuration
  actions/backup-actions.ts       OAuth URL building and upload, server side
  api/auth/callback/google/       OAuth callback
  api/auth/callback/dropbox/      OAuth callback
components/
  registro-form.tsx               polymorphic form, one shape per record type
  cotizaciones-form.tsx           per trip exchange rate entry
lib/
  backup-service.ts               Google Drive and Dropbox client
  pdf-generator.ts                trip report
```

## Running it locally

```bash
npm install
npm run dev
```

The app runs without configuration. Cloud backup is the only feature that needs environment variables:

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DROPBOX_APP_KEY
DROPBOX_APP_SECRET
NEXTAUTH_URL
```

## Known limitations

I would rather list these than pretend they are not there.

- There are two backup paths, one client side in `lib/backup-service.ts` and one server side in `app/actions/backup-actions.ts`. The server side one is the correct one. The client side one should be removed.
- `lib/backup-service.ts` declares the Google and Dropbox globals as `any`. Those need real types.
- The record payloads are typed loosely. A discriminated union over the record type would catch a whole class of mistakes at compile time.
- There are no automated tests. The app has one user who reports bugs directly, which worked, but it is not a defensible reason on a project with more than one user.
- Storage is capped by whatever `localStorage` allows. Fine for one driver, not fine for a fleet.

## A note on how this was built

A large part of the code was generated with v0 and then reviewed, corrected, and extended by hand. I am saying so openly because it is how I work day to day, and because the interesting part of this project was never the typing.

The decisions above are mine: keeping the currencies separate, freezing the rate inside the trip, entering rates manually, staying off a database, migrating the stored shape instead of resetting it. Those came from watching someone use the thing and from understanding what the money was actually doing.


