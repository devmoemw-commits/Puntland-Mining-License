// Custom Node server for cPanel / Phusion Passenger.
// cPanel's "Setup Node.js App" runs this file (set it as the Application startup file).
// Passenger supplies the port via process.env.PORT.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`> Mining License app ready on port ${port}`);
  });
});
