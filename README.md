# homebridge-platform-rcswitch-tx-only

<!-- [![NPM Version](https://img.shields.io/npm/v/homebridge-platform-rcswitch.svg)](https://www.npmjs.com/package/homebridge-platform-rcswitch) -->

RCSwitch plugin for the awesome [Homebridge](https://github.com/nfarina/homebridge) project.

## Differences from rainlake/homebridge-platform-rcswitch

1. Sniffing is removed. I found that sniffing often caused my Raspberry Pi's Homebridge process to become unresponsive.
2. Transmissions are repeated to make them more likely to succeed. Three transmissions are made 500 ms apart for each on/off command.

## Currently supports

- [Etekcity Remote Control Outlet Kit](https://www.amazon.com/Etekcity-Household-Appliances-Unlimited-Connections/dp/B00DQELHBS?SubscriptionId=AKIAIXPYH54L3NDDTYKQ&tag=bloopist-20&linkCode=xm2&camp=2025&creative=165953&creativeASIN=B00DQELHBS)
- Other 433 Mhz remote controlled outlets

# Installation

1. Install libuv-dev using: `apt-get install libuv-dev`
2. Install homebridge using: `npm install -g homebridge`
3. Install this plugin using: `npm install -g homebridge-platform-rcswitch`
4. Update your configuration file. See the sample below.

# Configuration

Configuration sample:

`send_pin` is the gpio pin you are using to send signal. It is different than the physical pin you are using. See [wireingpi.com](http://wiringpi.com/pins/) for details.

`switches` is the list of the "buttons" codes on your remote.

You'll need to adjust the keys `bridge.name`, `bridge.username`, `bridge.pin`, and the `on.code` and `off.code` properties for each switch.

```javascript
{
  "bridge": {
    "name": "Homebridge",
    "username": "AA:BB:CC:DD:EE:FF",
    "port": 51826,
    "pin": "123-45-678"
  },
  "description": "",
  "platforms": [
    {
      "platform": "RCSwitch",
      "name": "RCSwitch Platform",
      "send_pin": 0,
      "tolerance": 90,
      "switches": [
        {
          "name": "Zap Plug Port 1",
          "on": {
            "code": 123456,
            "pulse": 188
          },
          "off": {
            "code": 123456,
            "pulse": 188
          }
        }
      ]
    }
  ]
}
```

# Credits

Credit goes to

- [wireing pi](http://wiringpi.com/pins/)
- 433 control codes ported from [433Utils](https://github.com/ninjablocks/433Utils)
- [rfoutlet project](https://github.com/timleland/rfoutlet) and his [blog post](https://timleland.com/wireless-power-outlets/)
- [http://scottfrees.com/](http://scottfrees.com/) for his great tutorial for asynchronous call.
- inspired by [homebridge-platform-wemo] https://github.com/rudders/homebridge-platform-wemo
- [rainlake/homebridge-platform-rcswitch](https://github.com/rainlake/homebridge-platform-rcswitch)

# License

Published under the MIT License.
