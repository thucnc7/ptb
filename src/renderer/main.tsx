import React from 'react'
import ReactDOM from 'react-dom/client'
/* Variable fonts - all subsets including Vietnamese */
import '@fontsource-variable/quicksand'
import '@fontsource-variable/nunito'
import { App } from './App'
import './styles/global-styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
