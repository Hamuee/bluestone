const { Locator } = require('../../locator/index')
const StepResult = require('../../mocha/class/StepResult')
const FunctionAST = require('../../ast/class/Function')
const HtmlCaptureStatus = require('./HtmlCaptureStatus')
const fs = require('fs').promises
const path = require('path')
class RecordingStep {
    /** 
     * @param {step} recordingStep 
     */
    constructor(recordingStep) {
        //EHM: Command is the action (Example: click,deleteAllCatchReports)
        this.command = recordingStep.command

        //EHM: target is the webelement's class (when the locator IS NOT been defined)
        //EHM: target is the locator (when the locator IS been defined) 
        this.target = recordingStep.target
        /** @type {Array<string>} */

        //EHM: ¿What is iframe?
        this.iframe = recordingStep.iframe
        if (typeof (recordingStep.iframe) == 'string') {
            this.iframe = JSON.parse(recordingStep.iframe)
        }

        /** @type {Array<Locator>} */
        //EHM potentialMatch include the screenshot image of all page
        this.potentialMatch = recordingStep.potentialMatch

        
        this.framePotentialMatch = recordingStep.framePotentialMatch
        
        //EHM htmlPath is the HTML structure
        this.__htmlPath = recordingStep.htmlPath

        //EHM recordingStep.targetInnerText is the webelement's text
        this.targetInnerText = recordingStep.targetInnerText

        //EHM potentialMatch include the screenshot image of the web element
        this.targetPicPath = recordingStep.targetPicPath
        
        //EHM timeoutMs is the miliseconds that Bluestone is going to wait to make the action
        this.timeoutMs = recordingStep.timeoutMs
        this.meta = {}

        this.finalLocatorName = ''
        if (recordingStep.finalLocatorName) {
            this.finalLocatorName = recordingStep.finalLocatorName
        }
        this.finalLocator = ['']
        if (recordingStep.finalLocator) {
            this.finalLocator = recordingStep.finalLocator
        }
        
        //EHM: functionAst is function's step (Example: waitElementExists, deleteAllCatchReports )
        this.functionAst = recordingStep.functionAst
        if (this.functionAst) {
            this.parameter = JSON.parse(JSON.stringify(recordingStep.functionAst.params))
        }

        //EHM: StepResult Indicate if the execution of the step in the workflow was successful or not
        this.result = new StepResult()
        this.timeStamp = recordingStep.timestamp
        if (this.timeStamp == null) {
            this.timeStamp = recordingStep.timeStamp
        }
        this.scriptLineNumber = recordingStep.scriptLineNumber

        //EHM: healingTreeStore information of previos script and try to resolve this issue in the current script with a old script 
        this.healingTree = recordingStep.healingTree
    }
    /**
     * //based on the searalized json file, re-create object
     * @param {object} json 
     * @param {FunctionAST} functionAst 
     * @param {string} command 
     * @returns {RecordingStep}
     */
    static restore(json, functionAst, command) {
        json.functionAst = functionAst
        let result = new RecordingStep(json)
        let keys = Object.keys(json)
        keys.forEach(key => {
            result[key] = json[key]
        })
        result.command = command
        return result
    }
    get htmlPath() {
        return this.__htmlPath
    }
    set htmlPath(path) {
        this.__htmlPath = path
    }
    setFinalLocator(finalLocatorName, finalLocator) {
        this.finalLocatorName = finalLocatorName
        this.finalLocator = finalLocator
    }
    /**
     * Update the html capture and change its index based on its location in htmlCapture repo
     * @param {Number} offSet 
     * @param {HtmlCaptureStatus} htmlCaptureRepo 
     */
    updateHtmlForStep(offSet, htmlCaptureRepo) {
        this.__htmlPath = htmlCaptureRepo.getHtmlByPath(this.__htmlPath, offSet)

    }
}
/**
 * @typedef step
 * @property {'click'|'change'|'dblclick'|'keydown'|'goto'|'upload'|'waitForDownloadComplete'|'waitAndHandleForAlert'} command
 * @property {string} target
 * @property {Array<ExistingSelector>} matchedSelector
 * @property {number} timeoutMs
 * @property {string} htmlPath
 * @property {string} targetPicPath
 * @property {Array<string>} iframe
 * @property {import('../../ast/class/Function')} functionAst
 * @property {Array<RecordingStep>} potentialMatch
 * @property {Array<RecordingStep>} framePotentialMatch
 * @property {number} timestamp
 * @property {number} currentSelectedIndex
 * @property {number} scriptLineNumber
 * @property {string} healingTree
 */
module.exports = RecordingStep