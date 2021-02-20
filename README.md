# HOW TO USE

- Download source code ZIP from GitHub - Click green **Code** button and choose **Download ZIP**
- Open ZIP file
- Go to the **dist** folder and open **index.html** in your browser 
- In the page that opens, fill in the relevant fields and click **Connect to hass**, then choose the device type
- Fill in the form on the left to match your devices capabilities
- Click **Create table code**
- For each row in the table, click the signal icon, wait for light to turn on on Broadlink device. When code received, it will be shown in the table

# Broadlink tools

This tool support for SmartIR  https://github.com/smartHomeHub/SmartIR

## How it work
- Disable adblocker on browser. Adblocker may block connection to your Home Assistant instance.
- Uses the web socket API to connect to Home Assistant and send the `learn` command to your Broadlink device. Listens for the event from HA when the code is leaned.

## This is  testing version 
- Media/fan/Universal integrations not in place yet

# For developer 
```
git clone https://github.com/zineer/BroadlinkIRTools.git
cd BroadlinkIRTools
npm i
npm run dev
```

Build code and commit
```
npm run build
```
