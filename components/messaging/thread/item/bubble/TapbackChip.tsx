import { Stack, Typography } from "@mui/material";
import TapbackDislikeIcon from "components/icon/TapbackDislikeIcon";
import TapbackLikeIcon from "components/icon/TapbackLikeIcon";
import TapbackLoveIcon from "components/icon/TapbackLoveIcon";
import TapbackQuestionIcon from "components/icon/TapbackQuestionIcon";
import { TapbackType } from "lib/data/stateCodes";
import React from "react";

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
      color = props.isMine ? "#ffffff" : "#808080";
      Icon = () => (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color,
              lineHeight: "6px",
            }}
          >
            HA
          </div>
          <div
            style={{ fontSize: 8, fontWeight: 800, color, lineHeight: "10px" }}
          >
            HA
          </div>
        </div>
      );
      break;
    case TapbackType.Emphasis:
      Icon = () => (
        <div style={{ textAlign: "center", lineHeight: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color,
            }}
          >
            !
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color }}>!</span>
        </div>
      );
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
        width: 28,
        height: 28,
        borderRadius: 4,
        backgroundColor: `${
          props.isMine ? "messageOutgoing" : "messageIncoming"
        }.main`,
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
