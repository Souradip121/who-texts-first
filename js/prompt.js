// Route A: the prompt people paste into ChatGPT, Gemini or Claude next to
// their exported chat. Keep it in sync with the README.

export const PROMPT = `Analyse the WhatsApp chat export I've attached and tell me who's putting in the effort.

READ THE WHOLE FILE
- It's a WhatsApp "Export chat" file: a .txt, or a .zip with _chat.txt inside.
- Use code (Python, code execution or the analysis tool) to parse every line. Don't estimate from a skim, and don't stop early on a long file. If you can't run code, say so, analyse the most recent 2,000 messages, and tell me that's what you did.
- Message lines start with a date and time, in one of these shapes:
  Android: 11/10/26, 9:41 pm - Name: message
  iPhone:  [11/10/26, 9:41:02 PM] Name: message
- The date can be day/month or month/day. Work it out from the data (a first number above 12 means day/month) and check the timestamps run forwards.
- Times can be 12-hour (am/pm, sometimes with a narrow space before it) or 24-hour. Ignore invisible characters like U+200E.
- A line that doesn't start with a date belongs to the message above it.
- Skip lines WhatsApp writes itself: the encryption notice, "joined", "added", "changed the subject", security codes, missed or voice calls, disappearing-message notices.
- "<Media omitted>", "image omitted" and "This message was deleted" count as messages for timing, but not as text.
- If there are more than two people, use the two who sent the most messages.

WORK OUT, FOR EACH PERSON
1. Median reply time: each time the sender changes, the gap between the other person's last message and this person's first message. Ignore gaps over 12 hours.
2. Chats started: a chat starts with the very first message and with any message after 6+ hours of silence. Give each person's share as a %.
3. Double texts: a message sent 20+ minutes after your own previous message, with no reply in between.
4. Dry replies: messages that are only "hmm", "hm", "ok", "okay", "k", "kk", "achha" or "oh", in any spelling with stretched letters, ignoring punctuation and emoji.
5. Messages after midnight: sent between 12:00 am and 4:59 am.
6. Total messages.

REPLY IN EXACTLY THIS FORMAT
A table with one row per metric and one column per person, using their names from the chat:

| | <name 1> | <name 2> |
|---|---|---|
| Median reply time | | |
| Starts chats | % | % |
| Double texts | | |
| Dry replies | | |
| After midnight | | |
| Messages | | |

Then one line: Verdict: a playful one-line verdict on who's putting in the effort, under 12 words, kind and funny, never mean.
Then one line with the date range you analysed.

Don't quote any messages and don't add anything else.`;
