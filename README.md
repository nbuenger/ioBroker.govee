![Logo](admin/govee.png)
# ioBroker.govee

[![NPM version](https://img.shields.io/npm/v/iobroker.govee.svg)](https://www.npmjs.com/package/iobroker.govee)
[![Downloads](https://img.shields.io/npm/dm/iobroker.govee.svg)](https://www.npmjs.com/package/iobroker.govee)
![Number of Installations (latest)](https://iobroker.live/badges/govee-installed.svg)
![Number of Installations (stable)](https://iobroker.live/badges/govee-stable.svg)
[![Dependency Status](https://img.shields.io/david/nbuenger/iobroker.govee.svg)](https://david-dm.org/nbuenger/iobroker.govee)
[![Build](https://travis-ci.com/nbuenger/ioBroker.govee.svg?branch=main)


[![NPM](https://nodei.co/npm/iobroker.govee.png?downloads=true)](https://nodei.co/npm/iobroker.govee/)

**Tests:** ![Test and Release](https://github.com/nbuenger/ioBroker.govee/workflows/Test%20and%20Release/badge.svg)

## Govee Control

control govee lights over there api<br><br>
**Govee** is a brand of DE-GOVEE Moments Ltd.<br>
All images and trademarks are for illustrative purposes only and I do not collect any rights to the trademark.<br>
For more information, visit the Govee page: https://us.govee.com/ 


## THIS VERSION IS FOR TEST ONLY
This Govee adapter is in development. Some functions may not work probably.
This adapter only works with govee Wifi lightnings not Bluetooth.

### Getting started

1. Install this adapter on your ioBroker.
2. Get your own Govee API key.
 - Go to your Account tab -> "Settings" -> "About us" -> "Apply for API key"
 - Fill out your name und your reason ("SmartHome Control" would be sufficient)
 - You will receice your API Key to your Govee registered email address

3. Paste your API Key in the Govee Adapter configuration.
4. Set up the refresh time value (min: 5 seconds).

5. All your by the Govee API supportet Lights will be automatically added to your ioBroker objects.
6. States for your objects will added automatically.

### ioBroker States ####

| instance object    | govee.x                 | main object for the govee insrtance               |
| --- | --- | --- |
| device object      | XX:XX:XX:XX:XX:XX:XX:XX | device object for on lighting device              |
| color folder       | color                   | folder for 2 types of color objects               |
| color hsv folder   | hsv                     | folder for the hsv color format                   |
| color object h     | h                       | object for color control hue                      |
| color object s     | s                       | object for color control saturation               |
| color object v     | v                       | object for color control value (Default: 100)     |
| color rgb folder   | rgb                     | folder for the rgb color format                   |
| color object r     | r                       | object for color control red                      |
| color object g     | g                       | object for color control green                    |
| color object b     | b                       | object for color control blue                     |
| color object hex   | hex                     | object for color control hex                      |
| brightness object  | brightness              | object for brightness control                     |
| colorTem object    | colorTem                | object for colorTem control                       |
| colorTemMod object | colorTemMod             | object for colorTemMod control (Needed for Yahka) |
| model object       | model                   | object shows your device model                    |
| online object      | online                  | object shows is your device online                |
| powerState object  | powerstate              | object shows is your device powered on or off     |

## Changelog

### 0.0.1
* (Nick Bünger) initial release

### 0.0.2
* (Nick Büger) Update 0.0.2
 - Multidevice support added.
 - devicestate updates by govee API.

### 0.0.3
* (Nick Bünger) Update 0.0.3
 - add expert log.
 - add object hex.
 - value brightness cant be under 1.

## License
MIT License

Copyright (c) 2021 Nick Bünger <buenger.nick@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
