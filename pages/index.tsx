import type { NextPage } from "next";
import Head from "next/head";

import React from "react";
import * as Sentry from "@sentry/react";
import SignInGate from "components/SignInGate";
import AppTheme from "components/control/AppTheme";
import { initializeApp } from "firebase/app";
import { setPeopleUtils } from "lib/interface/people/peopleUtils";
import GooglePeopleUtils from "lib/interface/people/googlePeopleUtils";
import { setNotificationUtils } from "lib/interface/notification/notificationUtils";
import BrowserNotificationUtils from "lib/interface/notification/browserNotificationUtils";
import { setPlatformUtils } from "lib/interface/platform/platformUtils";
import BrowserPlatformUtils from "lib/interface/platform/browserPlatformUtils";
import Image from "next/image";
import Script from "next/script";

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
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AirMessage for web" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#ffffff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#1E1E1E"
        />

        <title>AirMessage</title>

        <link rel="manifest" href="/manifest.json" />

        <link rel="icon" href="/favicon-32.png" sizes="32x32" />
        <link rel="icon" href="/favicon-57.png" sizes="57x57" />
        <link rel="icon" href="/favicon-76.png" sizes="76x76" />
        <link rel="icon" href="/favicon-96.png" sizes="96x96" />
        <link rel="icon" href="/favicon-128.png" sizes="128x128" />
        <link rel="icon" href="/favicon-192.png" sizes="192x192" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />

        <noscript>
          <Image
            src="https://sa.airmessage.org/noscript.gif?ignore-dnt=true"
            alt=""
            width={1}
            height={1}
          />
        </noscript>
      </Head>

      <AppTheme>
        <SignInGate />
      </AppTheme>

      <Script
        data-skip-dnt="true"
        async
        defer
        strategy="afterInteractive"
        src="https://sa.airmessage.org/latest.js"
      />
    </>
  );
};

export default Home;
