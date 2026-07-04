import React, { useMemo } from "react";
import { Modal, View, StyleSheet, Pressable, ActivityIndicator, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { Txt } from "./ui";
import { colors, spacing, font } from "../theme";

// Full-screen Razorpay checkout hosted in a WebView — the Expo-friendly way to
// take payments without a custom native build. The server has already created
// the order; this just runs the hosted checkout and reports the result back:
//
//   onResult({ status: "success", payment })   → caller verifies with the server
//   onResult({ status: "dismissed" })          → user closed the sheet
//   onResult({ status: "failed", error })      → Razorpay reported a failure
//
// The caller must NOT trust "success" until /payments/verify confirms it.
export function PaymentWebView({ visible, order, keyId, prefill, description, onResult }) {
  const insets = useSafeAreaInsets();

  const html = useMemo(() => {
    if (!order || !keyId) return "";
    const options = {
      key: keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "EliteCrew",
      description: description || "Service booking",
      prefill: prefill || {},
      theme: { color: "#0A0A0A" },
    };
    // JSON.stringify keeps user-supplied strings (name/email) safely escaped.
    return `<!doctype html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"></head>
<body style="margin:0;background:#0A0A0A;">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  function post(o){ try { window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }
  try {
    var options = ${JSON.stringify(options)};
    options.modal = { ondismiss: function(){ post({ status: "dismissed" }); }, escape: true, backdropclose: false };
    options.handler = function(r){ post({ status: "success", payment: r }); };
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function(resp){
      post({ status: "failed", error: (resp && resp.error && resp.error.description) || "Payment failed." });
    });
    rzp.open();
  } catch (e) {
    post({ status: "error", error: String(e && e.message ? e.message : e) });
  }
</script>
</body>
</html>`;
  }, [order, keyId, prefill, description]);

  function handleMessage(event) {
    let data;
    try { data = JSON.parse(event.nativeEvent.data); } catch { return; }
    onResult?.(data);
  }

  // UPI / bank apps open via non-http schemes (upi:, tez:, phonepe:, paytmmp:).
  // Let those launch the real app instead of failing inside the WebView.
  function onShouldStart(req) {
    const url = req?.url || "";
    if (/^https?:\/\//i.test(url) || url === "about:blank" || url.startsWith("data:")) return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onResult?.({ status: "dismissed" })}>
      <View style={{ flex: 1, backgroundColor: colors.ink }}>
        <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
          <Pressable onPress={() => onResult?.({ status: "dismissed" })} hitSlop={10} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.textOnInk} />
          </Pressable>
          <Row />
          <Txt color={colors.textOnInk} weight={font.weight.bold} size={font.size.md}>Secure payment</Txt>
          <View style={{ flex: 1 }} />
          <Ionicons name="lock-closed" size={15} color="rgba(255,255,255,0.6)" />
        </View>
        {visible && html ? (
          <WebView
            source={{ html }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={onShouldStart}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.textOnInk} />
                <Txt color="rgba(255,255,255,0.7)" size={font.size.sm} style={{ marginTop: spacing.md }}>Opening secure checkout…</Txt>
              </View>
            )}
            onError={() => onResult?.({ status: "failed", error: "Couldn't open the payment window. Check your connection." })}
            style={{ backgroundColor: colors.ink }}
          />
        ) : null}
      </View>
    </Modal>
  );
}

// tiny spacer to keep the header title centred-left without pulling in Row from ui
function Row() { return <View style={{ width: 4 }} />; }

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.ink, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink },
});
