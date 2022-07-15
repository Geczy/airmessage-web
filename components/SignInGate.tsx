import React, { useCallback, useEffect, useRef, useState } from "react";

import Onboarding from "components/Onboarding";
import Messaging from "components/messaging/master/Messaging";
import * as Sentry from "@sentry/react";
import { promiseGAPI } from "pages/index";
import { googleScope } from "shared/constants";
import LoginContext from "components/LoginContext";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  User,
} from "firebase/auth";
import { useCancellableEffect } from "shared/util/hookUtils";

enum SignInState {
  Waiting,
  SignedOut,
  SignedIn,
}

export default function SignInGate() {
  const [state, setState] = useState(SignInState.Waiting);
  const googleAuth = useRef<gapi.auth2.GoogleAuthBase | undefined>(undefined);

  //Updates whether the current user is signed in
  const updateGoogleSignIn = useCallback((signedIn: boolean) => {
    if (signedIn) {
      //Getting the user
      const googleUser = googleAuth.current!.currentUser.get();

      //Register for Firebase auth updates
      const unsubscribe = onAuthStateChanged(getAuth(), (firebaseUser) => {
        unsubscribe();

        //Returning if the same user is already signed in to Firebase
        if (isUserEqual(googleUser, firebaseUser)) return;

        //Signing in to Firebase with the credential from Google
        signInWithCredential(
          getAuth(),
          GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token)
        ).catch((error) => {
          console.warn(
            `Unable to authenticate Google Sign-In token with Firebase: ${error.code}: ${error.message}`
          );
          googleAuth.current!.signOut();
        });
      });
    } else {
      //Signing out of Firebase
      signOut(getAuth());
    }
  }, []);

  //Load the current Google auth instance and check if the user is signed in
  useCancellableEffect(
    (addPromise) => {
      //Ignore if Google auth is already loaded
      if (googleAuth.current !== undefined) return;

      addPromise(
        promiseGAPI
          .then(() => new Promise((resolve) => gapi.load("auth2", resolve)))
          .then(() =>
            gapi.auth2.init({
              client_id: process.env.NEXT_PUBLIC_googleClientID as string,
              scope: googleScope,
            })
          )
      ).then((authInstance) => {
        googleAuth.current = authInstance;
        updateGoogleSignIn(authInstance.isSignedIn.get());
      });
    },
    [updateGoogleSignIn]
  );

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (user) => {
      //Updating the state
      setState(user ? SignInState.SignedIn : SignInState.SignedOut);

      //Checking if the user is logged in
      if (user) {
        //Updating Sentry
        Sentry.setUser({
          id: user.uid,
          email: user.email ?? undefined,
        });
      } else {
        //Signing out of Google
        if (googleAuth.current && googleAuth.current.isSignedIn.get()) {
          googleAuth.current.signOut();
        }
      }
    });
  }, [setState]);

  let main: React.ReactElement | null;
  switch (state) {
    case SignInState.Waiting:
      main = null;
      break;
    case SignInState.SignedOut:
      main = <Onboarding />;
      break;
    case SignInState.SignedIn:
      main = <Messaging />;
      break;
  }

  return (
    <LoginContext.Provider
      value={{
        signOut: useCallback(() => signOut(getAuth()), []),
      }}
    >
      {main}
    </LoginContext.Provider>
  );
}

function isUserEqual(
  googleUser: gapi.auth2.GoogleUser,
  firebaseUser: User | null
) {
  if (firebaseUser) {
    const providerData = firebaseUser.providerData;
    for (let i = 0; i < providerData.length; i++) {
      if (
        providerData[i]!.providerId === GoogleAuthProvider.PROVIDER_ID &&
        providerData[i]!.uid === googleUser.getBasicProfile().getId()
      ) {
        // We don't need to reauth the Firebase connection.
        return true;
      }
    }
  }

  return false;
}
