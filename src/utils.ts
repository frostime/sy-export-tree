/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 18:50:43
 * @FilePath     : /src/utils.ts
 * @LastEditTime : 2024-04-28 16:07:04
 * @Description  : 
 */
import zh_Hans from "./i18n/zh_CN.json";

export type I18N = typeof zh_Hans;
export let i18n: I18N;
export function setI18n(i18n_: any) {
    for (let key in zh_Hans) {
        if (i18n_[key] === "" || i18n_[key] === undefined || i18n_[key] === null) {
            i18n_[key] = key;
        }
    }
    i18n = i18n_;
}

import pLimit from 'p-limit';
import { LimitFunction } from 'p-limit';

let limit: LimitFunction;
export const updateLimit = (num: number) => {
    limit = pLimit(num);
}

export const limitIt = async <T>(fn: () => Promise<T>) => {
    return limit(fn);
}
