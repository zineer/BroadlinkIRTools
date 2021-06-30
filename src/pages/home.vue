<style lang="css" scoped>
.card {
  border: 0.2rem solid #ededed;
}
.tip {
  padding-top: 0.4rem;
  font-size: 0.6rem;
}
</style>

<template>
  <div class="container-fluid">
    <div class="col-6 offset-3 pt-5">
      <div class="card">
        <div class="card-body p-2">
          <h4>1. Connect to HASS</h4>
          <div class="alert alert-warning p-2 mb-1">
            - If can not connect to hass, please add this url to cors_allowed_origins on hass config file <b><a href="https://www.home-assistant.io/components/http/#cors_allowed_origins">Read more</a></b><br>
            <b class="text-danger">- No information is passed to our server. All communication is done in browser.</b>
          </div>
          <div class="form-group mb-1" :class="{'is-invalid':errors.has('hassInfo.url')}">
            <label class="mb-0">Hass Address</label>
            <input v-model="hassInfo.url" v-validate="'required'" :disabled="hassInfoStatus" data-vv-as="HASS address" name="hassInfo.url" type="text" class="form-control form-control-sm" placeholder="http://">
            <small v-if="errors.has('hassInfo.url')" class="form-text text-muted">{{ errors.first('hassInfo.url') }}</small>
            <small v-else class="form-text text-muted">If you are accessing this page from https, you must enter an https address</small>
          </div>
          <div class="form-group mb-1" :class="{'is-invalid':errors.has('hassInfo.token')}">
            <label class="mb-0">Token</label>
            <input v-model="hassInfo.token" v-validate="'required'" :disabled="hassInfoStatus" data-vv-as="token" name="hassInfo.token" type="text" class="form-control form-control-sm">
            <small v-if="errors.has('hassInfo.token')" class="form-text text-muted">{{ errors.first('hassInfo.token') }}</small>
            <small v-else class="form-text text-muted">
              HASS long time token <a target="_blank" href="https://www.home-assistant.io/docs/authentication/#your-account-profile">read more</a>
              <template v-if="showTip"> or get it from <a :href="hassInfo.url+'/profile'" target="_blank">here</a></template>
            </small>
          </div>
          <div class="form-group mb-1" :class="{'is-invalid':errors.has('hassInfo.broadlinkIp')}">
            <label class="mb-0">Broadlink Remote Entity ID</label>
            <input v-model="hassInfo.broadlinkIp" v-validate="'required'" data-vv-as="broadlink service" name="hassInfo.broadlinkIp" type="text" class="form-control form-control-sm" placeholder="remote.broadlink_remote">
            <small v-if="errors.has('hassInfo.broadlinkIp')" class="form-text text-muted">{{ errors.first('hassInfo.broadlinkIp') }}</small>
          </div>
          <div class="form-group mb-1">
            <div class="row align-items-center">
              <div class="col-6">
                <button type="button" class="btn btn-primary btn-sm mt-2" :disabled="hassInfoStatus" @click="connectToHass()">
                  <i class="mr-1" :class="iconConnect" /> Connect to hass
                </button>
              </div>
              <div v-if="hassInfoStatus" class="col-6 text-right">
                <small class="mt-2">Press F5 to reconnect</small>
              </div>
            </div>
          </div>
          <hr>
          <h4>2. Select your device type</h4>
          <div class="row no-gutters">
            <div class="col-3 text-center px-1">
              <button class="btn btn-secondary btn-block" :disabled="!hassInfoStatus" @click="gotoPage('/climate')">Climate</button>
            </div>
            <!-- <div class="col-3 text-center px-1">
              <button class="btn btn-secondary btn-block" :disabled="!hassInfoStatus" @click="gotoPage('/media')">Media</button>
            </div>
            <div class="col-3 text-center px-1">
              <button class="btn btn-secondary btn-block" :disabled="!hassInfoStatus" @click="gotoPage('/fan')">Fan</button>
            </div>
            <div class="col-3 text-center px-1">
              <button class="btn btn-secondary btn-block" :disabled="!hassInfoStatus" @click="gotoPage('/other')">Other</button>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { config, swal, helper } from "../../lib";
export default {
  data() {
    return {
      iconConnect: "fas fa-link", // fas fa-sync fa-spin
      hassInfo: {
        url: undefined,
        token: undefined,
        broadlinkIp: undefined
      }
    };
  },
  computed: {
    showTip: function () {
      return !!((this.hassInfo.url && this.hassInfo.url !== "https://" && this.hassInfo.url !== "http://" && !this.errors.first("hassInfo.url")));
    },
    hassInfoStatus: function () {
      return this.$store.state.socketStatus === config.socketStatus.connected;
    }
  },
  mounted() {
    swal("Welcome!", "Please disable your ads blocker, because it blocks connections to HASS!", "warning", {
      button: "Ok"
    });
    if (this.$store.state.hassInfo) this.hassInfo = this.$store.state.hassInfo;
  },
  methods: {
    gotoPage(_path) {
      this.$router.push({
        path: _path
      });
    },
    connectToHass() {
      this.$validator.validateAll().then((result) => {
        if (!result) return alert("Please enter field is required.");

        // change icon
        this.iconConnect = config.iconIr.learning;

        let vm = this;

        try {
          let testUrl = new URL(this.hassInfo.url);
        } catch (err) {
          throw err;
        }

        let url = new URL(this.hassInfo.url);
        if (url.protocol === "https:") {
          vm.socket = new WebSocket(`wss://${url.host}/api/websocket`);
        } else {
          vm.socket = new WebSocket(`ws://${url.host}/api/websocket`);
        }
        vm.$store.state.socket = vm.socket;

        // Listen for messages
        vm.socket.onmessage = (event) => {
          const evData = $.parseJSON(event.data);
          console.log("Message from server ", evData);

          if (evData.ha_version && helper.compareHaVersions(evData.ha_version, config.minHaVersion) < 0) {
            return swal("Woa!", "Hass version must be at least " + config.minHaVersion, "error", {
              button: "Oki!"
            });
          }

          // API required token -> Send pasword to HA
          if (evData.type === "auth_required") {
            console.log("Login..");
            vm.socket.send(JSON.stringify({
              type: "auth",
              access_token: vm.hassInfo.token
            }));
          }

          if (evData.type === "auth_invalid") {
            return swal("Woa!", "Token invalid...", "error", {
              button: "Oki!"
            });
          }

          if (evData.type === "auth_ok") {
            console.log("Login ok...");
            vm.$store.state.socketStatus = config.socketStatus.connected;
            vm.$store.state.hassInfo = vm.hassInfo;

            // subscribe events
            vm.socket.send(JSON.stringify({
              id: vm.$store.state.socketId++,
              type: "subscribe_events",
              event_type: "remote_learned_command"
            }));

            // vm.socket.send(JSON.stringify({
            //   id: vm.$store.state.socketId++,
            //   type: "get_states"
            // }));

            vm.iconConnect = config.iconIr.learnSuccess;
            swal("Good job!", "Login successfully into hass. Now choose the device you want to use", "success", {
              button: "Oki!"
            });
          }

          if (evData.success === false) {
            return swal("Error!", evData.error.message, "error", {
              button: "Oki!"
            });
          };

          vm.$store.state.socketMsgs = evData;
        };
      }).catch(err => {
        alert(err.message);
      });
    }
  }
};
</script>
