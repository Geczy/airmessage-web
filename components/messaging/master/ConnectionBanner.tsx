import React from "react";
import { WifiOffRounded } from "@mui/icons-material";
import { ConnectionErrorCode } from "lib/data/stateCodes";
import { errorCodeToShortDisplay } from "lib/util/languageUtils";
import SidebarBanner from "components/messaging/master/SidebarBanner";

/**
 * A sidebar banner that informs the user about
 * a connection error
 */
export default function ConnectionBanner(props: {
  error: ConnectionErrorCode;
}) {
  const errorDisplay = errorCodeToShortDisplay(props.error);

  return (
    <SidebarBanner
      icon={<WifiOffRounded />}
      message={errorDisplay.message}
      button={errorDisplay.button?.label}
      onClickButton={errorDisplay.button?.onClick}
    />
  );
}
