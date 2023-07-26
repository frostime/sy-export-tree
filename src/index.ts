/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 13:02:40
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2023-07-24 14:26:05
 * @Description  : 导出树状图
 */
import {
    Plugin
} from "siyuan";

import yaml from "json-to-pretty-yaml";


import exportDialog from "./dialog";
import { initDialog } from "./dialog";

import "@/index.scss";

import { sql } from "./api";
import { NotebookTree, queryAll_ } from "./tree";
import { setI18n } from "./utils";


const formatDate = (date: Date): string => {
    return (
        date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours()
        + ':' + date.getMinutes() + ':' + date.getSeconds()
    );
}

export default class ExportTreePlugin extends Plugin {

    onload() {
        this.addIcons(`<symbol id="iconFileTree" viewBox="0 0 1152 1024" ><path d="M128 64C128 28.6 99.4 0 64 0S0 28.6 0 64v704c0 70.6 57.4 128 128 128h384v-128H128V320h384V192H128V64z m448 320c0 35.4 28.6 64 64 64h448c35.4 0 64-28.6 64-64V128c0-35.4-28.6-64-64-64h-197.4c-17 0-33.2-6.8-45.2-18.8L818.8 18.8c-12-12-28.2-18.8-45.2-18.8H640c-35.4 0-64 28.6-64 64v320z m0 576c0 35.4 28.6 64 64 64h448c35.4 0 64-28.6 64-64V704c0-35.4-28.6-64-64-64h-197.4c-17 0-33.2-6.8-45.2-18.8l-26.6-26.6c-12-12-28.2-18.8-45.2-18.8H640c-35.4 0-64 28.6-64 64V960z" p-id="4360"></path></symbol>`);
        setI18n(this.i18n);
        initDialog(this);
        this.addTopBar({
            icon: "iconFileTree",
            title: this.i18n.iconTitle,
            callback: async () => {
                const sqlCode = 'select count(*) as count from blocks where type="d";';
                let query = await sql(sqlCode);
                console.log(query[0].count);
                exportDialog.reset(query[0].count);
                exportDialog.doExport();
            }
        });
        this.addStatusBar({
            element: exportDialog.statusBarItem,
            position: 'right'
        });
    }


    async exportTree() {
        let start = new Date().getTime();
        let end = start;
        let tree: NotebookTree[] = await queryAll_();
        end = new Date().getTime();
        console.log(`Retireving tree cost: ${(end - start) / 1000}s`);

        console.log('Got')
        let res = {
            documentCount: 0,
            exportTime: formatDate(new Date()),
        };
        let notebooksList = [];
        for (let notebook of tree) {
            // res[notebook.notebook.id] = notebook.asJSON();
            notebooksList.push(notebook.asJSON());
            res.documentCount += notebook.documentCount;
        }
        res['notebooks'] = notebooksList;
        console.log(res);

        //使用 i18n 替换所有 key, 递归遍历
        const replaceKey = (obj: any) => {
            if (Array.isArray(obj)) {
                let newObj = [];
                for (let item of obj) {
                    newObj.push(replaceKey(item));
                }
                return newObj;
            } else if (typeof obj === 'object') {
                let newObj = {};
                for (let key in obj) {
                    let newKey = this.i18n[key];
                    newKey = newKey ? newKey : key;
                    newObj[newKey] = replaceKey(obj[key]);
                }
                return newObj;
            } else {
                return obj;
            }
        }
        let newObj = replaceKey(res);
        // let newObj = res;

        let yml = yaml.stringify(newObj);
        //download
        let blob = new Blob([yml], { type: "text/plain;charset=utf-8" });
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;

        let userName = window.siyuan.user.userName;
        userName = userName ? `@${userName}` : '';
        let timestamp = formatDate(new Date()).replace(/[:]/g, '_');

        a.download = `SiYuan${userName}-${timestamp}.yml`;
        // a.click(); //#TODO 重新开启
        exportDialog.hide();
    }
}