let Service, Characteristic;
const rsswitch = require("./build/Release/rsswitch");
const switches = [];

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform(
    "homebridge-platform-rcswitch",
    "RCSwitch",
    RCSwitchPlatform
  );
};

const sendQueue = [];
const TRANSMISSION_DELAY_MS = 300;
const TRANSMISSION_ATTEMPTS = 3;
let queueProcessingIsScheduled = false;
const processQueue = () => {
  queueProcessingIsScheduled = false;

  const message = sendQueue.shift();
  rsswitch.send(message.sendPin, message.code, message.pulse);
  switches.forEach((sw) => console.log(`${sw.name} is ${sw.currentState}`));
  console.log("-=-=-=-");

  scheduleQueueProcessing();
};
const scheduleQueueProcessing = ({ runNow = false } = {}) => {
  if (queueProcessingIsScheduled) {
    return;
  }
  if (sendQueue.length > 0) {
    const delay = runNow ? 0 : TRANSMISSION_DELAY_MS;
    setTimeout(processQueue, delay);
    queueProcessingIsScheduled = true;
  }
};

class RCSwitchPlatform {
  constructor(log, config) {
    this.config = config;
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
        for (let count = 1; count <= TRANSMISSION_ATTEMPTS; count += 1) {
          sendQueue.push({
            sendPin: this.config.send_pin,
            code: this.sw.on.code,
            pulse: this.currentState ? this.sw.on.pulse : this.sw.off.pulse,
          });
          scheduleQueueProcessing({ runNow: true });
        }
        callback(null);
      });
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
