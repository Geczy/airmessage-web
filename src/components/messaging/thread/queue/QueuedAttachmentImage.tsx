import { styled } from "@mui/material";
import React from "react";
import { useBlobURL } from "shared/util/hookUtils";
import QueuedAttachment, { QueuedAttachmentProps } from "./QueuedAttachment";

const AttachmentImage = styled("img")(({ theme }) => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: theme.shape.borderRadius,
}));

export function QueuedAttachmentImage(props: {
  queueData: QueuedAttachmentProps;
}) {
  const imageURL = useBlobURL(props.queueData.file, props.queueData.file.type);

  return (
    <QueuedAttachment queueData={props.queueData}>
      <AttachmentImage src={imageURL} alt="" />
    </QueuedAttachment>
  );
}
