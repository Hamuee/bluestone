const LocatorDefiner = require('./class/LocatorDefiner')
const Operation = require('./class/Operation')
const Workflow = require('./class/Workflow')
const { WorkflowRecord } = require('../record/class')
const path = require('path')
class UI {
    /**
     * 
     * @param {WorkflowRecord} backend 
     */
    constructor(backend) {
        this.backend = backend
        this.locatorDefiner = new LocatorDefiner('', '', '', '', [], -1, this.backend)
        this.operation = new Operation(this.backend)
        this.workflow = new Workflow([], this.backend)

    }
    async updateUserInputForSpy(query) {
        let queryKeys = Object.keys(query)
        //if there is no query, we will just return
        if (queryKeys.length == 0) {
            return
        }
        await this.operation.update(query)
        this.workflow.update(query)
        await this.locatorDefiner.update(query)
        let firstKey = queryKeys[0]
        let firstValue = query[firstKey]
        let targetStep, stepIndex
        switch (firstKey) {
            case Workflow.inBuiltQueryKey.btnEditWorkflow:
                targetStep = this.backend.steps[firstValue]
                this.__repopulateOperationUI(targetStep)
                break
            case Workflow.inBuiltQueryKey.btnResolveLocatorQueryKey:


                this.backend.resolveExistingLocatorInSteps()
                stepIndex = this.backend.findPendingLocatorInStep()
                if (stepIndex != -1) {
                    targetStep = this.backend.steps[stepIndex]
                    await this.refreshLocatorDefiner(targetStep.target, targetStep.htmlPath, targetStep.finalLocatorName, targetStep.finalLocator, targetStep.potentialMatch, stepIndex)
                }
                //update text info
                this.workflow.validateForm(this.backend.steps)
                break

            case Workflow.inBuiltQueryKey.btnLocatorWorkflow:
                stepIndex = Number.parseInt(firstValue)
                targetStep = this.backend.steps[stepIndex]
                await this.refreshLocatorDefiner(targetStep.target, targetStep.htmlPath, targetStep.finalLocatorName, targetStep.finalLocator, targetStep.potentialMatch, stepIndex)
                break
            default:
                break;
        }
    }
    /**
     * Initialize Locator Definer page based on information from current locator information from workflow page
     * @param {string} defaultSelector 
     * @param {string} locatorHtmlPath 
     * @param {string} locatorName 
     * @param {string} locatorSelector 
     * @param {Array<Locator>} potentialMatch 
     * @param {number} stepIndex
     */
    async refreshLocatorDefiner(defaultSelector, locatorHtmlPath, locatorName, locatorSelector, potentialMatch, stepIndex) {
        //convert html path from local file to relative url
        let htmlUrl = this.backend.convertLocalPath2RelativeLink(locatorHtmlPath)

        //create a new object because we are going to modify screenshot key direclty
        /** @type {Array<Locator>} */
        let newPotentialMatch = JSON.parse(JSON.stringify(potentialMatch))
        //copy over locator pictures to temp folder for visualization
        let bluestoneFuncFolder = path.dirname(this.backend.locatorManager.locatorPath)
        for (let i = 0; i < newPotentialMatch.length; i++) {
            let item = newPotentialMatch[i]
            //no pic
            if (item.screenshot == null) {
                continue
            }
            let sourcePath = path.join(bluestoneFuncFolder, item.screenshot)
            let newPicPath = this.backend.getPicPath()
            //check if file path is valid
            try {
                await fs.access(sourcePath);
                await fs.copyFile(sourcePath, newPicPath)

            } catch (err) {
                continue
            }
            newPotentialMatch[i].screenshot = this.backend.getSpySelectorPictureForPug(newPicPath)
        }

        this.locatorDefiner = new LocatorDefiner(defaultSelector, htmlUrl, locatorName, locatorSelector, newPotentialMatch, stepIndex, this.backend)
    }
    /**
     * Based on the current step in the workflow, repopulate operation view
     * @param {RecordingStep} step 
     */
    __repopulateOperationUI(step) {

        let currentGroupKeys = Object.keys(this.backend.operationGroup)
        let findOperation = false
        for (let i = 0; i < currentGroupKeys.length; i++) {
            let groupKey = currentGroupKeys[i]
            /** @type {Array<FunctionAST>} */
            let operations = this.backend.operationGroup[groupKey].operations
            let currentOperation = operations.find(item => {
                if (item == null) return false
                return item.name == step.command
            })

            if (currentOperation != null) {
                this.operation.spy.userSelection.currentGroup = groupKey
                this.operation.spy.userSelection.currentOperation = step.functionAst.name
                this.operation.browserSelection.currentInnerText = step.targetInnerText
                this.operation.browserSelection.currentSelector = step.target
                this.operation.browserSelection.selectorPicture = step.targetPicPath
                this.operation.browserSelection.lastOperationTimeoutMs = step.timeoutMs
                findOperation = true
                break
            }

        }
        if (!findOperation) {
            this.backend.operation.spy.result.isPass = false
            this.backend.operation.spy.result.text = `Unable to find function ${step.command}`
        }
    }

}

module.exports = UI
