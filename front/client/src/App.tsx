import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import StyleLearning from "./pages/StyleLearning";
import Writing from "./pages/Writing";
import Interview from "./pages/Interview";
import History from "./pages/History";
// import LeadForm from "./pages/LeadForm"; 
import JDAnalysis from "./pages/JDAnalysis";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={""} component={Home} />
      <Route path={"/learning"} component={StyleLearning} />
      <Route path={"/writing"} component={Writing} />
      <Route path={"/interview"} component={Interview} />
      <Route path={"/history"} component={History} />
      <Route path={"/analysis"} component={JDAnalysis} /> {/* Added JD Analysis route */}
      {/* <Route path={"/contact"} component={LeadForm} /> */}
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      // switchable
      >
        <TooltipProvider>
          <Toaster />
          <div className="smooth-scroll">
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
