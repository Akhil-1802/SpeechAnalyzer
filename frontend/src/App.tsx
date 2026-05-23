import Home from "./pages/Home"
import { Routes,Route } from "react-router-dom"
import Speech from "./pages/Speech"
import Typing from "./pages/Typing"
import Result from "./pages/Result"
function App(){
  return <>
  <Routes>
    <Route path="/" element={<Home/>} />
    <Route path="/speech/:topic" element={<Speech/>} />
    <Route path="/typing/:topic" element={<Typing/>} />
    <Route path="/result/:record_id" element={<Result/>} />
  </Routes>
  </>
}

export default App
