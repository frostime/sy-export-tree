/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-07-23 18:50:43
 * @FilePath     : /src/utils.ts
 * @LastEditTime : 2023-07-23 18:52:14
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
