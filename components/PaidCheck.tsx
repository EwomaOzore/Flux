import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  readonly paid: boolean;
  readonly label: string;
  readonly color: string;
  readonly borderColor: string;
  readonly fillColor: string;
  readonly onToggle: () => void;
};

/** Checkbox for marking a bill or outflow paid in the current cycle. */
export function PaidCheck({
  paid,
  label,
  color,
  borderColor,
  fillColor,
  onToggle,
}: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: paid }}
      accessibilityLabel={
        paid ? `Mark ${label} unpaid this month` : `Mark ${label} paid this month`
      }
      hitSlop={8}
      onPress={(event) => {
        event.stopPropagation?.();
        onToggle();
      }}
      style={[
        styles.box,
        {
          borderColor: paid ? fillColor : borderColor,
          backgroundColor: paid ? fillColor : "transparent",
        },
      ]}
    >
      {paid ? <FontAwesome name="check" size={11} color={color} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
