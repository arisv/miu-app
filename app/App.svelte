<script lang="ts">
  import * as appSettings from "@nativescript/core/application-settings";
  import * as application from "@nativescript/core/application";
  import { isAndroid } from "@nativescript/core";
  import { onMount } from "svelte";
  import { showModal } from "svelte-native";
  import { prompt } from "@nativescript/core/ui/dialogs";
  import { openFilePicker } from "nativescript-simple-filepicker";
  import { File } from "@nativescript/core/file-system";
  import { UriHelper } from "./UriHelper";
  import UploadWidget from "./UploadWidget.svelte";
  var bghttp = require("@nativescript/background-http");

  let apikey: string = null;
  let hostname: string = null;

  function onSetHostTap() {
    prompt("MIU host url", hostname ?? "https://i.komachi.sh").then(function (
      res
    ) {
      if (res.result == true && res.text != null) {
        hostname = res.text;
        appSettings.setString("hostname", res.text);
        let result = appSettings.flush();
      }
    });
  }

  function onSetApiKeyTap() {
    prompt("MIU profile key", apikey ?? "").then(function (res) {
      if (res.result == true && res.text) {
        apikey = res.text;
        appSettings.setString("apikey", res.text);
        let result = appSettings.flush();
      }
    });
  }

  function pickFile() {
    openFilePicker({}).then((data) => {
      if (data.files) {
        console.log(data);
        const fileToUpload = data.files[0];
        console.log(fileToUpload);
        try {
          showModal({ page: UploadWidget, props: {uploadObject: fileToUpload} });
          //uploadFile(fileToUpload);
        } catch (e) {
          console.log("Error while uploading file");
          console.log(e);
        }
      }
    });
  }

  onMount(function () {
    hostname = appSettings.getString("hostname");
    apikey = appSettings.getString("apikey");

    if (isAndroid) {
      application.android.on(
        application.AndroidApplication.activityCreatedEvent,
        handleResult
      );

      function handleResult(args) {
        let activity = args.activity;
        // Get intent, action and MIME type
        let intent = activity.getIntent();
        let action = intent.getAction();
        if (android.content.Intent.ACTION_SEND == action) {
          let clip = intent.getClipData();
          if (clip) {
            console.log(clip);
            let count = clip.getItemCount();
            for (let i = 0; i < count; i++) {
              let clipItem = clip.getItemAt(i);
              if (clipItem) {
                let uri = clipItem.getUri();
                if (uri) {
                  let resolved = UriHelper._calculateFileUri(uri);
                  console.log("Uri: " + resolved);
                  const fileToUpload = ""+resolved;
                  console.log("Sending file to upload:" + fileToUpload);
                  setTimeout(function(fileToUpload) {
                    showModal({ page: UploadWidget, props: {uploadObject: fileToUpload} });
                  }, 1000, fileToUpload);
                }
              }
            }
          } else {
            let uri = intent.getData();
            console.log(uri);
          }
        }

        application.android.off(
          application.AndroidApplication.activityCreatedEvent,
          handleResult
        );
      }
    }
  });
</script>

<page>
  <actionBar>
    <stackLayout orientation="horizontal">
      <label width="40">MIU</label>
      <label text="The official app (tm)" />
    </stackLayout>
  </actionBar>
  <stackLayout>
    <textField
      height="60"
      editable="false"
      class="stats {hostname ? 'set' : 'unset'}"
      text={hostname
        ? "MIU host: " + hostname
        : "Host name not set (tap to set)"}
      on:tap={onSetHostTap}
    />
    <textField
      height="60"
      editable="false"
      class="stats {apikey ? 'set' : 'unset'}"
      text={apikey ? "Api key: " + apikey : "Api key not set (tap to set)"}
      on:tap={onSetApiKeyTap}
    />
    <button class="-primary" text="Upload a file" on:tap={pickFile} />
  </stackLayout>
</page>

<style>
  .stats {
    font-size: 20px;
    padding-left: 30;
  }
  .set {
    background-color: rgb(80, 212, 80);
    font-size: 20;
  }
  .unset {
    background-color: rgba(219, 73, 73, 0.986);
  }
</style>
