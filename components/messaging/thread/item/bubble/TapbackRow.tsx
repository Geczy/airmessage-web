import { Stack } from "@mui/material";
import TapbackChip from "components/messaging/thread/item/bubble/TapbackChip";
import { TapbackItem } from "lib/data/blocks";
import { TapbackType } from "lib/data/stateCodes";
import { useMemo } from "react";

/**
 * A row of tapback chips, to be attached to the bottom
 * of a message bubble
 */
export default function TapbackRow(props: { tapbacks: TapbackItem[] }) {
  //Counting tapbacks
  const tapbackCounts = useMemo(
    () =>
      props.tapbacks.reduce<Map<TapbackType, number>>((accumulator, item) => {
        const key = item.tapbackType;
        accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
        return accumulator;
      }, new Map()),
    [props.tapbacks]
  );

  return (
    <>
      {props.tapbacks.map(({ tapbackType, sender }, i) => (
        <Stack
          key={i}
          sx={{
            zIndex: 1,
            position: "absolute",
            top: -15,
            right: !sender ? -12 : "inherit",
            left: !sender ? "inherit" : -12,
          }}
          direction="row"
          gap={0.5}
        >
          <TapbackChip type={tapbackType} isMine={!sender} count={1} />
        </Stack>
      ))}
    </>
  );
}
