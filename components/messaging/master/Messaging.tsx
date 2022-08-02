import { getHotkeyHandler } from "@mantine/hooks";
import { Box, Collapse, Divider, List, Stack } from "@mui/material";
import CallOverlay from "components/calling/CallOverlay";
import DetailCreate from "components/messaging/create/DetailCreate";
import DetailError from "components/messaging/detail/DetailError";
import DetailLoading from "components/messaging/detail/DetailLoading";
import DetailWelcome from "components/messaging/detail/DetailWelcome";
import DetailThread from "components/messaging/thread/DetailThread";
import ConversationSkeleton from "components/skeleton/ConversationSkeleton";
import * as ConnectionManager from "lib/connection/connectionManager";
import {
  ConnectionListener,
  warnCommVer,
} from "lib/connection/connectionManager";
import { Conversation } from "lib/data/blocks";
import { ConnectionErrorCode, MessageError } from "lib/data/stateCodes";
import { getNotificationUtils } from "lib/interface/notification/notificationUtils";
import { initializePeople } from "lib/interface/people/peopleUtils";
import { getPlatformUtils } from "lib/interface/platform/platformUtils";
import useConversationState from "lib/state/conversationState";
import { normalizeAddress } from "lib/util/addressHelper";
import { arrayContainsAll } from "lib/util/arrayUtils";
import { compareVersions } from "lib/util/versionUtils";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TransitionGroup } from "react-transition-group";
import SnackbarProvider from "../../control/SnackbarProvider";
import ListConversation from "./ListConversation";
import Sidebar from "./Sidebar";
import styles from "./Sidebar.module.css";

