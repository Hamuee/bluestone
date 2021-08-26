var express = require('express');
var router = express.Router();
const puppeteerControl = require('../controller/puppeteer')

/* GET home page. */
router.post('/record', async function (req, res) {
    req.app.locals.puppeteerControl = await puppeteerControl.startRecording(req.app.locals.workflow)
    res.json()
});
router.delete('/record', async function (req, res) {
    await puppeteerControl.endRecording(req.app.locals.puppeteerControl.browser)

    res.json(req.app.locals.workflow)
});
module.exports = router;
