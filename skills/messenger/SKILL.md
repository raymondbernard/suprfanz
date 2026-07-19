---
name: "messenger"
description: "Automates Facebook Messenger outreach via Playwright with Chrome debug port, Lexical editor typing, CSV tracking, and duplicate prevention."
user-invocable: true
---

# Messenger — Updated 2026-07-18 (Throttle Detection)

## Purpose

Automates sending personalized Facebook Messenger messages using Playwright with Chrome debug port. 30 varied message templates. JPEG screenshots at each step. Continue button detection. Conversation-only already-sent check. **Post-send delivery verification with throttle detection.**

---

# CRITICAL: Facebook Throttling — "Couldn't Send"

## The Problem
Facebook rate-limits Messenger message sending. When throttled, pressing Enter appears to work but the message shows **"Couldn't send"** in the conversation and **"Message failed to send"** in the sidebar. The script CANNOT blindly mark as SENT after pressing Enter.

## Verification Loop (After Pressing Enter)

```javascript
// Poll for up to 10 seconds after pressing Enter
let sendResult = 'UNKNOWN';
for (let wait = 0; wait < 10; wait++) {
    await page.waitForTimeout(1000);
    const mainText = await page.locator('[role="main"]').first().evaluate(el => el.innerText).catch(() => '');
    
    // FAILURE indicators
    if (mainText.match(/couldn't send|failed to send|unable to send|couldn't deliver|not delivered|message not sent/i)) {
        sendResult = 'FAILED';
        break;
    }
    
    // Red error icons / resend buttons
    const errorElements = await page.locator('[role="main"] [aria-label*="error" i], [role="main"] [aria-label*="failed" i], [role="main"] [aria-label*="resend" i], [role="main"] [aria-label*="retry" i], [role="main"] [aria-label*="Could not" i]').count();
    if (errorElements > 0) {
        sendResult = 'FAILED';
        break;
    }
    
    // SUCCESS — our event link appears in conversation
    if (mainText.includes('971902445574502')) {
        sendResult = 'SENT';
        break;
    }
}

// If UNKNOWN after 10s — mark as UNCONFIRMED (not SENT)
if (sendResult === 'UNKNOWN') sendResult = 'UNCONFIRMED';
```

## Result Handling in Python

```python
# ONLY 'sent' and 'already' mark as sent in CSV
if result == 'sent':
    update_csv(c['pid'], True)        # Mark as sent
elif result == 'already':
    update_csv(c['pid'], True)        # Already had event link
elif result == 'failed':
    update_csv(c['pid'], False, 'couldnt_send')  # DO NOT mark as sent
elif result == 'unconfirmed':
    update_csv(c['pid'], False, 'unconfirmed')  # DO NOT mark as sent
elif result == 'bad':
    update_csv(c['pid'], False, 'bad')           # Bad profile
```

## Throttling Recovery Strategy
- When `FAILED` (couldn't send): Facebook is throttling. Stop the batch.
- Wait at least 1-2 hours before retrying.
- Consider reducing batch size (5-10 at a time).
- If multiple consecutive FAILED results, abort the entire batch.
- Do NOT mark throttled messages as sent — they were never delivered.

---

# CRITICAL: Continue Button Detection

Facebook shows a "Continue" button on conversations not recently opened (E2E encryption prompt). Without clicking it, the textbox is NOT visible.

## Fix — Use :has-text() Selector (3 attempts, 1.5s gaps)

```javascript
for (let attempt = 0; attempt < 3; attempt++) {
    const btn = page.locator('div[role="button"]:has-text("Continue"), button:has-text("Continue")');
    const count = await btn.count();
    for (let i = 0; i < count; i++) {
        if (await btn.nth(i).isVisible().catch(() => false)) {
            await btn.nth(i).click();
            await page.waitForTimeout(2000);
            break;
        }
    }
    await page.waitForTimeout(1500);
}
```

---

# CRITICAL: Already-Sent Detection — Check ONLY Conversation Area

## The Bug
Checking `document.body.innerText` causes FALSE "already sent" because the sidebar chat list shows preview text from ALL conversations.

## Fix — Check Only [role="main"]

```javascript
const msgArea = page.locator('[role="main"]');
const msgText = await msgArea.first().evaluate(el => el.innerText).catch(() => '');
if (msgText.includes('971902445574502')) {
    // Actually already sent to THIS contact
}
```

---

# CRITICAL: Screenshots — JPEG Not PNG

Messenger pages have heavy fonts. PNG screenshots timeout (30s+). Use JPEG:

```javascript
await page.screenshot({ path: 'shot.jpg', type: 'jpeg', quality: 40 });
```

---

# CRITICAL: Typing into Lexical Editor

```javascript
const textbox = page.locator('div[role="textbox"]').first();
await textbox.click();
await page.waitForTimeout(300);
await page.keyboard.type(message, { delay: 5 });
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
```

`page.keyboard.type()` is the ONLY reliable method. 5ms delay per character.

---

# CRITICAL: CSV Writing — Handle Empty Fieldnames

```python
fnames = [fn for fn in reader.fieldnames if fn and fn.strip()]
w = csv.DictWriter(f, fieldnames=fnames, extrasaction='ignore')
```

---

# Chrome Debug Port Setup

Same as before — kill Chrome, clean locks, launch via PowerShell Start-Process, wait for port 9222.

---

# Workflow (Per Contact)

1. Navigate to `https://www.messenger.com/t/{profile_id}`
2. Wait 2s
3. BEFORE screenshot (JPEG q40)
4. Check for Continue button (3 attempts, 1.5s gaps, :has-text("Continue"))
5. If Continue clicked → continue screenshot
6. Wait for textbox (7s timeout)
7. Check if already sent — ONLY check [role="main"] area
8. Type message via keyboard.type() (5ms delay)
9. TYPED screenshot
10. Press Enter
11. **VERIFY SEND — poll 10s checking for "Couldn't send" or event link in conversation**
12. AFTER screenshot
13. **Only mark as SENT if: event link appears in conversation AND no failure indicators**
14. If "Couldn't send" → mark as FAILED (NOT sent)
15. If unknown after 10s → mark as UNCONFIRMED (NOT sent)
16. Update CSV

---

# Message Templates

30 varied styles: personal, casual, exciting, fomo, warm, supportive, community, direct, curious, favor, nostalgic, musician, reconnect, invite, bluesfan. Each has 2 variations. Random selection per contact.

---

# Safety Rules

- **NEVER mark as sent unless delivery is confirmed** (event link visible in conversation)
- **Check for "Couldn't send" after EVERY send attempt**
- Save CSV after every send (immediately)
- JPEG screenshots only (PNG times out)
- Check only conversation area for already-sent (NOT sidebar)
- Continue button: use :has-text("Continue"), 3 attempts
- Keep Chrome open for entire batch
- 25s timeout per contact
- If 3+ consecutive FAILED results → abort batch (Facebook is throttling)
- Wait 1-2 hours after throttling before retrying
