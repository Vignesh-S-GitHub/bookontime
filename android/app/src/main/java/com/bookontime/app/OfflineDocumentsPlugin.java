package com.bookontime.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** User-selected local documents only. No storage permission or arbitrary filesystem path. */
@CapacitorPlugin(name = "OfflineDocuments")
public class OfflineDocumentsPlugin extends Plugin {
    private static final int MAX_BYTES = 10 * 1024 * 1024;
    @PluginMethod public void exportFile(PluginCall call) {
        String name = call.getString("name", "");
        String mime = call.getString("mime", "");
        String content = call.getString("content", "");
        if (!("bookontime-backup.json".equals(name) && "application/json".equals(mime)) &&
            !(name.matches("bookontime-(opening|openings)\\.ics") && "text/calendar".equals(mime))) {
            call.reject("Unsupported export."); return;
        }
        if (content.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) { call.reject("File exceeds 10 MB."); return; }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime);
        intent.putExtra(Intent.EXTRA_TITLE, name);
        intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);
        startActivityForResult(call, intent, "writeDocument");
    }
    @ActivityCallback private void writeDocument(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) { call.reject("Export cancelled."); return; }
        Uri uri = result.getData().getData();
        if (!"content".equals(uri.getScheme())) { call.reject("Choose a local document provider."); return; }
        try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "wt")) {
            if (stream == null) throw new java.io.IOException();
            stream.write(call.getString("content", "").getBytes(StandardCharsets.UTF_8));
            call.resolve();
        } catch (java.io.IOException | SecurityException e) { call.reject("Could not export the document."); }
    }
    @PluginMethod public void importFile(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);
        startActivityForResult(call, intent, "readDocument");
    }
    @ActivityCallback private void readDocument(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) { call.reject("Import cancelled."); return; }
        Uri uri = result.getData().getData();
        if (!"content".equals(uri.getScheme())) { call.reject("Choose a local document provider."); return; }
        try (InputStream stream = getContext().getContentResolver().openInputStream(uri); ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
            if (stream == null) throw new java.io.IOException();
            byte[] block = new byte[8192]; int total = 0; int size;
            while ((size = stream.read(block)) != -1) {
                total += size; if (total > MAX_BYTES) { call.reject("Backups must be smaller than 10 MB."); return; }
                buffer.write(block, 0, size);
            }
            JSObject response = new JSObject();
            response.put("content", buffer.toString(StandardCharsets.UTF_8.name()));
            call.resolve(response);
        } catch (java.io.IOException | SecurityException e) { call.reject("Could not read the backup."); }
    }
    @PluginMethod public void openSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        getActivity().startActivity(intent);
        call.resolve();
    }
}
