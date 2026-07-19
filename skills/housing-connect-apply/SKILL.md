---
name: "housing-connect-apply"
description: "Automates NYC Housing Connect lottery applications via Playwright with Chrome debug port, AI screenshot analysis, self-correction, and post-submit verification."
user-invocable: true
---

# Housing Connect Apply — Updated 2026-07-18 (AI Self-Correction)

## Purpose

Automates NYC Housing Connect (housingconnect.nyc.gov) lottery applications using Playwright with Chrome debug port. Reads applicant profile from JSON, logs in, navigates to lottery listings, fills application forms, and tracks submissions in CSV. **Includes AI screenshot analysis at every step — pauses on errors, self-corrects, re-verifies, and never marks Applied without confirmation.**

---

# CRITICAL: AI Screenshot Analysis — Before & After Every Form Action

## The Pattern

Every form interaction follows this loop:

```
1. Take BEFORE screenshot (JPEG q40)
2. Perform action (fill field, click button, check box, etc.)
3. Take AFTER screenshot (JPEG q40)
4. AI ANALYZES the AFTER screenshot:
   - Are the field values correct?
   - Are there validation errors (red text, error icons)?
   - Is the expected next step visible?
   - Did the action actually work?
5. If ISSUE FOUND:
   a. Print ISSUE description
   b. PAUSE the script
   c. AI corrects the issue (re-fill field, re-click button, try alternate selector, etc.)
   d. Take CORRECTION screenshot (JPEG q40)
   e. AI re-analyzes — is the issue gone?
   f. If still broken → try next correction strategy
   g. If fixed → continue to next step
   h. If unfixable after 3 attempts → mark as ERROR, move to next lottery
6. If NO ISSUE → continue to next step
```

## Screenshot Naming Convention

```
housing/applications/screenshots/
├── {lottery_id}_{step}_before.jpg     ← Before action
├── {lottery_id}_{step}_after.jpg      ← After action
├── {lottery_id}_{step}_fix_N.jpg      ← After Nth correction attempt
└── {lottery_id}_final.jpg             ← Final state (confirmation or error)
```

Steps include: `login`, `navigate`, `apply_click`, `terms`, `household`, `income`, `preferences`, `units`, `review`, `submit`, `confirmation`

## JavaScript Implementation — Screenshot + Analysis Bridge

```javascript
// After every action, take screenshot and signal for AI analysis
async function actionWithAnalysis(page, stepName, actionFn, shotDir, lotteryId) {
    const prefix = `${shotDir}${lotteryId}_${stepName}`;
    
    // BEFORE screenshot
    await page.screenshot({ path: `${prefix}_before.jpg`, type: 'jpeg', quality: 40 }).catch(() => {});
    console.log(`SHOT: ${lotteryId}_${stepName}_before.jpg`);
    
    // Perform the action
    await actionFn();
    await page.waitForTimeout(1000);
    
    // AFTER screenshot
    await page.screenshot({ path: `${prefix}_after.jpg`, type: 'jpeg', quality: 40 }).catch(() => {});
    console.log(`SHOT: ${lotteryId}_${stepName}_after.jpg`);
    
    // Check for obvious errors on the page
    const pageText = await page.evaluate(() => document.body.innerText).catch(() => '');
    const errors = [];
    
    // Validation errors
    if (pageText.match(/required|must be|please enter|please select|invalid|error/i)) {
        const errorElements = await page.locator('.mat-error, .error, [role="alert"], .invalid-feedback, .alert-danger').count();
        if (errorElements > 0) {
            errors.push('VALIDATION_ERROR');
            // Extract error text for AI analysis
            const errorTexts = await page.locator('.mat-error, .error, [role="alert"], .invalid-feedback').allTextContents();
            console.log('ERRORS: ' + JSON.stringify(errorTexts));
        }
    }
    
    // Disabled submit button (indicates incomplete form)
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Continue")').first();
    if (await submitBtn.count() > 0) {
        const disabled = await submitBtn.isDisabled().catch(() => false);
        if (disabled) {
            errors.push('SUBMIT_DISABLED');
            console.log('ISSUE: Submit button is disabled — form may be incomplete');
        }
    }
    
    if (errors.length > 0) {
        console.log('ISSUES: ' + JSON.stringify(errors));
        console.log('PAUSE_FOR_CORRECTION');
        // Python side will pause, analyze screenshot, correct, and re-run
    } else {
        console.log('OK: no issues detected');
    }
    
    return errors.length === 0;
}
```

