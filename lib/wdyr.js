import React from "react";
import whyDidYouRender from "@welldone-software/why-did-you-render";

if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined") {
    whyDidYouRender(React, {
      trackAllPureComponents: true,
      logOnDifferentValues: true,
      collapseGroups: true,
      trackHooks: true,
      titleColor: "green",
    });
  }
}
