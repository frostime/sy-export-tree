/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 14:38:58
 * @FilePath     : /src/tree.ts
 * @LastEditTime : 2023-07-26 17:13:33
 * @Description  : 导出的文档树的相关数据结构
 */
import { ResGetTreeStat, getTreeStat, lsNotebooks, readDir, getBlockByID } from "./api";

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


    constructor(docDir: string, docId: DocumentId) {
        this.docId = docId;
        this.docTitle = '';
        this.created = '';
        this.updated = '';
        this.stat = null;
        this.childDocs = [];
        this.path = `${docDir}/${this.docId}`;
    }

    /**
     * 递归地构建树结构
     * @param currentPath 当前文档所在的路径, 路径内容不包括 .sy 后缀名
     * @returns `Array<TreeItem>` 节点遍历的结果列表
     */
    async buildTree() {
        // this.path = currentPath + '.sy';
        let currentPath = this.path;
        let childPath = await readDocPath(`${currentPath}`);
        let childInfo = {};
        for (let child of childPath) {
            let name = child.name.replace(/\.sy$/, '');
            childInfo[name] = child.isDir || childInfo[name] ? true : false;
        }
        let dirItems: TreeItem[] = [];
        for (let id of Object.keys(childInfo)) {
            let tree_item = new TreeItem(currentPath, id);
            this.childDocs.push(tree_item);
            if (childInfo[id]) {
                dirItems.push(tree_item);
            }
        }
        this.childDocsCount = this.childDocs.length;
        exportDialog.increase(this.childDocsCount);

        let allItems: TreeItem[] = [];
        allItems.push(...this.childDocs); // 遍历所有的子节点
        let retrieve = await Promise.all(dirItems.map((item) => item.buildTree()));
        allItems.push(...retrieve.flat()); // 遍历所有的子节点的子节点
        this.offspringDocsCount = allItems.length;
        // for (let item of dirItems) {
        //     let retrieve = await item.buildTree(`${currentPath}/${item.docId}`);
        //     allItems.push(...retrieve);
        // }
        return allItems;
    }

    async queryItemInfo() {
        let block = await getBlockByID(this.docId);
        this.docTitle = block.content;
        this.created = formatTime(block.created);
        this.updated = formatTime(block.updated);
        this.stat = await getTreeStat(this.docId);
        exportDialog.increase();
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

    stat: ResGetTreeStat;

    constructor(notebook: any) {
        this.notebook = notebook;
        this.documents = [];
    }

    async build() {
        let childPath = await readDocPath(`/data/${this.notebook.id}`);
        let childInfo = {};
        for (let child of childPath) {
            let name = child.name.replace(/\.sy$/, '');
            childInfo[name] = child.isDir || childInfo[name] ? true : false;
        }

        let dirItems: TreeItem[] = [];
        //挑选出可以继续遍历的文件夹
        for (let id of Object.keys(childInfo)) {
            let tree_item = new TreeItem(`/data/${this.notebook.id}`, id);
            this.documents.push(tree_item);
            if (childInfo[id]) {
                dirItems.push(tree_item);
            }
        }

        let allItems: TreeItem[] = [...this.documents];
        let retrieve = await Promise.all(
            dirItems.map((item) => item.buildTree())
        );
        exportDialog.increase(dirItems.length);
        allItems.push(...retrieve.flat());
        this.documentCount = allItems.length;
        // for (let item of dirItems) {
        //     let retrieve = await item.buildTree(`/data/${this.notebook.id}/${item.docId}`);
        //     allItems.push(...retrieve);
        // }

        await Promise.all(
            allItems.map((item) => item.queryItemInfo())
        );

        this.stat = {
            imageCount: 0,
            linkCount: 0,
            refCount: 0,
            runeCount: 0,
            wordCount: 0
        }
        allItems.forEach((item) => {
            for (let key in this.stat) {
                this.stat[key] += item.stat[key];
            }
        });
    }

    asJSON(): object {
        let obj = {};
        //merge this.notebook
        let notebook = renameKey(this.notebook, {
            'id': 'notebookId',
            'name': 'notebookName'
        });
        delete notebook['icon'];
        delete notebook['closed'];
        delete notebook['sort'];
        delete notebook['sortMode'];
        for (let key in notebook) {
            obj[key] = notebook[key];
        }
        obj['documentCount'] = this.documentCount;
        obj['stat'] = this.stat;
        obj['documents'] = this.documents.map((item) => item.asJSON());
        return obj;
    }
}

export async function queryAll(): Promise<NotebookTree[]> {
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
    await Promise.all(notebookTrees.map((item) => item.build()));

    return notebookTrees;
}
