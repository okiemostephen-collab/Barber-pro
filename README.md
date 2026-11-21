# BarberPro

BarberPro is a mobile-friendly barber booking and grooming website built with HTML, CSS, JavaScript, Supabase and GitHub Pages.

**Live website:** https://okiemostephen-collab.github.io/Barber-pro/  
**Repository:** https://github.com/okiemostephen-collab/Barber-pro

## What the project does

- Presents haircut inspiration, grooming and haircare information.
- Lets registered customers book one of the currently bookable haircut services.
- Stores customer profiles and appointments in Supabase.
- Checks appointment-slot conflicts in the database.
- Calculates the service price and eligible loyalty discount on the server.
- Sends a booking notification email through a Supabase Edge Function and Resend.
- Provides customer appointment/profile pages and a barber dashboard.
- Includes a signed-in community for posts, comments and reviews.

## Technology

- **Frontend:** HTML, CSS and vanilla JavaScript.
- **Authentication and database:** Supabase Auth and PostgreSQL.
- **Server-side booking:** Supabase Edge Function named `barberpro-booking`.
- **Email:** Resend.
- **Hosting and source control:** GitHub Pages and GitHub.

## Main project structure

```text
/
├── index.html                 # Welcome and customer sign-in/sign-up
├── gallery.html               # Haircut inspiration collection
├── booking.html               # Appointment booking form
├── dashboard.html             # Customer/barber dashboard entry
├── appointments.html          # Customer appointments
├── profile.html               # Customer profile
├── community.html              # Community posts, comments and reviews
├── loyalty.html                # Loyalty information
├── haircare.html               # Haircare guide
├── hairline.html               # Hairline care guide
├── products.html               # Grooming product information
├── admin/
│   ├── admin-dashboard.html
│   └── admin.js
├── js/
│   ├── auth.js                  # Sign-in and account creation
│   ├── portal.js                # Shared signed-in customer setup
│   ├── booking.js               # Booking form and Edge Function request
│   ├── community.js              # Community interface
│   ├── service-prices.js         # Loads public service prices
│   ├── appointments.js
│   ├── dashboard.js
│   ├── profile.js
│   ├── loyalty.js
│   ├── navigation.js
│   └── guide.js
├── css/
│   └── ...                      # Page-specific styles
└── styles.css                   # Legacy/root stylesheet, if referenced
```

## Booking and price flow

1. A customer signs in through Supabase Auth.
2. The booking page sends the selected service, date and time to the `barberpro-booking` Edge Function with the customer's access token.
3. The Edge Function validates the session and derives the authenticated user ID.
4. The database booking function finds the linked customer profile and reads the current service price from `public.services`.
5. The database checks for a conflicting pending or confirmed appointment and calculates any eligible loyalty discount.
6. The appointment is saved in `public.appointments`; the Edge Function attempts to send an admin notification email.

**Important:** The database `services` table is the canonical source for bookable service prices. Do not rely on hard-coded browser prices for the amount charged. Update the database price and then verify the gallery and booking page display the same value.

Current canonical bookable services (verify in Supabase before changing):

| Service | Current database price |
|---|---:|
| Low Fade | ₦3,000 |
| Mid Fade | ₦3,500 |
| Burst Fade | ₦3,000 |
| Afro Shape-up | ₦2,500 |
| Waves & Line-up | ₦3,000 |
| Haircut + Beard | ₦3,500 |

Other haircut cards are inspiration-only until a service and price are deliberately added to the database and booking form.

## Community identity

Community posts, comments and reviews require a signed-in account. Database triggers derive the displayed author name from the matching `public.customers` profile using the authenticated user ID. Browser-submitted author names are not trusted. This verifies account ownership, not a person's government identity.

## Supabase database

Core tables include:

- `customers`
- `appointments`
- `services`
- `expenses`
- `community_posts`
- `community_comments`
- `community_reviews`

Row Level Security (RLS) is enabled on the public application tables. Keep RLS enabled and review policies whenever adding a table or changing data access.

The booking Edge Function uses the project endpoint:

`https://plokfuphzuyqtlbkjchp.supabase.co/functions/v1/barberpro-booking`

The frontend may contain the Supabase publishable key. **Never put the Supabase service-role key, Resend API key, or other server secrets in frontend files or this repository.** Keep server secrets in Supabase Edge Function secrets.

## Local development

1. Install a code editor such as Visual Studio Code (Notepad can also edit the files).
2. Download or clone this repository.
3. Open the project folder.
4. Run the site with a local static development server (for example, VS Code Live Server) rather than opening individual pages as `file://` URLs.
5. Confirm the Supabase project URL and publishable key in the frontend client configuration are the intended public values.
6. Do not paste private keys into source code, screenshots, issues or chat.

## Deployment

The site is published using GitHub Pages from the repository's configured branch/workflow. Changes pushed to the deployed branch trigger a Pages deployment. After each deployment:

- Check the GitHub Actions deployment result.
- Open the live website and hard-refresh the browser.
- Test sign-in, booking, appointment visibility and community actions with a test account.
- Confirm the booking appears in Supabase and the notification email is delivered.

## Operational notes and known limitations

- The current product is a single-shop implementation, not a multi-shop SaaS platform.
- Online payments/deposits, customer self-service cancellation/rescheduling, SMS reminders and multi-barber scheduling are not implemented.
- Admin booking emails depend on Resend configuration and a verified sending domain is recommended before public production use.
- Supabase Free plan leaked-password protection is currently deferred; enable it if/when the project plan supports it.
- Test the complete customer and barber journeys before using the system for real customer appointments.
- Review third-party image licensing and attribution before commercial use.
- Never use real customer personal data for test accounts.

## Safe maintenance checklist

- Back up/export important data before bulk database edits.
- Change service prices in Supabase and confirm the gallery and booking page match.
- Do not delete customers or appointments as part of routine cleanup.
- Keep RLS enabled; never solve access errors by exposing the service-role key.
- Test changes using a separate test account.
- Keep this README updated when routes, database tables, Edge Functions or setup steps change.
