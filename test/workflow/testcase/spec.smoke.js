const assert = require('assert')
const TestSite = require('../support/testSite.support')
let Bluestone = require('../support/bluestoneBackend')

//EHM-W: We send a request to a testing site
let siteBackend = new TestSite()

//EHM-W: We send a request to a Bluestone's router
let bluestoneBackend = new Bluestone()
let testConfig = require('../testConfig')
let fs = require('fs').promises
const fsCb = require('fs')
const path = require('path')
describe('Smoke Test - Integration', () => {
    const suite = this;
    beforeEach(async function () {
        //EHM-W: We add timeoutnfor each it function
        this.timeout(60000)

        //EHM-W: siteBackend asure that all test are in the same site 
        siteBackend = new TestSite()
        await siteBackend.launchApp()
        bluestoneBackend = new Bluestone()

        //EHM-W: Lunch the Bluestone
        await bluestoneBackend.launchApp()
    })
    after(function (done) {
        this.timeout(12000);

        let directory = path.join(__dirname, '../../../public/temp/componentPic')
        fsCb.readdir(directory, (err, files) => {
            if (err) throw err;
            let deleteQueue = []
            for (const file of files) {
                if (file == '.placeholder') continue

                deleteQueue.push(fs.unlink(path.join(directory, file)))
            }
            //wait until all delete is done
            Promise.all(deleteQueue)
                .then(() => {
                    done()
                })
                .catch(err => {
                    console.log(err)
                })



        });
    })
    it('should launch test harness and bluestone correctly', async () => {
        console.log("Hola" + 1)
        let res = await siteBackend.getMainPage()
        assert.strictEqual(res.status, 200, 'test harness site should launched')

        res = await bluestoneBackend.getMainPage()
        assert.strictEqual(res.status, 200, 'bluestone backend should launched')


    }).timeout(60000)
    it('should record click, change,  and call bluestone console correctly', async () => {
        console.log("Hola" + 2)
        //EHM-Q: happyPathPage?
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        //EHM-H: How to send operation to the website
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)
        await new Promise(resolve => setTimeout(resolve, 1000))
        let res = await bluestoneBackend.getPageCount()

        assert.strictEqual(res.data.value, 3)
        // await new Promise(resolve => setTimeout(resolve, 500000))

    }).timeout(10000000)
    it('should correlate existing locator when hovering defined element', async () => {
        console.log("Hola" + 3)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('mouseover', happyPathPage.header)
        await new Promise(resolve => setTimeout(resolve, 1000))
        let res = await bluestoneBackend.getBackendOperation()
        let baseline = require('../input/mouseover_header_steps');
        //override data which is irrelevant
        let currentData = res.data
        delete currentData['atomicTree']
        assert.deepStrictEqual(currentData, baseline)
    }).timeout(5000)
    it('should not correlate locator when hovering undefined element', async () => {
        console.log("Hola" + 4)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('mouseover', happyPathPage.paragraph)
        await new Promise(resolve => setTimeout(resolve, 1000))
        res = await bluestoneBackend.getBackendOperation()
        let baseline = require('../input/mouseover_undefined_element_step');
        //override data which is irrelevant
        let currentData = res.data
        delete currentData['atomicTree']
        assert.deepStrictEqual(currentData, baseline)
    }).timeout(10000)
    it('should record click event in steps correct', async () => {
        console.log("Hola" + 5)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.paragraph)
        await new Promise(resolve => setTimeout(resolve, 800))
        await siteBackend.sendOperation('click', happyPathPage.header)
        await new Promise(resolve => setTimeout(resolve, 800))

        let res = await bluestoneBackend.getSteps()
        let currentData = res.data
        let baseline = require('../input/mouseclick_steps');
        currentData.forEach(item => item.timeStamp = null)
        currentData.forEach(item => delete item['healingTree'])
        currentData.forEach(item => {
            let param = item.functionAst.params.find(param => param.name == 'healingSnapshot')
            if (param != null) {
                param.value = ''
            }

        })
        baseline.forEach(item => item.timeStamp = null)
        assert.deepStrictEqual(currentData, baseline)
        // await new Promise(resolve => setTimeout(resolve, 80000))


    }).timeout(500000)
    afterEach(function (done) {
        this.timeout(120000)
        siteBackend.closeApp()
            .then(() => {
                return bluestoneBackend.stopRecording()
            })
            .then(() => {
                return bluestoneBackend.closeApp()
            })
            .then(() => {
                done()
            })
            .catch(err => {
                console.log(err)
            })
    })
})