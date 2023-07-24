/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 16:25:46
 * @FilePath     : /src/dialog.ts
 * @LastEditTime : 2023-07-24 14:44:20
 * @Description  : 
 */
import { confirm } from "siyuan";
import { i18n } from "./utils";
import type ExportTreePlugin from "./index";


class ExportDialog {
    statusBarItem: HTMLDivElement;
    plabel: HTMLDivElement;
    progress: HTMLProgressElement;

    max: number = 100;
    value: number = 0;

    plugin: ExportTreePlugin;

    constructor() {
        const html = `
        <div id="export-tree" style="display: flex;">
        <label style="">${i18n.exporting}</label>
            <div style="width: 100px;">
                <progress value=${this.value} max=${this.max}>  </progress>
            </div>
            <label style="" id="progressLabel">${this.value}/${this.max}</label>
        </div>
        `;
        this.statusBarItem = document.createElement('div');
        this.statusBarItem.innerHTML = html;
        this.plabel = this.statusBarItem.querySelector('#progressLabel');
        this.progress = this.statusBarItem.querySelector('progress');
        this.progress.style.width = '100%';
        this.hide();
    }

    reset(max: number = 0) {
        this.max = max;
        this.value = 0;
        // this.update();
    }

    doExport() {
        confirm(i18n.iconTitle, i18n.startExport, () => {
            this.statusBarItem.style.display = 'flex';
            this.plugin.exportTree();
        });
    }

    hide() {
        this.statusBarItem.style.display = 'none';
    }

    increase() {
        this.value++;
        this.update();
    }

    update() {
        this.progress.value = this.value;
        this.progress.max = this.max;
        this.plabel.innerText = `${this.value}/${this.max}`;
    }
}

let dialog: ExportDialog;

function initDialog(plugin: ExportTreePlugin) {
    dialog = new ExportDialog();
    dialog.plugin = plugin;
}

export default dialog;
export { initDialog };
