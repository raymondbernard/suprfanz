const { chromium } = require('playwright');
const { execSync, spawn } = require('child_process');

const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE = 'Profile 3';
const TEST_MSG = 'Hey this is a test message from automation!';

(async () => {
    // Launch Chrome with remote debugging
    console.log('Launching Chrome with remote debugging on port 9222...');
    const chrome = spawn(CHROME_EXE, [
        '--profile-directory=' + PROFILE,
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--remote-debugging-port=9222',
        'https://www.messenger.com'
    ], { detached: true, stdio: 'ignore' });
    
    // Wait for Chrome to start and be ready
    console.log('Waiting for Chrome to start...');
    let connected = false;
    let browser;
    
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
            browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
            connected = true;
            console.log('Connected to Chrome!');
            break;
        } catch (e) {
            console.log(`  Attempt ${i+1}/15 - waiting...`);
        }
    }
    
    if (!connected) {
        console.error('Could not connect to Chrome after 30 seconds');
        process.exit(1);
    }
    
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log('URL:', page.url());
    console.log('');
    console.log('Make sure you are on a Messenger conversation.');
    console.log('Waiting 10 seconds for you to navigate to a chat...');
    await new Promise(r => setTimeout(r, 10000));
    
    console.log('Current URL:', page.url());
    
    // The CSS selector from the user
    const CSS_SELECTOR = '#mount_0_0_Lc > div > div.html-div.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.xpbz3e7.x67yw2k.xbzvyzk.x1xb1xrg.x1su8lfv.xbi9o00.x133ha9w.x4666fc.x78zum5.xdt5ytf.x1iyjqo2 > div:nth-child(1) > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div.x9f619.x1n2onr6.x1ja2u2z.__fb-light-mode > div.x9f619.x1ja2u2z.x78zum5.x2lah0s.x1n2onr6.x1nhvcw1.x1qjc9v5.xozqiw3.x1q0g3np.x18d9i69.xexx8yu.x1dr59a3.x13dmulc.x1bc3s5a.xkbglvu.x166lnxr.xvc5jky.x11t971q.xh8yej3.xssz1t8 > div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x193iq5w.xeuugli.xs83m0k.xjhlixk.xgyuaek > div > div > div.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x193iq5w.x1l7klhg.x1iyjqo2.xs83m0k.x2lwn1j.x6prxxf.x85a59c.x1n2onr6.xjbqb8w.xuce83p.x1bft6iq.xczebs5 > div > div > div > div > div > div.x78zum5.xdt5ytf.x1iyjqo2.xs83m0k.x1n2onr6 > div > div > div > div:nth-child(2) > div > div.x1iyjqo2.xw2csxc.x1n2onr6 > div > div.x16sw7j7.x12ol6y4.x180vkcf.x1khw62d.x709u02.x9f619.xlai7qp.x1iyjqo2.xeuugli > div > div.x78zum5.x1iyjqo2.x1xmf6yo.x1e56ztr.xbmvrgn.x1diwwjn.xeuugli.x1n2onr6 > div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x19gmnou.xisnujt.xeuugli.x1odjw0f.notranslate > p';
    
    // Method 1: CSS selector + click + type()
    console.log('\n--- Method 1: CSS + click + type() ---');
    try {
        const p = page.locator(CSS_SELECTOR);
        const exists = await p.count();
        console.log('Elements found:', exists);
        if (exists > 0) {
            await p.click();
            await page.waitForTimeout(500);
            await p.type(TEST_MSG, { delay: 20 });
            await page.waitForTimeout(1000);
            const text = await p.textContent();
            console.log('Content:', JSON.stringify(text));
            if (text && text.includes('test')) {
                console.log('>>> SUCCESS with type()! <<<');
                await page.keyboard.press('Control+a');
                await page.keyboard.press('Delete');
                await browser.close();
                return;
            }
            await page.keyboard.press('Control+a');
            await page.keyboard.press('Delete');
        }
    } catch (e) { console.log('Error:', e.message); }
    
    // Method 2: CSS + click + keyboard.type()
    console.log('\n--- Method 2: CSS + click + keyboard.type() ---');
    try {
        const p = page.locator(CSS_SELECTOR);
        await p.click();
        await page.waitForTimeout(500);
        await page.keyboard.type(TEST_MSG, { delay: 20 });
        await page.waitForTimeout(1000);
        const text = await p.textContent();
        console.log('Content:', JSON.stringify(text));
        if (text && text.includes('test')) {
            console.log('>>> SUCCESS with keyboard.type()! <<<');
            await page.keyboard.press('Control+a');
            await page.keyboard.press('Delete');
            await browser.close();
            return;
        }
        await page.keyboard.press('Control+a');
        await page.keyboard.press('Delete');
    } catch (e) { console.log('Error:', e.message); }
    
    // Method 3: .notranslate > p
    console.log('\n--- Method 3: .notranslate > p ---');
    try {
        const items = await page.locator('div.notranslate > p').count();
        console.log('Found', items, '.notranslate > p elements');
        const p = page.locator('div.notranslate > p').first();
        await p.click();
        await page.waitForTimeout(500);
        await page.keyboard.type(TEST_MSG, { delay: 20 });
        await page.waitForTimeout(1000);
        const text = await p.textContent();
        console.log('Content:', JSON.stringify(text));
        if (text && text.includes('test')) {
            console.log('>>> SUCCESS with .notranslate > p! <<<');
            await page.keyboard.press('Control+a');
            await page.keyboard.press('Delete');
            await browser.close();
            return;
        }
        await page.keyboard.press('Control+a');
        await page.keyboard.press('Delete');
    } catch (e) { console.log('Error:', e.message); }
    
    // Method 4: div[role=textbox]
    console.log('\n--- Method 4: div[role=textbox] ---');
    try {
        const tb = page.locator('div[role="textbox"]').first();
        await tb.click();
        await page.waitForTimeout(500);
        await page.keyboard.type(TEST_MSG, { delay: 20 });
        await page.waitForTimeout(1000);
        const text = await tb.textContent();
        console.log('Content:', JSON.stringify(text));
        if (text && text.includes('test')) {
            console.log('>>> SUCCESS with div[role=textbox]! <<<');
            await page.keyboard.press('Control+a');
            await page.keyboard.press('Delete');
            await browser.close();
            return;
        }
        await page.keyboard.press('Control+a');
        await page.keyboard.press('Delete');
    } catch (e) { console.log('Error:', e.message); }
    
    // Method 5: evaluate - focus + execCommand insertText
    console.log('\n--- Method 5: execCommand insertText ---');
    try {
        await page.evaluate((msg) => {
            const p = document.querySelector('div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x19gmnou.xisnujt.xeuugli.x1odjw0f.notranslate > p');
            if (p) {
                p.focus();
                const range = document.createRange();
                range.selectNodeContents(p);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand('insertText', false, msg);
            }
        }, TEST_MSG);
        await page.waitForTimeout(1000);
        const text = await page.locator(CSS_SELECTOR).textContent();
        console.log('Content:', JSON.stringify(text));
        if (text && text.includes('test')) {
            console.log('>>> SUCCESS with execCommand! <<<');
            await page.keyboard.press('Control+a');
            await page.keyboard.press('Delete');
            await browser.close();
            return;
        }
    } catch (e) { console.log('Error:', e.message); }
    
    // Method 6: evaluate - set innerHTML + dispatch events
    console.log('\n--- Method 6: innerHTML + input event ---');
    try {
        await page.evaluate((msg) => {
            const p = document.querySelector('div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x19gmnou.xisnujt.xeuugli.x1odjw0f.notranslate > p');
            if (p) {
                p.focus();
                p.innerHTML = msg;
                p.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: msg }));
                p.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, TEST_MSG);
        await page.waitForTimeout(1000);
        const text = await page.locator(CSS_SELECTOR).textContent();
        console.log('Content:', JSON.stringify(text));
        if (text && text.includes('test')) {
            console.log('>>> SUCCESS with innerHTML! <<<');
            await page.evaluate(() => {
                const p = document.querySelector('div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x19gmnou.xisnujt.xeuugli.x1odjw0f.notranslate > p');
                if (p) p.innerHTML = '<br data-lexical-managed-linebreak="true">';
            });
            await browser.close();
            return;
        }
    } catch (e) { console.log('Error:', e.message); }
    
    console.log('\n=== ALL METHODS FAILED ===');
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'debug_composer.png' });
    console.log('Saved: debug_composer.png');
    
    await browser.close();
})();