const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages[0];
    for (const p of pages) {
        try { if (p.url().includes('housingconnect')) { page = p; break; } } catch(e) {}
    }

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    
    // Scroll to bottom first
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: shotDir + 'setup_scrolled.png' }).catch(() => {});
    
    // Use JavaScript to click the visible Next button and interact with elements
    // The page is an Angular app — let's use evaluate to manipulate it directly
    
    console.log('=== Using JS to drive the wizard ===');
    
    // Step 1: Click the LAST visible Next button (which should be the one that advances sub-steps)
    const clicked1 = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nextBtns = btns.filter(b => b.textContent.trim() === 'Next' && b.offsetParent !== null && !b.disabled);
        if (nextBtns.length > 0) {
            // Click the last visible one (bottom of page)
            nextBtns[nextBtns.length - 1].click();
            return nextBtns.length;
        }
        return 0;
    });
    console.log('Clicked Next (' + clicked1 + ' visible) — Step 1a -> 1b');
    await page.waitForTimeout(2000);
    
    // Scroll to bottom again
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Click Next again (contact info -> language)
    const clicked2 = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nextBtns = btns.filter(b => b.textContent.trim() === 'Next' && b.offsetParent !== null && !b.disabled);
        if (nextBtns.length > 0) {
            nextBtns[nextBtns.length - 1].click();
            return nextBtns.length;
        }
        return 0;
    });
    console.log('Clicked Next (' + clicked2 + ' visible) — Step 1b -> 1c');
    await page.waitForTimeout(2000);
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: shotDir + 'setup_language_step.png' }).catch(() => {});
    
    // Select English using JavaScript (bypass visibility check)
    const langResult = await page.evaluate(() => {
        const sel = document.getElementById('ddlLanguage');
        if (sel) {
            sel.value = 'English';
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            return 'Selected English, value=' + sel.value;
        }
        return 'ddlLanguage not found';
    });
    console.log('Language:', langResult);
    await page.waitForTimeout(1000);
    
    // Check Start Setup button
    const startResult = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const startBtn = btns.find(b => b.textContent.includes('Start Setup'));
        if (startBtn) {
            return { text: startBtn.textContent.trim(), disabled: startBtn.disabled, visible: startBtn.offsetParent !== null };
        }
        return null;
    });
    console.log('Start Setup:', startResult);
    
    if (startResult && !startResult.disabled) {
        console.log('Clicking Start Setup...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const startBtn = btns.find(b => b.textContent.includes('Start Setup'));
            if (startBtn) startBtn.click();
        });
        await page.waitForTimeout(3000);
        console.log('After Start Setup');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: shotDir + 'step2_members.png' }).catch(() => {});
        
        // Step 2: Add Ray as Spouse
        console.log('\n=== Step 2: Adding Ray ===');
        
        // Click Add Member
        const addResult = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const addBtn = btns.find(b => b.textContent.includes('Add Member') && b.offsetParent !== null);
            if (addBtn) { addBtn.click(); return 'clicked'; }
            return 'not found';
        });
        console.log('Add Member:', addResult);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: shotDir + 'step2_add_form.png' }).catch(() => {});
        
        // Select relationship = Spouse
        const relResult = await page.evaluate(() => {
            const sel = document.getElementById('ddlRelationship0');
            if (sel) {
                // Find Spouse option
                const opts = Array.from(sel.options);
                const spouseOpt = opts.find(o => o.text.toLowerCase().includes('spouse') || o.text.toLowerCase().includes('husband') || o.text.toLowerCase().includes('wife'));
                if (spouseOpt) {
                    sel.value = spouseOpt.value;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                    return 'Selected: ' + spouseOpt.text;
                }
                return 'No spouse option. Options: ' + opts.map(o => o.text).join(', ');
            }
            return 'ddlRelationship0 not found';
        });
        console.log('Relationship:', relResult);
        await page.waitForTimeout(500);
        
        // Fill first name
        const fnResult = await page.evaluate(() => {
            const inp = document.getElementById('hhMmbrFirst_0');
            if (inp) {
                inp.value = 'Ray';
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                inp.dispatchEvent(new Event('change', { bubbles: true }));
                return 'Filled Ray';
            }
            // Try by placeholder
            const inputs = Array.from(document.querySelectorAll('input[placeholder*="First"]'));
            if (inputs.length > 0) {
                inputs[0].value = 'Ray';
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                return 'Filled via placeholder';
            }
            return 'Not found';
        });
        console.log('First name:', fnResult);
        await page.waitForTimeout(500);
        
        // Fill last name
        const lnResult = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input[placeholder*="Last"]'));
            if (inputs.length > 0) {
                inputs[0].value = 'Bernard';
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                return 'Filled Bernard';
            }
            return 'Not found';
        });
        console.log('Last name:', lnResult);
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: shotDir + 'step2_ray_filled.png' }).catch(() => {});
        
        // Click Next to proceed to Step 3
        const nextResult = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const nextBtns = btns.filter(b => b.textContent.trim() === 'Next' && b.offsetParent !== null && !b.disabled);
            if (nextBtns.length > 0) {
                nextBtns[nextBtns.length - 1].click();
                return 'clicked (' + nextBtns.length + ' visible)';
            }
            // Check disabled ones
            const disabled = btns.filter(b => b.textContent.trim() === 'Next' && b.offsetParent !== null);
            return 'Next disabled count: ' + disabled.length;
        });
        console.log('Next:', nextResult);
        await page.waitForTimeout(3000);
        
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: shotDir + 'step3_address.png' }).catch(() => {});
        
        // Step 3: Dump address form
        console.log('\n=== Step 3: Address ===');
        
        const step3Elements = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('input, select, mat-select, mat-checkbox, mat-radio-button, label, button').forEach(el => {
                if (el.offsetParent !== null) {
                    const text = el.textContent ? el.textContent.trim().substring(0, 60) : '';
                    const id = el.id || '';
                    const type = el.type || '';
                    const placeholder = el.placeholder || '';
                    const tag = el.tagName;
                    results.push({ tag, type, id, placeholder, text: text.substring(0, 50) });
                }
            });
            return results;
        });
        
        console.log('Visible elements (' + step3Elements.length + '):');
        for (const el of step3Elements.slice(0, 30)) {
            console.log('  ' + el.tag + ' type=' + el.type + ' id=' + el.id + ' placeholder=' + el.placeholder + ' text="' + el.text + '"');
        }
        
        // Body text around address
        const bodyText = await page.evaluate(() => document.body.textContent);
        const addrIdx = bodyText.toLowerCase().indexOf('current living address');
        if (addrIdx >= 0) {
            console.log('\nText around address:');
            console.log(bodyText.substring(addrIdx, addrIdx + 800));
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));