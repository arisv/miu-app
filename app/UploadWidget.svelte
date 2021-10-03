<script lang="ts">
  import * as appSettings from "@nativescript/core/application-settings";
  import { onMount } from "svelte";
  import { File } from "@nativescript/core/file-system";
  import * as bghttp from "@nativescript/background-http";

  export let uploadObject: String;

  let currentProgress = 0;
  let maxProgress = 0;
  let finalFilename = "";

  function uploadFile(subject: String) {
    console.log("About to try uploading " + subject);
    let hostname = appSettings.getString("hostname");
    let apikey = appSettings.getString("apikey");
    if (!hostname) {
      throw new Error("Please set a host name for MIU instance");
    }
    if (!apikey) {
      throw new Error("Please provide an API key for remote upload");
    }
    let endpoint = hostname + "/getfile/";
    let session = bghttp.session("image-upload");
    let request = {
      url: endpoint,
      method: "POST",
      headers: {},
      description: "Uploading " + subject,
    };
    let params = [
      {
        name: "meowfile_remote",
        filename: subject,
        mimeType: "image/jpeg",
      },
      {
        name: "private_key",
        value: apikey,
      },
    ];

    let task = session.multipartUpload(params, request);
    maxProgress = task.totalUpload;

    task.on("error", function (e) {
      console.log("Error code:" + e.responseCode);
      console.log(e);
    });
    task.on("progress", function (e) {
      console.log(e.currentBytes + " out of" + e.totalBytes);
      currentProgress = e.currentBytes;
    });
    task.on("responded", function (e) {
      console.log("server replied with");
      console.log(e.data);
      let payload = JSON.parse(e.data);
      finalFilename = payload.file;
    });
  }

  onMount(async function () {
    if (uploadObject) {
      uploadFile(uploadObject);
    }
  });
</script>

<page>
  <stackLayout backgroundColor="#3c495e">
    <label class="big" text={"Uploading " + uploadObject} height="70" />
    <progress value={currentProgress} maxValue={maxProgress} />
    {#if finalFilename}
      <textField class="big" text="{ finalFilename }"/>
    {/if}
  </stackLayout>
</page>

<style>
  .big {
    font-size: 24px;
    padding-left: 30;
  }
</style>
