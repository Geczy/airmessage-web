import { Box, CircularProgress, Stack } from "@mui/material";
import { Conversation, ConversationItem } from "lib/data/blocks";
import { ConversationItemType, MessageStatusCode } from "lib/data/stateCodes";
import React from "react";
import { getMessageFlow } from "../../../lib/util/conversationUtils";
import EventEmitter from "../../../lib/util/eventEmitter";
import styles from "./item/bubble/messages.module.scss";
import ConversationActionParticipant from "./item/ConversationActionParticipant";
import ConversationActionRename from "./item/ConversationActionRename";
import Message from "./item/Message";

interface Props {
  conversation: Conversation;
  items: ConversationItem[];
  messageSubmitEmitter: EventEmitter<void>;
  onRequestHistory: () => void;
  showHistoryLoader?: boolean;
}

interface State {
  isInThreshold: boolean;
}

const historyLoadScrollThreshold = 300;

export default class MessageList extends React.Component<Props, State> {
  static whyDidYouRender = true;

  state = {
    isInThreshold: false,
  };

  //Reference to the message scroll list element
  readonly scrollRef = React.createRef<HTMLDivElement>();

  //List scroll position snapshot values
  private snapshotScrollHeight = 0;
  private snapshotScrollTop = 0;

  private readonly handleScroll = (
    event: React.UIEvent<HTMLDivElement, UIEvent>
  ) => {
    if (event.currentTarget.scrollTop < historyLoadScrollThreshold) {
      if (!this.state.isInThreshold) {
        this.setState({ isInThreshold: true });
        this.props.onRequestHistory();
      }
    } else {
      if (this.state.isInThreshold) {
        this.setState({ isInThreshold: false });
      }
    }
  };

  render() {
    //The latest outgoing item with the "read" status
    const readTargetIndex = this.props.items.findIndex(
      (item) =>
        item.itemType === ConversationItemType.Message &&
        item.sender === undefined &&
        item.status === MessageStatusCode.Read
    );

    //The latest outgoing item with the "delivered" status, no further than the latest item with the "read" status
    const deliveredTargetIndex = this.props.items
      .slice(0, readTargetIndex === -1 ? undefined : readTargetIndex)
      .findIndex(
        (item) =>
          item.itemType === ConversationItemType.Message &&
          item.sender === undefined &&
          item.status === MessageStatusCode.Delivered
      );

    return (
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          minHeight: 0,

          padding: 2,
          overflowX: "hidden",
          overflowY: "scroll",
          scrollBehavior: "smooth",
        }}
        ref={this.scrollRef}
        onScroll={this.handleScroll}
        className="thin-scrollbar handle-scroll"
      >
        <Stack
          sx={{
            width: "100%",
            minWidth: "400px",
          }}
          className={styles.list}
          direction="column-reverse"
        >
          {this.props.items.map((item, i, array) => {
            if (item.itemType === ConversationItemType.Message) {
              return (
                <Message
                  key={item.localID ?? item.guid}
                  message={item}
                  isGroupChat={this.props.conversation.members.length > 1}
                  service={this.props.conversation.service}
                  {...getMessageFlow(item, array[i + 1], array[i - 1])}
                  showStatus={
                    i === readTargetIndex || i === deliveredTargetIndex
                  }
                />
              );
            } else if (
              item.itemType === ConversationItemType.ParticipantAction
            ) {
              return (
                <ConversationActionParticipant
                  key={item.localID ?? item.guid}
                  action={item}
                />
              );
            } else if (
              item.itemType === ConversationItemType.ChatRenameAction
            ) {
              return (
                <ConversationActionRename
                  key={item.localID ?? item.guid}
                  action={item}
                />
              );
            } else {
              return null;
            }
          })}

          {this.props.showHistoryLoader && (
            <HistoryLoadingProgress key="static-historyloader" />
          )}
        </Stack>
      </Box>
    );
  }

  componentDidMount() {
    //Registering the submit listener
    this.props.messageSubmitEmitter.subscribe(this.onMessageSubmit);

    //Scrolling to the bottom of the list
    this.scrollToBottom(true);
  }

  getSnapshotBeforeUpdate() {
    const element = this.scrollRef.current!;
    this.snapshotScrollHeight = element.scrollHeight;
    this.snapshotScrollTop = element.scrollTop;

    return null;
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    //Restoring the scroll position when new items are added at the top
    if (
      this.props.showHistoryLoader !== prevProps.showHistoryLoader &&
      this.checkScrolledToTop()
    ) {
      const element = this.scrollRef.current!;
      this.setScroll(
        this.snapshotScrollTop +
          (element.scrollHeight - this.snapshotScrollHeight),
        true
      );
    } // checks if its just 1 new message coming in, easy scroll down
    else if (prevProps.items.length === this.props.items.length - 1) {
      this.scrollToBottom(true);
    } else if (
      // checks last message that was sent
      // if we're scrolling up and activating history,
      // the last message should still be the newest
      prevProps.items[0].chatGuid !== this.props.items[0].chatGuid
    ) {
      this.scrollToBottom(true);
    } else if (
      // checks if new details like status were added, scroll down again since
      // they flex the dom height
      prevProps.items[0].status !== this.props.items[0].status
    ) {
      this.scrollToBottom(true);
    }

    if (this.props.messageSubmitEmitter !== prevProps.messageSubmitEmitter) {
      //Updating the submit emitter
      prevProps.messageSubmitEmitter.unsubscribe(this.onMessageSubmit);
      this.props.messageSubmitEmitter.subscribe(this.onMessageSubmit);
    }
  }

  componentWillUnmount() {
    //Unregistering the submit listener
    this.props.messageSubmitEmitter.unsubscribe(this.onMessageSubmit);
  }

  private readonly onMessageSubmit = () => {
    setTimeout(() => this.scrollToBottom(), 0);
  };

  private scrollToBottom(disableAnimation: boolean = false): void {
    this.setScroll(this.scrollRef.current!.scrollHeight, disableAnimation);
  }

  private setScroll(scrollTop: number, disableAnimation: boolean = false) {
    const element = this.scrollRef.current!;
    if (disableAnimation) element.style.scrollBehavior = "auto";
    element.scrollTop = scrollTop;
    if (disableAnimation) element.style.scrollBehavior = "";
  }

  private checkScrolledToTop(): boolean {
    const element = this.scrollRef.current!;
    return element.scrollTop <= 0;
  }
}

function HistoryLoadingProgress() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
