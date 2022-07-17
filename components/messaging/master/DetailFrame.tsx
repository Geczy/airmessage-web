import React from "react";
import { Divider, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import { VideocamOutlined } from "@mui/icons-material";

interface Props {
  title: string;
  children?: React.ReactNode;
  className?: string;

  showCall?: boolean;
  onClickCall?: () => void;
}

const TopBar = React.memo(({ title, showCall, onClickCall }: Props) => (
  <Toolbar>
    <Typography flexGrow={1} flexShrink={1} flexBasis={0} variant="h6" noWrap>
      {title}
    </Typography>

    {showCall && (
      <IconButton size="large" onClick={onClickCall}>
        <VideocamOutlined />
      </IconButton>
    )}
  </Toolbar>
));

TopBar.whyDidYouRender = true;

/**
 * A frame component with a toolbar, used to wrap detail views
 */
const DetailFrame = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  return (
    <Stack height="100%" ref={ref}>
      <TopBar
        title={props.title}
        showCall={props.showCall}
        onClickCall={props.onClickCall}
      />

      <Divider />

      {props.children}
    </Stack>
  );
});

DetailFrame.whyDidYouRender = true;
export { DetailFrame };
