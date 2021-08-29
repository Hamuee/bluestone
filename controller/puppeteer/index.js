const puppeteer = require('puppeteer-core')
const config = require('../../config')
const logEvent = require('./exposure/logEvent')
const isRecording = require('./exposure/isRecordng')
const logCurrentElement = require('./exposure/logCurrentElement')
const path = require('path')
const fs = require('fs').promises
const { RecordingStep, WorkflowRecord } = require('../record/class')
/**
 * Create a new puppeteer browser instance
 * @param {import('../record/class/index').WorkflowRecord}
 */
async function startRecording(record) {
    const browser = await puppeteer.launch(config.puppeteer)
    const page = await browser.newPage();

    //inject event watcher and expose supporting function
    let eventRecorderPath = path.join(__dirname, './injection/eventRecorder.js')
    let eventRecorderScript = (await fs.readFile(eventRecorderPath)).toString()
    let registerEvent = async function (eventRecorderScript) {
        setTimeout(() => {
            //add script block
            let finderScript = document.createElement("script");
            finderScript.setAttribute('type', 'module')
            finderScript.innerHTML = eventRecorderScript
            document.body.appendChild(finderScript);

        }, 300)

    }
    await page.evaluateOnNewDocument(registerEvent, eventRecorderScript)
    await page.exposeFunction('logEvent', logEvent(record, page))
    await page.exposeFunction('isRecording', isRecording(record))
    await page.exposeFunction('logCurrentElement', logCurrentElement(record))
    page.on('load', (event, WorkflowRecord) => {
        try {
            page.evaluate(() => {
                //add iframe
                setTimeout(() => {
                    let bluestone_inbrowser_console = document.getElementById('bluestone_inbrowser_console')
                    console.log(bluestone_inbrowser_console)
                    if (bluestone_inbrowser_console != null) return
                    bluestone_inbrowser_console = document.createElement("iframe");
                    bluestone_inbrowser_console.setAttribute('id', 'bluestone_inbrowser_console')
                    bluestone_inbrowser_console.setAttribute('src', 'http://localhost:3600/spy')
                    document.body.appendChild(bluestone_inbrowser_console);
                }, 300);

            })
        } catch (error) {
            console.log()
        }
    })


    //record goto operation
    browser.on('targetchanged', target => {
        let eventStep = new RecordingStep({ command: 'goto', target: target.url() })
        logEvent(record)(eventStep)


    })


    return { browser, page }
}
/**
 * Close the puppeteer browser
 * @param {import('puppeteer').Browser} browser 
 */
async function endRecording(browser) {
    await browser.close()
}

module.exports = { startRecording, endRecording }