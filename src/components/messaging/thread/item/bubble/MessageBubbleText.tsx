import React from "react";
import Linkify from "linkify-react";
import MessageBubbleWrapper from "shared/components/messaging/thread/item/bubble/MessageBubbleWrapper";
import { StickerItem, TapbackItem } from "shared/data/blocks";
import { styled, Typography } from "@mui/material";
import { getFlowBorderRadius, MessagePartFlow } from "shared/util/messageFlow";
import cn from "classnames";
import styles from "../bubble/messages.module.scss";
import { DarkModeContext } from "shared/components/DarkModeContext";

const MessageBubbleTypography = styled(Typography)(({ theme }) => ({
  overflowWrap: "break-word",
  wordBreak: "break-word",
  hyphens: "auto",

  "& a": {
    color: "inherit",
  },
}));

/**
 * A message bubble that displays text content
 */
export default function MessageBubbleText(props: {
  flow: MessagePartFlow;
  text: string;
  stickers: StickerItem[];
  tapbacks: TapbackItem[];
}) {
  const { darkMode } = React.useContext(DarkModeContext);
  return (
    <MessageBubbleWrapper
      flow={props.flow}
      stickers={props.stickers}
      tapbacks={props.tapbacks}
      maxWidth="60%"
    >
      <MessageBubbleTypography
        color={props.flow.color}
        bgcolor={props.flow.backgroundColor}
        variant="body2"
        style={{ whiteSpace: "pre-wrap" }}
        className={cn(
          styles.shared,
          props.flow.isOutgoing ? styles.sent : styles.received,
          props.flow.isText ? styles.sentText : null,
          props.flow.anchorBottom && styles.noTail,
          darkMode ? styles.dark : null
        )}
      >
        <Linkify options={{ target: "_blank" }}>{props.text}</Linkify>
      </MessageBubbleTypography>
    </MessageBubbleWrapper>
  );
}
