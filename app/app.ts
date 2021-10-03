/*
In NativeScript, the app.ts file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

import {
    android as androidApp,
    AndroidApplication,
    AndroidActivityBundleEventData
} from "@nativescript/core/application";

import { ad } from "@nativescript/core/utils/utils";

declare let com: any;
declare let console: any;

if (androidApp) {
    const ctxt = ad.getApplicationContext();

    androidApp.on(AndroidApplication.activityCreatedEvent, function (
        args: AndroidActivityBundleEventData
    ) {
        let builder = new android.os.StrictMode.VmPolicy.Builder();
        android.os.StrictMode.setVmPolicy(builder.build());

        // Needed for corner cases with HTTP request using TSL on Android API19
        com.google.android.gms.security.ProviderInstaller.installIfNeededAsync(
            ctxt,
            new com.google.android.gms.security.ProviderInstaller.ProviderInstallListener(
                {
                    onProviderInstalled: () => {
                        console.log("Provider Installed!");
                    },
                    onProviderInstallFailed: (errorCode, intent) => {
                        console.log("Error installing: " + errorCode);
                    }
                }
            )
        );
    });
}
import { svelteNative } from "svelte-native";
import App from "./App.svelte";
svelteNative(App, {});

