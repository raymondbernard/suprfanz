const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('housingconnect')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = context.pages[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    // Take screenshot of current state
    await page.screenshot({ path: shotDir + 'terms_state.png' }).catch(() => {});
    
    // Check checkbox state
    const cb = page.locator('#mat-checkbox-1-input');
    const checked = await cb.isChecked().catch(() => false);
    console.log('Checkbox checked:', checked);
    
    // Check if there's a dialog/modal open
    const dialogs = await page.locator('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"], [class*="Dialog"], [class*="overlay"], [class*="popup"]').all();
    console.log('\nDialogs (' + dialogs.length + '):');
    for (const d of dialogs.slice(0, 5)) {
        try {
            const tag = await d.evaluate(el => el.tagName);
            const text = (await d.textContent()).trim().substring(0, 200);
            const visible = await d.isVisible().catch(() => false);
            console.log(`  ${tag} visible=${visible} text="${text.substring(0, 150)}"`);
        } catch(e) {}
    }
    
    // Check the submit button more carefully
    const submitBtn = page.locator('button:has-text("Submit")');
    const btnCount = await submitBtn.count();
    console.log('\nSubmit buttons:', btnCount);
    for (let i = 0; i < btnCount; i++) {
        try {
            const b = submitBtn.nth(i);
            const text = (await b.textContent()).trim();
            const disabled = await b.isDisabled().catch(() => true);
            const visible = await b.isVisible().catch(() => false);
            const cls = await b.getAttribute('class') || '';
            const box = await b.boundingBox().catch(() => null);
            console.log(`  [${i}] "${text}" disabled=${disabled} visible=${visible} class="${cls}" ${box ? 'y=' + Math.round(box.y) : ''}`);
        } catch(e) {}
    }
    
    // Maybe the terms text is in a scrollable container that needs scrolling
    const scrollContainers = await page.locator('[class*="scroll"], [class*="terms"], [class*="agreement"], [class*="consent"]').all();
    console.log('\nScroll/terms containers (' + scrollContainers.length + '):');
    for (const c of scrollContainers.slice(0, 5)) {
        try {
            const tag = await c.evaluate(el => el.tagName);
            const cls = await c.getAttribute('class') || '';
            const text = (await c.textContent()).trim().substring(0, 100);
            console.log(`  ${tag} class="${cls}" text="${text}"`);
        } catch(e) {}
    }
    
    // Check all visible text near the checkbox
    const matCb = page.locator('mat-checkbox').first();
    const cbText = await matCb.textContent().catch(() => '');
    console.log('\nCheckbox text:', cbText.trim().substring(0, 100));
    
    // Check for any required attribute on the checkbox
    const cbRequired = await cb.getAttribute('required');
    const cbClass = await cb.getAttribute('class');
    console.log('Checkbox required:', cbRequired, 'class:', cbClass);
    
    // Try checking via the mat-checkbox click area — maybe our click missed
    console.log('\nRe-checking checkbox...');
    const matCheckboxLabel = page.locator('mat-checkbox .mat-checkbox-label, mat-checkbox label').first();
    if (await matCheckboxLabel.isVisible().catch(() => false)) {
        await matCheckboxLabel.click();
        await page.waitForTimeout(500);
        const checked2 = await cb.isChecked().catch(() => false);
        console.log('After label click, checked:', checked2);
    }
    
    // Also try clicking the inner input directly
    if (!await cb.isChecked().catch(() => false)) {
        await cb.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
        console.log('After force click, checked:', await cb.isChecked().catch(() => false));
    }
    
    // Recheck submit
    const submitDisabled2 = await submitBtn.first().isDisabled().catch(() => true);
    console.log('Submit disabled after re-check:', submitDisabled2);
    
    // Dump all elements with "required" in their class or attribute near the form
    const requiredEls = await page.locator('[required], .ng-invalid, .ng-dirty, [aria-required="true"]').all();
    console.log('\nRequired/invalid elements (' + requiredEls.length + '):');
    for (const e of requiredEls.slice(0, 10)) {
        try {
            const tag = await e.evaluate(el => el.tagName);
            const cls = await e.getAttribute('class') || '';
            const id = await e.getAttribute('id') || '';
            console.log(`  ${tag} id="${id}" class="${cls.substring(0, 60)}"`);
        } catch(e) {}
    }
    
    // Body text around checkbox area
    const bodyText = await page.locator('body').textContent();
    const termsIdx = bodyText.toLowerCase().indexOf('terms');
    if (termsIdx >= 0) {
        console.log('\nText around "terms":');
        console.log(bodyText.substring(Math.max(0, termsIdx - 100), termsIdx + 200).trim());
    }
    
    console.log('\nDONE');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));