import {
  AddRounded,
  DarkMode,
  LightMode,
  MoreVertRounded,
  SyncProblem,
  Update,
  VideoCallOutlined,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  IconButton,
  List,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
} from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { TransitionGroup } from "react-transition-group";
import { SnackbarContext } from "components/control/SnackbarProvider";
import { DarkModeContext } from "components/DarkModeContext";
import FaceTimeLinkDialog from "components/messaging/dialog/FaceTimeLinkDialog";
import FeedbackDialog from "components/messaging/dialog/FeedbackDialog";
import RemoteUpdateDialog from "components/messaging/dialog/RemoteUpdateDialog";
import SignOutDialog from "components/messaging/dialog/SignOutDialog";
import SidebarBanner from "components/messaging/master/SidebarBanner";
import ConversationSkeleton from "components/skeleton/ConversationSkeleton";
import ServerUpdateData from "lib/data/serverUpdateData";
import {
  useIsFaceTimeSupported,
  useNonNullableCacheState,
} from "lib/util/hookUtils";
import * as ConnectionManager from "lib/connection/connectionManager";
import { RemoteUpdateListener } from "lib/connection/connectionManager";
import { Conversation } from "lib/data/blocks";
import {
  ConnectionErrorCode,
  FaceTimeLinkErrorCode,
} from "lib/data/stateCodes";
import AirMessageLogo from "../../logo/AirMessageLogo";
import ChangelogDialog from "../dialog/ChangelogDialog";
import UpdateRequiredDialog from "../dialog/UpdateRequiredDialog";
import ConnectionBanner from "./ConnectionBanner";
import ListConversation from "./ListConversation";
import styles from "./Sidebar.module.css";

function Sidebar(props: {
  hasConversations: boolean;
  onCreateSelected: () => void;
  errorBanner?: ConnectionErrorCode;
  needsServerUpdate?: boolean;
}) {
  const { darkMode, setDarkMode } = React.useContext(DarkModeContext);

  //The anchor element for the overflow menu
  const [overflowMenu, setOverflowMenu] = useState<HTMLElement | null>(null);
  useEffect(() => {
    //Don't hold dangling references to DOM elements
    return () => {
      setOverflowMenu(null);
    };
  }, [setOverflowMenu]);

  const openOverflowMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setOverflowMenu(event.currentTarget);
    },
    [setOverflowMenu]
  );
  const closeOverflowMenu = useCallback(() => {
    setOverflowMenu(null);
  }, [setOverflowMenu]);

  const [isChangelogDialog, showChangelogDialog, hideChangelogDialog] =
    useSidebarDialog(closeOverflowMenu);
  const [isFeedbackDialog, showFeedbackDialog, hideFeedbackDialog] =
    useSidebarDialog(closeOverflowMenu);
  const [isSignOutDialog, showSignOutDialog, hideSignOutDialog] =
    useSidebarDialog(closeOverflowMenu);
  const [isRemoteUpdateDialog, showRemoteUpdateDialog, hideRemoteUpdateDialog] =
    useSidebarDialog();
  const [
    isUpdateRequiredDialog,
    showUpdateRequiredDialog,
    hideUpdateRequiredDialog,
  ] = useSidebarDialog();
  const [faceTimeLinkDialog, setFaceTimeLinkDialog] = useState<
    string | undefined
  >(undefined);

  //Keep track of remote updates
  const [remoteUpdate, remoteUpdateCache, setRemoteUpdate] =
    useNonNullableCacheState<ServerUpdateData | undefined>(undefined, {
      id: 0,
      notes: "",
      protocolRequirement: [],
      remoteInstallable: false,
      version: "",
    });
  useEffect(() => {
    const listener: RemoteUpdateListener = { onUpdate: setRemoteUpdate };
    ConnectionManager.addRemoteUpdateListener(listener);

    return () => {
      ConnectionManager.removeRemoteUpdateListener(listener);
      setRemoteUpdate(undefined);
    };
  }, [setRemoteUpdate]);

  //Keep track of whether FaceTime is supported
  const isFaceTimeSupported = useIsFaceTimeSupported();
  const { createFaceTimeLink, isFaceTimeLinkLoading } = useFaceTimeDial(
    setFaceTimeLinkDialog
  );

  return (
    <>
      <ChangelogDialog
        isOpen={isChangelogDialog}
        onDismiss={hideChangelogDialog}
      />
      <FeedbackDialog
        isOpen={isFeedbackDialog}
        onDismiss={hideFeedbackDialog}
      />
      <SignOutDialog isOpen={isSignOutDialog} onDismiss={hideSignOutDialog} />
      <RemoteUpdateDialog
        isOpen={isRemoteUpdateDialog}
        onDismiss={hideRemoteUpdateDialog}
        update={remoteUpdateCache}
      />
      <UpdateRequiredDialog
        isOpen={isUpdateRequiredDialog}
        onDismiss={hideUpdateRequiredDialog}
      />
      <FaceTimeLinkDialog
        isOpen={faceTimeLinkDialog !== undefined}
        onDismiss={() => setFaceTimeLinkDialog(undefined)}
        link={faceTimeLinkDialog ?? ""}
      />

      <Toolbar
        style={{
          boxShadow: !darkMode
            ? "0 4px 4px -4px rgb(0 0 0 / 0.2)"
            : "0 4px 4px -4px rgb(225 225 225 / 0.2)",
        }}
      >
        <AirMessageLogo />

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex" }}>
          {isFaceTimeSupported && (
            <IconButton
              size="large"
              onClick={createFaceTimeLink}
              disabled={isFaceTimeLinkLoading}
            >
              <VideoCallOutlined />
            </IconButton>
          )}

          <IconButton
            size="large"
            onClick={() => {
              if (!darkMode) {
                document.body.classList.add("dark");
              } else {
                document.body.classList.toggle("dark");
              }
              setDarkMode(!darkMode);
            }}
          >
            {darkMode ? <DarkMode /> : <LightMode />}
          </IconButton>

          <IconButton
            size="large"
            onClick={props.onCreateSelected}
            disabled={props.hasConversations}
          >
            <AddRounded />
          </IconButton>

          <IconButton
            aria-haspopup="true"
            size="large"
            edge="end"
            onClick={openOverflowMenu}
          >
            <MoreVertRounded />
          </IconButton>

          <Menu
            transitionDuration={200}
            anchorEl={overflowMenu}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={!!overflowMenu}
            onClose={closeOverflowMenu}
          >
            <MenuItem onClick={showChangelogDialog}>What&apos;s new</MenuItem>
            <MenuItem onClick={showFeedbackDialog}>Help and feedback</MenuItem>
            <MenuItem
              onClick={showSignOutDialog}
              disabled={props.hasConversations}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {props.errorBanner !== undefined && (
        <ConnectionBanner error={props.errorBanner} />
      )}

      {remoteUpdate !== undefined && (
        <SidebarBanner
          icon={<Update />}
          message="A server update is available"
          button="Details"
          onClickButton={showRemoteUpdateDialog}
        />
      )}

      {props.needsServerUpdate && (
        <SidebarBanner
          icon={<SyncProblem />}
          message="Your server needs to be updated"
          button="Details"
          onClickButton={showUpdateRequiredDialog}
        />
      )}
    </>
  );
}

