"use strict";

/*
 * Created with @iobroker/create-adapter v1.34.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");
const axios = require('axios');
const convert = require('color-convert');
var startup = true;
var colorTempzero = 0;
var colorTempzeromod = 0;
var lastcommand;
var devicelist = [];
var controlmode = false;

class Govee extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "govee",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */

	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:

		// Govee Master //
		var govee_api_key = this.config.govee_api_key;
		var refreshInterval;
		if(this.config.refreshInterval) {
			refreshInterval = this.config.refreshInterval * 1000;
			this.log.info('Refresh interval set to: ' + this.config.refreshInterval + ' seceonds');
		} else {
			refreshInterval = 15000;
			this.log.warn('Refresh interval not set! Default Value is 15 seconds');
		}

		if(govee_api_key) {
			this.log.info("Govee API Key: " + this.config.govee_api_key);
		} else {
			this.log.error("Govee API Key: Key is not set (Please set your Govee API Key in the instance config)");
		}
		
		setInterval(() => {
			if(!startup){
				this.refreshValues();
			}
		}, refreshInterval);

		try {
			const config = {
				headers: {
				  'Govee-API-Key': govee_api_key,
				}
			};
			axios.get('https://developer-api.govee.com/v1/devices',config)
			.then((res) => {
				this.log.info('Request send: get device list');
				this.log.info('Server Response: ' + res.status + ' (' + res.statusText + ')');
				if(res.status == "200") {
					this.log.info('Found (' + res.data.data.devices.length + ') Devices');
					for (var key in res.data.data.devices) {
						var obj = res.data.data.devices[key];
						this.log.info("Select Device: " + obj.device);
						devicelist.push(obj.device); // TEST
						this.addObjects(obj);		
					}
					startup = false;
					this.log.info("Govee Startup Routine finished");
				}
			}).catch((err) => {
				if(govee_api_key) {
					switch (err.response.status) {
						case 401:
							this.log.error('Govee API Key is wrong!');
							break;
						default:
							this.log.error(err);
							break;
					}
				}
			});

		} catch (error) {
			this.log.error(error);
			
		}

		//########################################################//

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		/*await this.setObjectNotExistsAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});*/

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("*");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw iobroker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	async onStateChange(id, state) {
		if (state) {
			// The state was changed
			//this.log.warn(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			if(!startup) {
				if(!state.ack) {
					controlmode = true;
					var deviceID = id.split('.');
					var govee_api_key = this.config.govee_api_key;

					var wert_state = await this.getStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.model');
					var devicemodel = wert_state.val;

					var command;
					var commandvalue;
					switch (deviceID[3]) {
						case 'powerState':
							command = "turn";
							if(state.val == true) {commandvalue = 'on'}else{commandvalue = 'off';}
							break;
						case 'brightness':
							command = "brightness";
							commandvalue = state.val;
							break;
						case 'color':
							if(deviceID[4] == 'rgb'){
								var wert_state_r = await this.getStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.rgb.r');
								var wert_r = wert_state_r.val;
								var wert_state_g = await this.getStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.rgb.g');
								var wert_g = wert_state_g.val;
								var wert_state_b = await this.getStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.rgb.b');
								var wert_b = wert_state_b.val;
								var hsv = convert.rgb.hsv(wert_r,wert_g,wert_b);
								this.setStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.hsv.h',hsv[0],true);
								this.setStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.hsv.s',hsv[1],true);
								this.setStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.hsv.v',hsv[2],true);
								commandvalue = JSON.parse('{\u0022r\u0022:' + wert_r + ',\u0022g\u0022:' + wert_g + ',\u0022b\u0022:' + wert_b + '}');
							} else if(deviceID[4] == 'hsv') {
								var wert_state_h = await this.getStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.hsv.h');
								var wert_h = wert_state_h.val;
								var wert_state_s = await this.getStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.hsv.s');
								var wert_s = wert_state_s.val;
								var wert_state_l = await this.getStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.hsv.v');
								var wert_v = wert_state_l.val;
								var rgb = convert.hsv.rgb(wert_h,wert_s,wert_v);
								this.setStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.rgb.r',rgb[0],true);
								this.setStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.rgb.g',rgb[1],true);
								this.setStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.color.rgb.b',rgb[2],true);
								commandvalue = JSON.parse('{\u0022r\u0022:' + rgb[0] + ',\u0022g\u0022:' + rgb[1] + ',\u0022b\u0022:' + rgb[2] + '}');
							}
							command = 'color';
							break;
						case 'colorTem':
							var colorTemObj = await this.getObjectAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.colorTem');
							var colorTemMin = colorTemObj.common.min;
							var colorTemMax = colorTemObj.common.max;
							var colorTemModValue = this.inscale('small',state.val,colorTemMin,colorTemMax,140,500);
							this.setStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.colorTemMod',colorTemModValue, true);
							command = "colorTem";
							commandvalue = state.val;
							break;
						case 'colorTemMod':
							var colorTemObj = await this.getObjectAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.colorTem');
							var colorTemMin = colorTemObj.common.min;
							var colorTemMax = colorTemObj.common.max;
							var colorTemModValue = this.inscale('big',state.val,colorTemMin,colorTemMax,140,500);
							this.setStateAsync(deviceID[0] + '.' + deviceID[1] + '.' + deviceID[2] + '.colorTem',colorTemModValue, true);
							command = "colorTem";
							commandvalue = colorTemModValue;
							break;
						default:
							break;
					}
					const config = {
						headers: {
					  	'Govee-API-Key': govee_api_key,
						}
					};
					const data = {
						device: deviceID[2],
 						model: devicemodel,
 						cmd: {
 							name: command,
 							value: commandvalue
 						}
					};
					try {
						if(lastcommand !== JSON.stringify(data)) {
							this.log.info("Command send: " + JSON.stringify(data));
							lastcommand = JSON.stringify(data);
							axios.put('https://developer-api.govee.com/v1/devices/control',data,config)
							.then((resmodcontrol) => {
								this.log.info("Server Response: " + resmodcontrol.status + " (" + resmodcontrol.statusText + ")");
							}).catch((errmodcontrol) => {
								this.log.error(errmodcontrol);
							});
						}	
					} catch (errorcontrol) {
						this.log.error(errorcontrol);
					}
					controlmode = false;
				}	
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	inscale(mode,input,xmin,xmax,ymin,ymax) {
		var ergebnis;
		switch (mode) {
			case 'small':
				var steigung = (ymax-ymin) / (xmax-xmin);
				var offset = ymin - steigung * xmin;
				ergebnis = input * steigung + offset;
				break;
			case 'big':
				var steigung = (xmax-xmin) / (ymax-ymin);
				var offset = xmin - steigung * ymin; 
				ergebnis = input * steigung  + offset;
				break;
			default:
				ergebnis = "ERROR";
				break;
		}
		if(!isNaN(ergebnis)) {
			ergebnis = parseInt(ergebnis);
		}
		return ergebnis;
	}

	async refreshValues() {
		if(!startup) {
			if(!controlmode) {
				try {
					var instance = this.name + '.' + this.instance;
					var govee_api_key = this.config.govee_api_key;

					const config = {
						headers: {
						  'Govee-API-Key': govee_api_key,
						}
					};

					axios.get('https://developer-api.govee.com/v1/devices',config)
					.then((resUpdate) => {
						this.log.info('Function: get current device info by API');
						this.log.info('Request send: get device list');
						this.log.info('Server Response: ' + resUpdate.status + ' (' + resUpdate.statusText + ')');
						if(resUpdate.status == "200") {
							// Remove old Devices
							for(var locallistitemkey in devicelist) {
								var locallistitem = devicelist[locallistitemkey];
								if(resUpdate.data.data.devices.some(device => device.device === locallistitem)) {
									//this.log.error('JA: ' + locallistitem); //REMOVE
								} else {
									this.log.warn('Local object: "' + locallistitem + '" not foud in your Govee devices.');
									this.removeObjects(instance + '.' + locallistitem,locallistitem);
									devicelist.splice(locallistitemkey,1);
								}
							}
							// Add new Devices
							for(var globallistitemkey in resUpdate.data.data.devices) {
								var globallistitem = resUpdate.data.data.devices[globallistitemkey];
								if(devicelist.includes(globallistitem.device)) {
									//this.log.error(JSON.stringify(devicelist)) // REMOVE
									//this.log.error('JA'); // REMOVE
									//this.log.error(JSON.stringify(globallistitem)); // REMOVE
								} else {
									this.log.info('New Device found in your Govee Account: ' + globallistitem.device);
									controlmode = true;
									devicelist.push(globallistitem.device);
									this.addObjects(globallistitem);
								}
							}
							for (var updateitemkey in devicelist) {
								var updateitem = devicelist[updateitemkey];
								this.updateObjects(updateitem);
							}
						} 
					}).catch((errUpdate) => {
						this.log.error(errUpdate);
					});
			
				} catch (error) {
					this.log.error(error);
				}
			}
		}
		
		
	}

	async removeObjects(id,name) {
		var rmobjects = ['.powerState','.online','.model','.colorTemMod','.colorTem','.brightness','.r','.g','.b','.h','.s','.v','.rgb','.hsv0','.color'];
		for (var rmobjectskey in rmobjects) {
			var rmobjectsitem = rmobjects[rmobjectskey];
			this.delObject(id + rmobjectsitem);
		}
		this.delObject(id);
		this.log.info('"' + name + '" will be removed');
	}

	async addObjects(item) {
		var govee_api_key = this.config.govee_api_key;

		const config = {
			headers: {
				'Govee-API-Key': govee_api_key,
			}
		};

		var newcolorTempzero;
		var newcolorTempzeromod;
		if(item.controllable == true) {
			this.log.info("Device: " + item.device + ' is controllable');
			this.setObjectNotExistsAsync(item.device, {
				type: "device",
				common: {
					name: item.deviceName,
					read: true,
					write: true,
				},
				native: {},
			});
			this.log.info("Device: " + item.device + ' created');
			this.setObjectNotExistsAsync(item.device + '.model', {
				type: "state",
				common: {
					name: "govee.device.state.model",
					type: "string",
					role: "indicator",
					read: true,
					write: false,
				},
				native: {},
			});
			this.log.info('object "model" for: ' + item.device + ' created');
			this.setStateAsync(item.device + '.model', item.model,true);
			for (var newdevicekey in item.supportCmds) {
				var newdevicecmd = item.supportCmds[newdevicekey];
				switch (newdevicecmd) {
					case 'turn':
						this.log.info('Device: ' + item.device + ' supports cmd "powerState"');
						this.setObjectNotExistsAsync(item.device + '.powerState', {
							type: "state",
							common: {
								name: "govee.device.state.power",
								type: "boolean",
								role: "switch",
							},
							native: {},
						});
						this.log.info('object "powerState" for: ' + item.device + ' created');
						break;
					case 'brightness':
						this.log.info('Device: ' + item.device + ' supports cmd "brightness"');
						this.setObjectNotExistsAsync(item.device + '.brightness', {
							type: "state",
							common: {
								name: "govee.device.state.brightness",
								type: "number",
								role: "level.dimmer",
								min: 0,
								max: 100,
							},
							native: {},
						});
						this.log.info('object "brightness" for: ' + item.device + ' created');
						break;
					case 'color':
						this.log.info('Device: ' + item.device + ' supports cmd "color"');
						this.setObjectNotExistsAsync(item.device + '.color', {
							type: "device",
							common: {
								name: "govee.device.state.colors",
								read: true,
								write: false,
							},
							native: {},
						});
						this.log.info('object "color" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.color.rgb', {
							type: "device",
							common: {
								name: "govee.device.state.colors.rgb",
								read: true,
								write: false,
							},
							native: {},
						});
						this.log.info('object "color.rgb" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.color.rgb.r', {
							type: "state",
							common: {
								name: "govee.device.state.colors.red",
								type: "number",
								role: "color.red",
								min: 0,
								max: 255
							},
							native: {},
						});
						this.log.info('object "color.red" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.color.rgb.g', {
							type: "state",
							common: {
								name: "govee.device.state.colors.green",
								type: "number",
								role: "color.green",
								min: 0,
								max: 255
							},
							native: {},
						});
						this.log.info('object "color.green" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.color.rgb.b', {
							type: "state",
							common: {
								name: "govee.device.state.colors.blue",
								type: "number",
								role: "color.blue",
								min: 0,
								max: 255
							},
							native: {},
						});
						this.log.info('object "color.blue" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.color.hsv', {
							type: "device",
							common: {
								name: "govee.device.state.colors.hsv",
								read: true,
								write: false,
							},
							native: {},
						});
						this.log.info('object "color.hsv" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.color.hsv.h', {
							type: "state",
							common: {
								name: "govee.device.state.colors.hue",
								type: "number",
								role: "color.hue",
								min: 0,
								max: 360
							},
							native: {},
						});
						this.log.info('object "color.hue" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.color.hsv.s', {
							type: "state",
							common: {
								name: "govee.device.state.colors.saturation",
								type: "number",
								role: "color.saturation",
								min: 0,
								max: 100
							},
							native: {},
						});
						this.log.info('object "color.saturation" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.color.hsv.v', {
							type: "state",
							common: {
								name: "govee.device.state.colors.value",
								type: "number",
								role: "color.value",
								min: 0,
								max: 100
							},
							native: {},
						});
						this.log.info('object "color.value" for: ' + item.device + ' created');
						break;
					case 'colorTem':
						this.log.info('Device: ' + item.device + ' supports cmd "colorTem"');
						this.setObjectNotExistsAsync(item.device + '.colorTem', {
							type: "state",
							common: {
								name: "govee.device.state.colorTem",
								type: "number",
								role: "level.colorTem",
								min: item.properties.colorTem.range.min,
								max: item.properties.colorTem.range.max,
							},
							native: {},
						});
						this.log.info('object "colorTem" for: ' + item.device + ' created');
						this.setObjectNotExistsAsync(item.device + '.colorTemMod', {
							type: "state",
							common: {
								name: "govee.device.state.colorTemMod",
								type: "number",
								role: "level.colorTemMod",
								min: 140,
								max: 500,
							},
							native: {},
						});
						this.log.info('object "colorTemMod" for: ' + item.device + ' created');
						newcolorTempzero = ((item.properties.colorTem.range.min + item.properties.colorTem.range.max) / 2);
						newcolorTempzeromod = this.inscale('small',newcolorTempzero,item.properties.colorTem.range.min,item.properties.colorTem.range.max,140,500);
						break;
					default:
						this.log.warn('No commands for control found for Device: ' + item.device);
						break;	
				}
			}
			this.log.info('Device "' + item.device + '" was created.');
			axios.get('https://developer-api.govee.com/v1/devices/state?device=' + encodeURI(item.device) + '&model=' + encodeURI(item.model),config)
			.then((newresmod) => {
				this.log.info('Request send: get device info (' + item.device + ')');
				this.log.info('Server Response: ' + newresmod.status + ' (' + newresmod.statusText + ')');
				if(newresmod.status == 200) {
					// Fill objects with values
					for (var newdevicepropkey in newresmod.data.data.properties) {
						var newdeviceprop = newresmod.data.data.properties[newdevicepropkey];
						switch (String(Object.keys(newdeviceprop))) {
							case 'online':
								this.setObjectNotExistsAsync(item.device + '.online', {
									type: "state",
									common: {
										name: "govee.device.state.online",
										type: "boolean",
										role: "indicator",
										read: true,
										write: false,
									},
									native: {},
								});
								this.log.info('object "online" for: ' + item.device + ' created');
								this.setStateAsync(item.device + '.online', newdeviceprop.online,true);
								break;
							case 'powerState':
								if(newdeviceprop.powerState == "on") {
									this.setStateAsync(item.device + '.powerState', true,true);
								} else {this.setStateAsync(item.device + '.powerState', false,true);}
								break;
							case 'brightness':
								this.setStateAsync(item.device + '.brightness', newdeviceprop.brightness,true);
								break;
							case 'color':
								this.setStateAsync(item.device + '.color.rgb.r', newdeviceprop.color.r,true);
								this.setStateAsync(item.device + '.color.rgb.g', newdeviceprop.color.g,true);
								this.setStateAsync(item.device + '.color.rgb.b', newdeviceprop.color.b,true);
								var newhsv = convert.rgb.hsv(newdeviceprop.color.r,newdeviceprop.color.g,newdeviceprop.color.b)
								this.setStateAsync(item.device + '.color.hsv.h', newhsv[0],true);
								this.setStateAsync(item.device + '.color.hsv.s', newhsv[1],true);
								this.setStateAsync(item.device + '.color.hsv.v', newhsv[2],true);
								if(newcolorTempzero != 0) {
									this.setStateAsync(item.device + '.colorTem', newcolorTempzero,true);
									this.setStateAsync(item.device + '.colorTemMod', newcolorTempzeromod,true);
									// Formel Scale
								}
								break;
							case 'colorTemInKelvin':
								// Do nothing and dont show an Error!
								break;
							case 'colorTem':
								this.setStateAsync(item.device + '.colorTem', newdeviceprop.colorTem,true);
								var newcolorTempmod = this.inscale('small',newdeviceprop.colorTem,item.properties.colorTem.range.min,item.properties.colorTem.range.max,140,500);
								this.setStateAsync(item.device + '.colorTemMod', newcolorTempmod,true);
								this.setStateAsync(item.device + '.color.rgb.r', 0,true);
								this.setStateAsync(item.device + '.color.rgb.g', 0,true);
								this.setStateAsync(item.device + '.color.rgb.b', 0,true);
								this.setStateAsync(item.device + '.color.hsv.h', 0,true);
								this.setStateAsync(item.device + '.color.hsv.s', 0,true);
								this.setStateAsync(item.device + '.color.hsv.v', 100,true);
								break;
							default:
								this.log.warn("cant find any propertie for Device: " + item.device);
								break;
						}
					}
					this.log.info('Values for object: ' + item.device + ' added');
					controlmode = false;
				}
			}).catch((newerrmod) => {
				this.log.error(newerrmod);
			});
		}
	}

	async updateObjects(id) {
		var instance = this.name + '.' + this.instance;
		var govee_api_key = this.config.govee_api_key;

		const config = {
			headers: {
				'Govee-API-Key': govee_api_key,
			}
		};
		var colorTemMin;
		var colorTemMax;
		var newcolorTempzero;
		var newcolorTempzeromod;	
		try {
			var colorTemObj = await this.getObjectAsync(instance + '.' + id + '.colorTem');
			colorTemMin = colorTemObj.common.min;
			colorTemMax = colorTemObj.common.max;
			newcolorTempzero = ((colorTemMin + colorTemMax) / 2);
			newcolorTempzeromod = this.inscale('small',newcolorTempzero,colorTemMin,colorTemMax,140,500);
		} catch (error) {
			newcolorTempzero = 0;
			newcolorTempzeromod = 0;
		}

		var model = await this.getStateAsync(instance + '.' + id + '.model');
		axios.get('https://developer-api.govee.com/v1/devices/state?device=' + encodeURI(id) + '&model=' + encodeURI(model.val),config)
			.then((newresmod) => {
				this.log.info('Request send: get device info (' + id + ')');
				this.log.info('Server Response: ' + newresmod.status + ' (' + newresmod.statusText + ')');
				if(newresmod.status == 200) {
					// Fill objects with values
					for (var devicepropkey in newresmod.data.data.properties) {
						var deviceprop = newresmod.data.data.properties[devicepropkey];
						switch (String(Object.keys(deviceprop))) {
							case 'online':
								this.setStateAsync(instance + '.' + id + '.online', deviceprop.online,true);
								break;
							case 'powerState':
								if(deviceprop.powerState == "on") {
									this.setStateAsync(instance + '.' + id + '.powerState', true,true);
								} else {this.setStateAsync(instance + '.' + id + '.powerState', false,true);}
								break;
							case 'brightness':
								this.setStateAsync(instance + '.' + id + '.brightness', deviceprop.brightness,true);
								break;
							case 'color':
								this.setStateAsync(instance + '.' + id + '.color.rgb.r', deviceprop.color.r,true);
								this.setStateAsync(instance + '.' + id + '.color.rgb.g', deviceprop.color.g,true);
								this.setStateAsync(instance + '.' + id + '.color.rgb.b', deviceprop.color.b,true);
								var hsv = convert.rgb.hsv(deviceprop.color.r,deviceprop.color.g,deviceprop.color.b)
								this.setStateAsync(instance + '.' + id + '.color.hsv.h', hsv[0],true);
								this.setStateAsync(instance + '.' + id + '.color.hsv.s', hsv[1],true);
								this.setStateAsync(instance + '.' + id + '.color.hsv.v', hsv[2],true);
								if(newcolorTempzero != 0) {
									this.setStateAsync(instance + '.' + id + '.colorTem', newcolorTempzero,true);
									this.setStateAsync(instance + '.' + id + '.colorTemMod', newcolorTempzeromod,true);
									// Formel Scale
								}
								break;
							case 'colorTemInKelvin':
								// Do nothing and dont show an Error!
								break;
							case 'colorTem':
								this.setStateAsync(instance + '.' + id + '.colorTem', deviceprop.colorTem,true);
								var newcolorTempmod = this.inscale('small',deviceprop.colorTem,colorTemMin,colorTemMax,140,500);
								this.setStateAsync(instance + '.' + id + '.colorTemMod', newcolorTempmod,true);
								this.setStateAsync(instance + '.' + id + '.color.rgb.r', 0,true);
								this.setStateAsync(instance + '.' + id + '.color.rgb.g', 0,true);
								this.setStateAsync(instance + '.' + id + '.color.rgb.b', 0,true);
								this.setStateAsync(instance + '.' + id + '.color.hsv.h', 0,true);
								this.setStateAsync(instance + '.' + id + '.color.hsv.s', 0,true);
								this.setStateAsync(instance + '.' + id + '.color.hsv.v', 100,true);
								break;
							default:
								this.log.warn("cant find any propertie for Device: " + id);
								break;
						}
					}
					this.log.info('Values for object: ' + id + ' updated');
				}
			}).catch((newerrmod) => {
				this.log.error(newerrmod);
			});
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Govee(options);
} else {
	// otherwise start the instance directly
	new Govee();
}