export default function Messaging(props: { onReset?: VoidFunction }) {
  const router = useRouter();
  const { conversationID } = router.query;

  function openNextChat({ targetIndexDelta, orderedIds }) {
    console.log("openNextChat", targetIndexDelta, orderedIds);

    navigateConversation(1);
  }

  const [detailPane, setDetailPane] = useState<DetailPane>({
    type: DetailType.Loading,
  });
  const [sidebarBanner, setSidebarBanner] = useState<
    ConnectionErrorCode | "connecting" | undefined
  >(undefined);
  const {
    conversations,
    loadConversations,
    addConversation,
    markConversationRead,
  } = useConversationState(
    detailPane.type === DetailType.Thread
      ? detailPane.conversationID
      : undefined,
    true
  );
  const [needsServerUpdate, setNeedsServerUpdate] = useState(false);

  // TODO: hot key handler for opening the next chat
  const hotkeyHandler = getHotkeyHandler(
    conversations?.length
      ? [
          [
            "Alt+ArrowUp",
            () => {
              openNextChat({ targetIndexDelta: -1, orderedIds: [0, 1] });
            },
          ],
          [
            "Alt+ArrowDown",
            () => {
              openNextChat({ targetIndexDelta: 1, orderedIds: [0, 1] });
            },
          ],
        ]
      : []
  );

  // Support <Alt>+<Up/Down> to navigate between chats
  // document.body.addEventListener("keydown", hotkeyHandler);

  const navigateConversation = useCallback(
    (conversationID: number | string) => {
      //Ignore if conversations aren't loaded
      if (conversations === undefined) return;

      //Get the conversation
      let conversation: Conversation | undefined;
      if (typeof conversationID === "number") {
        conversation = conversations.find(
          (conversation) => conversation.localID == conversationID
        );
      } else {
        conversation = conversations.find(
          (conversation) =>
            !conversation.localOnly && conversation.guid == conversationID
        );
      }
      if (conversation === undefined) return;

      //Mark the conversation as read
      if (conversation.unreadMessages) {
        markConversationRead(conversation.localID);
      }

      //Select the conversation
      setDetailPane({
        type: DetailType.Thread,
        conversationID: conversation.localID,
      });

      router.push(`/id/${conversation.localID}`);
    },
    [conversations, router, markConversationRead, setDetailPane]
  );

  const navigateConversationCreate = useCallback(() => {
    setDetailPane({ type: DetailType.Create });
  }, [setDetailPane]);

  const createConversation = useCallback(
    (conversation: Conversation) => {
      //If we have a matching local conversation, select it
      let matchingConversation: Conversation | undefined;
      if (conversation.localOnly) {
        matchingConversation = conversations?.find((existingConversation) =>
          arrayContainsAll(
            existingConversation.members,
            conversation.members,
            normalizeAddress
          )
        );
      } else {
        matchingConversation = conversations?.find(
          (existingConversation) =>
            !existingConversation.localOnly &&
            existingConversation.guid == conversation.guid
        );
      }
      if (matchingConversation !== undefined) {
        setDetailPane({
          type: DetailType.Thread,
          conversationID: matchingConversation.localID,
        });
        return;
      }

      //Add the new conversation and select it
      addConversation(conversation);
      setDetailPane({
        type: DetailType.Thread,
        conversationID: conversation.localID,
      });
    },
    [conversations, addConversation, setDetailPane]
  );

  useEffect(() => {
    //Load people
    initializePeople();

    //Initialize notifications
    getNotificationUtils().initialize();

    return () => {
      //Disconnect
      ConnectionManager.disconnect();
    };
  }, []);

  //Register for notification response events
  useEffect(() => {
    getNotificationUtils()
      .getMessageActionEmitter()
      .subscribe(navigateConversation);
    return () => {
      getNotificationUtils()
        .getMessageActionEmitter()
        .unsubscribe(navigateConversation);
      getPlatformUtils()
        .getChatActivationEmitter()
        ?.unsubscribe(navigateConversation);
    };
  }, [navigateConversation]);

  //Subscribe to connection updates
  const connectionListenerInitialized = useRef(false);
  useEffect(() => {
    const listener: ConnectionListener = {
      onConnecting(): void {
        //Checking if conversations have never been loaded
        if (conversations === undefined) {
          //Displaying the full-screen loading pane
          setDetailPane({ type: DetailType.Loading });
        } else {
          //Displaying a loading indicator on the sidebar
          setSidebarBanner("connecting");
        }

        setNeedsServerUpdate(false);
      },

      onOpen(): void {
        //Check if conversations have never been loaded
        if (conversations === undefined) {
          //Request conversation details
          loadConversations()
            .then((conversations) => {
              console.log(conversations, "geczy");

              if (conversations.length > 0) {
                //If there are any conversations available, select the first one
                setDetailPane({
                  type: DetailType.Thread,
                  conversationID:
                    Number(conversationID) || conversations[0].localID,
                });
              } else {
                //Otherwise show a welcome screen
                setDetailPane({ type: DetailType.Welcome });
              }

              //Register for activations
              getPlatformUtils().initializeActivations();
              getPlatformUtils()
                .getChatActivationEmitter()
                ?.subscribe(navigateConversation);
            })
            .catch((reason: MessageError) => {
              console.error("Failed to fetch conversations", reason);
              ConnectionManager.disconnect();
            });
        } else {
          //Clear the error from the sidebar
          setSidebarBanner(undefined);

          //Fetch missed messages
          ConnectionManager.requestMissedMessages();
        }

        //Set if we require a server update
        const activeCommVer = ConnectionManager.getActiveCommVer();
        if (
          activeCommVer !== undefined &&
          compareVersions(activeCommVer, warnCommVer) < 0
        ) {
          setNeedsServerUpdate(true);
        }
      },

      onClose(error: ConnectionErrorCode): void {
        //Check if conversations have never been loaded
        if (conversations === undefined) {
          //Display a full-screen error pane
          setDetailPane({ type: DetailType.Error, errorCode: error });
        } else {
          //Displaying an error in the sidebar
          setSidebarBanner(error);
        }

        setNeedsServerUpdate(false);
      },
    };
    ConnectionManager.addConnectionListener(listener);

    //Connect
    if (!connectionListenerInitialized.current) {
      if (ConnectionManager.isDisconnected()) {
        ConnectionManager.connect();
      } else {
        if (ConnectionManager.isConnected()) {
          listener.onOpen();
        } else {
          listener.onConnecting();
        }
      }

      connectionListenerInitialized.current = true;
    }

    return () => ConnectionManager.removeConnectionListener(listener);
  }, [
    conversationID,
    conversations,
    setDetailPane,
    setSidebarBanner,
    navigateConversation,
    loadConversations,
    setNeedsServerUpdate,
  ]);

  let masterNode: React.ReactNode;
  switch (detailPane.type) {
    case DetailType.Thread: {
      const conversation: Conversation = conversations!.find(
        (conversation) => conversation.localID === detailPane.conversationID
      )!;
      masterNode = <DetailThread conversation={conversation} />;
      break;
    }
    case DetailType.Create:
      masterNode = <DetailCreate onConversationCreated={createConversation} />;
      break;
    case DetailType.Loading:
      masterNode = <DetailLoading />;
      break;
    case DetailType.Error:
      masterNode = (
        <DetailError
          error={detailPane.errorCode}
          resetCallback={props.onReset}
        />
      );
      break;
    case DetailType.Welcome:
      masterNode = <DetailWelcome />;
      break;
  }

  const selectedConversation =
    detailPane.type === DetailType.Thread
      ? detailPane.conversationID
      : undefined;

  const errorBanner =
    typeof sidebarBanner === "number" ? sidebarBanner : undefined;
  return (
    <SnackbarProvider>
      <Stack direction="row" width="100%" height="100%">
        <Box
          width="30vw"
          minWidth="350px"
          maxWidth="400px"
          bgcolor="background.sidebar"
        >
          <Stack height="100%">
            <Sidebar
              hasConversations={!!conversations}
              onCreateSelected={navigateConversationCreate}
              errorBanner={errorBanner}
              needsServerUpdate={needsServerUpdate}
            />

            {conversations ? (
              <List className={`${styles.sidebarList} thin-scrollbar`}>
                <TransitionGroup>
                  {conversations.map((conversation) => (
                    <Collapse key={conversation.localID}>
                      <ListConversation
                        key={conversation.localID}
                        conversation={conversation}
                        selected={conversation.localID === selectedConversation}
                        highlighted={conversation.unreadMessages}
                        onSelected={navigateConversation}
                      />
                    </Collapse>
                  ))}
                </TransitionGroup>
              </List>
            ) : (
              <Box className={styles.sidebarListLoading}>
                {[...Array(16)].map((element, index) => (
                  <ConversationSkeleton key={`skeleton-${index}`} />
                ))}
              </Box>
            )}
          </Stack>
        </Box>

        <Divider orientation="vertical" />

        <Box flex={1} minWidth={400}>
          {masterNode}
        </Box>
      </Stack>

      <CallOverlay />
    </SnackbarProvider>
  );
}

enum DetailType {
  Thread,
  Create,
  Loading,
  Error,
  Welcome,
}

type DetailPane =
  | {
      type: DetailType.Create | DetailType.Loading | DetailType.Welcome;
    }
  | {
      type: DetailType.Thread;
      conversationID: number;
    }
  | {
      type: DetailType.Error;
      errorCode: ConnectionErrorCode;
    };
