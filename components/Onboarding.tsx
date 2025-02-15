import React from "react";

import { Typography, Button, Box, Stack, styled } from "@mui/material";

import AirMessageLogo from "components/logo/AirMessageLogo";
import { googleScope } from "lib/constants";
import Image from "next/image";

const OnboardingColumn = styled(Stack)({
  maxWidth: 400,
});

export default function Onboarding() {
  return (
    <Stack
      sx={{ width: "100%", height: "100%" }}
      alignItems="center"
      justifyContent="center"
    >
      <Box sx={{ position: "absolute", top: 0, left: 0 }} padding={2}>
        <AirMessageLogo />
      </Box>

      <Stack>
        <Typography variant="h4" marginBottom={6}>
          Use iMessage on any computer with AirMessage
        </Typography>

        <Stack direction="row" gap={6}>
          <OnboardingColumn gap={3}>
            <Stack direction="row" gap={3}>
              <Image
                width={64}
                height={64}
                alt="Onboarding steps"
                src="/assets/icons/tile-mac.svg"
              />

              <Stack>
                <Typography variant="h5" gutterBottom>
                  1. Set up your server
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  A server installed on a Mac computer is required to route your
                  messages for you.
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Visit{" "}
                  <a
                    href="https://airmessage.org"
                    style={{ color: "#008EFF", textDecoration: "none" }}
                  >
                    airmessage.org
                  </a>{" "}
                  on a Mac computer to download.
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" gap={3}>
              <Image
                width={64}
                height={64}
                alt="Onboarding steps"
                src="/assets/icons/tile-airmessage.svg"
              />

              <Stack>
                <Typography variant="h5" gutterBottom>
                  2. Connect your account
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Sign in with your account to get your messages on this device.
                </Typography>
              </Stack>
            </Stack>
          </OnboardingColumn>

          <OnboardingColumn style={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select a sign-in method:
            </Typography>
            <Button
              sx={{
                marginTop: 1,
                color: "black",
                backgroundColor: "white",
                textTransform: "none",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "inherit",
                },
              }}
              variant="contained"
              startIcon={
                <Image
                  width={64}
                  height={32}
                  src="/assets/icons/logo-google.svg"
                  alt=""
                />
              }
              onClick={signInGoogle}
              fullWidth
            >
              Sign in with Google
            </Button>
          </OnboardingColumn>
        </Stack>
      </Stack>
    </Stack>
  );
}

function signInGoogle() {
  gapi.auth2.getAuthInstance().signIn({
    scope: googleScope,
    ux_mode: "redirect",
  });

  /* const provider = new firebase.auth.GoogleAuthProvider();
	provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
	firebase.auth().signInWithRedirect(provider); */
}
