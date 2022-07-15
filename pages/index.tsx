import type { NextPage } from "next";
import Head from "next/head";

import React from "react";
import * as Sentry from "@sentry/react";
import SignInGate from "shared/components/SignInGate";
import AppTheme from "../pages/components/control/AppTheme";
import { initializeApp } from "firebase/app";
import { setPeopleUtils } from "shared/interface/people/peopleUtils";
import GooglePeopleUtils from "shared/interface/people/googlePeopleUtils";
import { setNotificationUtils } from "shared/interface/notification/notificationUtils";
import BrowserNotificationUtils from "shared/interface/notification/browserNotificationUtils";
import { setPlatformUtils } from "shared/interface/platform/platformUtils";
import BrowserPlatformUtils from "shared/interface/platform/browserPlatformUtils";

//Set platform-specific utilities
setPeopleUtils(new GooglePeopleUtils());
setNotificationUtils(new BrowserNotificationUtils());
setPlatformUtils(new BrowserPlatformUtils());

//Initializing Sentry
if (process.env.VERCEL_ENV === "production") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_sentryDSN,
    release: "airmessage-web@" + process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.VERCEL_ENV,
  });
}

//Initializing Firebase
try {
  initializeApp(JSON.parse(process.env.NEXT_PUBLIC_firebaseConfig as string));
} catch (error) {
  console.error(error);
}

// Check that service workers are supported
if (process.env.VERCEL_ENV === "production" && "serviceWorker" in navigator) {
  // Use the window load event to keep the page load performant
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}

//Loading the Google platform script
export const promiseGAPI = new Promise<unknown>((resolve) => {
  if (typeof window !== "undefined") {
    const script = window.document.createElement("script");
    script.setAttribute("src", "https://apis.google.com/js/platform.js");
    script.onload = resolve;
    window.document.head.appendChild(script);
  }
});

const Home: NextPage = () => {
  return (
    <AppTheme>
      <SignInGate />
    </AppTheme>
  );
};

export default Home;
