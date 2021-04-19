/*
 * @Author: FuWenHao  
 * @Date: 2021-04-17 16:10:07 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-04-19 16:02:17
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { copyProject, replaceInfo } from './util';
import * as fs from 'fs';
/**
 * local temaple, new project
 * @param tplInfo 
 * @param options 
 */
export default async function localMode(tplInfo: any, options: any): Promise<string> {
  try {
    let newProPath = path.join(options.savePath, options.name);
    if (fs.existsSync(newProPath)) { throw new Error('The project file already exists') };

    let tplPath = path.join(__dirname, '../../templates/simple_tpl');
    await copyProject(tplPath, newProPath);
    await replaceInfo(newProPath, options);
    return newProPath
  } catch (err) {
    console.log("local template new project error:", err);
    throw err
  }
}

