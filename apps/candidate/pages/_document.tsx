import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <link rel="icon" href="/static/favicon.png" />
        <link rel="stylesheet" href="/static/fonts/typography.css" />
        <link rel="stylesheet" href="/ui/style.css" />
        <script async src="https://plausible.io/js/pa-cXX45NtKK22gafkcYZwUj.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()
`,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
