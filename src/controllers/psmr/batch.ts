"use strict";
import path from 'path';
import dayjs from 'dayjs'

import fs from 'fs';
import db from '../../db';
import { getProcessNo, writeDetailLog } from '../../utils/logs';
// import { sendToPIC } from '@common/email-notification/lib';

const configPath = path.resolve(__dirname, '../../../configs/psmr-filename-list.json');
const psmr_config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { INTERFACE_PATH } = process.env;

const config_path = 'configs/';
const interface_path = INTERFACE_PATH;

const checkDataType = (data, type, dateFormat) => {
    if (!type || !data) {
        console.log('Missing type or data', data, type)
        return true;
    }
    switch (type) {
        case 'CHAR': {
            return true;
        }
        case 'NUM': {
            const n = parseInt(data);
            return !Number.isNaN(n) && Number.isFinite(n);
        }
        case 'DATE': {
            return dayjs(data, dateFormat, true).isValid();
        }
        default: {
            return false;
        }
    }
};

function is_file_exists(file_path) {
    try {
        fs.accessSync(file_path, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

function read_json_file(filePath) {
    if (!is_file_exists(filePath)) {
        console.error(`File ${filePath} not found`);
        return null;
    }
    try {
        const data = fs.readFileSync(filePath, 'utf-8'); // Read the JSON file synchronously
        const jsonData = JSON.parse(data); // Parse the JSON data 
        return jsonData;
    } catch (error) {
        return [];
    }
}

const upsert_data = async (table, pk_list, json_data) => {
    let sql = `SELECT * FROM ` + table + ` WHERE `;
    for (let i = 0; i < pk_list.length; i++) {
        if (i == pk_list.length - 1) {
            sql += pk_list[i] + ` = '` + json_data[pk_list[i]] + `' `;
        } else {
            sql += pk_list[i] + ` = '` + json_data[pk_list[i]] + `' AND `;
        }
    }

    const [rows,] = await db.query(sql);

    if (rows.length == 0) {
        insert_data(table, pk_list, json_data);
    } else {
        update_data(table, pk_list, json_data);
    }
}

const insert_data = async (table, pk_list, json_data) => {
    let sql = `INSERT INTO ` + table + ` (`;
    let sql_value = `VALUES (`;
    const data_size = Object.keys(json_data).length;

    let data_count = 0;
    for (const key in json_data) {
        if (data_count == data_size - 1) {
            sql += key + `) `;
            if (typeof (json_data[key]) == "number") {
                sql_value += `` + json_data[key] + `) `;
            } else if (json_data[key] instanceof Date) {
                sql_value += `TO_DATE('` + json_data[key].toISOString().slice(0, 10) + `','YYYY-MM-DD'), `;
            } else {
                sql_value += `'` + json_data[key] + `') `;
            }
        }
        else {
            sql += key + `, `;
            if (typeof (json_data[key]) == "number") {
                sql_value += `` + json_data[key] + `, `;
            } else if (json_data[key] instanceof Date) {
                sql_value += `TO_DATE('` + json_data[key].toISOString().slice(0, 10) + `','YYYY-MM-DD'), `;
            } else {
                sql_value += `'` + json_data[key] + `', `;
            }
        }
        data_count++;
    }
    sql += sql_value;
    await db.query(sql); // execute the insert query
}

const update_data = async (table, pk_list, json_data) => {
    let sql = `UPDATE ` + table + ` SET `;
    const data_size = Object.keys(json_data).length;

    let data_count = 0;
    for (const key in json_data) {
        if (!pk_list.includes(key)) {
            if (data_count == data_size - 1) {
                if (typeof (json_data[key]) == "number") {
                    sql += key + ` = ` + json_data[key] + ` `;
                } else if (json_data[key] instanceof Date) {
                    sql += key + ` = TO_DATE('` + json_data[key].toISOString().slice(0, 10) + `','YYYY-MM-DD') `;
                } else {
                    sql += key + ` = '` + json_data[key] + `' `;
                }
            }
            else {
                if (typeof (json_data[key]) == "number") {
                    sql += key + ` = ` + json_data[key] + `, `;
                } else if (json_data[key] instanceof Date) {
                    sql += key + ` = TO_DATE('` + json_data[key].toISOString().slice(0, 10) + `','YYYY-MM-DD'), `;
                } else {
                    sql += key + ` = '` + json_data[key] + `', `;
                }
            }
        }
        data_count++;
    }
    sql += ` WHERE `;
    for (let i = 0; i < pk_list.length; i++) {
        if (i == pk_list.length - 1) {
            sql += pk_list[i] + ` = '` + json_data[pk_list[i]] + `' `;
        } else {
            sql += pk_list[i] + ` = '` + json_data[pk_list[i]] + `' AND `;
        }
    }
    await db.query(sql); // execute the update query
}

const appendErrorLog = (log_collection, processName, fileName, message) => {
    const errorLog = {
        processName,
        dateTime: new Date().toISOString(),
        fileName,
        message
    };
    log_collection.push(errorLog);
}

const main = async () => {

    const appId = await getProcessNo();
    const userId = 'System';
    
    const log_collection = [];
    for (let i = 0; i < psmr_config.length; i++) { // loop through all the configFiles
        if (is_file_exists(config_path + psmr_config[i]['configFile'])) { // is file interface config exists?
            const interface_config = read_json_file(config_path + psmr_config[i]['configFile']);
            console.log("--------------------")
            console.log("Read", psmr_config[i]['configFile'], "with", interface_config['detail'].length, "fields");

            await writeDetailLog(interface_config["functionId"], "BTRI4", 'I', `Starting PSMR Batch`, "-", 'S', appId, userId);

            const pk_list = [];
            const attribute = [];
            for (let j = 0; j < interface_config['detail'].length; j++) {
                if (interface_config['detail'][j]['required'] === true) {
                    pk_list.push(interface_config['detail'][j]['key']);
                } else {
                    attribute.push(interface_config['detail'][j]['key']);
                }
            }
            console.log("interface_path :",interface_path)
            console.log("psmr_config[i]['ifFileName'] :",psmr_config[i]['ifFileName'])
            
            if (is_file_exists(interface_path + psmr_config[i]['ifFileName'])) { // read interface file
                const interface_data = fs.readFileSync(interface_path + psmr_config[i]['ifFileName'], 'utf-8'); // readlines in the file
                const lines = interface_data.split('\n');

                if (lines.length == 0) {
                    console.log("Interface file", psmr_config[i]['ifFileName'], "is empty");
                    await writeDetailLog(interface_config["functionId"], "BTRI4", 'E', `Cannot precess input data row with interface file is empty`, "-", 'E', appId, userId);
                    appendErrorLog(log_collection, interface_config["functionId"], psmr_config[i]['ifFileName'], `Cannot process input data row with interface file is empty`);
                }

                console.log("Read", psmr_config[i]['ifFileName'], "with", lines.length, "lines");
                for (let j = psmr_config[i]["headerFlag"] ? 1 : 0; j < (psmr_config[i]["footerFlag"] ? lines.length - 1 : lines.length); j++) { // read each line in interface file
                    const json_data = {};

                    const line = lines[j].replace(/\r/g, ""); // remove \r

                    if (line.length != psmr_config[i]['length']) {
                        // console.log(`Line ${j + 1} length not match`, line.length, "Should be", psmr_config[i]["length"]);
                        await writeDetailLog(interface_config["functionId"], "BTRI4", 'E', `Cannot precess input data row [${j + 1}] with length not match`, "-", 'E', appId, userId);
                        appendErrorLog(log_collection, interface_config["functionId"], psmr_config[i]['ifFileName'], `Cannot process input data row [${j + 1}] with length not match`);
                        continue;
                    }

                    let start_id = 0;
                    let is_complete = true;
                    for (const attr_index in interface_config['detail']) { // loop through all the attributes
                        const text_lenght = interface_config['detail'][attr_index]['length'];

                        const value = line.substring(start_id, start_id + text_lenght).trim();

                        if (value == "") { // is null?
                            if (interface_config['detail'][attr_index]['required'] === true) { // is PK?
                                await writeDetailLog(interface_config["functionId"], "BTRI4", 'E', `Cannot precess input data row [${j + 1}] with PK is empty`, "-", 'E', appId, userId);
                                appendErrorLog(log_collection, interface_config["functionId"], psmr_config[i]['ifFileName'], `Cannot process input data row [${j + 1}] with PK is empty`);
                                // console.log(psmr_config[i]['ifFileName'], `Line ${j + 1} PK ${interface_config['detail'][attr_index]["detail"]} is empty`)
                                is_complete = false;
                            }
                        } else { // is not null string?
                            if (!checkDataType(value, interface_config['detail'][attr_index]['type'], interface_config['detail'][attr_index]['dateFormat'])) { // is not valid data type?
                                await writeDetailLog(interface_config["functionId"], "BTRI4", 'E', `Cannot precess input data row [${j + 1}] with invalid data format. The data type is ${interface_config['detail'][attr_index]['type']} and the data is ${value}`, "Not valid data format", 'E', appId, userId);
                                appendErrorLog(log_collection, interface_config["functionId"], psmr_config[i]['ifFileName'], `Cannot process input data row [${j + 1}] with invalid data format. The data type is ${interface_config['detail'][attr_index]['type']} and the data is ${value}`);
                                is_complete = false;
                            } else { // is valid data type?
                                if (interface_config['detail'][attr_index]['type'] == "NUM") {
                                    json_data[interface_config['detail'][attr_index]['key']] = Number(value);
                                } else if (interface_config['detail'][attr_index]['type'] == "DATE") {
                                    const string_date = value;
                                    // console.log("string_date", string_date)
                                    const year = Number(string_date.substring(0, 4));
                                    const month = Number(string_date.substring(4, 6))-1;
                                    const day = Number(string_date.substring(6, 8));
                                    json_data[interface_config['detail'][attr_index]['key']] = new Date(Date.UTC(year, month, day));
                                    // console.log(json_data[interface_config['detail'][attr_index]['key']])
                                } else {
                                    json_data[interface_config['detail'][attr_index]['key']] = value;
                                }
                            }
                        }

                        start_id += text_lenght;  // move to next attribute
                    }

                    if (is_complete) {
                        await upsert_data(psmr_config[i]['tableName'], pk_list, json_data);
                    }
                }
            } else {
                console.log(`Interface file ${psmr_config[i]['ifFileName']} not found`);
                await writeDetailLog(interface_config["functionId"], "BTRI4", 'E', `Cannot precess input data row with interface file not found`, "-", 'E', appId, userId);
                appendErrorLog(log_collection, interface_config["functionId"], psmr_config[i]['ifFileName'], `Cannot process input data row with interface file not found`);
            }
            await writeDetailLog(interface_config["functionId"], "BTRI4", 'I', `End PSMR Batch`, "-", 'E', appId, userId);
        } else {
            console.log(`Interface config file ${psmr_config[i]['configFile']} not found`);
            await writeDetailLog("*", "BTRI4", 'E', `Cannot precess input data row with interface configuration file not found`, "Not found interface configuration file", 'E', appId, userId);
            appendErrorLog(log_collection, "*", psmr_config[i]['configFile'], `Cannot process input data row with interface configuration file not found`);
        }
        console.log("Upsert data to", psmr_config[i]['tableName'], "completed")
        
    }
    if (log_collection.length > 0) {
        // sendToPIC(log_collection, 'PSMR00001', "seksit39@outlook.com", undefined, undefined, db);
    }
}

function execute(req, res) {
    main();
    res.status(201).json({
        message: 'Batch is executing.',
    });
}

export default {
    execute,
};


