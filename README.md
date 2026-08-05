# School Connect Hub

I was recently thinking about our TSA project from the previous school year and I had an idea. You know how gradeway has become an all-in-one grades and schedule app that everybody uses across our district and beyond? I think it is possible for us to create an app that can act as an all-in-one club app that could be a massive success starting at our campus, and beyond. During my freshman year, I struggled to figure out when and where general and even private club meetings were taking place and it was very inconvenient for me to juggle three different apps, GroupMe, Remind, and SportsYou, just to figure out the details of where and what day I should go if I wanted to participate in a club or even a basketball team event. One of the clubs I was trying to join used WhatsApp() for their communication, which I was not allowed to download, preventing me all together from participating in club activities. Therefore, I think we should make "one club app to rule them all." We can first make a Proof of Concept website in order to see how successful this would be and then build an app if we succeed. For features, I think this app should be one that all clubs, sports teams, and even teachers for their tutorials without juggling any other apps. First, the app will be a way to show all clubs exclusively in the students' school. No getting offers to join random clubs at other schools. This will require school administrators to sign up their schools for the services of our app, but we will make this as quick and easy as possible and even give them options to style the app using the school brand(mascot and colors) for students of their school. After students using the app log in and maybe provide an access code unique to the school they attend, they will be able to start using the app. In the app, clubs can choose to be either private or public. Students will be able to add public clubs in their clubs at any time of their own will and the in app calendar will start to show all dates and times for the club's meetings. For private clubs, students will not be able to join on their own accord, but it will give them instructions that the club sponsor will set that will show them how to join the club and requirements to join. The club sponsor will be able to let them in the club from their end, and then the student will have the club in their my clubs tab. All clubs, regardless of being private or public, will be shown in the club search tab, because club gatekeeping is bad(). Next, we will probably model our chat features similar to that of GroupMe, and I don't have any ideas for any extra features we can add. Note, there are some features I will not talk about in this email, like how clubs can be added and sponsors can designate some students as leadership so they will also have some control over the club in the app, as we can talk about this later if you do agree. Finally, for sports teams, these teams will not be in the clubs tab. Instead, they will be able to give their players an access code that will allow them to join the team, adding the team to the my clubs tab, all events will be added to the calendar, and communication will be done through the communication tab. Finally, if we can, I think we should also add something that can help students find when their teacher's tutorials are more easily. Students can add their specific teachers to their "my teachers" in the app, but tutorial times will not show up on the main in app calendar because we want to avoid congestion. Instead, the student can click on the teacher to easily check tutorial times. We can have an easy set up for the teachers to set their tutorial times and an easy way to cancel a tutorial or add a tutorial for the week or permanently if something comes up that changes their schedule. Also, we can add a feature where club leaders can write articles or submit tickets to the newspaper team at their school to write an article regarding something in their club that they would like to share to the school, and these articles can be in a club news tab in our app, rather than in a school newspaper website because honestly, who reads those. So i got some insight from chat and I think we shud make this for our first feature:
User log in page (skl admin, teachers, students)
Join skl feature
Club directory 
Club joining
In app calendar 
For now we’re just going to have pre-set clubs and a pre-set skl and we will add the making a club and registering a skl later. We needa start simple first and then scale up make this first version

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://extracurricular-central.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/40f29dbe-850e-4171-a91a-bbb1d3e5ec68).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? Install [Bun](https://bun.com/docs/installation), then run:

```sh
git clone <this-repository-url>
cd <repository-name>
cp .env.example .env   # then put your email in CLUBHUB_OWNER_EMAILS
bun install --frozen-lockfile
bun run dev
```

Set `CLUBHUB_OWNER_EMAILS` before you sign up — it's what turns your account into
the owner console, and without it nobody can approve a school admin.

## How the backend works

Accounts, clubs, memberships, meetings, and announcements live server-side in
`src/server`, not in the browser.

- **Storage** — the whole database is one JSON document written through
  `src/server/storage.ts`. Production uses Upstash Redis. Local development uses
  `.data/clubhub.json` (override with `CLUBHUB_DATA_FILE`). A fresh database holds
  exactly one record: Frisco High School and its campus code. There are no seeded
  accounts, clubs, or meetings — everything students see was made by a real person.
