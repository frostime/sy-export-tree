/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 16:25:46
 * @FilePath     : /src/dialog.ts
 * @LastEditTime : 2023-07-23 18:48:37
 * @Description  : 
 */
import { Dialog } from "siyuan";


class ExportDialog {
    ilabel: HTMLDivElement;
    plabel: HTMLDivElement;
    progress: HTMLProgressElement;

    max: number = 0;
    value: number = 0;

    dialog: Dialog;

    reset(max: number = 0) {
        this.max = max;
        this.value = 0;
        // this.update();
        this.progress = null;
        this.dialog = null;
    }

    show(confirm?: () => void, cancel?: () => void) {
        const html = `
        <div class="b3-dialog__content" style="display: flex; margin-bottom: 5px; flex: 1;" id="confirm-dialog">开始导出?</div>
        <div class="b3-dialog__content" id="export-dialog" style="margin: 1rem; display: none; flex-direction: column; flex: 1;">
            <div style="display: flex; margin-bottom: 5px; flex: 1;">
                <div style="text-align: left" id="infoLabel">导出文档树...</div>
                <div style="text-align: right; flex: 1" id="progressLabel">${this.value}/${this.max}</div>
            </div>
            <div style=" flex: 1"> <progress value=${this.value} max=${this.max}>  </progress> </div>
        </div>
        <div class="b3-dialog__action">
            <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
            <button class="b3-button b3-button--text" id="confirmDialogConfirmBtn">${window.siyuan.languages.confirm}</button>
        </div>
        `;
        this.dialog = new Dialog({
            title: "导出所有文档树结构",
            content: html,
            width: '25rem',
            // height: '17rem',
        });
        let dialog = this.dialog;
        this.ilabel = dialog.element.querySelector('#infoLabel');
        this.plabel = dialog.element.querySelector('#progressLabel');
        this.progress = dialog.element.querySelector('progress');
        this.progress.style.width = '100%';
        // this.progress.style.color = 'var(--b3-theme-primary)';
        //background color
        // this.progress.style.background = 'var(--b3-theme-primary)';
        const btnsElement = dialog.element.querySelectorAll(".b3-button");
        btnsElement[0].addEventListener("click", () => {
            if (cancel) {
                cancel();
            }
            dialog.destroy();
        });
        btnsElement[1].addEventListener("click", () => {
            if (confirm) {
                let ele: HTMLDivElement = dialog.element.querySelector('#confirm-dialog');
                ele.style.display = 'none';
                ele = dialog.element.querySelector('#export-dialog');
                ele.style.display = 'flex';
                confirm();
            }
            // dialog.destroy();
        });
    }

    hide() {
        this.dialog.destroy();
        this.reset();
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

let dialog = new ExportDialog();
export default dialog;
