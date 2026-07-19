const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('housingconnect') || p.url().includes('a806')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = context.pages[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';

    // Go to main page and click Log In to get to the auth server
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    
    console.log('Clicking Log In...');
    await page.locator('a:has-text("Log In")').first().click();
    await page.waitForTimeout(5000);
    
    const loginUrl = page.url();
    console.log('Login URL:', loginUrl);
    await page.screenshot({ path: shotDir + 'login_form_final.png' }).catch(() => {});
    
    // Full form dump
    console.log('\n=== LOGIN FORM ===');
    
    // Get ALL form elements with their attributes
    const formElements = await page.evaluate(() => {
        const results = [];
        const els = document.querySelectorAll('input, button, select, textarea, label, form');
        els.forEach(el => {
            const rect = el.getBoundingClientRect();
            results.push({
                tag: el.tagName,
                type: el.type || '',
                name: el.name || '',
                id: el.id || '',
                value: el.value ? el.value.substring(0, 50) : '',
                placeholder: el.placeholder || '',
                ariaLabel: el.getAttribute('aria-label') || '',
                text: el.textContent ? el.textContent.trim().substring(0, 80) : '',
                htmlFor: el.htmlFor || '',
                visible: rect.width > 0 && rect.height > 0,
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                w: Math.round(rect.width),
                h: Math.round(rect.height)
            });
        });
        return results;
    });
    
    console.log('\nAll form elements (' + formElements.length + '):');
    for (const el of formElements) {
        if (el.visible) {
            let line = `  ${el.tag}`;
            if (el.type) line += ` type=${el.type}`;
            if (el.name) line += ` name=${el.name}`;
            if (el.id) line += ` id=${el.id}`;
            if (el.placeholder) line += ` placeholder="${el.placeholder}"`;
            if (el.ariaLabel) line += ` aria="${el.ariaLabel}"`;
            if (el.text) line += ` text="${el.text}"`;
            if (el.htmlFor) line += ` for=${el.htmlFor}`;
            line += ` (${el.x},${el.y})`;
            console.log(line);
        }
    }
    
    // Get form action
    const form = page.locator('form').first();
    if (await form.isVisible().catch(() => false)) {
        const action = await form.getAttribute('action') || '';
        const method = await form.getAttribute('method') || '';
        const id = await form.getAttribute('id') || '';
        console.log('\nForm: action=' + action + ' method=' + method + ' id=' + id);
    }
    
    // Headings
    const headings = await page.locator('h1, h2, h3, h4').all();
    console.log('\nHeadings:');
    for (const h of headings.slice(0, 10)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    // Body text
    const bodyText = await page.locator('body').textContent();
    console.log('\nBody text (first 600):', bodyText.substring(0, 600));
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));