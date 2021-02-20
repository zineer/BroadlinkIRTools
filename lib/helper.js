import config from "./config";
import store from "./store";
import FileSaver from "file-saver";
import swal from "sweetalert";

export default {
  watchScoketMsgs(evData, sendTarget) { },
  exportFileSaver(_jsonData) {
    let blob = new Blob([JSON.stringify(_jsonData, "", 1)], {
      type: "application/json;charset=utf-8"
    });
    FileSaver.saveAs(blob, "your-ir-code.json");
    swal("Good job!", "Your file was downloaded! Please note that the device_code field only accepts positive numbers. The .json extension is not required.", "success", {
      button: "Oki!"
    });
  },

  sendBroadlinkLearnCmd(remoteName, deviceName, command) {
    store.state.socket.send(JSON.stringify({
      id: store.state.socketId++,
      type: "call_service",
      domain: "remote",
      service: "learn_command",
      service_data: {
        entity_id: remoteName,
        device: deviceName,
        command: command
      }
    }));
  },
  getDupicateItem(_str1, _str2) {
    let temp = [];
    _str1.split(",").map(m1 => {
      m1 = m1.trim();
      _str2.split(",").map(m2 => {
        m2 = m2.trim();
        if (m1 === m2) temp.push(m2);
      });
    });
    return temp;
  },
  getTextClassByIcon(_icon) {
    switch (_icon) {
      case config.iconIr.learn:
        return "text-secondary";
      case config.iconIr.learnFalse:
        return "text-danger";
      case config.iconIr.learnSuccess:
        return "text-success";
      case config.iconIr.learning:
        return "text-primary";
      default:
        return "text-secondary";
    }
  },
  compareHaVersions(version1, version2) {
    let v1parts = version1.split(".");
    let v2parts = version2.split(".");
    while (v1parts.length < v2parts.length) v1parts.push("0");
    while (v2parts.length < v1parts.length) v2parts.push("0");

    v1parts = v1parts.map(Number).slice(0, 3);
    v2parts = v2parts.map(Number).slice(0, 3);
    console.log(v1parts, v2parts);
    for (var i = 0; i < v1parts.length; ++i) {
      if (v2parts.length === i) {
        return 1;
      }

      if (v1parts[i] === v2parts[i]) {
        continue;
      } else if (v1parts[i] > v2parts[i]) {
        return 1;
      } else {
        return -1;
      }
    }
    return 0;
  }

};
