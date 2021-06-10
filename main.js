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
		if(govee_api_key) {
			this.log.info("Govee API Key: " + this.config.govee_api_key);
		} else {
			this.log.error("Govee API Key: Key is not set (Please set your Govee API Key in the instance config)");
		}
		

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
						if(obj.controllable == true) {
							this.log.info("Device: " + obj.device + ' is controllable');
							this.setObjectNotExistsAsync(obj.device, {
								type: "device",
								common: {
									name: obj.deviceName,
									read: true,
									write: true,
								},
								native: {},
							});
							this.log.info("Device: " + obj.device + ' created');
							this.setObjectNotExistsAsync(obj.device + '.model', {
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
							this.log.info('object "model" for: ' + obj.device + ' created');
							this.setStateAsync(obj.device + '.model', obj.model);
							for (var devicekey in obj.supportCmds) {
								var devicecmd = obj.supportCmds[devicekey];
								switch (devicecmd) {
									case 'turn':
										this.log.info('Device: ' + obj.device + ' supports cmd "powerState"');
										this.setObjectNotExistsAsync(obj.device + '.powerState', {
											type: "state",
											common: {
												name: "govee.device.state.power",
												type: "boolean",
												role: "switch",
											},
											native: {},
										});
										this.log.info('object "powerState" for: ' + obj.device + ' created');
										break;
									case 'brightness':
										this.log.info('Device: ' + obj.device + ' supports cmd "brightness"');
										this.setObjectNotExistsAsync(obj.device + '.brightness', {
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
										this.log.info('object "brightness" for: ' + obj.device + ' created');
										break;
									case 'color':
										this.log.info('Device: ' + obj.device + ' supports cmd "color"');
										this.setObjectNotExistsAsync(obj.device + '.color', {
											type: "device",
											common: {
												name: "govee.device.state.colors",
												read: true,
												write: false,
											},
											native: {},
										});
										this.log.info('object "color" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.color.rgb', {
											type: "device",
											common: {
												name: "govee.device.state.colors.rgb",
												read: true,
												write: false,
											},
											native: {},
										});
										this.log.info('object "color.rgb" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.color.rgb.r', {
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
										this.log.info('object "color.red" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.color.rgb.g', {
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
										this.log.info('object "color.green" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.color.rgb.b', {
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
										this.log.info('object "color.blue" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.color.hsv', {
											type: "device",
											common: {
												name: "govee.device.state.colors.hsv",
												read: true,
												write: false,
											},
											native: {},
										});
										this.log.info('object "color.hsv" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.color.hsv.h', {
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
										this.log.info('object "color.hue" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.color.hsv.s', {
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
										this.log.info('object "color.saturation" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.color.hsv.v', {
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
										this.log.info('object "color.value" for: ' + obj.device + ' created');
										break;
									case 'colorTem':
										this.log.info('Device: ' + obj.device + ' supports cmd "colorTem"');
										this.setObjectNotExistsAsync(obj.device + '.colorTem', {
											type: "state",
											common: {
												name: "govee.device.state.colorTem",
												type: "number",
												role: "level.colorTem",
												min: obj.properties.colorTem.range.min,
												max: obj.properties.colorTem.range.max,
											},
											native: {},
										});
										this.log.info('object "colorTem" for: ' + obj.device + ' created');
										this.setObjectNotExistsAsync(obj.device + '.colorTemMod', {
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
										this.log.info('object "colorTemMod" for: ' + obj.device + ' created');
										colorTempzero = ((obj.properties.colorTem.range.min + obj.properties.colorTem.range.max) / 2);
										colorTempzeromod = this.inscale('small',colorTempzero,obj.properties.colorTem.range.min,obj.properties.colorTem.range.max,140,500);
										break;	
									default:
										this.log.warn('No commands for control found for Device: ' + obj.device);
										break;
								}
							}
							axios.get('https://developer-api.govee.com/v1/devices/state?device=' + encodeURI(obj.device) + '&model=' + encodeURI(obj.model),config)
							.then((resmod) => {
								this.log.info('Request send: get device info (' + obj.device + ')');
								this.log.info('Server Response: ' + resmod.status + ' (' + resmod.statusText + ')');
								if(resmod.status == 200) {
									// Fill objects with values
									for (var devicepropkey in resmod.data.data.properties) {
										var deviceprop = resmod.data.data.properties[devicepropkey];
										switch (String(Object.keys(deviceprop))) {
											case 'online':
												this.setObjectNotExistsAsync(obj.device + '.online', {
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
												this.log.info('object "online" for: ' + obj.device + ' created');
												this.setStateAsync(obj.device + '.online', deviceprop.online);
												break;
											case 'powerState':
												if(deviceprop.powerState == "on") {
													this.setStateAsync(obj.device + '.powerState', true);
												} else {this.setStateAsync(obj.device + '.powerState', false);}
												break;
											case 'brightness':
												this.setStateAsync(obj.device + '.brightness', deviceprop.brightness);
												break;
											case 'color':
												this.setStateAsync(obj.device + '.color.rgb.r', deviceprop.color.r);
												this.setStateAsync(obj.device + '.color.rgb.g', deviceprop.color.g);
												this.setStateAsync(obj.device + '.color.rgb.b', deviceprop.color.b);
												var hsv = convert.rgb.hsv(deviceprop.color.r,deviceprop.color.g,deviceprop.color.b)
												this.setStateAsync(obj.device + '.color.hsv.h', hsv[0]);
												this.setStateAsync(obj.device + '.color.hsv.s', hsv[1]);
												this.setStateAsync(obj.device + '.color.hsv.v', hsv[2]);
												if(colorTempzero != 0) {
													this.setStateAsync(obj.device + '.colorTem', colorTempzero);
													this.setStateAsync(obj.device + '.colorTemMod', colorTempzeromod);
													// Formel Scale
												}
												break;
											case 'colorTemInKelvin':
												// Do nothing and dont show an Error!
												break;
											case 'colorTem':
												this.setStateAsync(obj.device + '.colorTem', deviceprop.colorTem);
												var colorTempmod = this.inscale('small',deviceprop.colorTem,obj.properties.colorTem.range.min,obj.properties.colorTem.range.max,140,500);
												this.setStateAsync(obj.device + '.colorTemMod', colorTempmod);
												this.setStateAsync(obj.device + '.color.rgb.r', 0);
												this.setStateAsync(obj.device + '.color.rgb.g', 0);
												this.setStateAsync(obj.device + '.color.rgb.b', 0);
												this.setStateAsync(obj.device + '.color.hsv.h', 0);
												this.setStateAsync(obj.device + '.color.hsv.s', 0);
												this.setStateAsync(obj.device + '.color.hsv.v', 100);
												break;
											default:
												this.log.warn("cant find any propertie for Device: " + obj.device);
												break;
										}
									}

									this.log.info('Values for object: ' + obj.device + ' added');
									setTimeout(() => {
										startup = false;
										this.log.info("Govee Startup Routine finished");
									}, 5000);
								}
							}).catch((errmod) => {
								this.log.error(errmod);
							});
						}		
					}
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

	refreshValues() {
		this.log.warn("Test");
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