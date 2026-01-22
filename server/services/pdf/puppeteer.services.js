// services/pdf/puppeteer.service.js
const puppeteer = require('puppeteer');

async function generateSeoReportPdf({ token, baseUrl }) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.setCookie({
      name: 'token',
      value: token,
      domain: 'localhost', 
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    });

    await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
    await page.goto('http://localhost:4200/account', { waitUntil: 'networkidle0' });
console.log('Puppeteer cwd:', process.cwd());


    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = {
  generateSeoReportPdf
};
