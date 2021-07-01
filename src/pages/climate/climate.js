import {
  config,
  helper
} from "../../../lib";
export default {
  data() {
    return {
      irData: {
        off: {
          key: "off",
          operationMode: "off",
          fanMode: null,
          temp: null,
          irCode: "",
          iconClass: config.iconIr.learn
        }
      },
      irDataReady: false,
      hassInfo: undefined,
      settings: {
        manufacturer: "Unknown",
        supportedModels: "Unknown",
        supportedController: ["Broadlink"],
        supportedControllerSelected: "Broadlink",
        precision: 1.0,
        minTemperature: 18,
        maxTemperature: 32,
        operationModes: "cool, heat",
        fanModes: "auto, level1, level2, level3, level4",
        swingModes: "horizontal, vertical, both"
      },
      sentCommandKey: undefined,
      promiseResolve: undefined,
      promiseReject: undefined,
      jsonfile: null
    };
  },
  computed: {
    hassInfoStatus() {
      if (this.$store.state.socketStatus !== config.socketStatus.connected) return true;
      if (this.irDataReady === true) return true;
      return false;
    },
    sendCmdModeList() {
      if ($.isEmptyObject(this.settings.operationModes)) return;
      return this.settings.operationModes
        .split(",")
        .map(m => m.trim());
    },
    sendCmdFanList() {
      if ($.isEmptyObject(this.settings.fanModes)) return;
      return this.settings.fanModes.split(",").map(m => m.trim());
    },
    sendCmdSwingList() {
      if ($.isEmptyObject(this.settings.swingModes)) return;
      return this.settings.swingModes.split(",").map(m => m.trim());
    },
    sendCmdTempList() {
      let temp = [];
      let index = this.settings.minTemperature * 1;
      while (index <= this.settings.maxTemperature * 1) {
        temp.push(index);
        index = index + this.settings.precision * 1;
      }
      return temp;
    }
  },
  watch: {
    "$store.state.socketMsgs": {
      deep: true,
      handler: function (evData) {
        if (evData.event && evData.event.event_type && evData.event.data) {
          let eventData = evData.event.data;
          switch (evData.event.event_type) {
            case "remote_learned_command":

              if (this.sentCommandKey === eventData.command) {
                let irCode = eventData.code;
                this.$set(this.irData[this.sentCommandKey], "irCode", irCode);
                this.$set(this.irData[this.sentCommandKey], "iconClass", config.iconIr.learnSuccess);
                this.sentCommandKey = undefined;
                if (this.promiseResolve) {
                  this.promiseResolve(true);
                }
              }
              break;
            case "remote_learned_command_failed":
              alert(eventData.error);
              if (this.sentCommandKey) {
                this.$set(this.irData[this.sentCommandKey], "iconClass", config.iconIr.learnFalse);
                console.error("Error: ", eventData.error);
                if (this.promiseReject) {
                  this.promiseReject(true);
                }
              }
              break;
          }
        }
      }
    }
  },
  mounted() {
    if (this.$store.state.hassInfo) {
      this.hassInfo = this.$store.state.hassInfo;
    } else {
      return this.$router.push({
        path: "/"
      });
    };
  },
  methods: {
    exportFile() {
      let jsonData = {
        manufacturer: this.settings.manufacturer,
        supportedModels: this.settings.supportedModels.split(",").map(m2 => m2.trim()),
        commandsEncoding: "Base64",
        supportedController: this.settings.supportedControllerSelected,
        minTemperature: parseInt(this.settings.minTemperature),
        maxTemperature: parseInt(this.settings.maxTemperature),
        precision: parseFloat(this.settings.precision),
        operationModes: this.settings.operationModes.split(",").map(m2 => m2.trim()),
        fanModes: this.settings.fanModes.split(",").map(m2 => m2.trim()),
        swingModes: this.settings.swingModes.split(",").map(m2 => m2.trim()),
        commands: {}
      };

      Object.keys(this.irData).forEach(key => {
        let m = this.irData[key];
        if (m.operationMode === "off") {
          jsonData.commands[m.operationMode] = m.irCode;
        } else {
          if (!jsonData.commands[m.operationMode]) jsonData.commands[m.operationMode] = {};
          if (!jsonData.commands[m.operationMode][m.fanMode]) jsonData.commands[m.operationMode][m.fanMode] = {};
          if (!jsonData.commands[m.operationMode][m.fanMode][m.swingMode]) jsonData.commands[m.operationMode][m.fanMode][m.swingMode] = {};
          if (!jsonData.commands[m.operationMode][m.fanMode][m.swingMode][m.temp]) jsonData.commands[m.operationMode][m.fanMode][m.swingMode][m.temp] = {};
          jsonData.commands[m.operationMode][m.fanMode][m.swingMode][m.temp] = m.irCode;
        }
      });

      // export file
      helper.exportFileSaver(jsonData);
    },
    setupComponent() {
      this.$validator.validateAll().then((result) => {
        if (!result) return alert("Please enter field is required.");
        this.irDataReady = true;
        let _that = this;
        _that.settings.operationModes.split(",").forEach(operationMode => {
          operationMode = operationMode.trim();
          _that.settings.fanModes.split(",").forEach(fanMode => {
            fanMode = fanMode.trim();
            _that.settings.swingModes.split(",").forEach(swingMode => {
              swingMode = swingMode.trim();
              _that.sendCmdTempList.forEach(temp => {
                _that.$set(_that.irData, `${operationMode}_${fanMode}_${swingMode}_${temp}`, {
                  key: `${operationMode}_${fanMode}_${swingMode}_${temp}`,
                  operationMode: operationMode,
                  fanMode: fanMode,
                  swingMode: swingMode,
                  temp: temp,
                  irCode: "",
                  iconClass: config.iconIr.learn
                });
              });
            });
          });
        });
        console.log(this.irData);
      });
    },
    sendLearnCommand(_target) {
      console.log("Command was send..", _target.key);
      this.sentCommandKey = _target.key;
      this.$set(this.irData[this.sentCommandKey], "iconClass", config.iconIr.learning);
      helper.sendBroadlinkLearnCmd(this.$store.state.hassInfo.broadlinkIp, "climate", this.sentCommandKey);
    },
    changeBroadlinkIp() {
      this.$store.state.hassInfo.broadlinkIp = this.hassInfo.broadlinkIp;
    },
    fileChange(fieldName, fileList) {
      if (!fileList.length) return;

      let file = fileList[0];
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        let jsonData = JSON.parse(event.currentTarget.result);
        console.log(jsonData);

        if (jsonData.manufacturer) {
          this.settings.manufacturer = jsonData.manufacturer;
        }
        if (jsonData.supportedModels) {
          this.settings.supportedModels = jsonData.supportedModels.join(", ");
        }
        if (jsonData.supportedController) {
          this.settings.supportedControllerSelected = jsonData.supportedController;
        }
        if (jsonData.precision) {
          this.settings.precision = jsonData.precision;
        }
        if (jsonData.minTemperature) {
          this.settings.minTemperature = jsonData.minTemperature;
        }
        if (jsonData.maxTemperature) {
          this.settings.maxTemperature = jsonData.maxTemperature;
        }
        if (jsonData.operationModes) {
          this.settings.operationModes = jsonData.operationModes.join(", ");
        }
        if (jsonData.fanModes) {
          this.settings.fanModes = jsonData.fanModes.join(", ");
        }
        if (jsonData.swingModes) {
          this.settings.swingModes = jsonData.swingModes.join(", ");
        }
        if (jsonData.commands) {
          this.irDataReady = true;
          for (const operationMode in jsonData.commands) {
            if (operationMode === "off") {
              this.$set(this.irData, `${operationMode}`, {
                key: `${operationMode}`,
                operationMode: operationMode,
                fanMode: null,
                swingMode: null,
                temp: null,
                irCode: jsonData.commands[operationMode],
                iconClass: jsonData.commands[operationMode] ? config.iconIr.learnSuccess : config.iconIr.learn
              });
            } else {
              for (const fanMode in jsonData.commands[operationMode]) {
                for (const swingMode in jsonData.commands[operationMode][fanMode]) {
                  for (const temp in jsonData.commands[operationMode][fanMode][swingMode]) {
                    this.$set(this.irData, `${operationMode}_${fanMode}_${swingMode}_${temp}`, {
                      key: `${operationMode}_${fanMode}_${swingMode}_${temp}`,
                      operationMode: operationMode,
                      fanMode: fanMode,
                      swingMode: swingMode,
                      temp: temp,
                      irCode: jsonData.commands[operationMode][fanMode][swingMode][temp],
                      iconClass: jsonData.commands[operationMode][fanMode][swingMode][temp] ? config.iconIr.learnSuccess : config.iconIr.learn
                    });
                  }
                }
              }
            }
          }
          console.log(this.irData);
        }
      });
      reader.readAsText(file);
    },
    async autoMode() {
      if (!this.irDataReady) {
        return;
      }
      console.log(this.irData);
      for (const command in this.irData) {
        if (this.irData[command]["irCode"] === "") {
          await new Promise((resolve, reject) => {
            this.promiseResolve = resolve;
            this.promiseReject = reject;
            console.log("Send code for " + command);
            this.sentCommandKey = command;
            document.getElementById("row_" + command).scrollIntoView();
            this.$set(this.irData[command], "iconClass", config.iconIr.learning);
            helper.sendBroadlinkLearnCmd(this.$store.state.hassInfo.broadlinkIp, "climate", command);
          });
        }
      }
    }
  }
};
