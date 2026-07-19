const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = context.pages()[0];
    
    // Go to listings and check ALL 17 lotteries for 30% AMI units
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/search-lotteries', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    // Get all View Details buttons
    const btnCount = await page.locator('button:has-text("View Details")').count();
    console.log('Total View Details buttons: ' + btnCount);
    
    // Click each one, get URL + full unit table
    const checkedIds = new Set();
    for (let i = 0; i < btnCount; i++) {
        // Go back to listings
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/search-lotteries', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2500);
        
        try {
            const btns = page.locator('button:has-text("View Details")');
            await btns.nth(i).click();
            await page.waitForTimeout(3500);
            
            const url = page.url();
            const idMatch = url.match(/\/details\/(\d+)/);
            const id = idMatch ? idMatch[1] : 'unknown';
            
            if (checkedIds.has(id)) continue;
            checkedIds.add(id);
            
            // Click Units tab
            const unitsTab = page.locator('a:has-text("Units"), button:has-text("Units")').first();
            if (await unitsTab.count() > 0) {
                await unitsTab.click().catch(() => {});
                await page.waitForTimeout(2000);
            }
            
            const text = await page.evaluate(() => document.body.innerText).catch(() => '');
            
            // Check for 30% AMI
            const has30 = text.match(/30%\s*(AREA|AMI)|extremely low/i);
            // Check for minimum income $0 or very low
            const hasZeroMin = text.match(/\$0[\d,]*\.00-\$|\$1[\d,]*\.00-\$.*34,050/i);
            // Get lowest income figure
            const incomeMatches = text.match(/\$[\d,]+\.00/g);
            let lowestIncome = 999999;
            if (incomeMatches) {
                for (const m of incomeMatches) {
                    const val = parseInt(m.replace(/[$,]/g, ''));
                    if (val > 0 && val < lowestIncome) lowestIncome = val;
                }
            }
            
            // Get lottery name from page
            const nameMatch = text.match(/Lottery ends in \d+ days\s*\n\s*([A-Z][A-Z0-9 \-()]+)/);
            const name = nameMatch ? nameMatch[1].trim() : 'unknown';
            
            // Get borough from address
            const addrMatch = text.match(/(\d+\s+[\w\s]+,?\s+(Bronx|Brooklyn|Manhattan|Queens|Staten Island),?\s+NY)/i);
            const boro = addrMatch ? addrMatch[2] : 'unknown';
            
            const daysMatch = text.match(/Lottery ends in (\d+) days/);
            const days = daysMatch ? daysMatch[1] : '?';
            
            // Get apply count
            const applyCount = await page.locator('a:has-text("Apply Now")').count().catch(() => 0);
            
            console.log(`ID ${id}: ${name} | ${boro} | ${days}d | 30AMI:${!!has30} | lowestIncome:$${lowestIncome} | apply:${applyCount}`);
            
            if (has30 || lowestIncome < 30000) {
                console.log('  *** PROMISING FOR ZERO INCOME ***');
                // Print relevant unit lines
                const lines = text.split('\n').map(l => l.trim());
                for (const line of lines) {
                    if (line.match(/30%|extremely low|\$0|Studio.*\$|1 Bed.*\$/) && line.length < 100) {
                        console.log('  UNIT: ' + line);
                    }
                }
            }
        } catch(e) {
            console.log(`ERR_${i}: ` + e.message.substring(0, 60));
        }
    }
    
    browser.close();
})().catch(e => console.error('ERROR: ' + e.message));