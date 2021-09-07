const path = require('path')
const config = require('../../config')
const fs = require('fs')
class Locator {
    /**
     * Initialize new locator object
     * @param {string} locators xpath or css selector
     * @param {string} screenshot  path to the screenshot
     * @param {string} path  path specific locator object
     */
    constructor(locators, screenshot, path) {
        this.Locator = locators
        this.screenshot = screenshot
        this.path = path
    }
}

class LocatorManager {
    /**
     * Create Locator Manager Class
     * @param {string} locatorPath path to bluestone-locator.js
     */
    constructor(locatorPath) {
        /** @type {Array<Locator>} */
        this.locatorLibrary = []
        this.locatorPath = locatorPath
        this.__parseLocator(locatorPath)
        this.searchLocatorSet = this.RefreshSearchLocatorSet()
    }
    /**
     * Load bluestone-locator.js and return locatorLibrary function
     * @param {*} path 
     * @returns {{Array<Locator>}
     */
    __parseLocator(path) {
        let locatorObj = require(path)
        //recursively go through all json node and create mapping
        this.__iterateThroughObject(locatorObj, [])
    }
    /**
     * Iterate through locator object and generate a array of Locator Obj
     * @param {*} currentObj 
     * @param {Array<string>} currentPathList 
     */
    __iterateThroughObject(currentObj = {}, currentPathList = []) {
        let keyList = Object.keys(currentObj)
        for (let i = 0; i < keyList.length; i++) {
            let key = keyList[i]
            let value = currentObj[key]

            //if current value is a string, go with next key
            if (typeof value === 'string' || value instanceof String) {
                continue
            }

            //if current node contains locator attribute and that happen to be an array, push result into library            
            let newPath = []
            try {
                newPath = JSON.parse(JSON.stringify(currentPathList))
                newPath.push(key)
            } catch (error) {
                console.log(error)
            }

            let potentialLocator = value['locator']
            if (potentialLocator != null && Array.isArray(potentialLocator) && potentialLocator.length > 0) {


                let newLocator = new Locator(value['locator'], value['screenshot'], newPath)
                this.locatorLibrary.push(newLocator)
                continue
            }

            this.__iterateThroughObject(value, newPath)
        }
    }

}
module.exports = { LocatorManager, Locator }