## Python Side — AI Analysis & Correction Loop

```python
def run_step_with_analysis(lottery_id, step_name, node_script, args):
    """
    Run a Node.js step, capture screenshots, analyze for issues.
    If issues found, pause → correct → re-verify.
    Returns True if step succeeded, False if unfixable.
    """
    max_correction_attempts = 3
    
    for attempt in range(max_correction_attempts + 1):
        result = subprocess.run(
            ['node', node_script] + args,
            capture_output=True, text=True,
            encoding='utf-8', errors='replace',
            timeout=60, cwd=str(messenger_dir)
        )
        output = result.stdout + result.stderr
        
        # Parse output for issues
        has_issue = 'PAUSE_FOR_CORRECTION' in output or 'ISSUES:' in output
        is_ok = 'OK: no issues' in output
        
        if is_ok and attempt == 0:
            # Perfect — no issues, continue
            return True
        
        if has_issue:
            print(f"  ⚠️  Issue detected at step '{step_name}' (attempt {attempt + 1})")
            
            # Extract error details
            for line in output.split('\n'):
                if 'ISSUES:' in line or 'ERRORS:' in line or 'ISSUE:' in line:
                    print(f"  → {line.strip()}")
            
            # Get the after screenshot for AI analysis
            after_shot = f"{shot_dir}{lottery_id}_{step_name}_after.jpg"
            
            if attempt < max_correction_attempts:
                # AI analyzes screenshot and determines correction
                correction = analyze_and_correct(after_shot, step_name, output, lottery_id)
                if correction:
                    print(f"  → Applying correction: {correction['description']}")
                    # Apply correction to the node script args or profile
                    args = correction['new_args']
                    # Re-run step
                    continue
                else:
                    print(f"  → Could not determine correction — marking as error")
                    return False
            else:
                print(f"  → Max correction attempts reached — marking as error")
                return False
        
        if is_ok and attempt > 0:
            # Issue was corrected!
            print(f"  ✅ Issue resolved after {attempt} correction(s)")
            return True
        
        # No issue and no OK signal — unknown state
        if not has_issue and not is_ok:
            print(f"  ❓ Unknown state — taking screenshot for analysis")
            return False
    
    return False
```

## AI Analysis Function (OpenClaw Agent Side)

When the Python script reports `PAUSE_FOR_CORRECTION`, the OpenClaw agent:

1. **Reads the AFTER screenshot** using the `image` tool
2. **Analyzes what it sees**:
   - Are form fields filled with correct values?
   - Are there red error messages or validation warnings?
   - Is a button disabled that shouldn't be?
   - Is the page showing an unexpected state?
   - Did a field get the wrong value from the profile?
3. **Determines the correction**:
   - Re-fill a field with the correct value
   - Check a missed checkbox
   - Wait longer for a dynamic element to load
   - Use an alternate selector
   - Scroll to reveal hidden required fields
4. **Applies the correction** by writing a new Node.js snippet
5. **Re-runs the step** and takes a new screenshot
6. **Re-analyzes** to confirm the fix worked
7. **If fixed** → continues to next step
8. **If still broken** → tries next correction strategy (up to 3 attempts)
9. **If unfixable** → marks lottery as ERROR, saves screenshots, moves to next

## Correction Strategies (In Order of Attempt)

1. **Re-fill the field** — value may not have been entered correctly (Lexical/Angular form state)
2. **Click + clear + re-fill** — old value may be stuck
3. **Alternate selector** — try `nth()`, `[formcontrolname]`, or `[name]` attributes
4. **Wait for element** — dynamic Angular component may not be ready
5. **Scroll into view** — field may be below the fold, Angular may not register it
6. **Check parent checkbox/radio** — a dependent field may need its parent selected first
7. **Dismiss modal/overlay** — a dialog may be blocking interaction

## What AI Analyzes at Each Step

