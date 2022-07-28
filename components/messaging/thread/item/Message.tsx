import { ErrorRounded } from "@mui/icons-material";
import {
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Palette,
  Stack,
  StackProps,
  styled,
  Typography,
} from "@mui/material";
import MessageBubbleDownloadable from "components/messaging/thread/item/bubble/MessageBubbleDownloadable";
import MessageBubbleImage from "components/messaging/thread/item/bubble/MessageBubbleImage";
import MessageBubbleText from "components/messaging/thread/item/bubble/MessageBubbleText";
import { appleServiceAppleMessage } from "lib/data/appleConstants";
import { MessageItem } from "lib/data/blocks";
import FileDownloadResult, {
  FileDisplayResult,
} from "lib/data/fileDownloadResult";
import { MessageStatusCode } from "lib/data/stateCodes";
import { findPerson, PersonData } from "lib/interface/people/peopleUtils";
import { groupArray } from "lib/util/arrayUtils";
import { downloadBlob } from "lib/util/browserUtils";
import { getDeliveryStatusTime, getTimeDivider } from "lib/util/dateUtils";
import { useCancellableEffect } from "lib/util/hookUtils";
import { messageErrorToDisplay } from "lib/util/languageUtils";
import { getBubbleSpacing, MessagePartFlow } from "lib/util/messageFlow";
import React, { useCallback, useMemo, useState } from "react";

enum MessageDialog {
  Error,
  RawError,
}

const MessageStack = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "amLinked",
})<{ amLinked: boolean } & StackProps>(({ amLinked, theme }) => ({
  width: "100%",
  marginTop: theme.spacing(getBubbleSpacing(amLinked)),
}));

