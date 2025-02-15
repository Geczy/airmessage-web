import React, { CSSProperties, useEffect, useState } from "react";
import { StickerItem, TapbackItem } from "lib/data/blocks";
import { Box, BoxProps, Fade, styled } from "@mui/material";
import TapbackRow from "components/messaging/thread/item/bubble/TapbackRow";
import StickerStack from "./StickerStack";
import { getFlowOpacity, MessagePartFlow } from "lib/util/messageFlow";

const BoxWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "amTapbackPadding",
})<{ amTapbackPadding: boolean } & BoxProps>(({ amTapbackPadding, theme }) => ({
  position: "relative",
  marginBottom: theme.spacing(amTapbackPadding ? 1.25 : 0),
}));

/**
 * A wrapper around a bubble component that
 * layers tapbacks and stickers
 */
export default function MessageBubbleWrapper(props: {
  flow: MessagePartFlow;
  stickers: StickerItem[];
  tapbacks: TapbackItem[];
  maxWidth?: number | string;
  children?: React.ReactNode;
}) {
  const [isPeeking, setPeeking] = useState(false);

  const imPeeking = () => props.stickers.length && setPeeking(true);
  const imNotPeeking = () => props.stickers.length && setPeeking(false);

  return (
    <BoxWrapper
      maxWidth={props.maxWidth}
      style={{ opacity: getFlowOpacity(props.flow) }}
      amTapbackPadding={props.tapbacks.length > 0}
      onMouseEnter={imPeeking}
      onMouseLeave={imNotPeeking}
    >
      {props.children}

      {/* Stickers */}
      {props.stickers.length > 0 && (
        <StickerStack stickers={props.stickers} peek={isPeeking} />
      )}

      {/* Tapback row */}
      {props.tapbacks.length > 0 && <TapbackRow tapbacks={props.tapbacks} />}
    </BoxWrapper>
  );
}
