var Service, Characteristic, LastUpdate;
var rsswitch = require("./build/Release/rsswitch");

module.exports = function(homebridge) {
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
let queueProcessingIsScehduled = false;

const processQueue = () => {
  queueProcessingIsScehduled = false;

  const message = sendQueue.shift();
  rsswitch.send(message.sendPin, message.code, message.pulse);

  scheduleQueueProcessing();
};

const scheduleQueueProcessing = ({ runNow = false } = { runNow: false }) => {
  if (queueProcessingIsScehduled) {
    return;
  }
  if (sendQueue.length > 0) {
    const delay = runNow ? 0 : TRANSMISSION_DELAY_MS;
    setTimeout(processQueue, delay);
    queueProcessingIsScehduled = true;
  }
};

function RCSwitchPlatform(log, config) {
  var self = this;
  self.config = config;
  self.log = log;
}
RCSwitchPlatform.prototype.accessories = function(callback) {
  var self = this;
  self.accessories = [];
  self.config.switches.forEach(function(sw) {
    self.accessories.push(new RCSwitchAccessory(sw, self.log, self.config));
  });
  callback(self.accessories);
};

function RCSwitchAccessory(sw, log, config) {
  var self = this;
  self.name = sw.name;
  self.sw = sw;
  self.log = log;
  self.config = config;
  self.currentState = false;

  self.service = new Service.Switch(self.name);

  self.service.getCharacteristic(Characteristic.On).value = self.currentState;

  self.service.getCharacteristic(Characteristic.On).on(
    "get",
    function(cb) {
      cb(null, self.currentState);
    }.bind(self)
  );

  self.service.getCharacteristic(Characteristic.On).on(
    "set",
    function(state, cb) {
      self.currentState = state;
      if (self.currentState) {
        for (let count = 1; count <= TRANSMISSION_ATTEMPTS; count += 1) {
          sendQueue.push({
            sendPin: self.config.send_pin,
            code: self.sw.on.code,
            pulse: self.sw.on.pulse
          });
          scheduleQueueProcessing({ runNow: true });
        }
      } else {
        for (let count = 1; count <= TRANSMISSION_ATTEMPTS; count += 1) {
          sendQueue.push({
            sendPin: self.config.send_pin,
            code: self.sw.off.code,
            pulse: self.sw.off.pulse
          });
          scheduleQueueProcessing({ runNow: true });
        }
      }
      cb(null);
    }.bind(self)
  );
}
RCSwitchAccessory.prototype.notify = function(code) {
  var self = this;
  if (this.sw.on.code === code) {
    self.log("%s is turned on", self.sw.name);
    self.service.getCharacteristic(Characteristic.On).setValue(true);
  } else if (this.sw.off.code === code) {
    self.log("%s is turned off", self.sw.name);
    self.service.getCharacteristic(Characteristic.On).setValue(false);
  }
};
RCSwitchAccessory.prototype.getServices = function() {
  var self = this;
  var services = [];
  var service = new Service.AccessoryInformation();
  service
    .setCharacteristic(Characteristic.Name, self.name)
    .setCharacteristic(Characteristic.Manufacturer, "Raspberry Pi")
    .setCharacteristic(Characteristic.Model, "Raspberry Pi")
    .setCharacteristic(Characteristic.SerialNumber, "Raspberry Pi")
    .setCharacteristic(Characteristic.FirmwareRevision, "1.0.0")
    .setCharacteristic(Characteristic.HardwareRevision, "1.0.0");
  services.push(service);
  services.push(self.service);
  return services;
};
