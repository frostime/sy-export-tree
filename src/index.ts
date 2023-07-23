/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 13:02:40
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2023-07-23 17:19:14
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
        this.addIcons(`<symbol id="iconFileTree" viewBox="0 0 1024 1024" ><path d="M358.4 0h636.344C1014.24 0 1024 11.376 1024 34.136v187.728c0 22.76-9.752 34.136-29.256 34.136H358.4c-19.504 0-29.256-11.376-29.256-34.136V34.136C329.144 11.376 338.896 0 358.4 0z m182.856 384h453.488c19.504 0 29.256 11.376 29.256 34.136v187.728c0 22.76-9.752 34.136-29.256 34.136H541.256C521.76 640 512 628.624 512 605.864V418.136C512 395.376 521.752 384 541.256 384z m0 384h453.488c19.504 0 29.256 11.376 29.256 34.136v187.728c0 22.76-9.752 34.136-29.256 34.136H541.256C521.76 1024 512 1012.624 512 989.864v-187.728C512 779.376 521.752 768 541.256 768zM402.288 546.136c16.16 0 29.256-15.28 29.256-34.136 0-18.848-13.104-34.136-29.256-34.136H138.96V256h51.2c16.16 0 29.264-15.28 29.264-34.136V34.136C219.432 15.28 206.32 0 190.16 0H29.256C13.096 0 0 15.28 0 34.136v187.728C0 240.72 13.096 256 29.256 256h51.2v640c0 18.848 13.104 34.136 29.256 34.136h292.576c16.16 0 29.256-15.28 29.256-34.136 0-18.848-13.104-34.136-29.256-34.136H138.96V546.136h263.32z" p-id="4605"></path></symbol>`);
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