const Message = (props: {
  message: MessageItem;
  isGroupChat: boolean;
  service: string;
  showStatus?: boolean;
  className?: string;
  //Whether this message should be anchored to the message above
  anchorTop: boolean;

  //Whether this message should be anchored to the message below
  anchorBottom: boolean;

  //Whether this message should have a divider between it and the message below
  showDivider: boolean;
}) => {
  const [dialogState, setDialogState] = useState<MessageDialog | undefined>(
    undefined
  );
  const closeDialog = useCallback(
    () => setDialogState(undefined),
    [setDialogState]
  );
  const openDialogError = useCallback(
    () => setDialogState(MessageDialog.Error),
    [setDialogState]
  );
  const openDialogRawError = useCallback(
    () => setDialogState(MessageDialog.RawError),
    [setDialogState]
  );

  /**
   * Copies the message error detail to the clipboard,
   * and closes the dialog
   */
  const copyRawErrorAndClose = useCallback(async () => {
    const errorDetail = props.message.error?.detail;
    if (errorDetail !== undefined) {
      await navigator.clipboard.writeText(errorDetail);
    }
    closeDialog();
  }, [props.message, closeDialog]);

  const [attachmentDataMap, setAttachmentDataMap] = useState<
    Map<number, FileDownloadResult>
  >(new Map());

  //Compute the message information
  const isOutgoing = props.message.sender === undefined;
  const displayAvatar = props.isGroupChat && !isOutgoing && !props.anchorTop;
  const displaySender = props.isGroupChat && displayAvatar;
  const isUnconfirmed = props.message.status === MessageStatusCode.Unconfirmed;

  const handleAttachmentData = useCallback(
    (
      attachmentIndex: number,
      shouldDownload: boolean,
      result: FileDownloadResult
    ) => {
      if (shouldDownload) {
        //Download the file
        const attachment = props.message.attachments[attachmentIndex];
        downloadBlob(
          result.data,
          result.downloadType ?? attachment.type,
          result.downloadName ?? attachment.name
        );
      } else {
        //Update the data map
        setAttachmentDataMap((attachmentDataMap) =>
          new Map(attachmentDataMap).set(attachmentIndex, result)
        );
      }
    },
    [props.message.attachments, setAttachmentDataMap]
  );

  /**
   * Saves the data of an attachment to the user's downloads
   */
  const downloadAttachmentFile = useCallback(
    (attachmentIndex: number, data: Blob) => {
      const attachment = props.message.attachments[attachmentIndex];
      downloadBlob(data, attachment.type, attachment.name);
    },
    [props.message.attachments]
  );

  /**
   * Computes the file data to display to the user
   */
  const getComputedFileData = useCallback(
    (attachmentIndex: number): FileDisplayResult => {
      const attachment = props.message.attachments[attachmentIndex];
      const downloadData = attachmentDataMap.get(attachmentIndex);

      return {
        data: downloadData?.data ?? attachment.data,
        name: downloadData?.downloadName ?? attachment.name,
        type: downloadData?.downloadType ?? attachment.type,
      };
    },
    [props.message.attachments, attachmentDataMap]
  );

  //Load the message sender person
  const [personData, setPersonData] = useState<PersonData | undefined>(
    undefined
  );
  useCancellableEffect(
    (addPromise) => {
      if (props.message.sender === undefined) {
        setPersonData(undefined);
        return;
      }

      //Request contact data
      addPromise(findPerson(props.message.sender)).then(
        setPersonData,
        console.warn
      );
    },
    [props.message.sender, setPersonData]
  );

  //Get the color palette to use for the message
  let colorPalette: keyof Palette;
  if (isOutgoing) {
    if (props.service === appleServiceAppleMessage)
      colorPalette = "messageOutgoing";
    else colorPalette = "messageOutgoingTextMessage";
  } else {
    colorPalette = "messageIncoming";
  }

  //Split the modifiers for each message part
  const stickerGroups = useMemo(
    () => groupArray(props.message.stickers, (sticker) => sticker.messageIndex),
    [props.message.stickers]
  );
  const tapbackGroups = useMemo(
    () => groupArray(props.message.tapbacks, (tapback) => tapback.messageIndex),
    [props.message.tapbacks]
  );

  //Build message parts
  const messagePartsArray: React.ReactNode[] = [];
  if (props.message.text) {
    messagePartsArray.push(
      <MessageBubbleText
        key="messagetext"
        flow={{
          isText: props.service !== appleServiceAppleMessage,
          isOutgoing: isOutgoing,
          isUnconfirmed: isUnconfirmed,
          color: `${colorPalette}.contrastText`,
          backgroundColor: `${colorPalette}.main`,
          anchorTop: props.anchorTop,
          anchorBottom:
            props.anchorBottom || props.message.attachments.length > 0,
        }}
        text={props.message.text}
        stickers={stickerGroups.get(0) ?? []}
        tapbacks={tapbackGroups.get(0) ?? []}
      />
    );
  }
  messagePartsArray.push(
    props.message.attachments.map((attachment, i, attachmentArray) => {
      const componentKey = attachment.guid ?? attachment.localID;
      const messagePartIndex = props.message.text ? i + 1 : i;
      const stickers = stickerGroups.get(messagePartIndex) ?? [];
      const tapbacks = tapbackGroups.get(messagePartIndex) ?? [];

      //Get the attachment's data
      const attachmentData = getComputedFileData(i);

      const flow: MessagePartFlow = {
        isOutgoing: isOutgoing,
        isUnconfirmed: isUnconfirmed,
        color: `${colorPalette}.contrastText`,
        backgroundColor: `${colorPalette}.main`,
        anchorTop: !!props.message.text || props.anchorTop || i > 0,
        anchorBottom: props.anchorBottom || i + 1 < attachmentArray.length,
      };

      if (
        attachmentData.data !== undefined &&
        isAttachmentPreviewable(attachmentData.type)
      ) {
        return (
          <MessageBubbleImage
            key={componentKey}
            flow={flow}
            data={attachmentData.data}
            name={attachmentData.name}
            type={attachmentData.type}
            stickers={stickers}
            tapbacks={tapbacks}
          />
        );
      } else {
        return (
          <MessageBubbleDownloadable
            key={componentKey}
            flow={flow}
            data={attachmentData.data}
            name={attachmentData.name}
            type={attachmentData.type}
            size={attachment.size}
            guid={attachment.guid!}
            onDataAvailable={(data) =>
              handleAttachmentData(
                i,
                !isAttachmentPreviewable(attachmentData.type),
                data
              )
            }
            onDataClicked={(data) => downloadAttachmentFile(i, data)}
            stickers={stickers}
            tapbacks={tapbacks}
          />
        );
      }
    })
  );

  return (
    <>
      <MessageStack direction="column" amLinked={props.anchorTop}>
        {/* Time divider */}
        {props.showDivider && (
          <Typography
            paddingTop={6}
            paddingBottom={1}
            paddingX={1}
            textAlign="center"
            variant="body2"
            color="textSecondary"
          >
            {getTimeDivider(props.message.date)}
          </Typography>
        )}

        {/* Sender name */}
        {displaySender && (
          <Typography
            marginBottom={0.2}
            marginLeft="40px"
            variant="caption"
            color="textSecondary"
          >
            {personData?.name ?? props.message.sender}
          </Typography>
        )}

        {/* Horizontal message split */}
        <Stack direction="row" alignItems="flex-start" flexShrink={0}>
          {/* User avatar */}

          {props.isGroupChat && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 14,
              }}
              style={{
                backgroundColor: "#969aa5",
                visibility: displayAvatar ? undefined : "hidden",
              }}
              src={personData?.avatar}
            />
          )}

          {/* Message parts */}
          <Stack
            sx={{ marginLeft: 1.5 }}
            gap={getBubbleSpacing(false)}
            flexGrow={1}
            direction="column"
            alignItems={isOutgoing ? "end" : "start"}
          >
            {messagePartsArray}
          </Stack>

          {/* Progress spinner */}
          {props.message.progress !== undefined &&
            props.message.error === undefined && (
              <CircularProgress
                sx={{
                  marginX: 1,
                  marginY: "1px",
                }}
                size={24}
                variant={
                  props.message.progress === -1
                    ? "indeterminate"
                    : "determinate"
                }
                value={props.message.progress}
              />
            )}

          {/* Error indicator	*/}
          {props.message.error !== undefined && (
            <IconButton
              sx={{ margin: "1px" }}
              color="error"
              size="small"
              onClick={openDialogError}
            >
              <ErrorRounded />
            </IconButton>
          )}
        </Stack>

        {/* Message status */}
        {props.showStatus && (
          <Typography
            marginTop={0.5}
            textAlign="end"
            variant="caption"
            color="textSecondary"
          >
            {getStatusString(props.message)}
          </Typography>
        )}
      </MessageStack>

      {/* Message error dialog */}
      <Dialog open={dialogState === MessageDialog.Error} onClose={closeDialog}>
        <DialogTitle>Your message could not be sent</DialogTitle>
        {props.message.error !== undefined && (
          <React.Fragment>
            <DialogContent>
              <DialogContentText>
                {messageErrorToDisplay(props.message.error!.code)}
              </DialogContentText>
            </DialogContent>

            <DialogActions>
              {props.message.error!.detail !== undefined && (
                <Button onClick={openDialogRawError} color="primary">
                  Error details
                </Button>
              )}
              <Button onClick={closeDialog} color="primary" autoFocus>
                Dismiss
              </Button>
            </DialogActions>
          </React.Fragment>
        )}
      </Dialog>

      {/* Message raw error dialog */}
      <Dialog
        open={dialogState === MessageDialog.RawError}
        onClose={closeDialog}
      >
        <DialogTitle>Error details</DialogTitle>
        {props.message.error !== undefined && (
          <React.Fragment>
            <DialogContent>
              <DialogContentText fontFamily="monospace">
                {props.message.error.detail!}
              </DialogContentText>
            </DialogContent>

            <DialogActions>
              <Button onClick={copyRawErrorAndClose} color="primary">
                Copy to clipboard
              </Button>
              <Button onClick={closeDialog} color="primary" autoFocus>
                Dismiss
              </Button>
            </DialogActions>
          </React.Fragment>
        )}
      </Dialog>
    </>
  );
};

/**
 * Gets a human-readable status string for the given message item,
 * or undefined if no status string should be displayed
 */
function getStatusString(message: MessageItem): React.ReactElement | null {
  if (message.status === MessageStatusCode.Delivered) {
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
        }}
      >
        Delivered
      </span>
    );
  } else if (message.status === MessageStatusCode.Read) {
    return (
      <span
        style={{
          fontSize: 10,
        }}
      >
        <span style={{ fontWeight: 500, marginRight: 3 }}>Read</span>
        {message.statusDate && getDeliveryStatusTime(message.statusDate)}
      </span>
    );
  } else {
    return <span>last one</span>;
  }
}

/**
 * Gets whether the attachment of the specified MIME type
 * can be previewed in this app
 */
function isAttachmentPreviewable(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

Message.whyDidYouRender = true;
export default React.memo(Message);
