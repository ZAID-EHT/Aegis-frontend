Section 1: Migration status

The migration file exists at `supabase/migrations/0007_team_chat.sql` and has NOT been applied.

Step 1: Open supabase.com, go to the project dashboard
Step 2: Click SQL Editor in the left sidebar
Step 3: Click New query
Step 4: Open supabase/migrations/0007_team_chat.sql from the local repo
Step 5: Copy the entire SQL content and paste it into the SQL editor
Step 6: Click Run
Step 7: Confirm it completes with no error
Step 8: Restart pnpm dev
Step 9: Sign in as judge.student and scroll to the bottom of the workspace
Step 10: The chat panel should now be active and accept messages

Section 2: RLS security summary

Students can only read and write to their own team's messages because the INSERT policy checks `team_members` using `auth.uid()`. Students cannot impersonate other senders because `sender_id` is forced to equal `auth.uid()`. Lecturers and admins can read all team messages but cannot post.

Section 3: Component locations

- `supabase/migrations/0007_team_chat.sql`: creates the `messages` table, RLS policies, and Realtime publication entry.
- `components/aegis/chat-panel.tsx`: reusable Supabase Realtime chat panel with student send mode and staff read-only mode.
- `components/student-workspace.tsx`: renders the student team chat panel below the main team card.
- `components/dashboard.tsx`: adds a collapsible read-only chat monitor to each team card.
- `components/auth/user-provider.tsx`: exposes the Supabase auth user id as `user.id` for RLS-backed chat inserts.

Section 4: Things to eyeball after applying the migration

- The empty state disappears when the first message is sent.
- Messages from the current user appear on the right.
- Messages from others appear on the left.
- A second browser tab sees new messages appear in real time without refresh.

Section 5: Known behavior before migration is applied

The chat panel renders but shows only the empty state. This is correct.
No errors should appear in the browser console from the chat component before the migration. The fetch fails silently and the subscription will not receive events because the table does not exist. If console errors appear from the chat component, check that the running browser bundle matches this commit.

Verification note: `pnpm run typecheck` passed, `/dashboard` and `/teams` served with auth redirects, and `POST /run` returned 71 students and 15 teams. The requested `GET /run` returned 405 because the current API exposes `/run` as POST.
