const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

const messengerUrl = 'https://www.messenger.com/';

// Main function to fetch and modify the HTML
async function fetchAndModifyHtml(req) {
    const messengerResponse = await axios.get(messengerUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': req.headers.cookie || '' // Pass along cookies for login sessions
        }
    });

    const html = messengerResponse.data;
    const $ = cheerio.load(html);

    // Inject our custom CSS for the 240x320 display
    const customCSS = `
        /* Hide desktop clutter */
        [role="banner"], [aria-label*="Stories"], .__9dls, [aria-label="New message"], [aria-label="Calls"], [aria-label="People"] {
            display: none !important;
        }
        /* Force single-column layout */
        body, .__a5-d, .rq0escxv {
            width: 100% !important; min-width: 240px !important; max-width: 240px !important; overflow-x: hidden !important;
        }
        /* General styling for small screens */
        body { font-size: 14px; }
        * { box-sizing: border-box; }
        /* D-Pad focus indicator */
        .dpad-focus {
            outline: 2px solid #ff7f00 !important;
            background-color: rgba(255, 127, 0, 0.3) !important;
        }
    `;
    $('head').prepend(`<style>${customCSS}</style>`);
    $('head').prepend('<meta name="viewport" content="width=240, user-scalable=no">');
    
    // Inject our client-side D-Pad navigation script
    $('body').append('<script src="/static/navigation.js"></script>');

    return $.html();
}


// Route for the main page
app.get('/', async (req, res) => {
    try {
        const modifiedHtml = await fetchAndModifyHtml(req);
        res.send(modifiedHtml);
    } catch (error) {
        console.error("Error on main route:", error.message);
        res.status(500).send("Error loading Messenger. The service might be temporarily unavailable.");
    }
});

// Serve the static navigation file
app.use('/static', express.static('public'));

// Catch-all proxy for other assets (CSS, images) Messenger might request
app.get('*', async (req, res) => {
    try {
        const targetUrl = new URL(req.originalUrl, messengerUrl).href;
        const assetResponse = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': messengerUrl
            }
        });
        res.set('Content-Type', assetResponse.headers['content-type']);
        res.send(assetResponse.data);
    } catch (error) {
        console.error("Error proxying asset:", req.originalUrl, error.message);
        res.status(404).send('Asset not found');
    }
});


app.listen(PORT, () => {
    console.log(`KaiMessenger Proxy Server running on http://localhost:${PORT}`);
});