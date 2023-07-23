/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 14:38:58
 * @FilePath     : /src/tree.ts
 * @LastEditTime : 2023-07-23 15:27:49
 * @Description  : 导出的文档树的相关数据结构
 */
import { ResGetTreeStat, getTreeStat, sql } from "./api";

export let DocTotalCount: number = 0;
export let DocQueryProgress: number = 0;

export class TreeItem {
    id: DocumentId;
    title: string;
    created: string;
    updated: string;
    stat?: ResGetTreeStat;
    childDocs: TreeItem[];

    constructor(doc: Block) {
        this.id = doc.id;
        this.title = doc.content;
        this.created = doc.created;
        this.updated = doc.updated;
        this.stat = null;
        this.childDocs = [];
    }

    async queryAll_() {
        await this.queryStat_();
        await this.queryChildDocs_();
    }

    async queryStat_() {
        if (!this.id || this.stat !== null) {
            return;
        }
        this.stat = await getTreeStat(this.id);
    }

    async queryChildDocs_() {
        if (!this.id || this.childDocs.length > 0) {
            return;
        }

        let sqlCode = `select * from blocks where path regexp '.*/${this.id}/[0-9a-z\-]+\.sy' and type='d'
        order by path;`;
        let childDocs: Block[] = await sql(sqlCode);
        for (let doc of childDocs) {
            let tree_item = new TreeItem(doc);
            this.childDocs.push(tree_item);
        }
    }

    asJSON(): object {
        return {
            id: this.id,
            title: this.title,
            created: this.created,
            updated: this.updated,
            stat: this.stat,
            childDocs: this.childDocs.map((item) => item.asJSON())
        };
    }

}


/**
 * 一个笔记本 Notebook 下所有的文档树结构
 */
export class NotebookTree {
    timestamp: string;
    id: NotebookId;
    title: string;
    items: TreeItem[];

    constructor(id: NotebookId) {

    }
}
