import { Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout'
import Home from './pages/Home'
import Transcript from './pages/Transcript'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="transcript/:id" element={<Transcript />} />
      </Route>
    </Routes>
  )
}
