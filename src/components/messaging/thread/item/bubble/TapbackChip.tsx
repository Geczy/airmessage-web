import { Stack, Typography } from "@mui/material";
import React from "react";
import TapbackDislikeIcon from "shared/components/icon/TapbackDislikeIcon";
import TapbackEmphasisIcon from "shared/components/icon/TapbackEmphasisIcon";
import TapbackLaughIcon from "shared/components/icon/TapbackLaughIcon";
import TapbackLikeIcon from "shared/components/icon/TapbackLikeIcon";
import TapbackLoveIcon from "shared/components/icon/TapbackLoveIcon";
import TapbackQuestionIcon from "shared/components/icon/TapbackQuestionIcon";
import { TapbackType } from "shared/data/stateCodes";

/**
 * A single tapback chip
 * @param props.type The type of tapback
 * @param props.count The amount of reactions of this tapback type
 */
export default function TapbackChip(props: {
  type: TapbackType;
  count: number;
  isMine: boolean;
}) {
  let Icon: React.ElementType;
  let color: string;
  switch (props.type) {
    case TapbackType.Love:
      Icon = TapbackLoveIcon;
      color = props.isMine ? "#e86995" : "#e86995";
      break;
    case TapbackType.Like:
      Icon = TapbackLikeIcon;
      color = props.isMine ? "#ffffff" : "#808080";
      break;
    case TapbackType.Dislike:
      Icon = TapbackDislikeIcon;
      color = props.isMine ? "#ffffff" : "#808080";
      break;
    case TapbackType.Laugh:
      Icon = TapbackLaughIcon;
      color = props.isMine ? "#ffffff" : "#808080";
      break;
    case TapbackType.Emphasis:
      Icon = TapbackEmphasisIcon;
      color = props.isMine ? "#ffffff" : "#808080";
      break;
    case TapbackType.Question:
      Icon = TapbackQuestionIcon;
      color = props.isMine ? "#ffffff" : "#808080";
      break;
  }

  return (
    <Stack
      sx={{
        padding: "6px",
        minWidth: 8,
        height: 18,
        borderStyle: "solid",
        borderRadius: 4,
        borderWidth: 2,
        backgroundColor: `${
          props.isMine ? "messageOutgoing" : "messageIncoming"
        }.main`,
        borderColor: "background.default",
      }}
      direction="row"
      alignItems="center"
      justifyContent="center"
    >
      <Icon
        sx={{
          color,
          width: 12,
          height: 12,
        }}
      />

      {props.count > 1 && (
        <Typography variant="body2" color="secondary">
          {props.count}
        </Typography>
      )}
    </Stack>
  );
}
