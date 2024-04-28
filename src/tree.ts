/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 14:38:58
 * @FilePath     : /src/tree.ts
 * @LastEditTime : 2024-04-28 16:46:36
 * @Description  : 导出的文档树的相关数据结构
 */
import { showMessage } from "siyuan";
import { ResGetTreeStat, getTreeStat, lsNotebooks, getBlockByID, listDocTree } from "./api";

import exportDialog from "./dialog";
import { i18n, limitIt } from "./utils";

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

    async queryItemInfo() {
        let block = await getBlockByID(this.docId);
        this.docTitle = block.content;
        this.created = formatTime(block.created);
        this.updated = formatTime(block.updated);
        try {
            this.stat = await getTreeStat(this.docId);
        } catch (e) {
            console.groupCollapsed(`Error when query doc: ${this.docId}`);
            console.error(`Id=${this.docId}; Title=${this.docTitle}`);
            console.error(e);
            console.groupEnd();
            showMessage(i18n.getTreeStatError.replace("ID", this.docId));
        }
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
        let allItems: TreeItem[] = [];
        const dfs = (node: IDocTreeNode, parentPath: string) => {
            let item = new TreeItem(parentPath, node.id);
            allItems.push(item);
            if (node.children) {
                for (let child of node.children) {
                    let childNode = dfs(child, item.path);
                    item.childDocs.push(childNode);
                }
            }
            return item;
        }

        let treeNodes: IDocTreeNode[] = await listDocTree(this.notebook.id, '/');
        treeNodes.forEach((tree: IDocTreeNode) => {
            dfs(tree, '');
        });
        this.documentCount = allItems.length;

        // console.group(this.notebook.name);
        // console.log("All items");
        // console.log(allItems);
        // console.log("Tree nodes");
        // console.log(treeNodes);
        // console.groupEnd();


        let allPromises = allItems.map((item) => limitIt(() => item.queryItemInfo()));
        await Promise.all(allPromises);

        this.stat = {
            imageCount: 0,
            linkCount: 0,
            refCount: 0,
            runeCount: 0,
            wordCount: 0
        }
        allItems.forEach((item) => {
            for (let key in this.stat) {
                this.stat[key] += item.stat?.[key] ?? 0;
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
