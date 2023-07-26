/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 14:38:58
 * @FilePath     : /src/tree.ts
 * @LastEditTime : 2023-07-26 14:01:39
 * @Description  : 导出的文档树的相关数据结构
 */
import { ResGetTreeStat, getTreeStat, sql, lsNotebooks, readDir } from "./api";

import exportDialog from "./dialog";

const formatTime = (time: string): string => {
    return time.slice(0, 4) + '-' + time.slice(4, 6) + '-' + time.slice(6, 8) + ' ' + time.slice(8, 10) + ':' + time.slice(10, 12) + ':' + time.slice(12, 14);
}

const renameKey = (obj: object, keyMap: { [key: string]: string }) => {
    let newObj = {};
    for (let key in obj) {
        if (keyMap[key]) {
            newObj[keyMap[key]] = obj[key];
        } else {
            newObj[key] = obj[key];
        }
    }
    return newObj;
}

async function readDocPath(path: string) {
    let paths = await readDir(path);
    // "20230723152605-n01h94z.sy"
    let pat = /^\d+-\w+(\.sy)?$/
    // let pat = /([0-9a-z\-]+)(\.sy)?$/;
    return paths.filter((item) => pat.test(item.name));
}

export class TreeItem {
    docId: DocumentId;
    docTitle: string;
    created: string;
    updated: string;
    stat?: ResGetTreeStat;
    childDocsCount: number = 0;
    offspringDocsCount: number = 0;
    childDocs: TreeItem[];

    path = '';


    constructor(doc?: Block, docId?: DocumentId) {
        //#TODO 去掉 adapter
        this.docId = doc?.id ?? docId;
        this.docTitle = doc ? doc.content : '';
        this.created = doc ? formatTime(doc.created) : '';
        this.updated = doc ? formatTime(doc.updated) : '';
        this.stat = null;
        this.childDocs = [];
    }

    async queryAll_() {
        // await this.queryStat_();
        // await this.queryChildDocs_();
        await Promise.all([this.queryStat_(), this.queryChildDocs_()]);
        exportDialog.increase();
        // for (let childDoc of this.childDocs) {
        //     await childDoc.queryAll_();
        //     this.offspringDocsCount += childDoc.offspringDocsCount;
        // }
        await Promise.all(this.childDocs.map((item) => item.queryAll_()));
        this.childDocs.forEach((item) => {
            this.offspringDocsCount += item.offspringDocsCount;
        });
    }

    async queryStat_() {
        if (!this.docId || this.stat !== null) {
            return;
        }
        this.stat = await getTreeStat(this.docId);
    }

    async queryChildDocs_() {
        if (!this.docId || this.childDocs.length > 0) {
            return;
        }

        let sqlCode = `select * from blocks where path regexp '.*/${this.docId}/[0-9a-z\-]+\.sy' and type='d'
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

    /**
     * 递归地构建树结构
     * @param currentPath 当前文档所在的路径, 路径内容不包括 .sy 后缀名
     * @returns `Array<TreeItem>` 节点遍历的结果列表
     */
    async buildTree(currentPath: string) {
        this.path = currentPath + '.sy';
        let childPath = await readDocPath(`${currentPath}`);
        console.log(`${currentPath}`, childPath);
        let childInfo = {};
        for (let child of childPath) {
            let name = child.name.replace(/\.sy$/, '');
            childInfo[name] = child.isDir || childInfo[name] ? true : false;
        }
        let dirItems: TreeItem[] = [];
        for (let id of Object.keys(childInfo)) {
            let tree_item = new TreeItem(null, id);
            this.childDocs.push(tree_item);
            if (childInfo[id]) {
                dirItems.push(tree_item);
            }
        }
        let allItems: TreeItem[] = [this];
        allItems.push(...this.childDocs); // 遍历所有的子节点
        let retrieve = await Promise.all(dirItems.map((item) => item.buildTree(`${currentPath}/${item.docId}`)));
        allItems.push(...retrieve.flat()); // 遍历所有的子节点的子节点
        // for (let item of dirItems) {
        //     let retrieve = await item.buildTree(`${currentPath}/${item.docId}`);
        //     allItems.push(...retrieve);
        // }
        return allItems;
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
            docId: this.docId,
            docTitle: this.docTitle,
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
        // for (let doc of rootDocs) {
        //     let tree_item = new TreeItem(doc);
        //     this.documents.push(tree_item);
        //     await tree_item.queryAll_();
        //     this.documentCount += tree_item.offspringDocsCount;
        // }
        this.documents = rootDocs.map((item) => new TreeItem(item));
        await Promise.all(this.documents.map((item) => item.queryAll_()));
        this.documents.forEach((item) => {
            this.documentCount += item.offspringDocsCount;
        });
    }

    async buildTree() {
        let childPath = await readDocPath(`/data/${this.notebook.id}`);
        let childInfo = {};
        for (let child of childPath) {
            let name = child.name.replace(/\.sy$/, '');
            childInfo[name] = child.isDir || childInfo[name] ? true : false;
        }
        let dirItems: TreeItem[] = [];
        for (let id of Object.keys(childInfo)) {
            let tree_item = new TreeItem(null, id);
            this.documents.push(tree_item);
            if (childInfo[id]) {
                dirItems.push(tree_item);
            }
        }
        let allItems: TreeItem[] = [...this.documents];
        let retrieve = await Promise.all(
            dirItems.map((item) => item.buildTree(`/data/${this.notebook.id}/${item.docId}`))
        );
        allItems.push(...retrieve.flat());
        // for (let item of dirItems) {
        //     let retrieve = await item.buildTree(`/data/${this.notebook.id}/${item.docId}`);
        //     allItems.push(...retrieve);
        // }
        console.log(allItems);
    }

    asJSON(): object {
        let obj = {};
        //merge this.notebook
        let notebook = renameKey(this.notebook, {
            'id': 'notebookId',
            'name': 'notebookName',
            'closed': 'notebookClosed'
        });
        delete notebook['icon'];
        delete notebook['sort'];
        delete notebook['sortMode'];
        for (let key in notebook) {
            obj[key] = notebook[key];
        }
        obj['documentCount'] = this.documentCount;
        obj['documents'] = this.documents.map((item) => item.asJSON());
        return obj;
    }
}

export async function queryAll_(): Promise<NotebookTree[]> {
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

    // for (let notebook_tree of notebookTrees) {
    //     await notebook_tree.queryAll_();
    // }
    // await Promise.all(notebookTrees.map((item) => item.queryAll_()));
    // await Promise.all(notebookTrees.map((item) => item.buildTree()));
    await notebookTrees[0].buildTree(); //TODO 测试完成后换回来

    return notebookTrees;
}