| Step | Before Screenshot | After Screenshot | What AI Checks |
|---|---|---|---|
| Login | Login page loaded | Post-login page | Did login succeed? Error message? Captcha? |
| Navigate | Previous page | Lottery detail page | Is "Apply Now" visible? Is deadline passed? |
| Apply Click | Lottery detail | Application form / Terms | Did form load? Terms checkbox visible? |
| Terms | Terms page | Post-terms form | Did terms get accepted? Is Submit now enabled? |
| Household | Empty form | Filled household fields | Are names/DOB/SSN correct? Any validation errors? |
| Income | Previous step | Filled income fields | Is income amount correct? Sources selected? |
| Preferences | Previous step | Checked preference boxes | Are correct boxes checked? Any conflicts? |
| Units | Previous step | Selected unit types | Are eligible units selected? Income match? |
| Review | Previous step | Review summary | Does info match profile? Any highlighted errors? |
| Submit | Review page | Confirmation / Error page | Was submission confirmed? Application number? Errors? |

---

# CRITICAL: Post-Submit Verification — Never Mark Applied Without Confirmation

## Verification Loop (After Clicking Submit)

```javascript
// Poll for up to 15 seconds after clicking Submit
let submitResult = 'UNKNOWN';
for (let wait = 0; wait < 15; wait++) {
    await page.waitForTimeout(1000);
    try {
        const pageText = await page.evaluate(() => document.body.innerText).catch(() => '');
        
        // FAILURE indicators
        if (pageText.match(/error|failed|could not submit|please correct|validation|required field|session.*expired|please try again/i)) {
            const errorMessages = await page.locator('.error, .alert, [role="alert"], .mat-error, .invalid-feedback').count();
            if (errorMessages > 0) {
                submitResult = 'FAILED';
                console.log('FAIL_REASON: validation errors found');
                break;
            }
        }
        
        // SUCCESS indicators
        if (pageText.match(/application.*received|application.*submitted|confirmation|thank you|application number|your application has been/i)) {
            submitResult = 'SUBMITTED';
            const confirmNum = pageText.match(/application(?:\s*number)?[:\s]+([A-Z0-9\-]+)/i);
            if (confirmNum) console.log('CONFIRM_NUM: ' + confirmNum[1]);
            break;
        }
        
        // URL change to confirmation page
        if (page.url().includes('/confirmation') || page.url().includes('/dashboard') || page.url().includes('/receipt')) {
            submitResult = 'SUBMITTED';
            break;
        }
    } catch(e) {}
}

if (submitResult === 'UNKNOWN') submitResult = 'UNCONFIRMED';
```

## Result Handling

```python
# ONLY 'submitted' marks as Applied in CSV
if result == 'submitted':
    update_csv(lottery_id, 'Applied', confirm_num)
elif result == 'failed':
    update_csv(lottery_id, 'Error', 'validation_error')  # DO NOT mark as Applied
elif result == 'unconfirmed':
    update_csv(lottery_id, 'Unconfirmed', 'could_not_verify')  # DO NOT mark as Applied
```

**Never mark as "Applied" unless the page explicitly confirms it was received.**

---

# CRITICAL: Screenshot Format — JPEG Not PNG

```javascript
// CORRECT — fast, no font wait
await page.screenshot({ path: 'screenshot.jpg', type: 'jpeg', quality: 40 });

// WRONG — times out on Housing Connect (heavy Angular Material fonts)
await page.screenshot({ path: 'screenshot.png' });
```

---

# CRITICAL: Button Detection — Use :has-text() Selector

```javascript
// CORRECT — Playwright handles matching internally
const submitBtn = page.locator('button:has-text("Submit"), a:has-text("Submit")');
const applyLink = page.locator('a:has-text("Apply Now")').first();
const loginBtn = page.locator('button:has-text("Login")');
```

## Multi-Attempt Pattern for Security/Terms Prompts

```javascript
for (let attempt = 0; attempt < 5; attempt++) {
    const btn = page.locator('button:has-text("Continue"), button:has-text("Agree"), button:has-text("Accept")');
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

# CRITICAL: Subprocess Encoding (Windows)

```python
result = subprocess.run(
    ['node', str(temp_script)],
    capture_output=True, text=True,
    encoding='utf-8', errors='replace',
    timeout=60, cwd=str(messenger_dir)
)
```

---

# CRITICAL: CSV Writing — Handle Empty Fieldnames

```python
fnames = [fn for fn in reader.fieldnames if fn and fn.strip()]
w = csv.DictWriter(f, fieldnames=fnames, extrasaction='ignore')
```

---

# CRITICAL: Chrome Health Check Before Each Lottery

```python
def is_chrome_connected():
    try:
        urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=3)
        return True
    except:
        return False

