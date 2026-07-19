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

    console.log('URL:', page.url());
    await page.waitForTimeout(2000);
    await page.screenshot({ path: shotDir + 'login_page_final.png' }).catch(() => {});
    
    // Quick simple dump — just get input and button info
    const inputCount = await page.locator('input').count();
    console.log('Input count:', inputCount);
    
    for (let i = 0; i < inputCount; i++) {
        try {
            const inp = page.locator('input').nth(i);
            const type = await inp.getAttribute('type') || '';
            const name = await inp.getAttribute('name') || '';
            const id = await inp.getAttribute('id') || '';
            const placeholder = await inp.getAttribute('placeholder') || '';
            const visible = await inp.isVisible().catch(() => false);
            console.log(`  input[${i}] type=${type} name=${name} id=${id} placeholder=${placeholder} visible=${visible}`);
        } catch(e) { console.log(`  input[${i}] error: ${e.message}`); }
    }
    
    const btnCount = await page.locator('button, input[type=submit]').count();
    console.log('Button count:', btnCount);
    for (let i = 0; i < btnCount; i++) {
        try {
            const b = page.locator('button, input[type=submit]').nth(i);
            const text = (await b.textContent()).trim().substring(0, 60);
            const type = await b.getAttribute('type') || '';
            const visible = await b.isVisible().catch(() => false);
            console.log(`  btn[${i}] text="${text}" type=${type} visible=${visible}`);
        } catch(e) {}
    }
    
    const labelCount = await page.locator('label').count();
    console.log('Label count:', labelCount);
    for (let i = 0; i < labelCount; i++) {
        try {
            const l = page.locator('label').nth(i);
            const text = (await l.textContent()).trim().substring(0, 60);
            const forAttr = await l.getAttribute('for') || '';
            console.log(`  label[${i}] "${text}" for=${forAttr}`);
        } catch(e) {}
    }
    
    // Check for form action
    const formAction = await page.locator('form').first().getAttribute('action').catch(() => 'no form');
    const formMethod = await page.locator('form').first().getAttribute('method').catch(() => '');
    console.log('Form action:', formAction);
    console.log('Form method:', formMethod);
    
    // Headings
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    const h2 = await page.locator('h2').first().textContent().catch(() => '');
    console.log('H1:', h1.trim().substring(0, 80));
    console.log('H2:', h2.trim().substring(0, 80));
    
    console.log('DONE');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));