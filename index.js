let Service, Characteristic;
const rsswitch = require("./build/Release/rsswitch");

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform(
    "homebridge-platform-rcswitch-tx-only",
    "RCSwitch",
    RCSwitchPlatform
  );
};

let intervalHandle = null;
const switches = [];
const sendQueue = [];
let switchIndex = 0;
let transmissionDelayMs = 500;
const processQueue = () => {
  let switchToBroadcast;
  if (sendQueue.length > 0) {
    const switchName = sendQueue.shift();
    switchToBroadcast = switches.find((sw) => sw.name == switchName);
  } else {
    switchToBroadcast = switches[switchIndex];
    switchIndex = (switchIndex + 1) % switches.length;
  }
  switchToBroadcast.broadcast();
};
const scheduleQueueProcessing = () => {
  if (intervalHandle == null) {
    intervalHandle = setInterval(processQueue, transmissionDelayMs);
  }
};

class RCSwitchPlatform {
  constructor(log, config) {
    this.config = config;
    transmissionDelayMs = config.transmission_delay_ms || transmissionDelayMs;
    log(`Set transmissionDelayMs to ${transmissionDelayMs} ms.`);
    this.log = log;
  }
  accessories(callback) {
    this.accessories = [];
    this.config.switches.forEach((sw) => {
      const rcSwitch = new RCSwitchAccessory(sw, this.log, this.config);
      switches.push(rcSwitch);
      this.accessories.push(rcSwitch);
    });
    callback(this.accessories);
  }
}

class RCSwitchAccessory {
  constructor(sw, log, config) {
    this.name = sw.name;
    this.sw = sw;
    this.log = log;
    this.config = config;
    this.currentState = false;
    this.service = new Service.Switch(this.name);
    this.service.getCharacteristic(Characteristic.On).value = this.currentState;
    this.service.getCharacteristic(Characteristic.On).on("get", (callback) => {
      callback(null, this.currentState);
    });
    this.service
      .getCharacteristic(Characteristic.On)
      .on("set", (state, callback) => {
        this.currentState = state;
        this.log(`Setting ${this.name} to ${this.currentState}`);
        sendQueue.push(this.name);
        scheduleQueueProcessing();
        callback(null);
      });
  }
  broadcast() {
    const sendPin = this.config.send_pin;
    const code = this.currentState ? this.sw.on.code : this.sw.off.code;
    const pulse = this.currentState ? this.sw.on.pulse : this.sw.off.pulse;
    rsswitch.send(sendPin, code, pulse);
  }
  notify(code) {
    if (this.sw.on.code === code) {
      this.log("%s is turned on", this.sw.name);
      this.service.getCharacteristic(Characteristic.On).setValue(true);
    } else if (this.sw.off.code === code) {
      this.log("%s is turned off", this.sw.name);
      this.service.getCharacteristic(Characteristic.On).setValue(false);
    }
  }
  getServices() {
    const services = [];
    const serviceAccessoryInformation = new Service.AccessoryInformation();
    serviceAccessoryInformation
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, "Raspberry Pi")
      .setCharacteristic(Characteristic.Model, "Raspberry Pi")
      .setCharacteristic(Characteristic.SerialNumber, "Raspberry Pi")
      .setCharacteristic(Characteristic.FirmwareRevision, "1.0.0")
      .setCharacteristic(Characteristic.HardwareRevision, "1.0.0");
    services.push(serviceAccessoryInformation);
    services.push(this.service);
    return services;
  }
}
