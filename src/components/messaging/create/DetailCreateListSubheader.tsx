import { Typography } from "@mui/material";
import React from "react";

/**
 * A single-character list subheader for people lists
 */
export default function DetailCreateListSubheader(props: {
  children: React.ReactNode;
}) {
  return (
    <Typography
      sx={{
        width: "40px",
        textAlign: "center",
        marginTop: 1.5,
      }}
      variant="body2"
      color="textSecondary"
    >
      {props.children}
    </Typography>
  );
}
