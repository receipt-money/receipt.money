import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Trade from "./components/Trade";
import { ModalProvider } from "./components/ModalContext";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ModalProvider>
                <Trade />
              </ModalProvider>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
