package com.bookontime.app;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import android.os.Bundle;
import android.os.Build;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.view.View;
import android.view.WindowManager;
import java.io.ByteArrayInputStream;

public class MainActivity extends BridgeActivity {
    // The app has one WebView. Alarms are native broadcast receivers and do not
    // require JavaScript to stay alive while the activity is stopped.
    @Override public void onStop() {
        super.onStop();
        if (bridge != null) bridge.getWebView().pauseTimers();
    }
    @Override public void onResume() {
        if (bridge != null) bridge.getWebView().resumeTimers();
        super.onResume();
    }
    private boolean local(Uri uri) {
        return "https".equals(uri.getScheme()) && "localhost".equals(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443);
    }
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OfflineDocumentsPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        WebView.setWebContentsDebuggingEnabled(false);
        WebView webView = bridge.getWebView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        }
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setBlockNetworkLoads(true);
        webView.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !local(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !local(Uri.parse(url));
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (local(request.getUrl())) return super.shouldInterceptRequest(view, request);
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Offline only", java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
        });
    }
}
