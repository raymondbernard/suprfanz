const { chromium } = require('playwright');
const fs = require('fs');

const shotDir = 'C:/Users/RayBe/.openclaw/workspace/outreach/messenger/';
const messengerUrl = process.argv[2];
const messageFile = process.argv[3];
const contactName = process.argv[4] || 'unknown';

(async () => {
    const message = fs.readFileSync(messageFile, 'utf-8').trim();
    const safeName = contactName.replace(/[^a-zA-Z0-9]/g, '_');
    
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('messenger.com')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = context.pages()[0];
    
    // Navigate
    await page.goto(messengerUrl, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e => console.log('NAV_ERR'));
    await page.waitForTimeout(2000);
    
    // BEFORE screenshot
    await page.screenshot({ path: shotDir + 'before_' + safeName + '.jpg', type: 'jpeg', quality: 40 }).catch(() => {});
    
    // Continue button — 3 attempts, 1.5s gaps
    let continueClicked = false;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const btn = page.locator('div[role="button"]:has-text("Continue"), button:has-text("Continue")');
            const count = await btn.count();
            for (let i = 0; i < count; i++) {
                if (await btn.nth(i).isVisible().catch(() => false)) {
                    console.log('CONTINUE');
                    await btn.nth(i).click();
                    await page.waitForTimeout(2000);
                    continueClicked = true;
                    break;
                }
            }
            if (continueClicked) break;
            if (attempt < 2) await page.waitForTimeout(1500);
        } catch(e) {}
    }
    
    // Textbox — 7s timeout
    try {
        await page.waitForSelector('div[role="textbox"]', { state: 'visible', timeout: 7000 });
    } catch(e) {
        console.log('NO_TEXTBOX');
        await page.screenshot({ path: shotDir + 'notextbox_' + safeName + '.jpg', type: 'jpeg', quality: 40 }).catch(() => {});
        console.log('RESULT: NO_TEXTBOX');
        browser.close();
        return;
    }
    
    // CRITICAL SAFEGUARD: Clear textbox first to prevent stale message from previous contact
    const textbox = page.locator('div[role="textbox"]').first();
    await textbox.click();
    await page.waitForTimeout(200);
    // Select all text (Ctrl+A) and delete to ensure clean slate
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.waitForTimeout(100);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    console.log('TEXTBOX_CLEARED');
    
    // Already sent — check ONLY conversation area
    try {
        const msgArea = page.locator('[role="main"]');
        if (await msgArea.count() > 0) {
            const msgText = await msgArea.first().evaluate(el => el.innerText).catch(() => '');
            if (msgText.includes('971902445574502')) {
                console.log('ALREADY_SENT');
                console.log('RESULT: ALREADY_SENT');
                browser.close();
                return;
            }
        }
    } catch(e) {}
    
    // Type message with name verification
    await textbox.click();
    await page.waitForTimeout(300);
    await page.keyboard.type(message, { delay: 5 });
    await page.waitForTimeout(500); // Wait for message to fully render
    
    // CRITICAL SAFEGUARD: Verify the typed message contains the correct first name
    const typedContent = await textbox.evaluate(el => el.innerText).catch(() => '');
    const firstName = contactName.split(' ')[0]; // Extract first name
    if (!typedContent.includes(firstName)) {
        console.log('NAME_MISMATCH: Expected "' + firstName + '" but typed content was: "' + typedContent.substring(0, 100) + '..."');
        console.log('RESULT: ABORT_NAME_MISMATCH');
        await page.screenshot({ path: shotDir + 'namemismatch_' + safeName + '.jpg', type: 'jpeg', quality: 40 }).catch(() => {});
        browser.close();
        return; // ABORT - do not send!
    }
    console.log('NAME_VERIFIED: Found "' + firstName + '" in typed message');
    
    await page.screenshot({ path: shotDir + 'typed_' + safeName + '.jpg', type: 'jpeg', quality: 40 }).catch(() => {});
    
    // One final verification before pressing Enter
    const finalCheck = await textbox.evaluate(el => el.innerText).catch(() => '');
    if (!finalCheck.includes(firstName)) {
        console.log('FINAL_CHECK_FAILED: Name disappeared before send!');
        console.log('RESULT: ABORT_FINAL_CHECK');
        browser.close();
        return;
    }
    
    console.log('SENDING...');
    await page.keyboard.press('Enter');
    
    // VERIFY SEND — poll for up to 10 seconds checking for success or failure
    let sendResult = 'UNKNOWN';
    for (let wait = 0; wait < 10; wait++) {
        await page.waitForTimeout(1000);
        try {
            const mainArea = page.locator('[role="main"]').first();
            const mainText = await mainArea.evaluate(el => el.innerText).catch(() => '');
            
            // Check for FAILURE indicators (Facebook shows these when message doesn't deliver)
            if (mainText.match(/couldn't send|failed to send|unable to send|couldn't deliver|not delivered|message not sent/i)) {
                sendResult = 'FAILED';
                console.log('FAIL_REASON: text="' + mainText.match(/couldn't send|failed to send|unable to send|couldn't deliver|not delivered|message not sent/i)[0] + '"');
                break;
            }
            
            // Check for red error icons / resend buttons (Facebook's failed send indicators)
            const errorElements = await page.locator('[role="main"] [aria-label*="error" i], [role="main"] [aria-label*="failed" i], [role="main"] [aria-label*="resend" i], [role="main"] [aria-label*="retry" i], [role="main"] [aria-label*="Could not" i]').count();
            if (errorElements > 0) {
                sendResult = 'FAILED';
                console.log('FAIL_REASON: error icon found (' + errorElements + ')');
                break;
            }
            
            // Check for SUCCESS — our event link appears in the conversation
            if (mainText.includes('971902445574502')) {
                sendResult = 'SENT';
                break;
            }
        } catch(e) {}
    }
    
    // Final check — screenshot + one more text scan
    await page.screenshot({ path: shotDir + 'after_' + safeName + '.jpg', type: 'jpeg', quality: 40 }).catch(() => {});
    
    if (sendResult === 'UNKNOWN') {
        // Last chance — check one more time
        try {
            const finalText = await page.locator('[role="main"]').first().evaluate(el => el.innerText).catch(() => '');
            if (finalText.match(/couldn't send|failed to send|unable to send|couldn't deliver|not delivered|message not sent/i)) {
                sendResult = 'FAILED';
            } else if (finalText.includes('971902445574502')) {
                sendResult = 'SENT';
            } else {
                // Could not confirm either way — mark as UNKNOWN so we don't lie
                sendResult = 'UNCONFIRMED';
            }
        } catch(e) {
            sendResult = 'UNCONFIRMED';
        }
    }
    
    console.log(sendResult);
    console.log('RESULT: ' + sendResult);
    browser.close();
})().catch(e => { console.error('ERROR: ' + e.message); });