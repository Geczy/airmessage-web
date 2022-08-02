import "lib/wdyr";

import { MantineProvider } from "@mantine/core";
import { AppProps } from "next/app";

import Head from "next/head";
import "../styles/globals.scss";

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AirMessage</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: "light",
        }}
      >
        <Component {...pageProps} />
      </MantineProvider>
    </>
  );
}

export default App;
