import * as application from "@nativescript/core/application";

declare let console: any;

export class UriHelper {
    public static _calculateFileUri(uri: android.net.Uri) {
        let DocumentsContract = (<any>android.provider).DocumentsContract;
        let isKitKat = android.os.Build.VERSION.SDK_INT >= 19; // android.os.Build.VERSION_CODES.KITKAT

        if (isKitKat && DocumentsContract.isDocumentUri(application.android.context, uri)) {
            let docId, id, type;
            let contentUri: android.net.Uri = null;

            // ExternalStorageProvider
            if (UriHelper.isExternalStorageDocument(uri)) {
                docId = DocumentsContract.getDocumentId(uri);
                id = docId.split(":")[1];
                type = docId.split(":")[0];

                if ("primary" === type.toLowerCase()) {
                    return android.os.Environment.getExternalStorageDirectory() + "/" + id;
                } else {
                    if (android.os.Build.VERSION.SDK_INT > 23) {
                        (this.getContentResolver() as any).takePersistableUriPermission(
                            uri,
                            android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION | android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION,
                        );
                        const externalMediaDirs = application.android.context.getExternalMediaDirs();
                        if (externalMediaDirs.length > 1) {
                            let filePath = externalMediaDirs[1].getAbsolutePath();
                            filePath = filePath.substring(0, filePath.indexOf("Android")) + id;
                            return filePath;
                        }
                    }
                }
            }
            // DownloadsProvider
            else if (UriHelper.isDownloadsDocument(uri)) {
                return UriHelper.getDataColumn(uri, null, null, true);
            }
            // MediaProvider
            else if (UriHelper.isMediaDocument(uri)) {
                docId = DocumentsContract.getDocumentId(uri);
                let split = docId.split(":");
                type = split[0];
                id = split[1];

                if ("image" === type) {
                    contentUri = android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video" === type) {
                    contentUri = android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio" === type) {
                    contentUri = android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }

                let selection = "_id=?";
                let selectionArgs = [id];

                return UriHelper.getDataColumn(contentUri, selection, selectionArgs, false);
            }
        }
        else {
            // MediaStore (and general)
            if ("content" === uri.getScheme()) {
                return UriHelper.getDataColumn(uri, null, null, false);
            }
            // FILE
            else if ("file" === uri.getScheme()) {
                return uri.getPath();
            }
        }

        return undefined;
    }

    private static getDataColumn(uri: android.net.Uri, selection, selectionArgs, isDownload: boolean) {
        let cursor = null;
        let filePath;
        if (isDownload) {
            let columns = ["_display_name"];
            try {
                cursor = this.getContentResolver().query(uri, columns, selection, selectionArgs, null);
                if (cursor != null && cursor.moveToFirst()) {
                    let column_index = cursor.getColumnIndexOrThrow(columns[0]);
                    filePath = cursor.getString(column_index);
                    if (filePath) {
                        const dl = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
                        filePath = `${dl}/${filePath}`;
                        return filePath;
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
            finally {
                if (cursor) {
                    cursor.close();
                }
            }
        }
        else {
            let columns = [android.provider.MediaStore.MediaColumns.DATA];
            let filePath;

            try {
                cursor = this.getContentResolver().query(uri, columns, selection, selectionArgs, null);
                if (cursor != null && cursor.moveToFirst()) {
                    let column_index = cursor.getColumnIndexOrThrow(columns[0]);
                    filePath = cursor.getString(column_index);
                    if (filePath) {
                        return filePath;
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
            finally {
                if (cursor) {
                    cursor.close();
                }
            }
        }
        return undefined;

    }

    private static isExternalStorageDocument(uri: android.net.Uri) {
        return "com.android.externalstorage.documents" === uri.getAuthority();
    }

    private static isDownloadsDocument(uri: android.net.Uri) {
        return "com.android.providers.downloads.documents" === uri.getAuthority();
    }

    private static isMediaDocument(uri: android.net.Uri) {
        return "com.android.providers.media.documents" === uri.getAuthority();
    }

    private static getContentResolver(): android.content.ContentResolver {
        return application.android.nativeApp.getContentResolver();
    }
}