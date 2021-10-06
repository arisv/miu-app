<script lang="ts">
  import * as appSettings from "@nativescript/core/application-settings";
  import { onMount } from "svelte";
  import { setTextSync } from "nativescript-clipboard";
  import * as bghttp from "@nativescript/background-http";
  import { File } from "@nativescript/core/file-system";

  export let uploadObject: string;
  export const returnOnSuccess: Boolean = false;

  let currentProgress = 0;
  let maxProgress = 100;
  let finalFilename = "";

  function uuid() {
    var chars = "0123456789abcdef".split("");

    var uuid = [],
      rnd = Math.random,
      r;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
    uuid[14] = "4"; // version 4

    for (var i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (rnd() * 16);

        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r & 0xf];
      }
    }

    return uuid.join("");
  }

  function uploadFile(subject: string) {
    console.log("Trying to resolve filepath " + subject);
    const exists = File.exists(subject);
    console.log(`Does file exist: ${exists}`);
    let file = File.fromPath(subject);
    console.log(`File size is: ${file.size}`);
    const extension = file.extension.replace(".", "");
    console.log(`File extension is ${extension}`);
    const mimeTypeMap = android.webkit.MimeTypeMap.getSingleton();
    const mimeType = mimeTypeMap.getMimeTypeFromExtension(extension);
    console.log(`File meowtype is ${mimeType}`);

    let hostname = appSettings.getString("hostname");
    let apikey = appSettings.getString("apikey");

    if (!hostname) {
      throw new Error("Please set a host name for MIU instance");
    }
    if (!apikey) {
      throw new Error("Please provide an API key for remote upload");
    }
    let endpoint = hostname + "/getfile/";
    let session = bghttp.session(`upload-${uuid()}`);
    let request = {
      url: endpoint,
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": file.size,
      },
      description: "Uploading " + subject,
    };
    let params = [
      {
        name: "meowfile_remote",
        filename: subject,
        mimeType: mimeType,
      },
      {
        name: "private_key",
        value: apikey,
      },
    ];

    let task = session.multipartUpload(params, request);

    task.on("error", function (e) {
      console.log("Error code:" + e.responseCode);
      console.log(e);
    });
    task.on("progress", function (e) {
      console.log(e.currentBytes + " out of " + e.totalBytes);
      currentProgress = (e.currentBytes / e.totalBytes) * 100;
      console.log(`${currentProgress}%`);
    });
    task.on("responded", function (e) {
      console.log("server replied with");
      console.log(e.data);
      try {
        let payload = JSON.parse(e.data);
      finalFilename = payload.file;
      setTextSync(finalFilename);
      } catch (e) {
        console.log(`Error parsing response, got`);
        console.dir(e);
      }
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
      <textField class="big" text={finalFilename} />
    {/if}
  </stackLayout>
</page>

<style>
  .big {
    font-size: 24px;
    padding-left: 30;
  }
</style>
