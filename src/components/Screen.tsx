import React from "react";
import { SafeAreaView, StyleSheet, View, ViewProps } from "react-native";

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.body, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  body: { flex: 1, padding: 16 },
});
