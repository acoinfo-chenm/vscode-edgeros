import * as vscode from 'vscode'
import * as net from 'net'
import * as config from './config'
import { sendEdgerOSOutPut } from './common'
let channel: vscode.OutputChannel
let connectStatusBar: vscode.StatusBarItem
let tcpClient: net.Socket | undefined
let initiativeClose: Boolean = false
let lastDevice: any
/**
 * 打开open console
 * @param device
 */
export function openConsle (device: any): boolean {
  if (!channel) {
    connectStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
    channel = vscode.window.createOutputChannel('EdgerOS Console')
  }
  channel.show()

  if (!tcpClient || tcpClient?.destroyed === true) {
    initiativeClose = false
    lastDevice = device

    console.log(`TCP Connect Relinking  2s[TimeOut] count:>${1}`)
    connectStatusBar.text = `$(sync~spin) try connect ( ${1} ) [ ${device.devName} ]`
    connectStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
    connectStatusBar.tooltip = 'click connecting'
    connectStatusBar.command = undefined
    connectStatusBar.show()

    getTcpClientInstance(device, 1, channel, connectStatusBar)
    return true
  } else {
    sendEdgerOSOutPut(`
    ================= TCP Channal Occupy ${lastDevice.devName} =================
    EdgerOS LOG Error: TCP the connection already exists deviceName [${lastDevice.devName}]
    `)
    vscode.window.showErrorMessage(`TCP Channal Occupy [${lastDevice.devName}]`)
    return false
  }
}
/**
 * 根据device 建立tcp通讯
 * @param device
 * @param reconnection
 * @param channel
 * @param connectStatusBar
 */
function getTcpClientInstance (
  device: any,
  reconnection: number = 1,
  channel: vscode.OutputChannel,
  connectStatusBar: vscode.StatusBarItem
) {
  // intevalTime KeepAlive
  let keepAliveTime: NodeJS.Timeout
  tcpClient = net.createConnection({
    port: config.edgerosConsolePort,
    host: device.devIp,
    timeout: 3000
  }, () => {
    keepAliveTime = setInterval(() => {
      // console.log('send keepAlive')
      tcpClient?.write('hello edgeros')
    }, 5000)
    channel.show()
    reconnection = 1
    console.log('connected to server' + `:${device.devIp} [TCP]`)
    connectStatusBar.text = `$(link)  [ ${device.devName} : ${device.devIp} ]`
    connectStatusBar.tooltip = 'click_disconnect'
    connectStatusBar.command = 'edgeros.closeConsole'
    connectStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.debuggingBackground')
    connectStatusBar.show()
  })
  tcpClient.setKeepAlive(true, 1000)
  // 接收数据
  tcpClient.on('data', function (data) {
    let str: string = data.toString('UTF-8', 0, data.length - 1)
    str = replaceSpacielChar(str)
    channel.append(str)
  })
  tcpClient.on('error', function (err: any) {
    console.log('Error事件触发！', err)
  })
  tcpClient.on('close', function () {
    clearInterval(keepAliveTime)
    console.log(`TCP ${device.devName}:${device.devIp} end disconnect [Close]`)
    if (reconnection > 3 || initiativeClose) {
      console.log('TCP the maximum number of connections is exceeded or initiative close')
      connectStatusBar.text = `$(debug-disconnect)  [ ${device.devName} : ${device.devIp} ] `
      connectStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
      connectStatusBar.tooltip = 'click reconnect'
      connectStatusBar.command = 'edgeros.openConsole'
      connectStatusBar.show()
      tcpClient = undefined
    } else {
      console.log(`TCP Connect Relinking  2s[TimeOut] count:>${reconnection}`)
      connectStatusBar.text = `$(sync~spin) try connect ( ${reconnection} ) [ ${device.devName} ]`
      connectStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
      connectStatusBar.tooltip = 'click connecting'
      connectStatusBar.command = undefined
      connectStatusBar.show()
      reconnection++
      setTimeout(() => {
        getTcpClientInstance(device, reconnection, channel, connectStatusBar)
      }, 3000)
    }
  })
}

export function closeConsle () {
  if (!tcpClient?.destroyed) {
    initiativeClose = true
    tcpClient?.destroy()
    tcpClient = undefined
  }
}

/**
 * Clear the VT100 flag
 * @param str
 * @returns
 */
function replaceSpacielChar (str: string): string {
  // eslint-disable-next-line no-control-regex
  str = str.replace(/\x1b\[(\d+|\d+;\d+)m{1}/gim, '')
  return str
}
