/**
 * Modifications Copyright 2017 HUAWEI
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// This is an end-to-end test that focuses on exercising all parts of the fabric APIs
// in a happy-path scenario
'use strict';

var utils = require('fabric-client/lib/utils.js');
var logger = utils.getLogger('E2E install-chaincode');

var tape = require('tape');
var _test = require('tape-promise');
var test = _test(tape);

var e2eUtils = require('./e2eUtils.js');
var testUtil = require('./util.js');
var Client   = require('fabric-client');

module.exports.run = function (config_path) {
    Client.addConfigFile(config_path);
    testUtil.setupChaincodeDeploy();
    var fabricSettings = Client.getConfigSetting('fabric');
    var chaincodes     = fabricSettings.chaincodes;
    if(typeof chaincodes === 'undefined' || chaincodes.length === 0) {
        return Promise.resolve();
    }
    return new Promise(function(resolve, reject) {
        test('\n\n***** install all chaincodes *****\n\n', (t) => {
            chaincodes.reduce(function(prev, chaincode){
                return prev.then(() => {
                    let promises = [];
                    let channel  = testUtil.getChannel(chaincode.channel);
                    if(channel === null) {
                        throw new Error('could not find channel in config');
                    }
                    for(let v in channel.organizations) {
                        promises.push(e2eUtils.installChaincode(channel.organizations[v], chaincode, t));
                    }

                    return Promise.all(promises).then(() => {
                        t.pass('Installed chaincode ' + chaincode.id +  ' successfully in all peers');
                        return Promise.resolve();
                    })
                });
            }, Promise.resolve())
            .then(() => {
                t.end();
                return resolve();
            })
            .catch((err) => {
                t.fail('Failed to install chaincodes, ' + (err.stack?err.stack:err));
                t.end();
                return reject(err);
            });
        });
    });
}