- **Passwords** — hashed with PBKDF2-HMAC-SHA256, 210,000 iterations, a random
  16-byte salt per account, verified in constant time. Plaintext is never
  stored or logged. WebCrypto only, so the same code runs on Node and on edge
  runtimes.
- **Email confirmation** — every sign-up mails a six-digit code and the account
  can do nothing until it comes back: no campus, no club list, not even the owner
  console. Only the code's SHA-256 is stored. Codes expire in ten minutes, allow
  five attempts, and can't be resent more than once a minute. Changing your email
  address clears the flag and sends a new code.
- **Sessions** — a 256-bit random token in an HttpOnly, SameSite=Lax cookie
  (Secure in production). Only the SHA-256 of the token is stored, so a database
  dump can't be replayed as a login. Changing a password revokes every session,
  and declining a staff account signs it out immediately.
- **Authorization** — every mutation in `src/server/service.ts` re-derives the
  caller from the cookie and re-checks the rule. Teachers can only touch clubs
  they sponsor; only admins reassign sponsors, rotate the campus code, or
  approve staff. The browser never decides permissions.
- **Sign-in throttling** — 10 failed attempts per email in 15 minutes.

## Who can become what

Nobody grants themselves a role. Each tier is approved by the one above it:

| Role | How you get it | What it controls |
| --- | --- | --- |
| Student | Sign up + enter the campus code | Joining clubs, own calendar |
| Teacher | Sign up, then a **school admin** approves | The clubs they sponsor |
| School admin | Sign up, request a campus, then a **ClubHub owner** approves | The whole campus: access code, clubs, staff |
| ClubHub owner | Listed in `CLUBHUB_OWNER_EMAILS` | Approving admins, creating schools |

Everyone confirms their email address first, whatever the role.

`CLUBHUB_ADMIN_EMAILS` is a temporary shortcut past the request queue: an account
signing up with a listed address becomes an active admin of the default school
immediately. Use it to get a campus running before an owner is around, then clear
it — accounts already created keep their campus until an owner revokes them.

Owner is read from the environment on every request by `src/server/owners.ts` —
it is never stored in the database and has no sign-up path, so it can't be
reached by editing a record, replaying a session, or compromising an admin.
Signing up as a school admin creates a **pending** account with no school; it
lands in the owner console's request queue and stays powerless until approved.

### Setting up the first campus

1. Put your email in `CLUBHUB_OWNER_EMAILS` and restart the server.
2. Sign up with that email. You land on `/owner` instead of a campus.
3. Frisco High School already exists; use **Add a school** for any other campus.
   Each one gets a generated join code.
4. Share the campus code with students and staff.
5. When someone signs up as a school admin and requests the campus, approve them
   from the owner console. They can then approve teachers and rotate the code.

`src/lib/api.ts` is the RPC surface. Each handler reaches the service through a
dynamic import, so no server-only code can be pulled into the client bundle.

Delete `.data/clubhub.json` to reset the campus back to an empty Frisco High
School. Every account, club, and meeting is gone with it — there is no demo data
to fall back on.

## Deploying to Vercel

The Nitro build uses the Vercel preset, so SSR and TanStack server functions are
deployed as Vercel Functions. The backend also requires durable Upstash Redis
storage; the function's local project directory is not used as a production
database.

1. Open the Vercel project and go to **Storage**.
2. Add the **Upstash Redis** integration and connect it to this project.
3. Confirm Vercel created `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` for Production, Preview, and Development.
4. Redeploy the latest commit so the new environment variables are available.

5. Add `CLUBHUB_OWNER_EMAILS` to Production, Preview, and Development. Without it
   the deployment has no owner console and no admin can ever be approved.
6. Add `RESEND_API_KEY` and `CLUBHUB_FROM_EMAIL`, with the sender address or its
   domain verified in Resend. **Production refuses to fall back to console
   logging**, so without these nobody can finish signing up.

The optional `CLUBHUB_REDIS_KEY` variable changes the Redis key used for the
database. Keep the default unless multiple ClubHub installations share one Redis
database. Never expose the Upstash REST token to browser code or commit it.
