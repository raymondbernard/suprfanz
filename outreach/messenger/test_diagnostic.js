const { chromium } = require('playwright');

(async () => {
    try {
        const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
        const context = browser.contexts()[0];
        const pages = context.pages();
        console.log('Open pages:', pages.length);
        
        for (let i = 0; i < pages.length; i++) {
            try {
                console.log(`Page ${i}: ${pages[i].url()}`);
            } catch(e) { console.log(`Page ${i}: closed`); }
        }
        
        // Find the messenger page
        let page = null;
        for (const p of pages) {
            try {
                if (p.url().includes('messenger.com')) { page = p; break; }
            } catch(e) {}
        }
        
        if (!page) {
            console.log('No messenger page found, using first available');
            page = pages.find(p => { try { return true } catch { return false } });
        }
        
        if (!page) {
            console.log('Creating new page...');
            page = await context.newPage();
            await page.goto('https://www.messenger.com');
            await page.waitForTimeout(10000);
        }
        
        console.log('Using page:', page.url());
        console.log('Navigate to a conversation. Waiting 15 seconds...');
        await new Promise(r => setTimeout(r, 15000));
        
        console.log('Current URL:', page.url());
        
        // Simple check - count editable elements
        const info = await page.evaluate(() => {
            const result = {};
            result.editableCount = document.querySelectorAll('[contenteditable="true"]').length;
            result.textboxCount = document.querySelectorAll('[role="textbox"]').length;
            result.pInNotranslate = document.querySelectorAll('.notranslate p').length;
            
            // Get details of each contenteditable
            result.editables = Array.from(document.querySelectorAll('[contenteditable="true"]')).map(el => ({
                tag: el.tagName,
                role: el.getAttribute('role'),
                cls: (el.className || '').substring(0, 60),
                text: (el.textContent || '').substring(0, 40),
                w: Math.round(el.getBoundingClientRect().width),
                h: Math.round(el.getBoundingClientRect().height),
                kids: Array.from(el.children).map(c => c.tagName)
            }));
            
            // Get details of each textbox
            result.textboxes = Array.from(document.querySelectorAll('[role="textbox"]')).map(el => ({
                tag: el.tagName,
                cls: (el.className || '').substring(0, 60),
                text: (el.textContent || '').substring(0, 40),
                html: (el.innerHTML || '').substring(0, 120),
                w: Math.round(el.getBoundingClientRect().width),
                h: Math.round(el.getBoundingClientRect().height),
                kids: Array.from(el.children).map(c => c.tagName + (c.className ? '.' + c.className.substring(0,20) : ''))
            }));
            
            // Get <p> in notranslate
            result.ps = Array.from(document.querySelectorAll('.notranslate p')).map(el => ({
                cls: (el.className || '').substring(0, 60),
                text: (el.textContent || '').substring(0, 40),
                html: (el.innerHTML || '').substring(0, 80),
                parent: el.parentElement.tagName + '.' + (el.parentElement.className || '').substring(0, 30)
            }));
            
            return result;
        }).catch(e => {
            console.log('evaluate failed:', e.message);
            return null;
        });
        
        if (info) {
            console.log('\nEditable elements:', info.editableCount);
            info.editables.forEach((e, i) => {
                console.log(`  [${i}] ${e.tag} role=${e.role} ${e.w}x${e.h} text="${e.text}" kids=[${e.kids}]`);
            });
            
            console.log('\nTextbox elements:', info.textboxCount);
            info.textboxes.forEach((e, i) => {
                console.log(`  [${i}] ${e.tag} ${e.w}x${e.h} text="${e.text}"`);
                console.log(`       kids=[${e.kids}]`);
                console.log(`       html: ${e.html}`);
            });
            
            console.log('\n<p> in .notranslate:', info.pInNotranslate);
            info.ps.forEach((e, i) => {
                console.log(`  [${i}] <p class="${e.cls}"> text="${e.text}" html=${e.html}`);
                console.log(`       parent: ${e.parent}`);
            });
        }
        
        // Try typing into the first textbox
        if (info && info.textboxCount > 0) {
            console.log('\n=== TYPING TEST ===');
            try {
                const tb = page.locator('[role="textbox"]').first();
                console.log('Clicking textbox...');
                await tb.click({ timeout: 5000 });
                await page.waitForTimeout(500);
                console.log('Typing "hello test"...');
                await page.keyboard.type('hello test', { delay: 50 });
                await page.waitForTimeout(1000);
                const text = await tb.textContent();
                console.log('Result:', JSON.stringify(text));
                if (text.includes('hello')) {
                    console.log('>>> keyboard.type WORKS! <<<');
                }
                // Clear
                await page.keyboard.press('Control+a');
                await page.keyboard.press('Delete');
            } catch(e) { console.log('Typing test error:', e.message); }
        }
        
        // Try typing into first contenteditable
        if (info && info.editableCount > 0) {
            console.log('\n=== TYPING TEST 2 ===');
            try {
                const el = page.locator('[contenteditable="true"]').first();
                console.log('Clicking contenteditable...');
                await el.click({ timeout: 5000 });
                await page.waitForTimeout(500);
                console.log('Typing "hello test 2"...');
                await page.keyboard.type('hello test 2', { delay: 50 });
                await page.waitForTimeout(1000);
                const text = await el.textContent();
                console.log('Result:', JSON.stringify(text));
                if (text.includes('hello')) {
                    console.log('>>> contenteditable keyboard.type WORKS! <<<');
                }
                await page.keyboard.press('Control+a');
                await page.keyboard.press('Delete');
            } catch(e) { console.log('Typing test 2 error:', e.message); }
        }
        
        await page.screenshot({ path: 'debug_page.png' }).catch(() => {});
        console.log('\nDone!');
        
        await browser.close();
    } catch (error) {
        console.error('Fatal:', error.message);
        process.exit(1);
    }
})();