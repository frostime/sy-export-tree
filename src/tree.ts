/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 14:38:58
 * @FilePath     : /src/tree.ts
 * @LastEditTime : 2023-07-23 17:30:45
 * @Description  : 导出的文档树的相关数据结构
 */
import { ResGetTreeStat, getTreeStat, sql, lsNotebooks } from "./api";

export let DocTotalCount: number = 0;
export let DocQueryProgress: number = 0;

export class TreeItem {
    id: DocumentId;
    title: string;
    created: string;
    updated: string;
    stat?: ResGetTreeStat;
    childDocsCount: number = 0;
    offspringDocsCount: number = 0;
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
        DocQueryProgress++;
        for (let childDoc of this.childDocs) {
            await childDoc.queryAll_();
            this.offspringDocsCount += childDoc.offspringDocsCount;
        }
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
        this.childDocsCount = childDocs.length;
        this.offspringDocsCount = this.childDocsCount;
        for (let doc of childDocs) {
            let tree_item = new TreeItem(doc);
            this.childDocs.push(tree_item);
            // await tree_item.queryAll_();
            // this.offspringDocsCount += tree_item.offspringDocsCount;
        }
    }

    asJSON(): object {
        let stat: object = this.stat;
        for (let key in stat) {
            if (stat[key] === 0) {
                //删除
                stat[key] = undefined;
            }
        }
        let allUndefined = true;
        for (let key in stat) {
            if (stat[key] !== undefined) {
                allUndefined = false;
                break;
            }
        }

        let obj = {
            id: this.id,
            title: this.title,
            created: this.created,
            updated: this.updated,
            childDocsCount: this.childDocsCount > 0 ? this.childDocsCount : undefined,
            offspringDocsCount: this.offspringDocsCount > 0 ? this.offspringDocsCount : undefined,
            stat: allUndefined ? undefined : stat
        };
        if (this.childDocs.length > 0) {
            obj['childDocs'] = this.childDocs.map((item) => item.asJSON());
        }
        return obj;
    }

}


/**
 * 一个笔记本 Notebook 下所有的文档树结构
 */
export class NotebookTree {
    notebook: Notebook;
    documentCount: number = 0;
    documents: TreeItem[];

    constructor(notebook: any) {
        this.notebook = notebook;
        this.documents = [];
    }

    async queryAll_() {
        // 1. 查看根目录下所有的文档
        let sqlCode = `select * from blocks where path regexp '^/[0-9a-z\-]+\.sy$' and type='d' and box = '${this.notebook.id}' order by path;`;
        let rootDocs: Block[] = await sql(sqlCode);
        this.documentCount = rootDocs.length;
        for (let doc of rootDocs) {
            let tree_item = new TreeItem(doc);
            this.documents.push(tree_item);
            await tree_item.queryAll_();
            this.documentCount += tree_item.offspringDocsCount;
        }
        // console.log(this.documents);
    }

    asJSON(): object {
        let obj = {};
        //merge this.notebook
        for (let key in this.notebook) {
            obj[key] = this.notebook[key];
        }
        obj['documentCount'] = this.documentCount;
        obj['documents'] = this.documents.map((item) => item.asJSON());
        return obj;
    }
}

export async function queryAll_(): Promise<NotebookTree[]> {
    const sqlCode = 'select count(*) as count from blocks where type="d";';
    let res = await sql(sqlCode);
    console.log(res[0].count);
    DocTotalCount = res[0].count;
    DocQueryProgress = 0;

    let notebooks = await lsNotebooks();
    let notebookTrees: NotebookTree[] = [];
    for (let notebook of notebooks?.notebooks) {
        if (notebook.closed) {
            continue;
        }
        let notebook_tree = new NotebookTree(notebook);
        // await notebook_tree.queryAll_();
        notebookTrees.push(notebook_tree);
    }
    notebookTrees.sort((a, b) => a.notebook.sort - b.notebook.sort);

    for (let notebook_tree of notebookTrees) {
        await notebook_tree.queryAll_();
    }

    console.log(DocQueryProgress, DocTotalCount);

    return notebookTrees;
}
