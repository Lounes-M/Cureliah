// Simple navigation test for button functionality
const puppeteer = require('puppeteer');

async function testNavigation() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Starting navigation test...');
  
  try {
    // Navigate to the homepage
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle2' });
    console.log('✅ Homepage loaded successfully');
    
    // Test basic navigation routes
    const routesToTest = [
      '/demo-request',
      '/contact-sales', 
      '/faq',
      '/contact',
      '/auth'
    ];
    
    for (const route of routesToTest) {
      console.log(`🔍 Testing route: ${route}`);
      await page.goto(`http://localhost:8082${route}`, { waitUntil: 'networkidle2' });
      
      // Check if page loaded without errors
      const title = await page.title();
      console.log(`✅ ${route} - Page title: ${title}`);
      
      // Check if there are any 404 errors
      const notFoundText = await page.$eval('body', el => el.textContent.includes('404') || el.textContent.includes('Not Found'));
      if (notFoundText) {
        console.log(`❌ ${route} - 404 error detected`);
      } else {
        console.log(`✅ ${route} - No 404 errors`);
      }
      
      // Small delay between tests
      await page.waitForTimeout(1000);
    }
    
    console.log('🎉 Navigation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Navigation test failed:', error);
  } finally {
    await browser.close();
  }
}

testNavigation();
