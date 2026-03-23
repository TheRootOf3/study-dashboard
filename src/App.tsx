import { BrowserRouter } from 'react-router-dom';
import { ProjectsProvider } from './context/ProjectsContext';
import { AppGate } from './AppGate';

function App() {
  return (
    <BrowserRouter>
      <ProjectsProvider>
        <AppGate />
      </ProjectsProvider>
    </BrowserRouter>
  );
}

export default App;
