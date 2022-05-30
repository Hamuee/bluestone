const puppeteer = require('puppeteer')
const TestSite = require('../support/testSite.support')
let Bluestone = require('../support/bluestoneBackend')

//EHM-W: We send a request to a testing site
let siteBackend = new TestSite()

//EHM-W: We send a request to a Bluestone's router
let bluestoneBackend = new Bluestone()
let testConfig = require('../testConfig')

describe('Smoke Test - Operation Page', () =>{
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
    it('should change selector in the backend once selector value is changed in the Bluestone console', async () => {
        this.timeout(99999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log("Hamue")
        let res = await bluestoneBackend.getPageCount()
    })
})