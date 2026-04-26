import Home from "./pages/Home"
import { Routes,Route } from "react-router-dom"
import Speech from "./pages/Speech"
import Typing from "./pages/Typing"
function App(){
  return <>
  <Routes>
    <Route path="/" element={<Home/>} />
    <Route path="/speech/:topic" element={<Speech/>} />
  <Route path="/typing/:topic" element={<Typing/>} />
  </Routes>
  </>
}

export default App