function useFaceTimeDial(
  setFaceTimeLinkDialog: (link: string | undefined) => void
) {
  const displaySnackbar = useContext(SnackbarContext);
  const [isFaceTimeLinkLoading, setFaceTimeLinkLoading] = useState(false);
  const isFaceTimeSupported = useIsFaceTimeSupported();

  const createFaceTimeLink = useCallback(async () => {
    if (!isFaceTimeSupported) return false;
    setFaceTimeLinkLoading(true);

    try {
      const link = await ConnectionManager.requestFaceTimeLink();

      //Prefer web share, fall back to displaying a dialog
      if (navigator.share) {
        await navigator.share({ text: link });
      } else {
        setFaceTimeLinkDialog(link);
      }
    } catch (error) {
      if (error === FaceTimeLinkErrorCode.Network) {
        displaySnackbar({
          message: "Failed to get FaceTime link: no connection to server",
        });
      } else if (error === FaceTimeLinkErrorCode.External) {
        displaySnackbar({
          message: "Failed to get FaceTime link: an external error occurred",
        });
      }
    } finally {
      setFaceTimeLinkLoading(false);
    }
  }, [displaySnackbar, setFaceTimeLinkDialog, isFaceTimeSupported]);

  return { createFaceTimeLink, isFaceTimeLinkLoading };
}

/**
 * Creates a toggleable state for a sidebar dialog
 * @param openCallback A callback invoked when the menu is opened
 */
function useSidebarDialog(
  openCallback?: VoidFunction
): [boolean, VoidFunction, VoidFunction] {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = useCallback(() => {
    openCallback?.();
    setShowDialog(true);
  }, [openCallback, setShowDialog]);
  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, [setShowDialog]);

  useEffect(() => {
    //Close the dialog on unmount
    return () => {
      setShowDialog(false);
    };
  }, [setShowDialog]);

  return [showDialog, openDialog, closeDialog];
}

Sidebar.whyDidYouRender = true;
export default React.memo(Sidebar);
