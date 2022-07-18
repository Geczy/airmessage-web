import React, { useEffect, useState } from "react";

import * as ConversationUtils from "../../../lib/util/conversationUtils";
import { isConversationPreviewMessage } from "../../../lib/util/conversationUtils";

import {
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
  TypographyProps,
} from "@mui/material";

import { Conversation, ConversationPreview } from "lib/data/blocks";
import { appleSendStyleBubbleInvisibleInk } from "lib/data/appleConstants";
import { getLastUpdateStatusTime } from "../../../lib/util/dateUtils";
import GroupAvatar from "./GroupAvatar";
import { ConversationPreviewType } from "lib/data/stateCodes";

function ListConversation(props: {
  conversation: Conversation;
  selected?: boolean;
  highlighted?: boolean;
  onSelected: (localID: number) => void;
}) {
  //Getting the conversation title
  const [title, setConversationTitle] = useState("");

  useEffect(() => {
    //Updating the conversation's name if it has one
    if (props.conversation.name) {
      setConversationTitle(props.conversation.name);
      return;
    }

    //Building the conversation title
    setConversationTitle(
      ConversationUtils.getFallbackTitle(props.conversation)
    );
    ConversationUtils.getMemberTitle(props.conversation.members).then((title) =>
      setConversationTitle(title)
    );
  }, [setConversationTitle, props.conversation]);

  const primaryStyle: TypographyProps = props.highlighted
    ? {
        color: "primary",
        sx: {
          fontSize: "1rem",
          fontWeight: "bold",
        },
      }
    : {
        sx: {
          fontSize: "1rem",
          fontWeight: 500,
        },
      };

  const secondaryStyle: TypographyProps = props.selected
    ? {
        color: "#ffffff",
      }
    : props.highlighted
    ? {
        color: "textPrimary",
        sx: {
          fontWeight: "bold",
        },
      }
    : {};

  const onClick = () => props.onSelected(props.conversation.localID);

  return (
    <ListItemButton
      key={props.conversation.localID}
      onClick={onClick}
      disableRipple
      selected={props.selected}
      sx={{
        marginX: 1,
        marginY: 0.5,
        borderRadius: 1,
        paddingX: 1.5,
        paddingY: 0.5,
        "&&.Mui-selected, &&.Mui-selected:hover": {
          backgroundColor: "#3478f6",
          color: "#ffffff",
        },
        "&&:hover": {
          backgroundColor: "action.hover",
        },
        transitionDuration: "0s !important",
      }}
    >
      <ListItemAvatar>
        <GroupAvatar members={props.conversation.members} />
      </ListItemAvatar>
      <ListItemText
        sx={{
          ".MuiTypography-root": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
        primary={title}
        primaryTypographyProps={primaryStyle}
        secondary={previewString(props.conversation.preview)}
        secondaryTypographyProps={secondaryStyle}
      />
      <Typography
        sx={{
          alignSelf: "flex-start",
          paddingTop: 1,
          paddingLeft: 2,
          flexShrink: 0,
        }}
        variant="body2"
        color={`${props.selected ? "#ffffff" : "textSecondary"}`}
      >
        {getLastUpdateStatusTime(props.conversation.preview.date)}
      </Typography>
    </ListItemButton>
  );
}

function previewString(preview: ConversationPreview): string {
  if (isConversationPreviewMessage(preview)) {
    if (preview.sendStyle === appleSendStyleBubbleInvisibleInk)
      return "Message sent with Invisible Ink";
    else if (preview.text) return preview.text;
    else if (preview.attachments.length) {
      if (preview.attachments.length === 1) {
        return ConversationUtils.mimeTypeToPreview(preview.attachments[0]);
      } else {
        return `${preview.attachments.length} attachments`;
      }
    }
  } else if (preview.type === ConversationPreviewType.ChatCreation) {
    return "New conversation created";
  }

  return "Unknown";
}

ListConversation.whyDidYouRender = true;
export default React.memo(ListConversation, (prev, next) => {
  if (
    prev.conversation.localID === next.conversation.localID &&
    prev.highlighted === next.highlighted &&
    prev.selected === next.selected
  ) {
    return true;
  }
  return false;
});