if not is_chrome_connected():
    print("Chrome died — relaunching...")
    launch_chrome()
    time.sleep(10)
```

---

# CRITICAL: Abort After Consecutive Failures

```python
consecutive_failures = 0
MAX_CONSECUTIVE_FAILURES = 3

for lottery in lotteries:
    result = apply_to_lottery(lottery)
    if result in ('failed', 'unconfirmed', 'error'):
        consecutive_failures += 1
        if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
            print("ABORT: 3 consecutive failures — wait 1-2 hours")
            break
    elif result == 'submitted':
        consecutive_failures = 0
```

---

# CRITICAL: Chrome Debug Port Setup

## Step 1: Kill ALL Chrome Processes

```batch
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 5 /nobreak >nul
powershell -Command "Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 3 /nobreak >nul
```

## Step 2: Delete Lock Files

```batch
set "UD=%LOCALAPPDATA%\Google\Chrome\User Data"
set "P3=%UD%\Profile 3"
if exist "%P3%\LOCK" del /f /q "%P3%\LOCK" >nul 2>&1
if exist "%P3%\DevToolsActivePort" del /f /q "%P3%\DevToolsActivePort" >nul 2>&1
if exist "%P3%\Current Session" del /f /q "%P3%\Current Session" >nul 2>&1
if exist "%P3%\Current Tabs" del /f /q "%P3%\Current Tabs" >nul 2>&1
if exist "%UD%\SingletonLock" del /f /q "%UD%\SingletonLock" >nul 2>&1
if exist "%UD%\SingletonCookie" del /f /q "%UD%\SingletonCookie" >nul 2>&1
if exist "%UD%\SingletonSocket" del /f /q "%UD%\SingletonSocket" >nul 2>&1
```

## Step 3: Launch Chrome via PowerShell

```python
subprocess.Popen([
    'powershell', '-Command',
    f"Start-Process -FilePath '{CHROME_EXE}' -ArgumentList '{args_str}'"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
```

## Step 4: Wait for Debug Port

```python
for i in range(20):
    time.sleep(2)
    try:
        urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=2)
        break
    except:
        pass
```

**Use `http://127.0.0.1:9222` NOT `http://localhost:9222`.**

---

# CRITICAL: Playwright Module Resolution

Playwright is in `./outreach/messenger/node_modules/`. Set `cwd` to messenger dir:

```python
messenger_dir = Path.home() / '.openclaw' / 'workspace' / 'outreach' / 'messenger'
subprocess.run(['node', script_path], cwd=str(messenger_dir), ...)
```

---

# Site Architecture

| Page | URL | Notes |
|---|---|---|
| Landing | `housingconnect.nyc.gov/PublicWeb/` | Angular Material SPA |
| Lottery detail | `/PublicWeb/details/{lottery_id}` | Apply Now = `<a>` tag |
| Login | `a806-housingconnectapi.nyc.gov/id4/account/login` | IdentityServer4 |

## Login Selectors (VERIFIED)

| Field | Selector |
|---|---|
| Username | `#Username` |
| Password | `#Password` |
| Submit | `button:has-text("Login")` |

## Registration Selectors (VERIFIED)

| Field | Selector | Notes |
|---|---|---|
| Username | `#userNameControl` | nth(0) |
| Password | `#passwordControl` | |
| First Name | `#userNameControl` | nth(2) — ID reused! |
| Last Name | `#userNameControl` | nth(3) — ID reused! |
| Email | `#emailControl` | |
| Terms | `#mat-checkbox-1-input` | mat-checkbox |
| Submit | `button:has-text("Create my Account")` | |

## Lottery Detail

```javascript
const applyLink = page.locator('a:has-text("Apply Now")').first();
```

## Known Terms Page Issue
- Terms checkbox: `#mat-checkbox-1-input`
- Submit button was DISABLED after checking — may need scroll or Angular state update wait
- **AI screenshot analysis will catch this** and attempt corrections (scroll, wait, alternate click)

---

# Full Automation Flow (With AI Self-Correction)

```
1. Launch Chrome (debug port 9222)
2. AI ANALYSIS: Login step
   a. BEFORE screenshot → fill login → AFTER screenshot
   b. AI checks: did login succeed? captcha? error?
   c. If issue → pause, correct, re-verify
3. For each lottery where status == "Not Applied":
   a. Check Chrome health
   b. AI ANALYSIS: Navigate step
      - BEFORE → navigate to lottery detail → AFTER
      - AI checks: Apply Now visible? Deadline passed? 
   c. AI ANALYSIS: Apply Click step
      - BEFORE → click Apply Now → AFTER
      - AI checks: form loaded? terms visible?
   d. AI ANALYSIS: Terms step
      - BEFORE → check terms box → AFTER
      - AI checks: Submit enabled? Error? Need scroll?
      - If Submit disabled → try scroll, wait, alternate click
   e. AI ANALYSIS: Household step
      - BEFORE → fill name/DOB/SSN/address → AFTER
      - AI checks: values correct? validation errors?
   f. AI ANALYSIS: Income step
      - BEFORE → fill income → AFTER
      - AI checks: amount correct? sources selected?
   g. AI ANALYSIS: Preferences step
      - BEFORE → check boxes → AFTER
      - AI checks: correct boxes? conflicts?
   h. AI ANALYSIS: Units step
      - BEFORE → select units → AFTER
      - AI checks: eligible units? income match?
   i. AI ANALYSIS: Review step
      - BEFORE → review summary → AFTER
      - AI checks: info matches profile? highlighted errors?
   j. PAUSE — user reviews, presses ENTER to confirm
   k. AI ANALYSIS: Submit step
      - BEFORE → click Submit → AFTER
      - AI checks: confirmation? application number? error?
   l. VERIFY SUBMISSION — 15s poll for confirmation
   m. FINAL screenshot
   n. Update CSV: only "Applied" if SUBMITTED confirmed
   o. Wait 30-60s
   p. Abort after 3 consecutive failures
4. Batch complete — show summary
```

---

# Applicant Profile (JSON)

```json
{
  "account": { "email": "", "password": "" },
  "primary_applicant": {
    "first_name": "", "last_name": "", "middle_initial": "",
    "dob": "YYYY-MM-DD", "ssn": "XXX-XX-XXXX",
    "phone": "(XXX) XXX-XXXX", "email": "",
    "address": "", "apt": "", "city": "New York", "state": "NY",
    "zip": "", "borough": "", "community_board": ""
  },
  "household": [],
  "income": { "annual_income": 0, "sources": [], "employment": [] },
  "preferences": {
    "community_board": true, "nycha_resident": false,
    "senior_62": false, "municipal_employee": false,
    "mobility_assist": false, "vision_hearing": false
  },
  "eligibility": {
    "ami_tiers": ["ELI", "VLI", "LI"],
    "max_rent": 0, "unit_types": ["studio", "1BR"]
  }
}
```

---

# Resume Capability

1. Read application-tracker.csv
2. Skip rows where `application_status != 'Not Applied'`
3. Continue from next unapplied lottery
4. To re-apply: set status back to `Not Applied`

---

# Safety Rules

- **NEVER mark as "Applied" unless submission is confirmed** by the page
- **AI analyzes BEFORE and AFTER screenshots at every form step**
- **Script PAUSES when AI detects an issue** — corrects, re-verifies, then continues
- **Max 3 correction attempts** per step before marking as error
- Save CSV after every submission (immediately)
- JPEG screenshots only (q40) — PNG times out
- Use `:has-text()` selectors — don't manually match text
- Keep Chrome open for entire batch
- Check Chrome health before each lottery
- User reviews every application before final submit
- Abort after 3 consecutive failures
- Wait 1-2 hours after abort
- Never submit without user confirmation (ENTER key press)
- Capture application/confirmation number
- `encoding='utf-8', errors='replace'` on subprocess calls
- Filter empty fieldnames in CSV
- **Save all learnings from corrections back to this skill**

---

# Anti-Bot Considerations

- Housing Connect uses IdentityServer4 with possible captcha
- Use `--disable-blink-features=AutomationControlled` flag
- Random delays between applications (30-60 seconds)
- Type with human-like delays (20-30ms per character)
- Max 10 applications per session
- If captcha: check `#IsCaptchaEnabled`, pause for manual solve
- If 3 consecutive failures → abort, wait 1-2 hours

---

# Skill Update Protocol

When the AI discovers new issues and corrections during a session:
1. Document the issue and the fix that worked
2. Add it to the "Correction Strategies" section
3. Add any new selectors discovered to the selector tables
4. Update the skill via `skill_workshop` action=update
5. This ensures future runs benefit from past learnings
