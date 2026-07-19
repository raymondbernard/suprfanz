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
    
    console.log('NAV: ' + messengerUrl);
    await page.goto(messengerUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('NAV_ERR: ' + e.message));
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: shotDir + 'before_' + safeName + '.jpg', type: 'jpeg', quality: 50 }).catch(() => {});
    console.log('SHOT: before_' + safeName + '.jpg');
    
    let continueClicked = false;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const continueBtn = page.locator('div[role="button"]:has-text("Continue"), button:has-text("Continue")');
            const count = await continueBtn.count();
            for (let i = 0; i < count; i++) {
                const vis = await continueBtn.nth(i).isVisible().catch(() => false);
                if (vis) {
                    console.log('CONTINUE: clicking');
                    await continueBtn.nth(i).click();
                    await page.waitForTimeout(3000);
                    continueClicked = true;
                    await page.screenshot({ path: shotDir + 'continue_' + safeName + '.jpg', type: 'jpeg', quality: 50 }).catch(() => {});
                    console.log('SHOT: continue_' + safeName + '.jpg');
                    break;
                }
            }
            if (continueClicked) break;
            if (attempt < 4) await page.waitForTimeout(2000);
        } catch(e) {}
    }
    
    let textboxFound = false;
    try {
        await page.waitForSelector('div[role="textbox"]', { state: 'visible', timeout: 10000 });
        textboxFound = true;
        console.log('TEXTBOX: found');
    } catch(e) {
        console.log('NO_TEXTBOX');
        await page.screenshot({ path: shotDir + 'notextbox_' + safeName + '.jpg', type: 'jpeg', quality: 50 }).catch(() => {});
        console.log('SHOT: notextbox_' + safeName + '.jpg');
        console.log('RESULT: NO_TEXTBOX');
        browser.close();
        return;
    }
    
    let alreadySent = false;
    try {
        const msgArea = page.locator('[role="main"], [aria-label*="Conversation"]');
        const msgCount = await msgArea.count();
        if (msgCount > 0) {
            const msgText = await msgArea.first().evaluate(el => el.innerText).catch(() => '');
            if (msgText.includes('971902445574502')) alreadySent = true;
        }
        if (!alreadySent) {
            const msgBubbles = page.locator('[role="main"] [data-scope], [role="main"] div[dir="auto"]');
            const bubbleCount = await msgBubbles.count();
            for (let i = 0; i < Math.min(bubbleCount, 20); i++) {
                try {
                    const bubbleText = await msgBubbles.nth(i).textContent().catch(() => '');
                    if (bubbleText.includes('971902445574502')) { alreadySent = true; break; }
                } catch(e) {}
            }
        }
    } catch(e) {}
    
    if (alreadySent) {
        console.log('ALREADY_SENT');
        console.log('RESULT: ALREADY_SENT');
        browser.close();
        return;
    }
    
    const textbox = page.locator('div[role="textbox"]').first();
    await textbox.click();
    await page.waitForTimeout(500);
    console.log('TYPING...');
    await page.keyboard.type(message, { delay: 10 });
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: shotDir + 'typed_' + safeName + '.jpg', type: 'jpeg', quality: 50 }).catch(() => {});
    console.log('SHOT: typed_' + safeName + '.jpg');
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: shotDir + 'after_' + safeName + '.jpg', type: 'jpeg', quality: 50 }).catch(() => {});
    console.log('SHOT: after_' + safeName + '.jpg');
    
    console.log('RESULT: SENT');
    browser.close();
})().catch(e => { console.error('ERROR: ' + e.message); });