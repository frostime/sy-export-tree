//1. 读取一个 yml 文本
//2. 获取所有的 key, 使用最简单的正则匹配即可
//3. 获得 key 的集合, 去重排序
//4. 输出一个 json 文件，格式为 {key: ""}

import fs from 'fs';

function getKeys(filepath)
{
    const text = fs.readFileSync(filepath, 'utf-8');
    const keys = text.match(/(?<=^[\s\t\-]*)(\w+)(?=:)/gm);
    return keys;
}

function getUniqueKeys(keys)
{
    return [...new Set(keys)].sort();
}

function writeKeys(keys)
{
    let keysJson = {};
    keys.forEach(key => {
        keysJson[key] = "";
    });
    const json = JSON.stringify(keysJson, null, 4);
    fs.writeFileSync('keys.json', json);
}

let keys = getKeys('C:/Users/EEG/Desktop/SiYuan@Frostime.yml');
keys = getUniqueKeys(keys);
writeKeys(keys);

