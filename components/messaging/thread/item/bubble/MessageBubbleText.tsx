import { styled, Typography } from "@mui/material";
import cn from "classnames";
import { DarkModeContext } from "components/DarkModeContext";
import MessageBubbleWrapper from "components/messaging/thread/item/bubble/MessageBubbleWrapper";
import { StickerItem, TapbackItem } from "lib/data/blocks";
import { MessagePartFlow } from "lib/util/messageFlow";
import Linkify from "linkify-react";
import React from "react";
import Emoji from "react-emoji-render";
import styles from "../bubble/messages.module.scss";

export function AppleEmoji({
  text,
  className,
}: {
  text: string;
  className?: string;
}): React.ReactElement {
  const options = {
    baseUrl: "//web.telegram.org/z/img-apple-",
    ext: "png" as const,
    size: "64",
    protocol: "https" as const,
  };

  return (
    <Emoji onlyEmojiClassName={styles.emoji} options={options} text={text} />
  );
}

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
        <Linkify options={{ target: "_blank" }}>
          <AppleEmoji text={props.text} />
        </Linkify>
      </MessageBubbleTypography>
    </MessageBubbleWrapper>
  );
}
