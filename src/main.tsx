<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <div id="root"></div>

    <script type="module">
      import React from "https://esm.sh/react";
      import ReactDOM from "https://esm.sh/react-dom/client";

      function App() {
        return <h1>Hello React without Vite or Webpack!</h1>;
      }

      ReactDOM.createRoot(document.getElementById("root")).render(<App />);
    </script>
  </body>
</html>
