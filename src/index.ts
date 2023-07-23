/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 13:02:40
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2023-07-23 17:45:47
 * @Description  : 导出树状图
 */
import {
    Plugin
} from "siyuan";

import yaml from "json-to-pretty-yaml";

import "@/index.scss";

import { getBlockByID } from "./api";
import { NotebookTree, queryAll_, TreeItem } from "./tree";

export default class ExportTreePlugin extends Plugin {

    onClickDockIconBindThis = this.onClickDocIcon.bind(this);

    onload() {
        this.addIcons(`<symbol id="iconFileTree" viewBox="0 0 1152 1024" ><path d="M128 64C128 28.6 99.4 0 64 0S0 28.6 0 64v704c0 70.6 57.4 128 128 128h384v-128H128V320h384V192H128V64z m448 320c0 35.4 28.6 64 64 64h448c35.4 0 64-28.6 64-64V128c0-35.4-28.6-64-64-64h-197.4c-17 0-33.2-6.8-45.2-18.8L818.8 18.8c-12-12-28.2-18.8-45.2-18.8H640c-35.4 0-64 28.6-64 64v320z m0 576c0 35.4 28.6 64 64 64h448c35.4 0 64-28.6 64-64V704c0-35.4-28.6-64-64-64h-197.4c-17 0-33.2-6.8-45.2-18.8l-26.6-26.6c-12-12-28.2-18.8-45.2-18.8H640c-35.4 0-64 28.6-64 64V960z" p-id="4360"></path></symbol>`);
        this.addTopBar({
            icon: "iconFileTree",
            title: "导出树状图",
            callback: async () => {
                let tree: NotebookTree[] = await queryAll_();
                console.log('Got')
                let res = {
                    documentCount: 0
                };
                let notebooksList = [];
                for (let notebook of tree) {
                    // res[notebook.notebook.id] = notebook.asJSON();
                    notebooksList.push(notebook.asJSON());
                    res.documentCount += notebook.documentCount;
                }
                res['notebooks'] = notebooksList;
                console.log(res);
                let yml = yaml.stringify(res);
                //download
                let blob = new Blob([yml], { type: "text/plain;charset=utf-8" });
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement("a");
                a.href = url;
                a.download = "tree.yml";
                a.click();
            }
        });
        this.eventBus.on('click-editortitleicon', this.onClickDockIconBindThis);
    }

    async onClickDocIcon({ detail }) {
        let rootID = detail?.data?.rootID;
        if (rootID) {
            console.log(rootID);
            let block: Block = await getBlockByID(rootID);
            let tree_item = new TreeItem(block);
            await tree_item.queryAll_();
            console.log(tree_item.asJSON());
        }
    }
}