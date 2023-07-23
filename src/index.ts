import {
    Plugin
} from "siyuan";
import "@/index.scss";

export default class ExportTreePlugin extends Plugin {
    onload() {
        this.addIcons(`<symbol id="iconFileTree" viewBox="0 0 32 32"><path fill="#000000" fill-rule="evenodd" d="M1,1 C1,0.447715 1.44772,0 2,0 L8,0 C8.55228,0 9,0.447715 9,1 L9,5 C9,5.55228 8.55228,6 8,6 L6,6 L6,8 L10,8 C10,7.44772 10.4477,7 11,7 L14,7 C14.5523,7 15,7.44772 15,8 L15,10 C15,10.5523 14.5523,11 14,11 L11,11 C10.4477,11 10,10.5523 10,10 L6,10 L6,13 L10,13 C10,12.4477 10.4477,12 11,12 L14,12 C14.5523,12 15,12.4477 15,13 L15,15 C15,15.5523 14.5523,16 14,16 L11,16 C10.4477,16 10,15.5523 10,15 L5,15 C4.44772,15 4,14.5523 4,14 L4,6 L2,6 C1.44772,6 1,5.55228 1,5 L1,1 Z M3,4 L3,2 L7,2 L7,4 L3,4 Z"/></symbol>`);
        this.addTopBar({
            icon: "iconFileTree",
            title: "导出树状图",
            callback: () => {}
        })
    }
}