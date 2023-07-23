/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 16:25:46
 * @FilePath     : /src/dialog.ts
 * @LastEditTime : 2023-07-23 18:03:00
 * @Description  : 
 */
import { Dialog } from "siyuan";


class ExportDialog {
    label: HTMLDivElement;
    progress: HTMLProgressElement;

    max: number = 0;
    value: number = 0;

    reset(max: number = 0) {
        this.max = max;
        this.value = 0;
        // this.update();
        this.progress = null;
    }

    show() {
        const html = `
        <div id="export-dialog" style="margin: 1rem; display: flex; flex-direction: column; flex: 1;">
            <div style="display: flex; margin-bottom: 5px; flex: 1">
                <div style="text-align: left">正在导出文档树...</div>
                <div style="text-align: right; flex: 1" id="progressLabel">${this.value}/${this.max}</div>
            </div>
            <div style=" flex: 1"> <progress value=${this.value} max=${this.max}>  </progress> </div>
        </div>
        `;
        let dialog = new Dialog({
            title: "导出树状图",
            content: html,
            width: '25rem',
            height: '10rem',
        });
        this.label = dialog.element.querySelector('#progressLabel');
        this.progress = dialog.element.querySelector('progress');
        this.progress.style.width = '100%';
        // this.progress.style.color = 'var(--b3-theme-primary)';
        //background color
        // this.progress.style.background = 'var(--b3-theme-primary)';
    }

    increase() {
        this.value++;
        this.update();
    }

    update() {
        this.progress.value = this.value;
        this.progress.max = this.max;
        this.label.innerText = `${this.value}/${this.max}`;
    }
}

let dialog = new ExportDialog();
export default dialog;
