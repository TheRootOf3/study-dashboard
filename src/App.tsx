import { BrowserRouter } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { AppGate } from './AppGate';

function App() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <AppGate />
      </ProgressProvider>
    </BrowserRouter>
  );
}

export default App;
