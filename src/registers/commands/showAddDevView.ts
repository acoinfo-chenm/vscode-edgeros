/*
 * @Author: FuWenHao
 * @Date: 2021-04-12 20:00:47
 * @Last Modified by: FuWenHao
 * @Last Modified time: 2021-06-07 14:06:39
 */
import * as vscode from 'vscode'
import * as ejs from 'ejs'
import * as path from 'path'
import * as common from '../../lib/common'
import * as config from '../../lib/config'
import { EOSTreeItem } from '../../lib/class/EOSTreeItem'
import nlsConfig from '../../lib/nls'
import { getGlobalState, setGlobalState } from '../../common'
const localize = nlsConfig(__filename)
/**
 *command:  edgeros.showAddDevView
 *show add device page
 */
export = function (context: vscode.ExtensionContext) {
  // addDevView example
  let currentPanel: vscode.WebviewPanel | undefined
  const disposable = vscode.commands.registerCommand('edgeros.showAddDevView', async (...options: EOSTreeItem[]) => {
    try {
      const devsArray = getGlobalState(context) || []
      const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined
      // Do not open it repeatedly
      if (currentPanel) {
        currentPanel.reveal(columnToShowIn)
      } else {
        currentPanel = vscode.window.createWebviewPanel('addDeviceView', 'Add Device', vscode.ViewColumn.One, {
          enableScripts: true
        })
        const webViewFileName = 'addDevice'
        const assetUris = await common.getWebViewBaseUris(webViewFileName, currentPanel, context)
        const indexCssUri = common.changeUri(currentPanel, path.join(context.extensionPath, 'view', webViewFileName, 'index.css'))
        // set html str
        currentPanel.webview.html = await ejs.renderFile(path.join(context.extensionPath, 'view', webViewFileName, 'view.ejs'), {
          ...assetUris,
          indexCssUri: indexCssUri,
          language: {
            devIpTxt: localize('devIp.txt', 'Device IP'),
            devNameTxt: localize('devName.txt', 'Device Name'),
            devPwdTxt: localize('devPwd.txt', 'Device Password'),
            devLoginPwdText: localize('devLoginPwd.txt', 'Device Login Password'),
            addDeviceText: localize('addDevice.txt', 'Add Device'),
            ipNotEmptyText: localize('ipNotEmpty.Text', 'IP Not Empty'),
            ipIncorrectFormatText: localize('ipIncorrectFormat.text', 'IP Incorrect Format'),
            devNameNotEmptyText: localize('devNameNotEmpty.Text', 'Device Name Not Empty'),
            devNameExistText: localize('devNameExist.Text', 'Device Name Exist')
          }
        })
        currentPanel.iconPath = vscode.Uri.parse(config.edgerosLogo)
        currentPanel.webview.onDidReceiveMessage(
          async message => {
            // add Device
            if (message.type === 'addDev') {
              devsArray.push(message.data)
              await setGlobalState(context, devsArray)
              await vscode.commands.executeCommand('edgeros.refreshThreeView')
              currentPanel?.dispose()
            } else if (message.type === 'getDeviceData') { // return device List
              currentPanel?.webview.postMessage({
                type: '_getDeviceData',
                data: {
                  devices: devsArray
                }
              })
            }
          },
          undefined,
          context.subscriptions
        )
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined
          },
          null,
          context.subscriptions
        )
      }
    } catch (err) {
      console.error(err)
    }
  })
  context.subscriptions.push(disposable)
};
