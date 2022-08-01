import { Box, IconButton, InputBase, Stack } from "@mui/material";
import { QueuedFile } from "lib/data/blocks";
import React, { ChangeEvent, useCallback, useRef, useState } from "react";
import PushIcon from "../../icon/PushIcon";
import { QueuedAttachmentProps } from "./queue/QueuedAttachment";
import QueuedAttachmentGeneric from "./queue/QueuedAttachmentGeneric";
import { QueuedAttachmentImage } from "./queue/QueuedAttachmentImage";

interface Props {
  placeholder: string;
  attachments: QueuedFile[];
  onMessageSubmit: (message: string, attachments: QueuedFile[]) => void;
  onAttachmentAdd: (files: File[]) => void;
  onAttachmentRemove: (value: QueuedFile) => void;
}

const useFocus = (): [any, () => void] => {
  const htmlElRef = useRef<HTMLInputElement>(null);
  const setFocus = () => htmlElRef?.current?.focus();

  return [htmlElRef, setFocus];
};

export default function MessageInput(props: Props) {
  const {
    onMessageSubmit: propsOnMessageSubmit,
    attachments: propsAttachments,
    onAttachmentAdd: propsOnAttachmentAdd,
  } = props;
  const [propsMessage, propsOnMessageChange] = useState<string>("");
  const [inputRef, setInputFocus] = useFocus();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      propsOnMessageChange(event.target.value);
    },
    [propsOnMessageChange]
  );

  const submitInput = useCallback(() => {
    propsOnMessageSubmit(propsMessage, propsAttachments);
    propsOnMessageChange("");
  }, [propsOnMessageSubmit, propsMessage, propsAttachments]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        submitInput();
      }
    },
    [submitInput]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLElement>) => {
      propsOnAttachmentAdd(Array.from(event.clipboardData.files));
    },
    [propsOnAttachmentAdd]
  );

  return (
    <Box
      sx={{
        borderRadius: 5,
        backgroundColor: "transparent",
        border: "1px solid",
        borderColor: "messageIncoming.border",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {props.attachments.length > 0 && (
        <Stack
          sx={{
            overflowX: "scroll",
            overflowY: "hidden",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },

            paddingX: "16px",
            paddingTop: "16px",
          }}
          direction="row"
          gap={2}
        >
          {props.attachments.map((file) => {
            const queueData: QueuedAttachmentProps = {
              file: file.file,
              onRemove: () => props.onAttachmentRemove(file),
            };

            let component: React.ReactNode;
            if (file.file.type.startsWith("image/")) {
              component = (
                <QueuedAttachmentImage key={file.id} queueData={queueData} />
              );
            } else {
              component = (
                <QueuedAttachmentGeneric key={file.id} queueData={queueData} />
              );
            }

            return component;
          })}
        </Stack>
      )}

      <Stack direction="row">
        <InputBase
          key="inputBase"
          sx={{
            typography: "body2",
            paddingX: "16px",
            paddingY: "10px",
          }}
          maxRows="5"
          multiline
          inputRef={inputRef}
          fullWidth
          autoFocus
          placeholder={props.placeholder}
          value={propsMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        <IconButton
          sx={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            alignSelf: "flex-end",
          }}
          size="small"
          color="primary"
          disabled={
            propsMessage.trim() === "" && props.attachments.length === 0
          }
          onClick={submitInput}
        >
          <PushIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
